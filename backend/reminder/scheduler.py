import random
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings

from .models import MessageTemplate
from testplans.models import TestPlan
from slack_sdk import WebClient

logging.basicConfig(level=logging.DEBUG)
logging.getLogger('apscheduler').setLevel(logging.DEBUG)

class ReminderScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler({
            'apscheduler.timezone': 'Asia/Seoul',
            'apscheduler.job_defaults.coalesce': True,
            'apscheduler.job_defaults.max_instances': 1,
            'apscheduler.job_defaults.misfire_grace_time': 3600,
        })
        self.scheduler.add_jobstore(DjangoJobStore(), "default")
        self.slack_client = WebClient(token=settings.SLACK_BOT_TOKEN)

    def start(self):
        """스케줄러 시작"""
        try:
            self.scheduler.start()
            print("Scheduler started successfully")
        except Exception as e:
            print(f"Error starting scheduler: {str(e)}")

    def shutdown(self):
        """스케줄러 종료"""
        self.scheduler.shutdown()
            
    def schedule_reminder(self, reminder_setting):
        """각 ReminderSetting에 대한 작업 스케줄링"""
        job_id = f"reminder_{reminder_setting.reminder_id}"
        
        # 기존 작업이 있다면 제거
        try:
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
                print(f"Removed existing job: {job_id}")
        except Exception as e:
            print(f"Error removing job: {str(e)}")
        
        if not reminder_setting.is_active:
            return
        
        try:
            # 시작 시간과 종료 시간을 HH:MM 형식으로 변환
            start_time = f"{reminder_setting.start_hour:02d}:{reminder_setting.start_minute:02d}"
            end_time = f"{reminder_setting.end_hour:02d}:{reminder_setting.end_minute:02d}"
        
            # 새로운 작업 스케줄링
            self.scheduler.add_job(
                self.send_reminder,
                trigger=CronTrigger(
                    hour=f"{reminder_setting.start_hour}-{reminder_setting.end_hour}/{reminder_setting.interval_hours}",
                    minute=reminder_setting.start_minute,  # 시작 분에 맞춰서 실행
                    timezone='Asia/Seoul'
                ),
                id=job_id,
                args=[reminder_setting.test_plan.id, reminder_setting.message_style],
                replace_existing=True,
                misfire_grace_time=3600,
                coalesce=True,
                max_instances=1
            )
            print(f"Scheduled new job: {job_id} from {start_time} to {end_time}")
        except Exception as e:
            print(f"Error scheduling job: {str(e)}")

    @staticmethod
    def send_reminder(test_plan_id, message_style):
        """실제 알림 전송 함수"""        
        try:
            print(f"send_reminder started for test_plan_id={test_plan_id}, style={message_style}")
            test_plan = TestPlan.objects.get(id=test_plan_id)
            user = test_plan.user_id
            
            templates = MessageTemplate.objects.filter(style=message_style)
            if not templates.exists():
                print(f"No templates found for style: {message_style}")
                return
                
            template = random.choice(templates)
            message = template.content.format(
                username=user.username,
                test_name=test_plan.test_name,
                test_date=test_plan.test_date
            )
            
            slack_client = WebClient(token=settings.SLACK_BOT_TOKEN)
            
            try:
                result = slack_client.users_lookupByEmail(
                    email=user.email
                )
                slack_user_id = result['user']['id']
                
                slack_client.chat_postMessage(
                    channel=slack_user_id,
                    text=message
                )
                print(f"Message sent successfully to {user.email} for test plan {test_plan_id}")
                
            except Exception as slack_error:
                print(f"Error sending message: {str(slack_error)}")
                
        except Exception as e:
            print(f"Failed to process reminder: {str(e)}")

scheduler = ReminderScheduler()
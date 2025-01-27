import logging
import random
import pytz
import json
from datetime import datetime as dt

from apscheduler.schedulers.background import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django.conf import settings

from .models import ReminderSetting, MessageTemplate
from testplans.models import TestPlan
from slack_sdk import WebClient

# 로깅 설정
logging.basicConfig(level=logging.DEBUG)
logging.getLogger('apscheduler').setLevel(logging.DEBUG)

# 전역 스케줄러 인스턴스 
scheduler = BlockingScheduler({
    'apscheduler.timezone': 'Asia/Seoul',
    'apscheduler.job_defaults.coalesce': True,
    'apscheduler.job_defaults.max_instances': 1,
    'apscheduler.job_defaults.misfire_grace_time': 3600,
})
scheduler.add_jobstore(DjangoJobStore(), "default")

def load_reminder_settings():
    """DB에서 사용자 리마인더 설정 불러오기"""
    try:
        reminder_settings = ReminderSetting.objects.filter(is_active=True)
        logging.info(f"Loaded {reminder_settings.count()} active reminder settings.")

        for setting in reminder_settings:
            schedule_reminder(
                setting.reminder_id,
                setting.test_plan.id,
                setting.start_hour or 9,
                setting.start_minute or 0,
                setting.end_hour or 18,
                setting.interval_hours or 1,
                setting.message_style or "encourage"
            )
        
    except Exception as e:
        logging.error(f"Error loading reminder settings: {str(e)}")

def send_reminder(test_plan_id, message_style):
    """사용자에게 Slack 메시지 전송"""
    try:
        test_plan = TestPlan.objects.get(id=test_plan_id)
        user = test_plan.user_id

        templates = MessageTemplate.objects.filter(style=message_style)
        if not templates.exists():
            logging.warning(f"No templates found for style: {message_style}")
            return

        template = random.choice(templates)
        message = template.content.format(
            username=user.username,
            test_name=test_plan.test_name,
            test_date=test_plan.test_date
        )

        slack_client = WebClient(token=settings.SLACK_BOT_TOKEN)
        
        try:
            response = slack_client.users_lookupByEmail(email=user.email)
            slack_user_id = response['user']['id']
            
            # UTF-8로 인코딩된 메시지 전송 
            encoded_message = json.dumps(message, ensure_ascii=False)

            slack_client.chat_postMessage(
                channel=slack_user_id,
                text=encoded_message
            )
            logging.info(f"Message sent to {user.email} for test plan {test_plan_id}")
        except Exception as slack_error:
            logging.error(f"Slack API error: {str(slack_error)}")
    
    except TestPlan.DoesNotExist:
        logging.error(f"Test plan with ID {test_plan_id} does not exist.")

    except Exception as e:
        logging.error(f"Failed to send reminder: {str(e)}")

def schedule_reminder(reminder_id, test_plan_id, start_hour, start_minute, end_hour, interval_hours, message_style):
    """현재 시간과 알림이 울려야 하는 시간이 같은 경우 알림 전송"""
    job_id = f"reminder_{reminder_id}"
    
    now = dt.now(pytz.timezone('Asia/Seoul'))
    current_hour = now.hour
    current_minute = now.minute
    
    # 현재 시간과 시작 시간 + 인터벌 시간 비교
    for interval in range(interval_hours):
        if current_hour == start_hour+interval and current_minute == start_minute:
            logging.info(f"Triggering reminder {job_id} at {current_hour}:{current_minute}")
            
            try:
                send_reminder(test_plan_id, message_style)
                logging.info(f"Reminder job {job_id} executed successfully.")
            except Exception as e:
                logging.error(f"Error executing reminder job {job_id}: {str(e)}")
        
        else:
            logging.info(f"Skipping reminder {job_id}, not the scheduled time.")

def start():
    """스케줄러 시작"""
    scheduler.add_job(
        load_reminder_settings,
        trigger=CronTrigger(second=0),  # 매 분 00초에 실행
        id="load_reminders_job",
        replace_existing=True
    )
    try:
        scheduler.start()
        print("Scheduler started successfully")
    except Exception as e:
        print(f"Error starting scheduler: {str(e)}")

def shutdown():
    """스케줄러 종료"""
    scheduler.shutdown()

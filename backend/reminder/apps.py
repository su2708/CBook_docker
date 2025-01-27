from django.apps import AppConfig

class ReminderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reminder'

    def ready(self):
        pass





# import os

# from django.apps import AppConfig

# class ReminderConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'reminder'
    
#     def ready(self):
#         # RUN_MAIN 환경 변수를 체크하여 메인 프로세스에서만 실행
#         if os.environ.get('RUN_MAIN', None) == 'true':
#             from .models import ReminderSetting
#             from .scheduler import ReminderScheduler
            
#             try:
#                 scheduler = ReminderScheduler()
#                 scheduler.start()
#                 print("Main process: Scheduler started")
                
#                 # 활성화된 모든 알림 설정 다시 로드
#                 active_reminders = ReminderSetting.objects.filter(is_active=True)
#                 for reminder in active_reminders:
#                     scheduler.schedule_reminder(reminder)
                    
#             except Exception as e:
#                 print(f"Error initializing scheduler: {str(e)}")
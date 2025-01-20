from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from testplans.models import TestPlan

class ReminderSetting(models.Model):
    INTERVAL_CHOICES = [
        (1, '1시간'),
        (2, '2시간'),
        (3, '3시간'),
    ]
    
    MESSAGE_STYLE_CHOICES = [
        ('encourage', '격려'),
        ('harsh', '팩폭'),
        ('polite', '정중'),
        ('witty', '위트'),
    ]
    
    reminder_id = models.BigAutoField(primary_key=True)
    test_plan = models.OneToOneField(
        TestPlan,
        on_delete=models.CASCADE,
        related_name='reminder_setting'
    )
    start_hour = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(23)],
        help_text='시작 시간 (0-23)'
    )
    start_minute = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(59)],
        help_text='시작 분 (0-59)'
    )
    end_hour = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(23)],
        help_text='종료 시간 (0-23)'
    )
    end_minute = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(59)],
        help_text='종료 분 (0-59)'
    )
    interval_hours = models.IntegerField(
        choices=INTERVAL_CHOICES,
        default=1
    )
    message_style = models.CharField(
        max_length=10,
        choices=MESSAGE_STYLE_CHOICES,
        default='encourage'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

class MessageTemplate(models.Model):
    template_id = models.BigAutoField(primary_key=True)
    style = models.CharField(
        max_length=10,
        choices=ReminderSetting.MESSAGE_STYLE_CHOICES
    )
    content = models.TextField(
        help_text='메시지 템플릿. {username}, {test_name}, {test_date} 변수 사용 가능'
    )
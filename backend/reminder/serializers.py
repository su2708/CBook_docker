from rest_framework import serializers
from .models import ReminderSetting, MessageTemplate

class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = ['template_id', 'style', 'content']
        read_only_fields = ['template_id']

class ReminderSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderSetting
        fields = ['reminder_id', 'test_plan', 'start_hour', 'start_minute', 
                 'end_hour', 'end_minute', 'interval_hours', 
                 'message_style', 'is_active']
        read_only_fields = ['reminder_id']

    def validate(self, data):
        """시작 시간이 종료 시간보다 이후인지 검증"""
        start_time = data['start_hour'] * 60 + data['start_minute']
        end_time = data['end_hour'] * 60 + data['end_minute']
        
        if start_time >= end_time:
            raise serializers.ValidationError(
                "종료 시간은 시작 시간보다 이후여야 합니다."
            )
        return data
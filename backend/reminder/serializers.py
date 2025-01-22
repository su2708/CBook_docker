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
        # PATCH 요청의 경우 일부 필드만 전송될 수 있으므로
        # 없는 필드는 instance에서 가져옴
        if self.instance:  # 수정 요청인 경우
            start_hour = data.get('start_hour', self.instance.start_hour)
            start_minute = data.get('start_minute', self.instance.start_minute)
            end_hour = data.get('end_hour', self.instance.end_hour)
            end_minute = data.get('end_minute', self.instance.end_minute)
        else:  # 생성 요청인 경우
            start_hour = data['start_hour']
            start_minute = data['start_minute']
            end_hour = data['end_hour']
            end_minute = data['end_minute']

        start_time = start_hour * 60 + start_minute
        end_time = end_hour * 60 + end_minute
        
        if start_time >= end_time:
            raise serializers.ValidationError(
                "종료 시간은 시작 시간보다 이후여야 합니다."
            )
        return data
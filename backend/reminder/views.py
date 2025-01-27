from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import ReminderSetting, MessageTemplate
from .serializers import ReminderSettingSerializer, MessageTemplateSerializer
from .scheduler import schedule_reminder
from testplans.models import TestPlan

class ReminderSettingViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSettingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """현재 사용자의 알림 설정만 반환"""
        return ReminderSetting.objects.filter(
            test_plan__user_id=self.request.user
        )

    def create(self, request, *args, **kwargs):
        """알림 설정 생성"""
        # TestPlan이 현재 사용자의 것인지 확인
        test_plan = get_object_or_404(TestPlan, id=request.data.get('test_plan'))
        if test_plan.user_id != request.user:
            return Response(
                {"error": "권한이 없습니다."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reminder_setting = serializer.save()
        
        # 스케줄러에 작업 등록
        schedule_reminder(
            reminder_setting.reminder_id,
            reminder_setting.test_plan.id,
            reminder_setting.start_hour,
            reminder_setting.start_minute,
            reminder_setting.end_hour,
            reminder_setting.interval_hours,
            reminder_setting.message_style
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """알림 설정 수정"""
        reminder_setting = self.get_object()
        schedule_reminder(
            reminder_setting.reminder_id,
            reminder_setting.test_plan.id,
            reminder_setting.start_hour,
            reminder_setting.start_minute,
            reminder_setting.end_hour,
            reminder_setting.interval_hours,
            reminder_setting.message_style
        )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """부분 알림 설정 수정 (PATCH)"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """알림 활성화/비활성화 토글"""
        reminder_setting = self.get_object()
        reminder_setting.is_active = not reminder_setting.is_active
        reminder_setting.save()
        
        # 스케줄러 작업 갱신
        schedule_reminder(
            reminder_setting.reminder_id,
            reminder_setting.test_plan.id,
            reminder_setting.start_hour,
            reminder_setting.start_minute,
            reminder_setting.end_hour,
            reminder_setting.interval_hours,
            reminder_setting.message_style
        )

        return Response({
            'status': 'success',
            'is_active': reminder_setting.is_active
        })

class MessageTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """메시지 템플릿 조회용 ViewSet"""
    queryset = MessageTemplate.objects.all()
    serializer_class = MessageTemplateSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def by_style(self, request):
        """스타일별 메시지 템플릿 조회"""
        style = request.query_params.get('style', None)
        if style:
            templates = self.queryset.filter(style=style)
            serializer = self.get_serializer(templates, many=True)
            return Response(serializer.data)
        return Response(
            {"error": "style parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

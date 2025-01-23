from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'settings', views.ReminderSettingViewSet, basename='reminder-setting')
router.register(r'templates', views.MessageTemplateViewSet, basename='message-template')

urlpatterns = [
    path('', include(router.urls)),
]
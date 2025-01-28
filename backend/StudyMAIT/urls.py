from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/accounts/", include("accounts.urls")),  # 계정 관련 기능 
    path("api/v1/testplans/", include("testplans.urls")),  # 시험 계획 관련 기능 
    path("api/v1/archievements/", include("archievements.urls")),  # 업적 관련 기능 
    path("api/v1/chatrooms/", include("chatrooms.urls")),  # 챗봇 관련 기능
    path('api/v1/reminder/', include('reminder.urls')),  # 리마인더 관련 기능
]


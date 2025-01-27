from django.urls import path
from .views import ArchievementListView

app_name = 'archievements'

urlpatterns = [
    path('', ArchievementListView.as_view(), name="archievement")
]

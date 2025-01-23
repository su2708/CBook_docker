from django.urls import path
from . import views
from .views import ArchievementListView

app_name = 'archievements'

urlpatterns = [
    path('', ArchievementListView.as_view(), name="archievement")
]

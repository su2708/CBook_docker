from django.urls import path
from . import views

app_name = 'progress'

urlpatterns = [
    path('<int:plan_id>/', views.progress, name='progress'),
]
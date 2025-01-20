from django.urls import path
from . import views
from .views import PlanListView

app_name = 'testplans'

urlpatterns = [
    path('<int:user_id>/', PlanListView.as_view(), name="plan")
]


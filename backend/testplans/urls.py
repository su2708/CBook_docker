from django.urls import path
from . import views
from .views import PlanListView

app_name = 'testplans'

urlpatterns = [
    path('', PlanListView.as_view(), name="plan")
]


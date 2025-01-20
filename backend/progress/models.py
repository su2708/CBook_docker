from django.db import models
from testplans.models import TestPlan

class ProgressStatus(models.Model):
    status_id = models.BigAutoField(primary_key=True)
    plan_id = models.ForeignKey(
        TestPlan, on_delete=models.CASCADE, related_name="progress"
    )
    progress_status = models.CharField(max_length=50)
    updated_at = models.DateTimeField(auto_now=True)

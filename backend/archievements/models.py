from django.db import models
from django.conf import settings

# Create your models here.
class Archievement(models.Model):
    id = models.AutoField(primary_key=True)
    plan_id = models.IntegerField(null=True, blank=True)
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="archievements"
    )
    test_name = models.CharField(max_length=50)
    test_date = models.CharField(max_length=50)
    test_place = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.test_name
    
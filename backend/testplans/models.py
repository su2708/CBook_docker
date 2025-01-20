from django.db import models, transaction
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.conf import settings
from chatrooms.models import ChatRoom

class TestPlan(models.Model):
    id = models.AutoField(primary_key=True)
    plan_id = models.IntegerField(null=True, blank=True)
    chatroom = models.OneToOneField(
        "chatrooms.ChatRoom",
        on_delete=models.CASCADE,
        related_name="linked_testplan"
    )
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="testplans"
    )
    test_name = models.CharField(max_length=50)
    test_date = models.CharField(max_length=50)
    test_place = models.CharField(max_length=200)
    test_plan = models.JSONField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    on_progress = models.BooleanField(default=1)
    
    def __str__(self):
        return self.test_name
    
    class Meta:
        unique_together = ("plan_id", "chatroom")

@receiver(pre_save, sender=TestPlan)
def set_plan_id(sender, instance, **kwargs):
    """
    chatroom 별로 plan_id를 chatroom_id와 동일하게 설정 
    """
    if instance.plan_id is None:  # 새로 생성되는 객체일 때만
        instance.plan_id = instance.chatroom.id
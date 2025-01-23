from django.db import models, transaction
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.conf import settings

# Create your models here.
class ChatRoom(models.Model):
    chat_id = models.IntegerField(null=True, blank=True, default=None)
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chatrooms"
    )
    testplan = models.OneToOneField(
        "testplans.TestPlan",
        on_delete=models.SET_NULL,
        related_name="linked_chatroom",
        null=True,
        blank=True
    )
    chat_name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.chat_name
    
    class Meta:
        unique_together = ("user_id", "chat_id")

@receiver(pre_save, sender=ChatRoom)
def set_chat_id(sender, instance, **kwargs):
    """
    user_id 별로 chat_id가 독립적으로 증가하도록 설정
    """
    if instance.chat_id is None:  # 새로 생성되는 객체일 때만
        last_chat = ChatRoom.objects.filter(user_id=instance.user_id).order_by("-chat_id").first()
        instance.chat_id = last_chat.chat_id + 1 if last_chat else 1


class ChatMessage(models.Model):
    id = models.AutoField(primary_key=True)
    message_id = models.IntegerField(null=True, blank=True)
    chat_id = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, related_name="chatmessages"
    )
    chatroom_id = models.IntegerField(null=True, blank=True)  # ChatRoom의 chat_id
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chatmessages"
    )
    message_content = models.JSONField()  # 메시지 본문 
    SENDER_CHOICES = [("user", "User"), ("ai", "AI")]  # 발신자를 user 또는 ai로 구분 
    sent_by = models.CharField(max_length=20, choices=SENDER_CHOICES)
    sent_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=50)
    
    def __str__(self):
        return f"[{self.sent_at}] {self.sent_by}: {self.message_content}"
    
    class Meta:
        unique_together = ("message_id", "chat_id")

@receiver(pre_save, sender=ChatMessage)
def set_message_id(sender, instance, **kwargs):
    """
    chat_id 별로 message_id가 독립적으로 증가하도록 설정
    """
    if instance.message_id is None:  # 새로 생성되는 객체일 때만
        with transaction.atomic():
            last_msg = ChatMessage.objects.filter(chat_id=instance.chat_id).order_by("-message_id").select_for_update().first()
            instance.message_id = last_msg.message_id + 1 if last_msg else 1
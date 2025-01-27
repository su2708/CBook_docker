from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):   
    phone = models.CharField(max_length=13, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    gender = models.BooleanField(default=True) #True='남자' False='여자'
    
    REQUIRED_FIELDS = ["phone"]
    
    def __str__(self):
        return self.username
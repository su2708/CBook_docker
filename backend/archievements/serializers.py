from rest_framework import serializers
from .models import Archievement

class ArchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archievement
        fields = '__all__'
        read_only_fields = ('user_id',)

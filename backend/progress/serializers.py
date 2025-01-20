from rest_framework import serializers
from .models import ProgressStatus

class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressStatus
        fields = "__all__"
        read_only_fields = ("plan_id",)

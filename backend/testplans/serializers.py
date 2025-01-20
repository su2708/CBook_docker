from rest_framework import serializers
from .models import TestPlan

class TestPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestPlan
        fields = '__all__'
        read_only_fields = ('user_id',)


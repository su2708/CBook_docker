from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import TestPlanSerializer
from .models import TestPlan

from django.contrib.auth import authenticate, logout, get_user_model
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, get_list_or_404
from datetime import datetime as dt

# 특정 사용자 인증에 대한 class 
class IsOwner(BasePermission):
    def has_permission(self, request, view):
        user_id = view.kwargs.get("user_id")  # URL 매개변수에서 user_id 가져오기 
        
        if str(request.user.id) == str(user_id):
            return True
        return False


# 시험 계획에 대한 class
class PlanListView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get(self, request, user_id):
        """
        사용자의 모든 시험 계획을 조회 
        """
        try:
            plans = TestPlan.objects.filter(user_id=user_id)
            
            if not plans.exists():
                return Response({
                    "message": "아직 시험 계획이 없습니다."
                }, status=status.HTTP_204_NO_CONTENT)
            
            serializer = TestPlanSerializer(plans, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                "message": f"시험 계획 조회 오류 {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        pass
    
    def post(self, request, user_id):
        """
        새로운 시험 계획 생성 
        """
        serializer = TestPlanSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(user_id=request.user)
            return Response({
                "message": "시험 계획 생성 성공"
            }, status=status.HTTP_201_CREATED)
        pass

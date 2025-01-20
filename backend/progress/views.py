from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import ProgressSerializer
from .models import ProgressStatus
from testplans.models import TestPlan

from django.contrib.auth import authenticate, logout, get_user_model
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from datetime import datetime as dt

User = get_user_model()
    
@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def progress(request, plan_id):
    if request.method == 'GET':
        progress = ProgressStatus.objects.get(plan_id=plan_id)
        serializer = ProgressSerializer(progress)
        if request.user == TestPlan.objects.get(plan_id=plan_id).user_id:
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"message": "해당하는 사용자가 아닙니다."}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'POST':
        user = request.user  # JWT 인증을 통해 얻은 현재 사용자
        plan = TestPlan.objects.get(plan_id=plan_id)
        serializer = ProgressSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(plan_id=plan)
            return Response({
                "message": "진행 상태 생성 성공"
            }, status=status.HTTP_201_CREATED)

    if request.method == 'PUT':
        user = request.user  # JWT 인증을 통해 얻은 현재 사용자
        progress = ProgressStatus.objects.get(plan_id=plan_id)
        serializer = ProgressSerializer(instance=progress, data=request.data, partial=True)  # partial=True로 일부 업데이트 허용

        if serializer.is_valid():
            if request.user == TestPlan.objects.get(plan_id=plan_id).user_id:
                serializer.save()  # 수정 내용 저장
                return Response({
                    "message": "진행 상태가 성공적으로 수정되었습니다.",
                    "progress": serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({"message": "해당하는 사용자가 아닙니다."}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
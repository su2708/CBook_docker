from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import ArchievementSerializer
from .models import Archievement
from chatrooms.models import ChatRoom
from testplans.models import TestPlan

from django.contrib.auth import authenticate, logout, get_user_model
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, get_list_or_404
from datetime import datetime as dt

# 특정 사용자 인증에 대한 class 
class IsOwner(BasePermission):
    def has_permission(self, request, view):
        user_id = view.kwargs.get("user_id")  # URL 매개변수에서 user_id 가져오기 
        
        if not user_id:
            user_id = request.GET.get("user_id")  # 쿼리 문자열에서 user_id 가져오기
        
        if str(request.user.id) == str(user_id):
            return True
        return False

class ArchievementListView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get(self, request):
        """
        사용자의 업적 조회
        """
        user_id = request.GET.get('user_id', 1)
        
        try:
            # 전체 계획 조회
            archievements = Archievement.objects.filter(user_id=user_id)
            if not archievements.exists():
                return Response({
                    "message": "아직 업적이 없습니다."
                }, status=status.HTTP_204_NO_CONTENT)
            
            serializer = ArchievementSerializer(archievements, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                "message": f"업적 조회 오류 {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
    def post(self, request):
        """
        새로운 업적 생성 
        """
        # request params에서 user_id, plan_id 추출
        user_id = request.GET.get('user_id', 1)
        plan_id = request.GET.get("plan_id")
        
        try:
            # Archievement 생성을 위한 Testplan instance 호출 
            plan = TestPlan.objects.filter(user_id=user_id, plan_id=plan_id).first()
            if not plan:
                return Response({
                    "message": "해당 시험 계획이 존재하지 않습니다."
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 유효한 Testplan인지를 확인
            if (plan.on_progress == True) and (plan.test_plan["total_plan"]):

                # TestPlan의 세부 계획을 전부 완료했는지 확인
                total_plan, test_value = plan.test_plan["total_plan"], 1
                for is_done in (k["is_done"] for t in total_plan.values() for k in t):
                    test_value *= is_done

                if test_value == 1:
                    
                    # 삭제할 채팅방 검색 
                    chatroom = ChatRoom.objects.filter(user_id=user_id, chat_id=plan.ctrm_id).first()
                    
                    if not chatroom:
                        return Response({
                            "message": f"채팅 방 {plan.ctrm_id}를 찾을 수 없습니다."
                        }, status=status.HTTP_404_NOT_FOUND)
                    
                    # Archievement 생성 
                    archievement = Archievement.objects.create(
                        plan_id = plan.plan_id,
                        user_id = request.user,
                        test_name = plan.test_name,
                        test_date = plan.test_date,
                        test_place = plan.test_place,
                    )
                        
                    # 채팅방 삭제. 이로 인해 연쇄적으로 TestPlan과 Reminder도 삭제됨
                    chatroom.delete()

                    return Response({
                        "message": "업적 생성 성공",
                        "archievement_id": archievement.id
                    }, status=status.HTTP_201_CREATED)

                else:
                    return Response({
                        "message": "완료된 시험 계획이 아닙니다."
                    }, status=status.HTTP_400_BAD_REQUEST)

            else:
                return Response({
                    "message": "유효한 시험 계획이 아닙니다."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            
        except Exception as e:
            return Response({
                "message": f"업적 생성 에러: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
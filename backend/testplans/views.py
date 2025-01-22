from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import TestPlanSerializer
from .models import TestPlan
from chatrooms.models import ChatRoom

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


# 시험 계획에 대한 class
class PlanListView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get(self, request):
        """
        사용자의 시험 계획 조회
        - user_id만 있으면 전체 계획 조회
        - user_id와 plan_id가 모두 있으면 특정 계획만 조회
        """
        user_id = request.GET.get('user_id', 1)
        plan_id = request.GET.get('plan_id')
        
        try:
            if plan_id:
                # 특정 계획만 조회
                plan = TestPlan.objects.filter(user_id=user_id, plan_id=plan_id).first()
                if not plan:
                    return Response({
                        "message": "해당하는 시험 계획이 없습니다."
                    }, status=status.HTTP_404_NOT_FOUND)
                    
                serializer = TestPlanSerializer(plan)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            # 전체 계획 조회
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

    
    def post(self, request):
        """
        새로운 시험 계획 생성 
        """
        # request params에서 user_id 추출. 기본 값은 1
        user_id = request.GET.get('user_id', 1)
        chatroom_id = request.GET.get("chatroom_id")
        
        try:
            # TestPlan 생성을 위한 ChatRoom instance 호출 
            chatroom = ChatRoom.objects.filter(user_id=user_id, chat_id=chatroom_id).first()
            if not chatroom:
                return Response({
                    "message": "해당 채팅방이 존재하지 않습니다."
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 중복 TestPlan 확인 
            existing_plan = TestPlan.objects.filter(chatroom=chatroom).first()
            if existing_plan:
                return Response({
                    "message": "이미 이 채팅방에 시험 계획이 존재합니다.",
                    "existing_plan_id": existing_plan.id
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # TestPlan 생성 
            test_plan = TestPlan.objects.create(
                chatroom = chatroom,
                ctrm_id = chatroom.chat_id,
                user_id = request.user,
                test_name = request.data["test_name"],
                test_date = request.data["test_date"],
                test_place = request.data["test_place"],
                test_plan = request.data["test_plan"],
            )
            
            # ChatRoom의 testplan 생성을 위한 TestPlan 호출 
            chatroom.testplan = test_plan  # None이 아닌 다른 값 넣기 
            chatroom.save()
            
            return Response({
                "message": "시험 계획 생성 성공",
                "test_plan_id": test_plan.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "message": f"시험 계획 생성 에러: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def patch(self, request):
        """
        특정 시험 계획의 task 완료 상태 수정
        """
        user_id = request.GET.get('user_id')
        plan_id = request.GET.get('plan_id')
        week = request.data.get('week')      # ex: "1주차"
        task_idx = request.data.get('task_idx')  # task의 인덱스
        
        if not all([user_id, plan_id, week, task_idx is not None]):
            return Response({
                "message": "필수 파라미터가 누락되었습니다. (user_id, plan_id, week, task_idx)"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # 시험 계획 조회
            plan = TestPlan.objects.get(user_id=user_id, plan_id=plan_id)
            
            # test_plan JSON에서 해당 주차의 task 리스트 찾기
            total_plan = plan.test_plan['total_plan']
            if week not in total_plan:
                return Response({
                    "message": f"'{week}' 계획이 존재하지 않습니다."
                }, status=status.HTTP_404_NOT_FOUND)
                
            # 해당 주차의 task 목록에서 특정 task 찾기
            tasks = total_plan[week]
            if task_idx >= len(tasks):
                return Response({
                    "message": f"task_idx {task_idx}가 범위를 벗어났습니다."
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # is_done 값 토글
            tasks[task_idx]['is_done'] = not tasks[task_idx]['is_done']
            
            # 변경된 내용 저장
            plan.save()
            
            return Response({
                "message": "Task 상태가 변경되었습니다.",
                "task": tasks[task_idx]
            }, status=status.HTTP_200_OK)
                
        except TestPlan.DoesNotExist:
            return Response({
                "message": "시험 계획을 찾을 수 없습니다."
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({
                "message": f"시험 계획 수정 오류: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
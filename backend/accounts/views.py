from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import SignupSerializer, UserProfileSerializer, UserUpdateSerializer
from django.contrib.auth import authenticate, logout, get_user_model
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from datetime import datetime as dt

User = get_user_model()

# Create your views here.
@api_view(['POST'])
@authentication_classes([]) # 전역 인증 설정 무시
@permission_classes([AllowAny]) # 전역 IsAuthenticated 설정 무시
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "message": "회원가입이 성공적으로 완료되었습니다."
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([])      # 전역 인증 설정 무시
@permission_classes([AllowAny])  # 전역 IsAuthenticated 설정 무시
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    # 사용자 인증
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        user.last_login = dt.today()
        user.save()
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': '로그인 성공'
        }, status=200)
    else:
        return JsonResponse({'error': '이메일 또는 비밀번호가 올바르지 않습니다.'}, status=400)


@api_view(['POST'])
def logout(request):
    try:
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # RefreshToken 객체 생성 및 refresh_token의 유효성 검사 
        token = RefreshToken(refresh_token)
        token.blacklist()  # 블랙리스트에 추가 
        
        return Response({"success": "Logged out"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user  # JWT 인증을 통해 얻은 현재 사용자
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data, status=200)
    
    if request.method in ('PUT', 'PATCH') :
        serializer = UserUpdateSerializer(instance=user, data=request.data, partial=True)  # partial=True로 일부 업데이트 허용

        if serializer.is_valid():
            serializer.save()  # 수정 내용 저장
            return Response({
                "message": "회원정보가 성공적으로 수정되었습니다.",
                "user": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
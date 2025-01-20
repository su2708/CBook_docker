from django.urls import path
from .views import ChatListView, ChatMsgListView

app_name = 'chatrooms'

urlpatterns = [
    # 채팅방 생성 및 조회
    path('', ChatListView.as_view(), name='chatroom'),
    
    # 채팅 메시지 생성 및 조회 
    path(
        '<int:user_id>/',
        ChatMsgListView.as_view(),
        name='chatmessages'
    ),
]
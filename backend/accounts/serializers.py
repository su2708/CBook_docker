from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

# create Serializers
class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            'email', 'password', 'password2', 'username'
        )

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({
                "password": "비밀번호가 일치하지 않습니다."
            })
        return data

    def create(self, validated_data):
        validated_data.pop('password2')  # password2 제거
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()  # 커스텀 필드로 처리 
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'phone',
            'profile_image'
        ]  # 반환할 필드
    
    def get_profile_image(self, obj):
        # Serializer context에서 request 가져오기
        request = self.context.get('request')  
        
        # 프로필 이미지 경로를 절대 경로로 변경 
        if obj.profile_image:
            return request.build_absolute_uri(obj.profile_image.url)
        
        return None



class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username','profile_image', 'email', 'phone')  # 수정 가능한 필드
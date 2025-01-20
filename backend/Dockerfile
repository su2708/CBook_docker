# Python 3.11 slim 이미지 사용
FROM python:3.11.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 필수 패키지 설치 (MariaDB/MySQL 클라이언트 설치 시 필요한 의존성 추가)
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3-dev \
    libmariadb-dev \
    pkg-config \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# 의존성 설치
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 프로젝트 파일 복사
COPY . .

# 환경 변수 설정
ENV PYTHONUNBUFFERED=1

# Django 서버 실행
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

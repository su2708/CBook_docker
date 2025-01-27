FROM nginx:alpine

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# Next.js static 파일들을 복사할 디렉토리 생성
RUN mkdir -p /usr/share/nginx/html/_next/static
RUN mkdir -p /usr/share/nginx/html/static

# 기본 nginx 설정 제거
RUN rm -rf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 
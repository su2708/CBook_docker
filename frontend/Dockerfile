# Build stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

COPY . .
# COPY /app/.next/static /usr/share/nginx/html/_next/static
# COPY /app/public /usr/share/nginx/html/static
# COPY /app/.next/static ./.next/static

RUN npm install
RUN npm run build
RUN ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime && echo "Asia/Seoul" > /etc/timezone

EXPOSE 3000

ENV PORT 3000
ENV NEXT_PUBLIC_API_URL http://localhost:8000
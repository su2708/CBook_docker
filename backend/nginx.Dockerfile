FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY ./static /usr/share/nginx/html/static

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 
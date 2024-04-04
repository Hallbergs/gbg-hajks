FROM registry.redhat.io/rhel9/nodejs-18 as clientBuilder
COPY /apps/client/package*.json ./
USER root
RUN npm install
COPY ./apps/client .
RUN npm run build --ignore-scripts

FROM nginx:latest
COPY /Docker/hajk-simple-s3/nginx.conf /etc/nginx/nginx.conf
COPY --from=clientBuilder /opt/app-root/src/build /usr/share/nginx/html

RUN chgrp -R 0 /var/cache/nginx /var/run /var/log/nginx /var/run /etc/nginx/conf.d \
  && chmod -R g=u /var/cache/nginx /var/run /var/log/nginx /var/run /etc/nginx/conf.d

EXPOSE 8080

USER 1001

CMD ["nginx", "-g", "daemon off;"]
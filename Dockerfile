FROM node:20-alpine 
# 노드 기반 base image 생성

WORKDIR /usr/src/app

COPY . .
# 현재 디렉토리의 모든 파일을 컨테이너의 /usr/src/app 디렉토리에 복사

RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
# 빌드된 애플리케이션 실행
FROM node:20-alpine

WORKDIR /usr/src/app

# 1. package.json과 package-lock.json 먼저 복사
COPY package*.json ./

# 2. 의존성 설치 (개발 의존성 포함)
RUN npm ci

# 3. 소스 코드 복사
COPY . .

# 4. 빌드 실행 및 결과 확인
RUN npm run build && \
    ls -la dist/ && \
    ls -la dist/src/ && \
    ls -la dist/src/main.js

# 5. 프로덕션 의존성만 유지 (선택사항)
RUN npm prune --production

EXPOSE 3000

# 6. 빌드된 애플리케이션 실행 (올바른 경로)
CMD ["node", "dist/src/main.js"]
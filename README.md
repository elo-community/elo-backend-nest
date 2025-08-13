<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
# ELO Community

스포츠 레이팅 및 리워드 시스템을 위한 모노레포 프로젝트입니다.

## 📁 프로젝트 구조

```
elo-community/
├── 📁 packages/
│   ├── 📁 contracts/          # 🚀 스마트 컨트랙트 (Hardhat)
│   │   ├── contracts/         # Solidity 컨트랙트
│   │   ├── scripts/           # 배포 스크립트
│   │   ├── test/              # 컨트랙트 테스트
│   │   └── hardhat.config.ts  # Hardhat 설정
│   └── 📁 nest-backend/       # 🪺 NestJS 백엔드
│       ├── src/               # 소스 코드
│       ├── nest-cli.json      # NestJS 설정
│       └── tsconfig.json      # TypeScript 설정
├── 📄 package.json            # 루트 패키지 (workspaces)
└── 📄 README.md               # 프로젝트 설명
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 환경변수를 설정하세요
```

### 3. 스마트 컨트랙트 컴파일
```bash
npm run contracts:compile
```

### 4. 백엔드 개발 서버 실행
```bash
npm run dev
```

## 📦 사용 가능한 스크립트

### 루트 레벨
- `npm run build` - 모든 패키지 빌드
- `npm run dev` - 백엔드 개발 서버 실행
- `npm run contracts:compile` - 스마트 컨트랙트 컴파일
- `npm run contracts:test` - 스마트 컨트랙트 테스트
- `npm run contracts:deploy` - 스마트 컨트랙트 배포

### 백엔드 패키지
```bash
cd packages/nest-backend
npm run start:dev      # 개발 서버
npm run build          # 빌드
npm run test           # 테스트
```

### 컨트랙트 패키지
```bash
cd packages/contracts
npm run compile        # 컴파일
npm run test           # 테스트
npm run deploy:amoy    # Amoy 네트워크 배포
```

## 🔧 기술 스택

### 백엔드
- **NestJS** - Node.js 프레임워크
- **TypeORM** - 데이터베이스 ORM
- **PostgreSQL** - 데이터베이스
- **JWT** - 인증
- **Ethers.js** - 블록체인 연동

### 스마트 컨트랙트
- **Solidity** - 스마트 컨트랙트 언어
- **Hardhat** - 개발 환경
- **OpenZeppelin** - 보안 라이브러리
- **TypeChain** - TypeScript 타입 생성

## 🌐 네트워크

- **Amoy** - Polygon 테스트넷
- **Very** - Very 네트워크 (향후 지원 예정)

## 📝 라이선스

이 프로젝트는 비공개 라이선스입니다.
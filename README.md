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
# elo-backend-nest

# Elo Community Backend (NestJS)

A NestJS backend application for managing sports community match results with Elo rating system.

## Features

- **User Authentication**: JWT-based authentication system
- **Match Results Management**: Create, accept, reject, and confirm match results
- **Elo Rating System**: Professional-grade Elo rating calculation with H2H and handicap support
- **Real-time Notifications**: Server-Sent Events (SSE) for instant updates
- **Sport Categories**: Support for multiple sports with separate ratings
- **Rating History**: Complete tracking of rating changes and match history

## Elo Rating System

The application implements a sophisticated Elo rating system with the following features:

- **Initial Rating**: 1400 for new users
- **Base K-factor**: 20
- **Handicap Multiplier**: ×0.3 (when `isHandicap=true`)
- **H2H (Head-to-Head) Multipliers**:
  - Gap 0-2: ×1.0 (no reduction)
  - Gap 3-4: ×0.75 (25% reduction)
  - Gap 5-6: ×0.5 (50% reduction)
  - Gap ≥7: ×0.25 (75% reduction)

### Rating Calculation

- **Expected Score**: `E = 1 / (1 + 10^((R_opponent - R_me)/400))`
- **Rating Update**: `R' = R + K_eff × (S - E)`
  - `S = 1.0` for win, `0.5` for draw, `0.0` for loss
  - `K_eff = 20 × H2H_multiplier × handicap_multiplier`
- **Precision**: Ratings are stored with 2 decimal places

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd elo-community-backend-nest
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=elo_community
JWT_SECRET=your_jwt_secret
```

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE elo_community;
```

2. Run migrations:
```bash
npm run migration:run
```

### Migration Details

The system includes a comprehensive migration that:
- Extends the `match_result` table with new columns for Elo system
- Creates `rating` table for user ratings per sport category
- Creates `match_result_history` table for tracking rating changes
- Adds indexes and constraints for optimal performance

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Docker
```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/verify` - Verify JWT token

### Match Results
- `POST /api/v1/match-results` - Create new match result
- `GET /api/v1/match-results/sent` - Get sent match requests
- `GET /api/v1/match-results/received` - Get received match requests
- `GET /api/v1/match-results/:id` - Get specific match result
- `POST /api/v1/match-results/:id/respond` - Respond to match (accept/reject/counter)
- `POST /api/v1/match-results/:id/confirm` - Confirm match after counter

### Elo Rating
- `GET /api/v1/elo/preview` - Preview Elo calculation without persistence

### SSE (Server-Sent Events)
- `GET /api/v1/sse/notifications` - SSE connection for real-time updates
- `GET /api/v1/sse/health` - Check SSE connection health

## API Examples

### Create Match Result
```bash
POST /api/v1/match-results
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "sportCategoryId": 1,
  "partnerNickname": "tennis_pro",
  "myResult": "win",
  "isHandicap": false,
  "playedAt": "2025-08-10T14:00:00Z"
}
```

### Partner Accepts Match
```bash
POST /api/v1/match-results/123/respond
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "action": "accept"
}
```

### Partner Counters Match
```bash
POST /api/v1/match-results/123/respond
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "action": "counter",
  "partnerResult": "draw"
}
```

### Reporter Confirms After Counter
```bash
POST /api/v1/match-results/123/confirm
Authorization: Bearer <jwt_token>
```

### Preview Elo Calculation
```bash
POST /api/v1/elo/preview
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "sportCategoryId": 1,
  "aId": 10,
  "bId": 22,
  "result": "lose",
  "isHandicap": true
}
```

## Testing

Run the test suite:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:cov
```

Run e2e tests:
```bash
npm run test:e2e
```

## Project Structure

```
src/
├── auth/                 # Authentication module
├── config/              # Configuration files
├── controllers/         # API controllers
├── dtos/               # Data Transfer Objects
├── entities/            # TypeORM entities
├── elo/                # Elo rating system
│   ├── constants.ts     # Elo constants and utilities
│   ├── elo.service.ts   # Elo calculation service
│   └── elo.module.ts    # Elo module
├── ratings/             # Rating management
│   ├── ratings.service.ts # Rating CRUD operations
│   └── ratings.module.ts  # Ratings module
├── services/            # Business logic services
├── schedulers/          # Background job schedulers
└── utils/               # Utility functions
```

## Elo Rating Flow

1. **Match Creation**: User creates a match result with `PENDING` status
2. **Partner Response**: Partner can accept, reject, or counter the result
3. **Confirmation**: If countered, reporter confirms the final result
4. **Elo Calculation**: When status becomes `CONFIRMED`, Elo ratings are calculated and applied
5. **History Tracking**: All rating changes are recorded in `match_result_history`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
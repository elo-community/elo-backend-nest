"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const path = require("path");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const blockchain_module_1 = require("./blockchain/blockchain.module");
const blockchain_config_1 = require("./config/blockchain.config");
const s3_config_1 = require("./config/s3.config");
const elo_module_1 = require("./elo/elo.module");
const comment_like_entity_1 = require("./entities/comment-like.entity");
const comment_entity_1 = require("./entities/comment.entity");
const hot_post_entity_1 = require("./entities/hot-post.entity");
const match_result_history_entity_1 = require("./entities/match-result-history.entity");
const match_result_entity_1 = require("./entities/match-result.entity");
const post_entity_1 = require("./entities/post.entity");
const user_entity_1 = require("./entities/user.entity");
const rewards_module_1 = require("./rewards/rewards.module");
const hot_posts_scheduler_1 = require("./schedulers/hot-posts.scheduler");
const match_result_scheduler_1 = require("./schedulers/match-result.scheduler");
const real_time_hot_posts_scheduler_1 = require("./schedulers/real-time-hot-posts.scheduler");
const temp_image_cleanup_scheduler_1 = require("./schedulers/temp-image-cleanup.scheduler");
const isProd = process.env.NODE_ENV === 'production';
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                expandVariables: true,
                ignoreEnvFile: isProd,
                envFilePath: isProd
                    ? []
                    : [
                        path.resolve(process.cwd(), '.env'),
                        path.resolve(process.cwd(), 'apps/backend/.env'),
                    ],
                load: [blockchain_config_1.default, s3_config_1.default],
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_DATABASE || 'elo-community',
                entities: [user_entity_1.User, post_entity_1.Post, comment_entity_1.Comment, comment_like_entity_1.CommentLike, match_result_entity_1.MatchResult, match_result_history_entity_1.MatchResultHistory, hot_post_entity_1.HotPost],
                synchronize: process.env.NODE_ENV !== 'production',
                logging: process.env.NODE_ENV !== 'production',
            }),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            elo_module_1.EloModule,
            rewards_module_1.RewardsModule,
            blockchain_module_1.BlockchainModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            hot_posts_scheduler_1.HotPostsScheduler,
            real_time_hot_posts_scheduler_1.RealTimeHotPostsScheduler,
            match_result_scheduler_1.MatchResultScheduler,
            temp_image_cleanup_scheduler_1.TempImageCleanupScheduler,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
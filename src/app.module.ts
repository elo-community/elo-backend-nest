import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './controllers/auth.controller';
import { CommentsController } from './controllers/comments.controller';
import { PostsController } from './controllers/posts.controller';
import { RepliesController } from './controllers/replies.controller';
import { UsersController } from './controllers/users.controller';
import { Address } from './entities/address.entity';
import { Comment } from './entities/comment.entity';
import { PostLike } from './entities/post-like.entity';
import { PostMeh } from './entities/post-meh.entity';
import { Post } from './entities/post.entity';
import { Reply } from './entities/reply.entity';
import { SportCategory } from './entities/sport-category.entity';
import { User } from './entities/user.entity';
import { CommentService } from './services/comment.service';
import { PostService } from './services/post.service';
import { ReplyService } from './services/reply.service';
import { UserService } from './services/user.service';

// NOTE: 앞으로 생성할 컨트롤러/라우트는 모두 복수형으로 작성 (예: users, posts, comments, auths)
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'elo-community',
      autoLoadEntities: true,
      synchronize: true,
      // dropSchema: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([User, Post, Comment, Reply, SportCategory, PostLike, PostMeh, Address]),
    AuthModule,
  ],
  controllers: [AuthController, UsersController, PostsController, CommentsController, RepliesController],
  providers: [UserService, PostService, CommentService, ReplyService],
})
export class AppModule { }

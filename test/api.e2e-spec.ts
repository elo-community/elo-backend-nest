import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API E2E Tests', () => {
    let app: INestApplication;
    let accessToken: string;
    let userId: number;
    let postId: number;
    let commentId: number;
    let replyId: number;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                AppModule,
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: process.env.DB_HOST || 'localhost',
                    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
                    username: process.env.DB_USERNAME || 'postgres',
                    password: process.env.DB_PASSWORD || '',
                    database: process.env.DB_DATABASE || 'elo-community-test',
                    autoLoadEntities: true,
                    synchronize: true,
                    dropSchema: true,
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Authentication', () => {
        it('should create test user', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/test-user')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.user.id).toBeDefined();

            accessToken = response.body.data.accessToken;
            userId = response.body.data.user.id;

            console.log('✅ Test user created:', {
                userId,
                accessToken: accessToken.substring(0, 20) + '...',
            });
        });

        it('should verify token', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/verify')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token is valid');
        });
    });

    describe('Posts', () => {
        it('should create a post', async () => {
            const postData = {
                title: 'Test Post',
                content: 'This is a test post content',
                type: 'post',
                isHidden: false,
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/posts')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(postData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.title).toBe(postData.title);
            expect(response.body.data.content).toBe(postData.content);

            postId = response.body.data.id;

            console.log('✅ Post created:', { postId });
        });

        it('should get post with details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/posts/${postId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(postId);
            expect(response.body.data.author).toBeDefined();
            expect(response.body.data.author.id).toBe(userId);
            expect(response.body.data.comments).toBeDefined();
        });

        it('should get all posts', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/posts')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('Comments', () => {
        it('should create a comment', async () => {
            const commentData = {
                content: 'This is a test comment',
                postId: postId,
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/comments')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(commentData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.content).toBe(commentData.content);
            expect(response.body.data.postId).toBe(postId);

            commentId = response.body.data.id;

            console.log('✅ Comment created:', { commentId });
        });

        it('should get comments by post', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/posts/${postId}/comments`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should get all comments', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/comments')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Replies', () => {
        it('should create a reply', async () => {
            const replyData = {
                content: 'This is a test reply',
                commentId: commentId,
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/replies')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(replyData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.content).toBe(replyData.content);
            expect(response.body.data.commentId).toBe(commentId);

            replyId = response.body.data.id;

            console.log('✅ Reply created:', { replyId });
        });

        it('should get replies by comment', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/replies/comment/${commentId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should get all replies', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/replies')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Post with Comments and Replies', () => {
        it('should get post with all details including comments and replies', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/posts/${postId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(postId);
            expect(response.body.data.author).toBeDefined();
            expect(response.body.data.comments).toBeDefined();
            expect(response.body.data.comments.length).toBeGreaterThan(0);

            const comment = response.body.data.comments[0];
            expect(comment.id).toBe(commentId);
            expect(comment.replies).toBeDefined();
            expect(comment.replies.length).toBeGreaterThan(0);
            expect(comment.replies[0].id).toBe(replyId);

            console.log('✅ Post with details retrieved successfully');
        });
    });

    describe('Error Handling', () => {
        it('should return 401 for unauthorized requests', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/posts')
                .send({ title: 'Unauthorized Post' })
                .expect(401);
        });

        it('should return 404 for non-existent post', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/posts/99999')
                .expect(200)
                .expect((res) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.message).toBe('Post not found');
                });
        });
    });
}); 
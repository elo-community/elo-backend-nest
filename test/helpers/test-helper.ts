import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface TestUser {
    id: number;
    accessToken: string;
    walletUserId: string;
    walletAddress: string;
}

export interface TestPost {
    id: number;
    title: string;
    content: string;
}

export interface TestComment {
    id: number;
    content: string;
    postId: number;
}

export interface TestReply {
    id: number;
    content: string;
    commentId: number;
}

export class TestHelper {
    private app: INestApplication;
    private baseUrl: string;

    constructor(app: INestApplication) {
        this.app = app;
        this.baseUrl = '/api/v1';
    }

    async createTestUser(): Promise<TestUser> {
        const response = await request(this.app.getHttpServer())
            .post(`${this.baseUrl}/auth/test-user`)
            .expect(200);

        return {
            id: response.body.data.user.id,
            accessToken: response.body.data.accessToken,
            walletUserId: response.body.data.user.walletUserId,
            walletAddress: response.body.data.user.walletAddress,
        };
    }

    async createTestPost(user: TestUser, postData?: Partial<TestPost>): Promise<TestPost> {
        const defaultData = {
            title: 'Test Post',
            content: 'This is a test post content',
            type: 'post',
            isHidden: false,
        };

        const response = await request(this.app.getHttpServer())
            .post(`${this.baseUrl}/posts`)
            .set('Authorization', `Bearer ${user.accessToken}`)
            .send({ ...defaultData, ...postData })
            .expect(200);

        return {
            id: response.body.data.id,
            title: response.body.data.title,
            content: response.body.data.content,
        };
    }

    async createTestComment(user: TestUser, postId: number, commentData?: Partial<TestComment>): Promise<TestComment> {
        const defaultData = {
            content: 'This is a test comment',
            postId: postId,
        };

        const response = await request(this.app.getHttpServer())
            .post(`${this.baseUrl}/comments`)
            .set('Authorization', `Bearer ${user.accessToken}`)
            .send({ ...defaultData, ...commentData })
            .expect(200);

        return {
            id: response.body.data.id,
            content: response.body.data.content,
            postId: response.body.data.postId,
        };
    }

    async createTestReply(user: TestUser, commentId: number, replyData?: Partial<TestReply>): Promise<TestReply> {
        const defaultData = {
            content: 'This is a test reply',
            commentId: commentId,
        };

        const response = await request(this.app.getHttpServer())
            .post(`${this.baseUrl}/replies`)
            .set('Authorization', `Bearer ${user.accessToken}`)
            .send({ ...defaultData, ...replyData })
            .expect(200);

        return {
            id: response.body.data.id,
            content: response.body.data.content,
            commentId: response.body.data.commentId,
        };
    }

    async getPostWithDetails(postId: number) {
        const response = await request(this.app.getHttpServer())
            .get(`${this.baseUrl}/posts/${postId}`)
            .expect(200);

        return response.body.data;
    }

    async verifyToken(accessToken: string) {
        const response = await request(this.app.getHttpServer())
            .post(`${this.baseUrl}/auth/verify`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        return response.body;
    }

    async createFullTestScenario() {
        // 1. 테스트 사용자 생성
        const user = await this.createTestUser();
        console.log('✅ Test user created:', { userId: user.id });

        // 2. 게시글 생성
        const post = await this.createTestPost(user);
        console.log('✅ Test post created:', { postId: post.id });

        // 3. 댓글 생성
        const comment = await this.createTestComment(user, post.id);
        console.log('✅ Test comment created:', { commentId: comment.id });

        // 4. 대댓글 생성
        const reply = await this.createTestReply(user, comment.id);
        console.log('✅ Test reply created:', { replyId: reply.id });

        // 5. 상세 정보 조회
        const postWithDetails = await this.getPostWithDetails(post.id);

        return {
            user,
            post,
            comment,
            reply,
            postWithDetails,
        };
    }
} 
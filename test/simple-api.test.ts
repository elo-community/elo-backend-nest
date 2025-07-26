import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { TestHelper } from './helpers/test-helper';

describe('Simple API Tests', () => {
    let app: INestApplication;
    let testHelper: TestHelper;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        testHelper = new TestHelper(app);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Full API Flow Test', () => {
        it('should complete full API flow', async () => {
            console.log('🚀 Starting full API flow test...');

            const result = await testHelper.createFullTestScenario();

            // 검증
            expect(result.user).toBeDefined();
            expect(result.user.id).toBeGreaterThan(0);
            expect(result.user.accessToken).toBeDefined();

            expect(result.post).toBeDefined();
            expect(result.post.id).toBeGreaterThan(0);
            expect(result.post.title).toBe('Test Post');

            expect(result.comment).toBeDefined();
            expect(result.comment.id).toBeGreaterThan(0);
            expect(result.comment.postId).toBe(result.post.id);

            expect(result.reply).toBeDefined();
            expect(result.reply.id).toBeGreaterThan(0);
            expect(result.reply.commentId).toBe(result.comment.id);

            expect(result.postWithDetails).toBeDefined();
            expect(result.postWithDetails.author).toBeDefined();
            expect(result.postWithDetails.comments).toBeDefined();
            expect(result.postWithDetails.comments.length).toBeGreaterThan(0);

            const comment = result.postWithDetails.comments[0];
            expect(comment.replies).toBeDefined();
            expect(comment.replies.length).toBeGreaterThan(0);

            console.log('✅ Full API flow test completed successfully!');
            console.log('📊 Test Results:', {
                userId: result.user.id,
                postId: result.post.id,
                commentId: result.comment.id,
                replyId: result.reply.id,
            });
        });
    });

    describe('Individual Component Tests', () => {
        it('should create and verify test user', async () => {
            const user = await testHelper.createTestUser();

            expect(user.id).toBeGreaterThan(0);
            expect(user.accessToken).toBeDefined();
            expect(user.walletUserId).toMatch(/^test-user-\d+$/);
            expect(user.walletAddress).toMatch(/^0x[a-f0-9]+$/);

            const verifyResult = await testHelper.verifyToken(user.accessToken);
            expect(verifyResult.success).toBe(true);
        });

        it('should create post and retrieve with details', async () => {
            const user = await testHelper.createTestUser();
            const post = await testHelper.createTestPost(user, {
                title: 'Custom Test Post',
                content: 'Custom test content',
            });

            expect(post.id).toBeGreaterThan(0);
            expect(post.title).toBe('Custom Test Post');
            expect(post.content).toBe('Custom test content');

            const postWithDetails = await testHelper.getPostWithDetails(post.id);
            expect(postWithDetails.author.id).toBe(user.id);
            expect(postWithDetails.comments).toBeDefined();
        });

        it('should create comment and reply', async () => {
            const user = await testHelper.createTestUser();
            const post = await testHelper.createTestPost(user);
            const comment = await testHelper.createTestComment(user, post.id, {
                content: 'Custom test comment',
            });
            const reply = await testHelper.createTestReply(user, comment.id, {
                content: 'Custom test reply',
            });

            expect(comment.content).toBe('Custom test comment');
            expect(comment.postId).toBe(post.id);
            expect(reply.content).toBe('Custom test reply');
            expect(reply.commentId).toBe(comment.id);
        });
    });
}); 
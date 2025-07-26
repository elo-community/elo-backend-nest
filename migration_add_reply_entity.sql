-- Reply 엔티티를 위한 테이블 생성
CREATE TABLE IF NOT EXISTS "reply" (
    "id" SERIAL PRIMARY KEY,
    "user_id" integer NOT NULL,
    "comment_id" integer NOT NULL,
    "created_at" TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP NOT NULL,
    "content" character varying(255)
);

-- 외래 키 제약 조건 추가
ALTER TABLE "reply" ADD CONSTRAINT "FK_reply_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "reply" ADD CONSTRAINT "FK_reply_comment" FOREIGN KEY ("comment_id") REFERENCES "comment"("id") ON DELETE CASCADE;

-- Comment 테이블에서 대댓글 관련 컬럼 제거
ALTER TABLE "comment" DROP COLUMN IF EXISTS "parent_id";
ALTER TABLE "comment" DROP COLUMN IF EXISTS "depth";

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS "IDX_reply_user_id" ON "reply" ("user_id");
CREATE INDEX IF NOT EXISTS "IDX_reply_comment_id" ON "reply" ("comment_id");
CREATE INDEX IF NOT EXISTS "IDX_reply_created_at" ON "reply" ("created_at"); 
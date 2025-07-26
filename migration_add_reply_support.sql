-- 댓글 테이블에 대댓글 기능을 위한 컬럼 추가
ALTER TABLE comment 
ADD COLUMN parent_id INT NULL,
ADD COLUMN depth INT NOT NULL DEFAULT 0;

-- 외래키 제약조건 추가
ALTER TABLE comment 
ADD CONSTRAINT fk_comment_parent 
FOREIGN KEY (parent_id) REFERENCES comment(id) ON DELETE CASCADE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_comment_parent_id ON comment(parent_id);
CREATE INDEX idx_comment_depth ON comment(depth);
CREATE INDEX idx_comment_post_depth ON comment(post_id, depth);

-- 기존 댓글들의 depth를 0으로 설정
UPDATE comment SET depth = 0 WHERE parent_id IS NULL; 
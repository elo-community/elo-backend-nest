-- User 테이블에 튜토리얼 관련 필드 추가
ALTER TABLE `user` 
ADD COLUMN `tutorial_first_post_completed` BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN `tutorial_first_match_completed` BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN `tutorial_first_post_completed_at` TIMESTAMP NULL,
ADD COLUMN `tutorial_first_match_completed_at` TIMESTAMP NULL;

-- 기존 사용자들의 튜토리얼 상태를 확인하기 위한 인덱스 추가
CREATE INDEX `idx_user_tutorial_status` ON `user` (`tutorial_first_post_completed`, `tutorial_first_match_completed`);
CREATE INDEX `idx_user_wallet_address` ON `user` (`wallet_address`);

-- TokenAccumulation 테이블의 기존 데이터와 호환성을 위한 확인
-- (기존 데이터가 있다면 튜토리얼 타입으로 마이그레이션하지 않음)

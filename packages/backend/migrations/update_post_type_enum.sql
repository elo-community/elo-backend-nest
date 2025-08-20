-- Post 테이블의 type 필드를 enum으로 변경
-- 기존 데이터 마이그레이션
UPDATE `post` SET `type` = 'general' WHERE `type` IS NULL OR `type` = '';
UPDATE `post` SET `type` = 'general' WHERE `type` = '일반';
UPDATE `post` SET `type` = 'match' WHERE `type` = '매치';

-- type 컬럼을 enum으로 변경
ALTER TABLE `post` 
MODIFY COLUMN `type` ENUM('general', 'match') NOT NULL DEFAULT 'general';

-- 인덱스 추가
CREATE INDEX `idx_post_type` ON `post` (`type`);
CREATE INDEX `idx_post_type_created` ON `post` (`type`, `created_at`);

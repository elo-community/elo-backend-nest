-- Post 테이블에 매치글 관련 필드 추가
ALTER TABLE `post` 
ADD COLUMN `match_location` VARCHAR(255) NULL,
ADD COLUMN `my_elo` INT NULL,
ADD COLUMN `preferred_elo` VARCHAR(50) NULL,
ADD COLUMN `participant_count` INT NULL,
ADD COLUMN `match_status` VARCHAR(50) NULL DEFAULT '대기중',
ADD COLUMN `deadline` TIMESTAMP NULL,
ADD COLUMN `match_date` TIMESTAMP NULL;

-- match_requests 테이블 생성
CREATE TABLE `match_requests` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    `message` TEXT NULL,
    `user_elo` INT NULL,
    `responded_at` TIMESTAMP NULL,
    `response_message` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    UNIQUE KEY `unique_post_user` (`post_id`, `user_id`),
    FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

-- 인덱스 추가
CREATE INDEX `idx_post_type` ON `post` (`type`);
CREATE INDEX `idx_post_match_status` ON `post` (`match_status`);
CREATE INDEX `idx_post_deadline` ON `post` (`deadline`);
CREATE INDEX `idx_post_sport_category` ON `post` (`sport_category_id`);

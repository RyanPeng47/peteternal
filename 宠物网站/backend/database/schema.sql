-- PetEternal 数据库设计
-- 数据库: peteternal

-- 创建数据库
CREATE DATABASE IF NOT EXISTS peteternal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE peteternal;

-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    bio TEXT,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 宠物表
CREATE TABLE pets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    type ENUM('dog', 'cat', 'other') NOT NULL,
    breed VARCHAR(50),
    gender ENUM('male', 'female', 'unknown'),
    birth_date DATE,
    weight DECIMAL(5,2),
    avatar_url VARCHAR(255),
    bio TEXT,
    status ENUM('alive', 'rainbow_bridge') DEFAULT 'alive',
    death_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- 媒体文件表
CREATE TABLE media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pet_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('photo', 'video') NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    caption TEXT,
    tags JSON,
    stage ENUM('baby', 'adult', 'senior', 'memorial'),
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pet_id (pet_id),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

-- 点赞表
CREATE TABLE likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    target_type ENUM('media', 'post') NOT NULL,
    target_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_target (target_type, target_id)
);

-- 评论表
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    target_type ENUM('media', 'post') NOT NULL,
    target_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_id INT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_target (target_type, target_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- 社交动态表
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    media_ids JSON,
    tags JSON,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    community ENUM('all', 'dogs', 'cats', 'rainbow', 'breeds') DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_community (community),
    INDEX idx_created_at (created_at)
);

-- 关注关系表
CREATE TABLE follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_follow (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (follower_id != following_id)
);

-- 纪念事件表
CREATE TABLE memorial_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pet_id INT,
    type ENUM('birthday', 'adopt', 'health', 'milestone', 'memorial') NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    repeat_type ENUM('once', 'yearly', 'monthly') DEFAULT 'once',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_pet_id (pet_id),
    INDEX idx_event_date (event_date)
);

-- 时空信箱表
CREATE TABLE time_letters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pet_id INT,
    type ENUM('future', 'rainbow') NOT NULL,
    content TEXT NOT NULL,
    deliver_date DATE,
    is_delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_deliver_date (deliver_date)
);

-- 空间装饰表
CREATE TABLE space_decorations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pet_id INT NOT NULL,
    theme_type VARCHAR(50),
    widget_data JSON,
    bgm_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    INDEX idx_pet_id (pet_id)
);

-- AI卡通生成记录表
CREATE TABLE ai_avatars (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pet_id INT NOT NULL,
    original_image_url VARCHAR(255),
    generated_image_url VARCHAR(255),
    style VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    INDEX idx_pet_id (pet_id)
);

-- 成长时间线表
CREATE TABLE timeline_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pet_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    media_ids JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    INDEX idx_pet_id (pet_id),
    INDEX idx_event_date (event_date)
);

-- 品种互助表
CREATE TABLE breed_help_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    breed VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tags JSON,
    views_count INT DEFAULT 0,
    answers_count INT DEFAULT 0,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_breed (breed),
    INDEX idx_user_id (user_id)
);

-- 品种互助回答表
CREATE TABLE breed_help_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    is_best_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES breed_help_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id)
);

-- 通知表
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('like', 'comment', 'follow', 'mention', 'reminder') NOT NULL,
    content TEXT NOT NULL,
    related_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- 创建视图：用户宠物统计
CREATE VIEW user_pet_stats AS
SELECT
    u.id as user_id,
    u.username,
    COUNT(DISTINCT p.id) as total_pets,
    COUNT(DISTINCT CASE WHEN p.status = 'alive' THEN p.id END) as alive_pets,
    COUNT(DISTINCT CASE WHEN p.status = 'rainbow_bridge' THEN p.id END) as rainbow_pets,
    COUNT(DISTINCT m.id) as total_media,
    SUM(m.likes_count) as total_likes
FROM users u
LEFT JOIN pets p ON u.id = p.user_id
LEFT JOIN media m ON p.id = m.pet_id
GROUP BY u.id, u.username;

-- 创建视图：宠物时间线
CREATE VIEW pet_timeline AS
SELECT
    p.id as pet_id,
    p.name as pet_name,
    p.user_id,
    'media' as type,
    m.id as item_id,
    m.caption as title,
    m.created_at,
    m.stage
FROM pets p
JOIN media m ON p.id = m.pet_id

UNION ALL

SELECT
    p.id as pet_id,
    p.name as pet_name,
    p.user_id,
    'timeline' as type,
    t.id as item_id,
    t.title,
    t.created_at,
    NULL as stage
FROM pets p
JOIN timeline_events t ON p.id = t.pet_id

ORDER BY created_at DESC;

-- 插入示例数据
INSERT INTO users (username, email, password_hash, nickname, location) VALUES
('admin', 'admin@peteternal.com', '$2b$12$hashed_password', '管理员', '北京'),
('testuser', 'test@example.com', '$2b$12$hashed_password', '测试用户', '上海');

INSERT INTO pets (user_id, name, type, breed, gender, birth_date, status) VALUES
(2, '小白', 'dog', '金毛', 'male', '2021-01-25', 'alive'),
(2, '球球', 'cat', '布偶', 'female', '2020-06-15', 'rainbow_bridge');
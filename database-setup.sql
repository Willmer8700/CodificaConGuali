CREATE DATABASE IF NOT EXISTS codifica_con_guali
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE codifica_con_guali;

CREATE TABLE admin_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_ADMIN',
    
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    username VARCHAR(100) NOT NULL,
    action VARCHAR(500) NOT NULL,
    
    INDEX idx_timestamp (timestamp DESC),
    INDEX idx_username (username),
    INDEX idx_timestamp_username (timestamp DESC, username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE game_stat (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    track_name VARCHAR(200) NOT NULL,
    result VARCHAR(50) NOT NULL,
    timestamp DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    
    INDEX idx_timestamp (timestamp DESC),
    INDEX idx_result (result),
    INDEX idx_track_name (track_name),
    INDEX idx_timestamp_result (timestamp DESC, result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE visit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    visit_time DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    
    INDEX idx_visit_time (visit_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE track (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    path TEXT NOT NULL,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar log de actividad inicial
INSERT INTO activity_log (username, action, timestamp) VALUES 
('admin', 'Sistema inicializado', NOW(6));
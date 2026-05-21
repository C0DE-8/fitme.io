
CREATE TABLE IF NOT EXISTS chat_history (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,               -- <== SIGNED to match users.id
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    session_id VARCHAR(100) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE chat_history 
ADD COLUMN replied BOOLEAN NOT NULL DEFAULT FALSE;

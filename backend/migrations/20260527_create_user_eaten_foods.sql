CREATE TABLE IF NOT EXISTS user_eaten_foods (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  food_id INT NOT NULL,
  eaten_count INT NOT NULL DEFAULT 1,
  last_eaten_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_user_eaten_food (user_id, food_id),
  KEY idx_user_eaten_food_user (user_id),
  KEY idx_user_eaten_food_food (food_id),
  KEY idx_user_eaten_food_last_eaten (user_id, last_eaten_at),
  CONSTRAINT fk_user_eaten_food_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_eaten_food_food
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

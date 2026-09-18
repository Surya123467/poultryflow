CREATE DATABASE IF NOT EXISTS poultryflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE poultryflow;

CREATE TABLE batches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  batch_name VARCHAR(100) NOT NULL,
  initial_birds INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_batches_initial_birds CHECK (initial_birds > 0),
  INDEX idx_batches_start_date (start_date),
  INDEX idx_batches_batch_name (batch_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE daily_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  batch_id INT UNSIGNED NOT NULL,
  log_date DATE NOT NULL,
  feed_consumed_kg DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
  water_consumed_liters DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
  mortality INT UNSIGNED NOT NULL DEFAULT 0,
  eggs_collected INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_daily_logs_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT uq_daily_logs_batch_date UNIQUE (batch_id, log_date),
  INDEX idx_daily_logs_log_date (log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

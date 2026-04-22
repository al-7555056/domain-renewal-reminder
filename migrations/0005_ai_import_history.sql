CREATE TABLE IF NOT EXISTS ai_import_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_label TEXT NOT NULL,
  source_text TEXT,
  model TEXT,
  status TEXT NOT NULL,
  drafts_json TEXT,
  warnings_json TEXT,
  error_message TEXT,
  result_count INTEGER NOT NULL DEFAULT 0,
  retry_of_history_id TEXT,
  imported_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (retry_of_history_id) REFERENCES ai_import_history(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_import_history_user_id ON ai_import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_import_history_status ON ai_import_history(status);
CREATE INDEX IF NOT EXISTS idx_ai_import_history_created_at ON ai_import_history(created_at);

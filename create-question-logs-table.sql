-- Supabase question_logs 表创建脚本
-- 请在 Supabase SQL 编辑器中执行此脚本

-- 创建题目日志表
CREATE TABLE IF NOT EXISTS question_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  question_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_question_logs_account_id ON question_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_question_logs_created_at ON question_logs(created_at);

-- 启用行级安全策略
ALTER TABLE question_logs ENABLE ROW LEVEL SECURITY;

-- 创建策略允许所有操作（根据你的需求调整）
CREATE POLICY "Allow all operations on question_logs" ON question_logs 
FOR ALL USING (true) WITH CHECK (true);

-- 验证表创建成功
SELECT 'question_logs table created successfully' as status;

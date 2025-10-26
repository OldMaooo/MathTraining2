-- Supabase数据库表创建脚本
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 创建题目日志表
CREATE TABLE IF NOT EXISTS question_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  question_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_question_logs_account_id ON question_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_question_logs_created_at ON question_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_question_logs_account_created ON question_logs(account_id, created_at);

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_question_logs_updated_at ON question_logs;
CREATE TRIGGER update_question_logs_updated_at 
    BEFORE UPDATE ON question_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 设置行级安全策略
ALTER TABLE question_logs ENABLE ROW LEVEL SECURITY;

-- 5. 创建策略：允许所有操作（简化版本，用于测试）
DROP POLICY IF EXISTS "Allow all operations on question_logs" ON question_logs;
CREATE POLICY "Allow all operations on question_logs" ON question_logs
    FOR ALL USING (true) WITH CHECK (true);

-- 6. 验证表创建
SELECT 'question_logs table created successfully' as status;

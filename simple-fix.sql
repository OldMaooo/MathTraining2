-- 简单修复question_logs表的SQL脚本
-- 请在Supabase SQL编辑器中执行此脚本

-- 方案1: 如果表存在但列名不对，添加正确的列
ALTER TABLE question_logs ADD COLUMN IF NOT EXISTS question_data JSONB;

-- 方案2: 如果上面的方法不行，删除表重新创建
-- DROP TABLE IF EXISTS question_logs CASCADE;

-- CREATE TABLE question_logs (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
--   question_data JSONB NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- CREATE INDEX idx_question_logs_account_id ON question_logs(account_id);
-- CREATE INDEX idx_question_logs_created_at ON question_logs(created_at);

-- ALTER TABLE question_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations on question_logs" ON question_logs FOR ALL USING (true) WITH CHECK (true);

-- 验证列是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'question_logs' 
ORDER BY ordinal_position;

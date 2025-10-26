-- 重新创建question_logs表的完整SQL脚本
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 删除现有表（如果存在）
DROP TABLE IF EXISTS question_logs CASCADE;

-- 2. 重新创建表，只使用question_data列
CREATE TABLE question_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  question_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX idx_question_logs_account_id ON question_logs(account_id);
CREATE INDEX idx_question_logs_created_at ON question_logs(created_at);

-- 4. 启用行级安全策略
ALTER TABLE question_logs ENABLE ROW LEVEL SECURITY;

-- 5. 创建策略
CREATE POLICY "Allow all operations on question_logs" ON question_logs 
FOR ALL USING (true) WITH CHECK (true);

-- 6. 验证表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'question_logs' 
ORDER BY ordinal_position;

-- 7. 测试插入
INSERT INTO question_logs (account_id, question_data) 
VALUES (
  'b09ab67e-c922-4598-a915-75e8c8a8b72d',
  '{"a": 12, "b": 8, "operation": "-", "correctAnswer": 4, "userAnswer": 4, "isCorrect": true, "timeTaken": 6.152, "displayText": "12 - 8 =?", "timestamp": 1761456032397}'::jsonb
);

-- 8. 测试查询
SELECT * FROM question_logs WHERE account_id = 'b09ab67e-c922-4598-a915-75e8c8a8b72d';

-- 9. 清理测试数据
DELETE FROM question_logs WHERE account_id = 'b09ab67e-c922-4598-a915-75e8c8a8b72d';

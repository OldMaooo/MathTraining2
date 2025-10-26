-- 直接测试question_logs表的SQL脚本
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 测试插入一条题目日志
INSERT INTO question_logs (account_id, question_data) 
VALUES (
  '78926b54-cce2-45f8-bcb1-a986363feab2',
  '{"a": 5, "b": 3, "operation": "+", "correctAnswer": 8, "userAnswer": 8, "isCorrect": true, "timeTaken": 2.5}'::jsonb
);

-- 2. 查询刚才插入的数据
SELECT * FROM question_logs 
WHERE account_id = '78926b54-cce2-45f8-bcb1-a986363feab2'
ORDER BY created_at DESC 
LIMIT 5;

-- 3. 删除测试数据
DELETE FROM question_logs 
WHERE account_id = '78926b54-cce2-45f8-bcb1-a986363feab2'
AND question_data->>'a' = '5';

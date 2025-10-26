-- 紧急清理重复的题目日志数据
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 查看当前数据情况
SELECT 
  account_id,
  COUNT(*) as total_count,
  COUNT(DISTINCT question_data) as unique_count,
  COUNT(*) - COUNT(DISTINCT question_data) as duplicate_count
FROM question_logs 
GROUP BY account_id;

-- 2. 删除重复的题目日志（保留最新的）
WITH ranked_logs AS (
  SELECT 
    id,
    account_id,
    question_data,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY account_id, question_data 
      ORDER BY created_at DESC
    ) as rn
  FROM question_logs
)
DELETE FROM question_logs 
WHERE id IN (
  SELECT id 
  FROM ranked_logs 
  WHERE rn > 1
);

-- 3. 再次查看清理后的数据情况
SELECT 
  account_id,
  COUNT(*) as total_count,
  COUNT(DISTINCT question_data) as unique_count
FROM question_logs 
GROUP BY account_id;

-- 4. 查看具体的题目日志内容
SELECT 
  id,
  account_id,
  question_data,
  created_at
FROM question_logs 
ORDER BY created_at DESC 
LIMIT 10;

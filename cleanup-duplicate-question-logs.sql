-- 清理重复的题目日志
-- 保留每个唯一题目（基于a, b, operation, userAnswer）的最新记录

-- 首先查看重复情况
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT CONCAT(question_data->>'a', '_', question_data->>'b', '_', question_data->>'operation', '_', question_data->>'userAnswer')) as unique_logs,
  COUNT(*) - COUNT(DISTINCT CONCAT(question_data->>'a', '_', question_data->>'b', '_', question_data->>'operation', '_', question_data->>'userAnswer')) as duplicates
FROM question_logs;

-- 删除重复的题目日志，保留最新的记录
WITH ranked_logs AS (
  SELECT 
    id,
    account_id,
    question_data,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        question_data->>'a', 
        question_data->>'b', 
        question_data->>'operation', 
        question_data->>'userAnswer'
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

-- 再次查看清理后的情况
SELECT 
  COUNT(*) as remaining_logs,
  COUNT(DISTINCT CONCAT(question_data->>'a', '_', question_data->>'b', '_', question_data->>'operation', '_', question_data->>'userAnswer')) as unique_logs
FROM question_logs;

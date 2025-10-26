-- 彻底清理重复的题目日志
-- 这次使用更严格的去重条件

-- 首先查看当前情况
SELECT 
  COUNT(*) as total_logs,
  COUNT(DISTINCT CONCAT(question_data->>'a', '_', question_data->>'b', '_', question_data->>'operation', '_', question_data->>'userAnswer')) as unique_logs,
  COUNT(*) - COUNT(DISTINCT CONCAT(question_data->>'a', '_', question_data->>'b', '_', question_data->>'operation', '_', question_data->>'userAnswer')) as duplicates
FROM question_logs;

-- 删除所有重复的题目日志，只保留每个唯一题目的第一条记录
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
      ORDER BY created_at ASC  -- 保留最早的记录
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

-- 显示剩余的题目日志样本
SELECT 
  question_data->>'a' as a,
  question_data->>'b' as b,
  question_data->>'operation' as operation,
  question_data->>'userAnswer' as userAnswer,
  question_data->>'isCorrect' as isCorrect,
  created_at
FROM question_logs
ORDER BY created_at ASC
LIMIT 10;

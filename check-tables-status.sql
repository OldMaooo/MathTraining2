-- 检查Supabase表状态的SQL脚本
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 检查所有表是否存在
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('accounts', 'profiles', 'daily_stats', 'daily_tasks', 'question_logs', 'wrong_questions')
ORDER BY schemaname, tablename;

-- 2. 检查question_logs表的结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'question_logs' 
ORDER BY ordinal_position;

-- 3. 检查表的权限
SELECT 
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges 
WHERE table_name = 'question_logs';

-- 4. 检查行级安全策略（修复版本）
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'question_logs';

import { getSupabaseClient } from './supabaseClient';
import type { DailyStats, DailyTasks, UserProfile } from '../types/gamification';

export class CloudStore {
  private static instance: CloudStore;
  private constructor() {}
  static getInstance() {
    if (!CloudStore.instance) CloudStore.instance = new CloudStore();
    return CloudStore.instance;
  }

  // 账户创建/查找
  async ensureAccount(username: string, passwordHash: string, type: string): Promise<string> {
    const supabase = getSupabaseClient();
    
    // 先尝试查找现有账户
    const { data: existing, error: findError } = await supabase
      .from('accounts')
      .select('id')
      .eq('username', username)
      .limit(1)
      .maybeSingle();
    
    if (findError) {
      console.error('查找账户失败:', findError);
      throw findError;
    }
    
    if (existing?.id) {
      console.log('[CloudSync] 找到现有账户:', existing.id);
      return existing.id;
    }
    
    // 如果不存在，尝试插入新账户
    const { data: inserted, error: insertError } = await supabase
      .from('accounts')
      .insert({ username, password_hash: passwordHash, type })
      .select('id')
      .single();
    
    if (insertError) {
      // 如果是重复键错误，再次尝试查找
      if (insertError.code === '23505') {
        console.log('[CloudSync] 账户已存在，重新查找...');
        const { data: retryFind, error: retryError } = await supabase
          .from('accounts')
          .select('id')
          .eq('username', username)
          .limit(1)
          .single();
        
        if (retryError) throw retryError;
        return retryFind.id;
      }
      throw insertError;
    }
    
    console.log('[CloudSync] 创建新账户:', inserted.id);
    return inserted.id;
  }

  async upsertProfile(accountId: string, profile: UserProfile) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        account_id: accountId, 
        exp: profile.exp,
        level: profile.level,
        streak: profile.streak,
        last_active_date: profile.lastActiveDate,
        total_questions: profile.totalQuestions,
        correct_questions: profile.correctQuestions || 0,
        total_time_ms: profile.totalTimeMs || 0
      });
    if (error) throw error;
  }

  async upsertDailyStats(accountId: string, stats: DailyStats) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('daily_stats')
      .upsert({ 
        account_id: accountId, 
        date: stats.date, 
        questions_answered: stats.questionsAnswered, 
        correct_answers: stats.correctAnswers, 
        wrong_answers: stats.wrongAnswers,
        total_time: stats.totalTime
      }, {
        onConflict: 'account_id,date',
        ignoreDuplicates: false
      });
    if (error) throw error;
  }

  async upsertDailyTasks(accountId: string, tasks: DailyTasks) {
    const supabase = getSupabaseClient();
    
    // 将任务对象转换为行格式
    const taskEntries = Object.entries(tasks.tasks).map(([taskKey, task]) => ({
      account_id: accountId,
      date: tasks.date,
      task_key: taskKey,
      progress: task.progress,
      completed: task.completed
    }));
    
    // 使用 upsert 来处理主键冲突
    const { error } = await supabase
      .from('daily_tasks')
      .upsert(taskEntries, { 
        onConflict: 'account_id,date,task_key',
        ignoreDuplicates: false 
      });
    if (error) throw error;
  }

  // 记录题目日志
  async logQuestion(accountId: string, questionData: {
    questionText: string;
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    timeTaken: number;
  }) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('question_logs')
      .insert({
        account_id: accountId,
        question_text: questionData.questionText,
        user_answer: questionData.userAnswer,
        correct_answer: questionData.correctAnswer,
        is_correct: questionData.isCorrect,
        time_taken: Math.round(questionData.timeTaken) // 直接取整秒数
      });
    if (error) throw error;
  }

  // 记录错题
  async logWrongQuestion(accountId: string, wrongQuestionData: {
    questionText: string;
    correctAnswer: number;
    wrongAnswer: number;
  }) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('wrong_questions')
      .insert({
        account_id: accountId,
        question_text: wrongQuestionData.questionText,
        correct_answer: wrongQuestionData.correctAnswer,
        wrong_answer: wrongQuestionData.wrongAnswer
      });
    if (error) throw error;
  }
}






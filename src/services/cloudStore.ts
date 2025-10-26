import { getSupabaseClient } from './supabaseClient';
import { localCloudStore } from './localCloudStore';
import type { DailyStats, DailyTasks, UserProfile } from '../types/gamification';

export class CloudStore {
  private static instance: CloudStore;
  private useLocalFallback = false;
  
  private constructor() {
    // 检查Supabase是否可用
    this.checkSupabaseAvailability();
  }
  
  static getInstance() {
    if (!CloudStore.instance) CloudStore.instance = new CloudStore();
    return CloudStore.instance;
  }

  // 检查Supabase可用性
  private async checkSupabaseAvailability() {
    try {
      const supabase = getSupabaseClient();
      await supabase.from('accounts').select('id').limit(1);
      this.useLocalFallback = false;
      console.log('✅ Supabase连接正常');
    } catch (error) {
      console.warn('⚠️ Supabase不可用，切换到本地存储模式:', error);
      this.useLocalFallback = true;
    }
  }

  // 获取Supabase客户端
  get supabase() {
    return getSupabaseClient();
  }

  // 账户创建/查找
  async ensureAccount(username: string, passwordHash: string, type: string): Promise<string> {
    if (this.useLocalFallback) {
      // 使用本地存储
      const accountId = `local:${username}`;
      await localCloudStore.syncAccount({ id: accountId, username, type });
      return accountId;
    }

    try {
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
    } catch (error) {
      console.warn('Supabase账户操作失败，切换到本地存储:', error);
      this.useLocalFallback = true;
      const accountId = `local:${username}`;
      await localCloudStore.syncAccount({ id: accountId, username, type });
      return accountId;
    }
  }

  async upsertProfile(accountId: string, profile: UserProfile) {
    if (this.useLocalFallback) {
      await localCloudStore.syncProfile(profile);
      return;
    }

    try {
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
    } catch (error) {
      console.warn('Supabase档案同步失败，切换到本地存储:', error);
      this.useLocalFallback = true;
      await localCloudStore.syncProfile(profile);
    }
  }

  async upsertDailyStats(accountId: string, stats: DailyStats) {
    if (this.useLocalFallback) {
      // 本地存储模式下，直接保存到localStorage
      const key = `mp-daily-stats-${accountId}`;
      localStorage.setItem(key, JSON.stringify(stats));
      return;
    }

    try {
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
    } catch (error) {
      console.warn('Supabase每日统计同步失败，切换到本地存储:', error);
      this.useLocalFallback = true;
      const key = `mp-daily-stats-${accountId}`;
      localStorage.setItem(key, JSON.stringify(stats));
    }
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
    if (this.useLocalFallback) {
      // 本地存储模式下，保存到localStorage
      const key = `mp-question-logs-${accountId}`;
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
      const newLog = {
        ...questionData,
        timestamp: Date.now(),
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      existingLogs.push(newLog);
      localStorage.setItem(key, JSON.stringify(existingLogs));
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('question_logs')
        .insert({
          account_id: accountId,
          question_data: {
            questionText: questionData.questionText,
            userAnswer: questionData.userAnswer,
            correctAnswer: questionData.correctAnswer,
            isCorrect: questionData.isCorrect,
            timeTaken: questionData.timeTaken
          }
        });
      if (error) throw error;
    } catch (error) {
      console.warn('Supabase题目日志记录失败，切换到本地存储:', error);
      this.useLocalFallback = true;
      const key = `mp-question-logs-${accountId}`;
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
      const newLog = {
        ...questionData,
        timestamp: Date.now(),
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      existingLogs.push(newLog);
      localStorage.setItem(key, JSON.stringify(existingLogs));
    }
  }

  // 记录错题
  async logWrongQuestion(accountId: string, wrongQuestionData: {
    questionText: string;
    correctAnswer: number;
    wrongAnswer: number;
  }) {
    if (this.useLocalFallback) {
      // 本地存储模式下，保存到localStorage
      const key = `mp-wrong-questions-${accountId}`;
      const existingQuestions = JSON.parse(localStorage.getItem(key) || '[]');
      const newQuestion = {
        ...wrongQuestionData,
        timestamp: Date.now(),
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      existingQuestions.push(newQuestion);
      localStorage.setItem(key, JSON.stringify(existingQuestions));
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('wrong_questions')
        .insert({
          account_id: accountId,
          question_data: {
            questionText: wrongQuestionData.questionText,
            correctAnswer: wrongQuestionData.correctAnswer,
            wrongAnswer: wrongQuestionData.wrongAnswer
          }
        });
      if (error) throw error;
    } catch (error) {
      console.warn('Supabase错题记录失败，切换到本地存储:', error);
      this.useLocalFallback = true;
      const key = `mp-wrong-questions-${accountId}`;
      const existingQuestions = JSON.parse(localStorage.getItem(key) || '[]');
      const newQuestion = {
        ...wrongQuestionData,
        timestamp: Date.now(),
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      existingQuestions.push(newQuestion);
      localStorage.setItem(key, JSON.stringify(existingQuestions));
    }
  }
}






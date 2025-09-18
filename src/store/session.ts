import { create } from 'zustand';
import type { Question, Config } from '../logic/generator';
import type { Attempt, ErrorType } from '../logic/classifier';

export interface SessionSummary {
  id: string;
  config: Config;
  totalQuestions: number;
  correctAnswers: number;
  averageTimeMs: number;
  longestCombo: number;
  errorBreakdown: Record<ErrorType, number>;
  completedAt: number;
}

export interface SessionState {
  // 当前会话状态
  currentSession: {
    id: string;
    config: Config;
    questions: Question[];
    currentQuestionIndex: number;
    attempts: Attempt[];
    startTime: number;
    isActive: boolean;
  } | null;
  
  // 历史记录
  sessionHistory: SessionSummary[];
  
  // 个人最佳
  personalBest: {
    accuracy: number;
    averageTime: number;
    longestCombo: number;
  };
  
  // 操作
  startSession: (config: Config, questions: Question[]) => void;
  submitAnswer: (answer: number | null, timeMs: number) => void;
  nextQuestion: () => void;
  finishSession: () => SessionSummary | null;
  resetSession: () => void;
  
  // 历史管理
  addSessionToHistory: (summary: SessionSummary) => void;
  clearHistory: () => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
      currentSession: null,
      sessionHistory: [],
      personalBest: {
        accuracy: 0,
        averageTime: 0,
        longestCombo: 0
      },
      
      startSession: (config: Config, questions: Question[]) => {
        const sessionId = `session_${Date.now()}`;
        set({
          currentSession: {
            id: sessionId,
            config,
            questions,
            currentQuestionIndex: 0,
            attempts: [],
            startTime: Date.now(),
            isActive: true
          }
        });
      },
      
      submitAnswer: (answer: number | null, timeMs: number) => {
        const state = get();
        if (!state.currentSession) return;
        
        const currentQuestion = state.currentSession.questions[state.currentSession.currentQuestionIndex];
        const correct = answer === currentQuestion.correctAnswer;
        
        const attempt: Attempt = {
          questionId: currentQuestion.id,
          answer,
          correct,
          timeMs,
          timestamp: Date.now()
        };
        
        set({
          currentSession: {
            ...state.currentSession,
            attempts: [...state.currentSession.attempts, attempt]
          }
        });
      },
      
      nextQuestion: () => {
        const state = get();
        if (!state.currentSession) return;
        
        const nextIndex = state.currentSession.currentQuestionIndex + 1;
        const isComplete = nextIndex >= state.currentSession.questions.length;
        
        set({
          currentSession: {
            ...state.currentSession,
            currentQuestionIndex: nextIndex,
            isActive: !isComplete
          }
        });
      },
      
      finishSession: () => {
        const state = get();
        if (!state.currentSession) return null;
        
        const { questions, attempts, config } = state.currentSession;
        const totalQuestions = questions.length;
        const correctAnswers = attempts.filter(a => a.correct).length;
        const averageTimeMs = attempts.reduce((sum, a) => sum + a.timeMs, 0) / attempts.length || 0;
        
        // 计算最长连击
        let longestCombo = 0;
        let currentCombo = 0;
        for (const attempt of attempts) {
          if (attempt.correct) {
            currentCombo++;
            longestCombo = Math.max(longestCombo, currentCombo);
          } else {
            currentCombo = 0;
          }
        }
        
        // 计算错误分类
        const errorBreakdown: Record<ErrorType, number> = {
          'borrow': 0,
          'carry': 0,
          'careless': 0,
          'timeout': 0,
          'operation': 0
        };
        
        attempts.forEach(attempt => {
          if (!attempt.correct && attempt.errorType) {
            errorBreakdown[attempt.errorType]++;
          }
        });
        
        const summary: SessionSummary = {
          id: state.currentSession.id,
          config,
          totalQuestions,
          correctAnswers,
          averageTimeMs,
          longestCombo,
          errorBreakdown,
          completedAt: Date.now()
        };
        
        // 更新个人最佳
        const accuracy = correctAnswers / totalQuestions;
        const currentBest = state.personalBest;
        
        set({
          personalBest: {
            accuracy: Math.max(currentBest.accuracy, accuracy),
            averageTime: currentBest.averageTime === 0 ? averageTimeMs : 
                        Math.min(currentBest.averageTime, averageTimeMs),
            longestCombo: Math.max(currentBest.longestCombo, longestCombo)
          }
        });
        
        return summary;
      },
      
      resetSession: () => {
        set({ currentSession: null });
      },
      
      addSessionToHistory: (summary: SessionSummary) => {
        set(state => ({
          sessionHistory: [summary, ...state.sessionHistory].slice(0, 50) // 保留最近50次
        }));
      },
      
      clearHistory: () => {
        set({ sessionHistory: [] });
      }
}));

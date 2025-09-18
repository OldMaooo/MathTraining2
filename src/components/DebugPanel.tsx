import React from 'react';

interface DebugPanelProps {
  questions: any[];
  currentQuestionIndex: number;
  totalQuestions: number;
  userAnswer: string;
  score: number;
  timeLeft: number;
  showFeedback: any;
  questionType: string;
  range: number;
  questionCount: number;
  timeLimit: number;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  questions,
  currentQuestionIndex,
  totalQuestions,
  userAnswer,
  score,
  timeLeft,
  showFeedback,
  questionType,
  range,
  questionCount,
  timeLimit
}) => {
  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">🐛 调试信息</h3>
      
      <div className="space-y-1">
        <div><strong>题目数量:</strong> {questions.length}</div>
        <div><strong>当前题目:</strong> {currentQuestionIndex + 1} / {totalQuestions}</div>
        <div><strong>用户答案:</strong> "{userAnswer}"</div>
        <div><strong>得分:</strong> {score}</div>
        <div><strong>剩余时间:</strong> {timeLeft}s</div>
        <div><strong>反馈状态:</strong> {showFeedback ? '显示中' : '无'}</div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div><strong>配置:</strong></div>
        <div>题型: {questionType}</div>
        <div>范围: {range}</div>
        <div>题目数: {questionCount}</div>
        <div>时间限制: {timeLimit}s</div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div><strong>当前题目:</strong></div>
        {questions[currentQuestionIndex] ? (
          <div>
            <div>题目: {questions[currentQuestionIndex].displayText}</div>
            <div>答案: {questions[currentQuestionIndex].correctAnswer}</div>
            <div>操作: {questions[currentQuestionIndex].operation}</div>
          </div>
        ) : (
          <div className="text-red-400">❌ 无题目数据</div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div><strong>前3题预览:</strong></div>
        {questions.slice(0, 3).map((q, i) => (
          <div key={i} className="text-xs">
            {i + 1}. {q.displayText} = {q.correctAnswer}
          </div>
        ))}
      </div>
    </div>
  );
};



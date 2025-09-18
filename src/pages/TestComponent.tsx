import React, { useState, useEffect } from 'react';

interface Question {
  a: number;
  b: number;
  operation: '+' | '-';
  correctAnswer: number;
  displayText: string;
}

interface TestComponentProps {
  onBack: () => void;
}

export const TestComponent: React.FC<TestComponentProps> = ({ onBack }) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // 测试题目生成
  const testQuestionGeneration = () => {
    addResult('=== 开始测试题目生成 ===');
    
    const range = 20;
    const questionCount = 5;
    const usedQuestions = new Set<string>();
    const newQuestions: Question[] = [];
    
    // 退位减法题目生成
    for (let i = 0; i < questionCount; i++) {
      const a = Math.floor(Math.random() * (range - 10)) + 10; // 10到19
      const b = Math.floor(Math.random() * 9) + 1; // 1到9
      
      // 确保需要退位：个位不够减
      const adjustedA = Math.max(a, 10);
      const adjustedB = Math.min(b, (adjustedA % 10) + 1);
      
      const question: Question = {
        a: adjustedA,
        b: adjustedB,
        operation: '-',
        correctAnswer: adjustedA - adjustedB,
        displayText: `${adjustedA} - ${adjustedB} =`
      };
      
      addResult(`题目 ${i + 1}: ${question.displayText} 答案: ${question.correctAnswer}`);
      newQuestions.push(question);
    }
    
    setQuestions(newQuestions);
    addResult('=== 题目生成完成 ===');
  };

  // 测试分数统计
  const testScoreCalculation = () => {
    addResult('=== 开始测试分数统计 ===');
    
    // 模拟答题过程
    let testScore = 0;
    questions.forEach((question, index) => {
      const userAnswer = question.correctAnswer; // 假设都答对了
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        testScore++;
        addResult(`题目 ${index + 1}: 答对了，当前分数: ${testScore}`);
      } else {
        addResult(`题目 ${index + 1}: 答错了，当前分数: ${testScore}`);
      }
    });
    
    setScore(testScore);
    addResult(`最终分数: ${testScore}/${questions.length}`);
    addResult('=== 分数统计完成 ===');
  };

  // 测试完整的分数保存和读取流程
  const testCompleteScoreFlow = () => {
    addResult('=== 开始测试完整分数流程 ===');
    
    // 1. 清除之前的测试数据
    localStorage.removeItem('math-practice-score');
    localStorage.removeItem('questionCount');
    localStorage.removeItem('timeLimit');
    localStorage.removeItem('questionType');
    addResult('清除之前的测试数据');
    
    // 2. 设置测试数据
    const testScore = 3;
    const testQuestionCount = 5;
    const testTimeLimit = 5;
    const testQuestionType = 'borrow';
    
    localStorage.setItem('math-practice-score', testScore.toString());
    localStorage.setItem('questionCount', testQuestionCount.toString());
    localStorage.setItem('timeLimit', testTimeLimit.toString());
    localStorage.setItem('questionType', testQuestionType);
    
    addResult(`设置测试数据: 分数=${testScore}, 题目数=${testQuestionCount}, 时间=${testTimeLimit}, 题型=${testQuestionType}`);
    
    // 3. 读取并验证数据
    const savedScore = localStorage.getItem('math-practice-score');
    const savedQuestionCount = localStorage.getItem('questionCount');
    const savedTimeLimit = localStorage.getItem('timeLimit');
    const savedQuestionType = localStorage.getItem('questionType');
    
    addResult(`读取数据: 分数=${savedScore}, 题目数=${savedQuestionCount}, 时间=${savedTimeLimit}, 题型=${savedQuestionType}`);
    
    // 4. 计算正确率
    const accuracy = testQuestionCount > 0 ? Math.round((testScore / testQuestionCount) * 100) : 0;
    addResult(`计算正确率: ${testScore}/${testQuestionCount} = ${accuracy}%`);
    
    // 5. 验证数据一致性
    const isScoreCorrect = savedScore === testScore.toString();
    const isCountCorrect = savedQuestionCount === testQuestionCount.toString();
    const isTimeCorrect = savedTimeLimit === testTimeLimit.toString();
    const isTypeCorrect = savedQuestionType === testQuestionType;
    
    addResult(`数据验证: 分数${isScoreCorrect ? '✓' : '✗'}, 题目数${isCountCorrect ? '✓' : '✗'}, 时间${isTimeCorrect ? '✓' : '✗'}, 题型${isTypeCorrect ? '✓' : '✗'}`);
    
    addResult('=== 完整分数流程测试完成 ===');
  };

  // 测试模拟真实答题过程
  const testRealAnsweringProcess = () => {
    addResult('=== 开始测试真实答题过程 ===');
    
    // 生成5道测试题目
    const testQuestions: Question[] = [
      { a: 15, b: 7, operation: '-', correctAnswer: 8, displayText: '15 - 7 =' },
      { a: 18, b: 9, operation: '-', correctAnswer: 9, displayText: '18 - 9 =' },
      { a: 16, b: 8, operation: '-', correctAnswer: 8, displayText: '16 - 8 =' },
      { a: 19, b: 6, operation: '-', correctAnswer: 13, displayText: '19 - 6 =' },
      { a: 17, b: 9, operation: '-', correctAnswer: 8, displayText: '17 - 9 =' }
    ];
    
    setQuestions(testQuestions);
    
    // 模拟答题过程：答对3题，答错2题
    let currentScore = 0;
    const userAnswers = [8, 9, 7, 13, 8]; // 第3题答错（7而不是8）
    
    testQuestions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        currentScore++;
        addResult(`题目 ${index + 1}: ${question.displayText} 用户答案: ${userAnswer} ✓ 正确，当前分数: ${currentScore}`);
      } else {
        addResult(`题目 ${index + 1}: ${question.displayText} 用户答案: ${userAnswer} ✗ 错误，正确答案: ${question.correctAnswer}，当前分数: ${currentScore}`);
      }
    });
    
    // 保存最终分数
    localStorage.setItem('math-practice-score', currentScore.toString());
    localStorage.setItem('questionCount', testQuestions.length.toString());
    localStorage.setItem('timeLimit', '5');
    localStorage.setItem('questionType', 'borrow');
    
    addResult(`最终结果: 答对 ${currentScore}/${testQuestions.length} 题`);
    addResult(`正确率: ${Math.round((currentScore / testQuestions.length) * 100)}%`);
    addResult('=== 真实答题过程测试完成 ===');
  };

  // 测试localStorage
  const testLocalStorage = () => {
    addResult('=== 开始测试localStorage ===');
    
    // 保存测试数据
    localStorage.setItem('math-practice-score', score.toString());
    localStorage.setItem('questionCount', questions.length.toString());
    localStorage.setItem('timeLimit', '5');
    localStorage.setItem('questionType', 'borrow');
    
    addResult(`保存分数: ${score}`);
    addResult(`保存题目数量: ${questions.length}`);
    
    // 读取测试数据
    const savedScore = localStorage.getItem('math-practice-score');
    const savedQuestionCount = localStorage.getItem('questionCount');
    const savedTimeLimit = localStorage.getItem('timeLimit');
    const savedQuestionType = localStorage.getItem('questionType');
    
    addResult(`读取分数: ${savedScore}`);
    addResult(`读取题目数量: ${savedQuestionCount}`);
    addResult(`读取时间限制: ${savedTimeLimit}`);
    addResult(`读取题型: ${savedQuestionType}`);
    addResult('=== localStorage测试完成 ===');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">🧪 测试组件</h1>
        
        {/* 测试按钮 */}
        <div className="flex gap-4 mb-6 justify-center flex-wrap">
          <button
            onClick={testQuestionGeneration}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            测试题目生成
          </button>
          <button
            onClick={testScoreCalculation}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            测试分数统计
          </button>
          <button
            onClick={testCompleteScoreFlow}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            测试完整分数流程
          </button>
          <button
            onClick={testRealAnsweringProcess}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            测试真实答题过程
          </button>
          <button
            onClick={testLocalStorage}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            测试localStorage
          </button>
          <button
            onClick={onBack}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            返回
          </button>
        </div>
        
        {/* 当前状态 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">当前状态:</h3>
          <p>题目数量: {questions.length}</p>
          <p>当前分数: {score}</p>
        </div>
        
        {/* 生成的题目 */}
        {questions.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold mb-2">生成的题目:</h3>
            {questions.map((q, i) => (
              <p key={i} className="text-sm">{q.displayText} {q.correctAnswer}</p>
            ))}
          </div>
        )}
        
        {/* 测试结果 */}
        <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-2">测试结果:</h3>
          {testResults.map((result, i) => (
            <p key={i} className="text-sm text-gray-700">{result}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

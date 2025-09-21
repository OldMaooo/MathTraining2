import { useState, useEffect } from 'react';

interface WrongQuestion {
  id: string;
  a: number;
  b: number;
  operation: '+' | '-' | '×' | '÷';
  correctAnswer: number;
  userAnswer: number;
  timeTaken: number;
  displayText: string;
  isFillBlank?: boolean;
  blankPosition?: 'a' | 'b' | 'result';
  createdAt: number;
  questionType: string;
  isTestMode?: boolean;
}

interface WrongQuestionsProps {
  onBack: () => void;
}

export const WrongQuestions: React.FC<WrongQuestionsProps> = ({ onBack }) => {
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<WrongQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOperation, setFilterOperation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showTestMode, setShowTestMode] = useState<boolean>(false);

  // 加载错题数据
  useEffect(() => {
    loadWrongQuestions();
  }, []);

  // 应用筛选和排序
  useEffect(() => {
    let filtered = [...wrongQuestions];

    // 按测试模式筛选
    if (!showTestMode) {
      filtered = filtered.filter(q => !q.isTestMode);
    }

    // 按题型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(q => q.questionType === filterType);
    }

    // 按运算类型筛选
    if (filterOperation !== 'all') {
      filtered = filtered.filter(q => q.operation === filterOperation);
    }

    // 排序
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'timeTaken':
        filtered.sort((a, b) => a.timeTaken - b.timeTaken);
        break;
      case 'operation':
        filtered.sort((a, b) => a.operation.localeCompare(b.operation));
        break;
    }

    setFilteredQuestions(filtered);
  }, [wrongQuestions, filterType, filterOperation, sortBy, showTestMode]);

  const loadWrongQuestions = () => {
    try {
      const wrongData = localStorage.getItem('mp-wrong-questions');
      if (wrongData) {
        const questions = JSON.parse(wrongData);
        setWrongQuestions(questions);
      }
    } catch (error) {
      console.error('加载错题数据失败:', error);
    }
  };

  const saveWrongQuestions = (questions: WrongQuestion[]) => {
    localStorage.setItem('mp-wrong-questions', JSON.stringify(questions));
    setWrongQuestions(questions);
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedQuestions.size === 0) {
      alert('请先选择要删除的题目');
      return;
    }

    if (window.confirm(`确定要删除选中的 ${selectedQuestions.size} 道题目吗？`)) {
      const remainingQuestions = wrongQuestions.filter(q => !selectedQuestions.has(q.id));
      saveWrongQuestions(remainingQuestions);
      setSelectedQuestions(new Set());
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('确定要删除这道题目吗？')) {
      const remainingQuestions = wrongQuestions.filter(q => q.id !== questionId);
      saveWrongQuestions(remainingQuestions);
    }
  };

  const handleAddQuestion = () => {
    const a = window.prompt('请输入第一个数字:');
    if (!a) return;
    
    const operation = window.prompt('请输入运算符 (+, -, ×, ÷):');
    if (!operation || !['+', '-', '×', '÷'].includes(operation)) {
      alert('请输入有效的运算符');
      return;
    }
    
    const b = window.prompt('请输入第二个数字:');
    if (!b) return;
    
    const correctAnswer = window.prompt('请输入正确答案:');
    if (!correctAnswer) return;
    
    const userAnswer = window.prompt('请输入错误答案:');
    if (!userAnswer) return;
    
    const timeTaken = window.prompt('请输入答题用时（秒）:', '10');
    if (!timeTaken) return;
    
    const questionType = window.prompt('请输入题型:', 'mixed');
    if (!questionType) return;

    const newQuestion: WrongQuestion = {
      id: Date.now().toString(),
      a: parseInt(a),
      b: parseInt(b),
      operation: operation as '+' | '-' | '×' | '÷',
      correctAnswer: parseInt(correctAnswer),
      userAnswer: parseInt(userAnswer),
      timeTaken: parseFloat(timeTaken),
      displayText: `${a} ${operation} ${b} =`,
      createdAt: Date.now(),
      questionType
    };

    const updatedQuestions = [...wrongQuestions, newQuestion];
    saveWrongQuestions(updatedQuestions);
  };

  const getQuestionTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'borrow': '退位减法',
      'carry': '进位加法',
      'mixed': '加减混合',
      'multiply': '乘法',
      'divide': '除法',
      'multiply_divide': '乘除混合',
      'all_four': '四则混合',
      'fill_add_subtract': '加减法填空',
      'fill_multiply_divide': '乘除法填空'
    };
    return typeMap[type] || type;
  };

  const getOperationName = (op: string): string => {
    const opMap: Record<string, string> = {
      '+': '加法',
      '-': '减法',
      '×': '乘法',
      '÷': '除法'
    };
    return opMap[op] || op;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 text-2xl font-medium transition-colors"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-800">错题管理</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-gray-600">
            共 {wrongQuestions.length} 道错题
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showTestMode}
              onChange={(e) => setShowTestMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">显示测试错题</span>
          </label>
        </div>
      </div>

      {/* 筛选和操作栏 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* 题型筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">题型筛选</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部题型</option>
              <option value="borrow">退位减法</option>
              <option value="carry">进位加法</option>
              <option value="mixed">加减混合</option>
              <option value="multiply">乘法</option>
              <option value="divide">除法</option>
              <option value="multiply_divide">乘除混合</option>
              <option value="all_four">四则混合</option>
              <option value="fill_add_subtract">加减法填空</option>
              <option value="fill_multiply_divide">乘除法填空</option>
            </select>
          </div>

          {/* 运算类型筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">运算类型</label>
            <select
              value={filterOperation}
              onChange={(e) => setFilterOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全部运算</option>
              <option value="+">加法</option>
              <option value="-">减法</option>
              <option value="×">乘法</option>
              <option value="÷">除法</option>
            </select>
          </div>

          {/* 排序方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">最新</option>
              <option value="oldest">最早</option>
              <option value="timeTaken">答题时间</option>
              <option value="operation">运算类型</option>
            </select>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              + 添加题目
            </button>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {selectedQuestions.size === filteredQuestions.length ? '取消全选' : '全选'}
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              disabled={selectedQuestions.size === 0}
            >
              删除选中 ({selectedQuestions.size})
            </button>
          </div>
        </div>
      </div>

      {/* 错题列表 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-xl">暂无错题</div>
            <div className="text-sm mt-2">开始练习后，错题会自动记录在这里</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className={`p-4 border rounded-lg transition-all ${
                  selectedQuestions.has(question.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(question.id)}
                      onChange={() => handleSelectQuestion(question.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-lg font-semibold text-gray-800">
                          {question.displayText}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getQuestionTypeName(question.questionType)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {getOperationName(question.operation)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <span>正确答案: <span className="font-semibold text-green-600">{question.correctAnswer}</span></span>
                        <span>你的答案: <span className="font-semibold text-red-600">{question.userAnswer}</span></span>
                        <span>用时: <span className="font-semibold">{question.timeTaken.toFixed(2)}秒</span></span>
                        <span>时间: {new Date(question.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

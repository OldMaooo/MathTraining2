import { useEffect, useState } from 'react';

interface HistoryProps {
  onBack: () => void;
}

interface SessionRecord {
  id: number;
  createdAt: string;
  questionCount: number;
  correct: number;
  wrong: number;
  accuracy: number; // percentage
  avgTime: number; // seconds
  times: number[];
  type?: string; // 题型
  timeLimit?: number; // 单题时间限制
  isManual?: boolean; // 是否手动添加
  questionLogs?: Array<{
    a: number;
    b: number;
    operation: '+' | '-' | '×' | '÷';
    correctAnswer: number;
    userAnswer: number;
    isCorrect: boolean;
    timeTaken: number;
    displayText: string;
    isFillBlank?: boolean;
    blankPosition?: 'a' | 'b' | 'result';
  }>;
  wrongDetails: Array<{
    a: number; b: number; operation: '+' | '-'; correctAnswer: number; userAnswer: number; isCorrect: boolean; durationSec: number;
  }>;
  slowCorrectDetails?: Array<{
    a: number; b: number; operation: '+' | '-'; correctAnswer: number; userAnswer: number; isCorrect: boolean; durationSec: number;
  }>;
}

export const History: React.FC<HistoryProps> = ({ onBack }) => {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [selected, setSelected] = useState<SessionRecord | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryItems, setSummaryItems] = useState<Array<{
    a: number; b: number; operation: '+' | '-'; correctAnswer: number; userAnswer: number; isCorrect: boolean; durationSec: number; type: 'wrong' | 'slow'
  }>>([]);
  const [summaryTitle, setSummaryTitle] = useState<string>('错题/慢题汇总');
  const [showBestRecords, setShowBestRecords] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);

  const getQuestionTypeName = (type?: string): string => {
    const typeMap: Record<string, string> = {
      'borrow': '退位减法', 'carry': '进位加法', 'mixed': '加减混合',
      'multiply': '乘法', 'divide': '除法', 'multiply_divide': '乘除混合',
      'all_four': '四则混合', 'fill_add_subtract': '加减法填空', 'fill_multiply_divide': '乘除法填空',
      'unknown': '未知题型'
    };
    return typeMap[type || 'unknown'] || type || '未知题型';
  };

  // 获取各项记录（每类题型的最高纪录）
  const getBestRecords = () => {
    const typeMap = new Map<string, SessionRecord>();
    
    records.forEach(record => {
      if (!record.type) return;
      
      const existing = typeMap.get(record.type);
      if (!existing || record.avgTime < existing.avgTime) {
        typeMap.set(record.type, record);
      }
    });
    
    return Array.from(typeMap.values()).sort((a, b) => a.avgTime - b.avgTime);
  };

  const displayRecords = showBestRecords ? getBestRecords() : records;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mp-history');
      console.log('历史记录原始数据:', raw?.substring(0, 200) + '...');
      const list: SessionRecord[] = raw ? JSON.parse(raw) : [];
      console.log('解析后的历史记录:', list.length, '条记录');
      if (list.length > 0) {
        console.log('第一条记录:', list[0]);
        console.log('第一条记录的questionLogs:', list[0].questionLogs?.length || 0, '条');
      }
      setRecords(list);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      setRecords([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pt-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">历史记录</h1>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showBestRecords}
                onChange={(e) => setShowBestRecords(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">最佳纪录</span>
            </label>
            <button
              onClick={() => setShowAddRecord(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              添加记录
            </button>
            <button
              onClick={() => {
                const input = window.prompt('确定要清空所有历史记录吗？此操作不可恢复！\n请输入"清空记录"来确认：');
                if (input === '清空记录') {
                  localStorage.removeItem('mp-history');
                  setRecords([]);
                  alert('历史记录已清空');
                } else if (input !== null) {
                  alert('输入错误，操作已取消');
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              清空记录
            </button>
            <button onClick={onBack} className="text-blue-600 hover:underline">返回首页</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-4">时间</th>
                <th className="py-2 pr-4">题型</th>
                <th className="py-2 pr-4">题数</th>
                <th className="py-2 pr-4">正确</th>
                <th className="py-2 pr-4">错误</th>
                <th className="py-2 pr-4 w-48">正确率</th>
                <th className="py-2 pr-4 w-48">平均用时(s)</th>
                <th className="py-2 pr-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.length === 0 && (
                <tr><td className="py-3 text-gray-500" colSpan={8}>暂无记录</td></tr>
              )}
              {displayRecords.map(r => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.isManual ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getQuestionTypeName(r.type)}
                      {r.isManual && ' (手动)'}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{r.questionCount}</td>
                  <td className="py-2 pr-4 text-green-700">{r.correct}</td>
                  <td className="py-2 pr-4 text-red-600">{r.wrong}</td>
                  <td className="py-2 pr-4">
                    <div className="h-3 bg-gray-100 rounded">
                      <div className="h-3 bg-green-500 rounded" style={{ width: `${Math.min(100, Math.max(0, r.accuracy))}%` }} />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{r.accuracy}%</div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="h-3 bg-gray-100 rounded">
                      {/* 这里以10秒为可视化上限，可后续做自适应 */}
                      <div className="h-3 bg-indigo-500 rounded" style={{ width: `${Math.min(100, (r.avgTime / 10) * 100)}%` }} />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{r.avgTime.toFixed(2)}s</div>
                  </td>
                  <td className="py-2 pr-4">
                    <button className="text-blue-600 hover:underline mr-3" onClick={() => {
                      console.log('查看记录详情:', r);
                      console.log('questionLogs:', r.questionLogs);
                      setSelected(r);
                    }}>查看</button>
                    <button className="text-red-600 hover:underline" onClick={() => {
                      const ok = window.confirm('确定删除这条历史记录吗？');
                      if (!ok) return;
                      const next = records.filter(x => x.id !== r.id);
                      setRecords(next);
                      localStorage.setItem('mp-history', JSON.stringify(next));
                      // 更新最快纪录（Review页读取mp-best-avg，故此处同步覆盖）
                      if (next.length > 0) {
                        const best = Math.min(...next.map(x => x.avgTime));
                        localStorage.setItem('mp-best-avg', String(best));
                      } else {
                        localStorage.removeItem('mp-best-avg');
                      }
                    }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 错题汇总筛选 */}
        <div className="mt-6 bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">错题汇总</h2>
          <div className="flex items-center gap-3 text-sm mb-3">
            <label>时间范围：</label>
            <select id="days" className="border rounded px-2 py-1">
              <option value="3">近3天</option>
              <option value="7">近7天</option>
              <option value="30">近30天</option>
              <option value="all">全部</option>
            </select>
            <label className="ml-4">题型：</label>
            <select id="op" className="border rounded px-2 py-1">
              <option value="all">全部</option>
              <option value="+">加法</option>
              <option value="-">减法</option>
            </select>
            <button className="ml-4 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200" onClick={() => {
              const daysSel = document.getElementById('days') as HTMLSelectElement;
              const opSel = document.getElementById('op') as HTMLSelectElement;
              const days = daysSel.value;
              const op = opSel.value as ('all' | '+' | '-');
              const now = Date.now();
              const filtered = records.filter(r => {
                const ts = new Date(r.createdAt).getTime();
                const inDays = days === 'all' ? true : (now - ts) <= Number(days) * 86400000;
                return inDays;
              });
              const aggregate = filtered.flatMap(r => {
                const wrongs = r.wrongDetails.filter(w => op === 'all' ? true : w.operation === op);
                const slow = (r.slowCorrectDetails || []).filter(w => op === 'all' ? true : w.operation === op);
                return [...wrongs.map(w => ({ ...w, type: 'wrong' as const })), ...slow.map(w => ({ ...w, type: 'slow' as const }))];
              }).sort((a, b) => b.durationSec - a.durationSec);
              setSummaryItems(aggregate);
              const title = `汇总 ${days === 'all' ? '全部' : `近${days}天`} · ${op === 'all' ? '全部题型' : op === '+' ? '加法' : '减法'}`;
              setSummaryTitle(title);
              setIsSummaryOpen(true);
            }}>汇总</button>
        </div>
      </div>

        {/* 右侧抽屉：查看详情 */}
        {selected && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)}></div>
            <div className="absolute top-0 right-0 h-full w-full max-w-xl bg-white shadow-xl p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">详细信息</h2>
                <button className="text-gray-600 hover:underline" onClick={() => setSelected(null)}>关闭</button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>时间：{new Date(selected.createdAt).toLocaleString()}</div>
                <div>题数：{selected.questionCount}</div>
                <div>正确：{selected.correct}</div>
                <div>错误：{selected.wrong}</div>
                <div>正确率：{selected.accuracy}%</div>
                <div>平均用时/题：{selected.avgTime.toFixed(2)}s</div>
              </div>

              <div className="text-sm font-semibold text-gray-700 mb-2">题目分析</div>
              {/* 调试信息 - 已隐藏 */}
              {false && (
                <div className="mb-4 p-2 bg-yellow-100 text-xs text-gray-700 rounded">
                  <div className="font-bold mb-2">调试信息：</div>
                  <div>questionLogs长度: {selected.questionLogs?.length || 0}</div>
                  <div>questionLogs类型: {typeof selected.questionLogs}</div>
                  <div>questionLogs是否为数组: {Array.isArray(selected.questionLogs) ? '是' : '否'}</div>
                  <div>selected对象键: {Object.keys(selected).join(', ')}</div>
                  <div>questionLogs内容: {JSON.stringify(selected.questionLogs?.slice(0, 2) || [], null, 2)}</div>
                  <div>完整selected对象: {JSON.stringify(selected, null, 2)}</div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">题目</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">对错</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">用时(秒)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!selected.questionLogs || selected.questionLogs.length === 0) && (
                      <tr><td className="py-3 text-gray-500 text-center" colSpan={3}>暂无题目详情</td></tr>
                    )}
                    {selected.questionLogs?.map((log, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <span>
                            <span className="text-gray-800">{log.displayText.replace('?', '')}</span>
                            <span className="text-green-600 font-semibold">{log.correctAnswer}</span>
                            {!log.isCorrect && (
                              <span className="text-red-600"> （{log.userAnswer}）</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.isCorrect 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.isCorrect ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.timeTaken.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 汇总弹窗 */}
        {isSummaryOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={() => setIsSummaryOpen(false)}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-full max-w-3xl rounded-xl shadow-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{summaryTitle}</h3>
                <button className="text-gray-600 hover:underline" onClick={() => setIsSummaryOpen(false)}>关闭</button>
              </div>

              <div className="text-sm text-gray-700 mb-3">共 {summaryItems.length} 题（含错题与慢题）。</div>

              <div className="max-h-80 overflow-y-auto bg-gray-50 rounded p-3 text-sm">
                <ul className="list-disc pl-5 text-gray-800">
                  {summaryItems.map((w, i) => (
                    <li key={i} className="mb-1">
                      {w.a} {w.operation} {w.b} = （你的：{w.userAnswer}，对：{w.correctAnswer}，用时{w.durationSec}s）
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => {
                    const pure = summaryItems.map(w => `${w.a} ${w.operation} ${w.b} =`).join('\n');
                    navigator.clipboard.writeText(pure).then(() => {
                      // no-op
                    });
                  }}
                >复制纯题干</button>

                <button
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => {
                    // 将题目加入自定义题集（累积）
                    try {
                      const existingRaw = localStorage.getItem('mp-custom-questions');
                      const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
                      const newOnes = summaryItems.map(w => ({ a: w.a, b: w.b, operation: w.operation }));
                      const merged = [...existing, ...newOnes];
                      localStorage.setItem('mp-custom-questions', JSON.stringify(merged));
                      alert('已加入自定义题集');
                    } catch {
                      alert('保存失败');
                    }
                  }}
                >加入自定义题集</button>

                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => {
                    // 生成练习并保存题集（使用最新集合作为开练素材）
                    const set = summaryItems.map(w => ({ a: w.a, b: w.b, operation: w.operation }));
                    localStorage.setItem('mp-latest-wrong-set', JSON.stringify(set));
                    localStorage.setItem('mp-start-with-wrong-set', '1');
                    localStorage.setItem('questionCount', String(set.length));
                    // 触发开始练习事件（App监听）
                    window.dispatchEvent(new CustomEvent('start-wrong-practice'));
                    setIsSummaryOpen(false);
                  }}
                >一键生成练习</button>
              </div>
            </div>
          </div>
        )}

        {/* 添加记录弹窗 */}
        {showAddRecord && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddRecord(false)}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-full max-w-md rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">添加记录</h3>
                <button className="text-gray-600 hover:underline" onClick={() => setShowAddRecord(false)}>×</button>
              </div>

              <AddRecordForm onClose={() => setShowAddRecord(false)} onSuccess={() => {
                setShowAddRecord(false);
                // 重新加载记录
                try {
                  const raw = localStorage.getItem('mp-history');
                  const list: SessionRecord[] = raw ? JSON.parse(raw) : [];
                  setRecords(list);
                } catch {
                  setRecords([]);
                }
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 添加记录表单组件
interface AddRecordFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddRecordForm: React.FC<AddRecordFormProps> = ({ onClose, onSuccess }) => {
  const [speed, setSpeed] = useState<string>('');
  const [questionType, setQuestionType] = useState<string>('borrow');
  const [timeLimit, setTimeLimit] = useState<string>('5');

  const questionTypes = [
    { value: 'borrow', label: '退位减法' },
    { value: 'carry', label: '进位加法' },
    { value: 'mixed', label: '加减混合' },
    { value: 'multiply', label: '乘法' },
    { value: 'divide', label: '除法' },
    { value: 'multiply_divide', label: '乘除混合' },
    { value: 'all_four', label: '四则混合' },
    { value: 'fill_add_subtract', label: '加减法填空' },
    { value: 'fill_multiply_divide', label: '乘除法填空' }
  ];

  const handleSubmit = () => {
    const speedValue = parseFloat(speed);
    const timeLimitValue = parseInt(timeLimit);

    if (isNaN(speedValue) || speedValue <= 0) {
      alert('请输入有效的速度值');
      return;
    }

    if (isNaN(timeLimitValue) || timeLimitValue <= 0) {
      alert('请输入有效的单题时间');
      return;
    }

    try {
      // 获取现有历史记录
      const existingHistory = localStorage.getItem('mp-history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      // 添加新记录
      const newRecord = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        questionCount: 1, // 手动添加的记录设为1题
        correct: 1,
        wrong: 0,
        accuracy: 100,
        avgTime: speedValue,
        times: [speedValue],
        type: questionType,
        timeLimit: timeLimitValue,
        isManual: true,
        wrongDetails: [],
        slowCorrectDetails: []
      };

      history.push(newRecord);
      localStorage.setItem('mp-history', JSON.stringify(history));

      // 更新最佳纪录
      const typeRecords = history.filter((record: any) => record.type === questionType);
      if (typeRecords.length > 0) {
        const bestTime = Math.min(...typeRecords.map((record: any) => record.avgTime));
        localStorage.setItem('mp-best-avg', bestTime.toString());
      }

      alert('记录添加成功！');
      onSuccess();
    } catch (error) {
      console.error('添加记录失败:', error);
      alert('添加记录失败，请重试');
    }
  };

  return (
    <div className="space-y-4">
      {/* 题型选择 */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">题型</label>
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {questionTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* 速度输入 */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">平均速度（秒）</label>
        <input
          type="number"
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
          placeholder="例如：2.5"
          step="0.1"
          min="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 单题时间 */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">单题时间（秒）</label>
        <input
          type="number"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          placeholder="例如：5"
          min="1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-3 pt-4">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          添加记录
        </button>
      </div>
    </div>
  );
};



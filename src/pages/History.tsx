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

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mp-history');
      const list: SessionRecord[] = raw ? JSON.parse(raw) : [];
      setRecords(list);
    } catch {
      setRecords([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pt-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">历史记录</h1>
          <button onClick={onBack} className="text-blue-600 hover:underline">返回首页</button>
        </div>

        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-4">时间</th>
                <th className="py-2 pr-4">题数</th>
                <th className="py-2 pr-4">正确</th>
                <th className="py-2 pr-4">错误</th>
                <th className="py-2 pr-4 w-48">正确率</th>
                <th className="py-2 pr-4 w-48">平均用时(s)</th>
                <th className="py-2 pr-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td className="py-3 text-gray-500" colSpan={7}>暂无记录</td></tr>
              )}
              {records.map(r => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
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
                    <button className="text-blue-600 hover:underline mr-3" onClick={() => setSelected(r)}>查看</button>
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

              <div className="text-sm font-semibold text-gray-700 mb-2">错题（按耗时降序）</div>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">题目</th>
                      <th className="py-2 pr-4">你的答案</th>
                      <th className="py-2 pr-4">正确答案</th>
                      <th className="py-2 pr-4">用时(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.wrongDetails.length === 0 && (
                      <tr><td className="py-3 text-gray-500" colSpan={4}>本次没有错题</td></tr>
                    )}
                    {selected.wrongDetails.map((w, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 whitespace-nowrap">{w.a} {w.operation} {w.b} =</td>
                        <td className="py-2 pr-4 text-red-600">{w.userAnswer}</td>
                        <td className="py-2 pr-4">{w.correctAnswer}</td>
                        <td className="py-2 pr-4">{w.durationSec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-sm font-semibold text-gray-700 mb-2">慢题（≥4s，按耗时降序）</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">题目</th>
                      <th className="py-2 pr-4">你的答案</th>
                      <th className="py-2 pr-4">正确答案</th>
                      <th className="py-2 pr-4">用时(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.slowCorrectDetails || []).length === 0 && (
                      <tr><td className="py-3 text-gray-500" colSpan={4}>本次没有慢题</td></tr>
                    )}
                    {(selected.slowCorrectDetails || []).map((w, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="py-2 pr-4 whitespace-nowrap">{w.a} {w.operation} {w.b} =</td>
                        <td className="py-2 pr-4">{w.userAnswer}</td>
                        <td className="py-2 pr-4">{w.correctAnswer}</td>
                        <td className="py-2 pr-4">{w.durationSec}</td>
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
      </div>
    </div>
  );
};



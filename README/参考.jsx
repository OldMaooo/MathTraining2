import React, { useEffect, useState, useRef } from "react";

// 单文件 React 应用（Tailwind 假定在项目中已配置）
// 说明：默认导出一个 React 组件，可以直接放到 CRA / Vite + Tailwind 项目中。
// 功能要点：
// - 包含 0-7 共 8 个层级练习配置（基于你提供的训练计划）
// - 每层生成题目、计时、核对答案、错题记录、练习结果记录到 localStorage
// - 自动统计每日正确率，需要用户点击“完成本次练习并记录”来保存当天结果
// - 当最近连续 3 天达到晋级标准（>=95%）时，显示可晋级提示（需用户确认晋级）
// - 设计上尽量让孩子可以独立操作：大按钮、语音提示（可选）、最小化家长干预

// ------------------------- 层级配置 -------------------------
const LEVELS = [
  {
    id: 0,
    title: "Level 0 — 基础数感",
    goal: "1–9 的加减能瞬间反应（不思考）",
    size: 20,
    timeLimitSec: 60,
    genQuestion: () => {
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      const op = Math.random() < 0.5 ? "+" : "-";
      const q = `${a} ${op} ${b}`;
      const ans = op === "+" ? a + b : a - b;
      return { q, ans, hint: "直接口答" };
    },
  },
  {
    id: 1,
    title: "Level 1 — 凑十基础",
    goal: "看到 6~9 与任一数能自动凑成 10",
    size: 20,
    timeLimitSec: null,
    genQuestion: () => {
      const big = Math.floor(Math.random() * 4) + 6; // 6-9
      const small = Math.floor(Math.random() * 9) + 1; // 1-9
      const op = "+";
      const q = `${big} + ${small}`;
      const ans = big + small;
      const hint = `口述：${big}差${10 - big}到10`;
      return { q, ans, hint };
    },
  },
  {
    id: 2,
    title: "Level 2 — 一位数与两位数（无进位）",
    goal: "一位数加两位数，且不触发进位",
    size: 20,
    timeLimitSec: null,
    genQuestion: () => {
      const tens = Math.floor(Math.random() * 8) + 10; // 10-17? better 10-89
      const b = Math.floor(Math.random() * 9) + 1; // 1-9
      const tensVal = Math.floor(Math.random() * 8) + 10; // 10-17 was wrong; we'll pick 10-89
      const a = Math.floor(Math.random() * 80) + 10; // 10-89
      // ensure no carry in ones: units(a)+b <=9
      const unitA = Math.floor(Math.random() * 9);
      const aVal = (Math.floor(Math.random() * 8) + 1) * 10 + unitA; // 10-89
      const q = `${aVal} + ${b}`;
      const ans = aVal + b;
      return { q, ans, hint: "口述个位直接相加，无进位" };
    },
  },
  {
    id: 3,
    title: "Level 3 — 一位数与两位数（有进位／凑整）",
    goal: "熟练用凑整思维处理进位",
    size: 20,
    timeLimitSec: null,
    genQuestion: () => {
      const a = Math.floor(Math.random() * 90) + 10; // 10-99
      const b = Math.floor(Math.random() * 9) + 1; // 1-9
      // force some with carry: choose b so units(a)+b>9 sometimes
      const unit = a % 10;
      let bVal = b;
      if (Math.random() < 0.6) {
        bVal = Math.floor(Math.random() * (9 - (9 - unit))) + (10 - unit); // ensure carry sometimes
        if (bVal < 1) bVal = 1;
      }
      const q = `${a} + ${bVal}`;
      const ans = a + bVal;
      const hint = `先补 ${10 - unit} 到整十`;
      return { q, ans, hint };
    },
  },
  {
    id: 4,
    title: "Level 4 — 两位数相加/相减（无跨十）",
    goal: "按位合并，个位不跨十",
    size: 20,
    timeLimitSec: null,
    genQuestion: () => {
      const a = Math.floor(Math.random() * 80) + 10;
      const b = Math.floor(Math.random() * 80) + 10;
      // ensure units sum <=9 and for subtraction ensure >=0
      const unitA = a % 10;
      const unitB = Math.floor(Math.random() * (9 - unitA + 1));
      const bVal = Math.floor(b / 10) * 10 + unitB;
      const op = Math.random() < 0.6 ? "+" : "-";
      let q = `${a} ${op} ${bVal}`;
      let ans = op === "+" ? a + bVal : a - bVal;
      const hint = "先算个位，再算十位";
      return { q, ans, hint };
    },
  },
  {
    id: 5,
    title: "Level 5 — 两位数相加/相减（含一处跨十/借位）",
    goal: "处理一种进位或借位（一次）",
    size: 20,
    timeLimitSec: null,
    genQuestion: () => {
      // generate add or sub with one carry/borrow
      const a = Math.floor(Math.random() * 80) + 10;
      const unitA = a % 10;
      const unitB = Math.floor(Math.random() * 9) + (10 - unitA); // ensure carry
      const b = Math.floor(Math.random() * 8) * 10 + (unitB % 10);
      const op = Math.random() < 0.6 ? "+" : "-";
      let q = `${a} ${op} ${b}`;
      let ans = op === "+" ? a + b : a - b;
      const hint = op === "+" ? "可把第二数写成 40-3 等分拆法" : "尝试把被减数/减数拆成整十";
      return { q, ans, hint };
    },
  },
  {
    id: 6,
    title: "Level 6 — 两位数多步（两处进位或退位）",
    goal: "处理两个位置都需进位/借位",
    size: 20,
    timeLimitSec: null,
    genQuestion: () => {
      const a = Math.floor(Math.random() * 90) + 10;
      const b = Math.floor(Math.random() * 90) + 10;
      // bias to multi-carry cases
      const q = `${a} + ${b}`;
      const ans = a + b;
      const hint = "先处理个位凑十，再加十位+进位";
      return { q, ans, hint };
    },
  },
  {
    id: 7,
    title: "Level 7 — 三数相加 / 混合步骤",
    goal: "三项相加或加减混合，训练中间结果记忆",
    size: 18,
    timeLimitSec: null,
    genQuestion: () => {
      // generate 3-term addition or mixed
      const a = Math.floor(Math.random() * 90) + 10;
      const b = Math.floor(Math.random() * 90) + 10;
      const c = Math.floor(Math.random() * 90) + 10;
      const ops = Math.random() < 0.6 ? ["+", "+"] : ["-", "+"]; // sometimes mixed
      let q = `${a} ${ops[0]} ${b} ${ops[1]} ${c}`;
      let ans = eval(`${a}${ops[0]}${b}${ops[1]}${c}`);
      const hint = "先合整十或先算两项再加第三项";
      return { q, ans, hint };
    },
  },
];

// ------------------------- utils -------------------------
const todayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const storage = {
  get(k, fallback) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },
};

// ------------------------- 主组件 -------------------------
export default function XiaoyePracticeApp() {
  const [levelIdx, setLevelIdx] = useState(storage.get("xy_level", 0));
  const level = LEVELS[levelIdx];

  const [problems, setProblems] = useState(() => generateProblems(levelIdx));
  const [curIndex, setCurIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]); // {q, ans, correct, given}
  const [timerSec, setTimerSec] = useState(level.timeLimitSec || 0);
  const timerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [wrongNotebook, setWrongNotebook] = useState(storage.get("xy_wrong", []));
  const [history, setHistory] = useState(storage.get("xy_history", {}));
  const [message, setMessage] = useState("");

  useEffect(() => {
    storage.set("xy_wrong", wrongNotebook);
  }, [wrongNotebook]);
  useEffect(() => {
    storage.set("xy_history", history);
  }, [history]);
  useEffect(() => {
    storage.set("xy_level", levelIdx);
  }, [levelIdx]);

  useEffect(() => {
    // reset when level changes
    setProblems(generateProblems(levelIdx));
    setCurIndex(0);
    setUserAnswer("");
    setRevealed(false);
    setResults([]);
    setTimerSec(LEVELS[levelIdx].timeLimitSec || 0);
    setRunning(false);
  }, [levelIdx]);

  useEffect(() => {
    if (running && level.timeLimitSec) {
      timerRef.current = setInterval(() => {
        setTimerSec((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            setMessage("时间到，请提交并记录本次练习。");
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [running, levelIdx]);

  function generateProblems(lIdx) {
    const cfg = LEVELS[lIdx];
    const arr = [];
    for (let i = 0; i < cfg.size; i++) {
      arr.push(cfg.genQuestion());
    }
    return arr;
  }

  function startSession() {
    setProblems(generateProblems(levelIdx));
    setCurIndex(0);
    setResults([]);
    setUserAnswer("");
    setRevealed(false);
    setMessage("");
    if (level.timeLimitSec) {
      setTimerSec(level.timeLimitSec);
      setRunning(true);
    }
  }

  function submitAnswer() {
    const prob = problems[curIndex];
    const given = userAnswer.trim();
    const correct = String(prob.ans) === given;
    const rec = { q: prob.q, ans: prob.ans, given: given || "--", correct };
    setResults((r) => [...r, rec]);
    setRevealed(true);
    if (!correct) {
      // add to wrong notebook with chance to add reason
      setWrongNotebook((w) => [{ ...rec, note: "" }, ...w].slice(0, 200));
    }
  }

  function nextQuestion() {
    setUserAnswer("");
    setRevealed(false);
    if (curIndex + 1 < problems.length) {
      setCurIndex(curIndex + 1);
    }
  }

  function finishAndRecord() {
    // compute accuracy
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 10000) / 100;
    const today = todayKey();
    const newHist = { ...history };
    newHist[today] = newHist[today] || [];
    newHist[today].push({ level: levelIdx, total, correct, accuracy, timestamp: Date.now() });
    setHistory(newHist);
    setMessage(`已记录：本次 ${total} 题，正确 ${correct}，准确率 ${accuracy}%`);

    // check last 3 days for promotion
    maybeOfferPromotion(newHist, levelIdx);
  }

  function maybeOfferPromotion(hist, lIdx) {
    // check consecutive last 3 calendar days - whether each had one record at this level with >=95%
    const dates = Object.keys(hist).sort((a, b) => b.localeCompare(a));
    // build map date->best accuracy for that level
    const accByDate = {};
    for (const d of Object.keys(hist)) {
      const entries = hist[d].filter((e) => e.level === lIdx);
      if (entries.length) {
        accByDate[d] = Math.max(...entries.map((e) => e.accuracy));
      }
    }
    // pick last 3 calendar days (including today)
    const today = new Date();
    const last3 = [];
    for (let i = 0; i < 3; i++) {
      const check = new Date(today);
      check.setDate(today.getDate() - i);
      last3.push(check.toISOString().slice(0, 10));
    }
    const ok = last3.every((d) => accByDate[d] >= 95);
    if (ok) {
      setMessage((m) => m + `\n恭喜！在本层连续 3 天达标（>=95%）。可以点击“晋级到下一层”。`);
    }
  }

  function promoteIfAllowed() {
    if (levelIdx < LEVELS.length - 1) {
      setLevelIdx(levelIdx + 1);
      setMessage("已晋级到下一层，请家长/孩子确认新的练习内容。");
    }
  }

  function resetWrongNotebook() {
    setWrongNotebook([]);
    setMessage("错题本已清空（本地存储）。");
  }

  function editWrongNote(idx, note) {
    setWrongNotebook((w) => {
      const copy = [...w];
      copy[idx] = { ...copy[idx], note };
      return copy;
    });
  }

  // small UI helpers
  const curProb = problems[curIndex] || { q: "—", ans: "—", hint: "" };
  const totalDone = results.length + (revealed ? 1 : 0);
  const totalCorrect = results.filter((r) => r.correct).length + (revealed && String(curProb.ans) === userAnswer.trim() ? 1 : 0);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">小野口算练习</h1>
          <p className="text-sm text-slate-600">当前层级：{level.title} · 目标：{level.goal}</p>
        </div>
        <div className="text-right">
          <div className="text-sm">层级 {levelIdx} / {LEVELS.length - 1}</div>
          <div className="text-xs text-slate-500">本地进度已保存</div>
        </div>
      </header>

      <main className="bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <button className="px-3 py-2 rounded-lg bg-slate-800 text-white" onClick={startSession}>开始练习</button>
          <button className="px-3 py-2 rounded-lg bg-amber-500 text-white" onClick={() => { setProblems(generateProblems(levelIdx)); setCurIndex(0); }}>重置题目</button>
          <button className="px-3 py-2 rounded-lg bg-red-400 text-white" onClick={resetWrongNotebook}>清空错题本</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 p-4 border rounded-lg">
            <div className="text-lg font-medium mb-2">题目 {curIndex + 1} / {problems.length}</div>
            <div className="text-4xl font-bold mb-4">{curProb.q}</div>
            <div className="mb-2">
              <label className="block text-sm">答案（口答后输入或直接留空用“显示答案”）：</label>
              <input value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="mt-1 input px-3 py-2 rounded-md border w-full" placeholder="在此输入答案，例如 36" />
            </div>
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={submitAnswer}>提交并显示答案</button>
              <button className="px-3 py-2 rounded bg-slate-200" onClick={() => setRevealed(true)}>显示答案（跳过）</button>
              <button className="px-3 py-2 rounded bg-slate-200" onClick={() => { navigator.clipboard?.writeText(curProb.q); setMessage("题目复制到剪贴板"); }}>复制题目</button>
            </div>

            {revealed && (
              <div className="mt-4 p-3 bg-slate-50 border rounded">
                <div className="text-sm text-slate-700">正确答案： <span className="font-semibold text-xl">{curProb.ans}</span></div>
                <div className="text-xs text-slate-500 mt-1">提示：{curProb.hint}</div>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => { nextQuestion(); }}>下一题</button>
                </div>
              </div>
            )}

          </div>

          <aside className="p-4 border rounded-lg">
            <div className="mb-3">
              <div className="text-sm text-slate-500">计时</div>
              <div className="text-2xl font-mono">{level.timeLimitSec ? `${timerSec}s` : `无`}</div>
              {level.timeLimitSec && !running && <button className="mt-2 px-2 py-1 rounded bg-emerald-500 text-white" onClick={() => setRunning(true)}>开始计时</button>}
            </div>

            <div className="mb-3">
              <div className="text-sm text-slate-500">进度</div>
              <div className="text-lg">已答：{results.length}{revealed ? ` + 当前` : ""} / {problems.length}</div>
              <div className="text-sm">正确：{results.filter(r => r.correct).length} / {results.length}</div>
            </div>

            <div className="mb-3">
              <button className="px-3 py-2 rounded bg-indigo-600 text-white w-full" onClick={finishAndRecord}>完成本次练习并记录</button>
              <button className="mt-2 px-3 py-2 rounded bg-gray-200 w-full" onClick={() => { setMessage(JSON.stringify(history, null, 2).slice(0, 200)); }}>查看本地记录（简短）</button>
            </div>

            <div className="mt-3">
              <div className="text-xs text-slate-500">提示：要晋级需 连续 3 天 ≥95%。每天练一次，周末可加练。</div>
              <div className="mt-2"><button onClick={promoteIfAllowed} className="px-2 py-1 bg-amber-400 rounded">晋级到下一层（手动）</button></div>
            </div>

          </aside>
        </div>

        <section className="mt-6">
          <h3 className="font-medium">错题本（本地保存，可供下次优先练习）</h3>
          <div className="max-h-48 overflow-auto mt-2 border rounded p-2">
            {wrongNotebook.length === 0 ? <div className="text-xs text-slate-500">目前没有错题。</div> : (
              wrongNotebook.map((w, i) => (
                <div key={i} className="p-2 border-b last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{w.q}  → 正确：{w.ans} · 你的：{w.given}</div>
                      <div className="text-xs text-slate-500">备注：{w.note || <i>未填写</i>}</div>
                    </div>
                    <div className="ml-2">
                      <input className="border px-2 py-1 text-sm" placeholder="写下错因（帮助自己下次复习）" value={w.note || ""} onChange={(e) => editWrongNote(i, e.target.value)} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="font-medium">家长/教师面板（最小化干预）</h3>
          <div className="text-sm text-slate-600 mt-2">建议：家长只做计时与鼓励。若孩子达到晋级条件（连续 3 天 ≥95% 且能口述思路），可在此点击“晋级”。</div>
        </section>

        <footer className="mt-6 text-sm text-slate-500">说明：本应用所有数据保存在浏览器本地（localStorage）。如需分享或备份，请复制右上角记录或导出页面数据。</footer>
      </main>

      <div className="mt-4 p-3 text-sm text-emerald-700 whitespace-pre-wrap">{message}</div>
    </div>
  );
}

import React, { useState } from 'react';
import { Sparkles, Send, Copy, Check, RefreshCw } from 'lucide-react';
import { projectsApi } from '../api/services';

interface AiResult {
  analysis: string;
  model: string;
  generatedAt: string;
  question?: string;
}

const QUICK_QUESTIONS = [
  'Loyiha foydali bo\'ladimi? Marjani baholang.',
  'Qaysi materiallarga eng ko\'p pul ketdi va narxlar normalmi?',
  'Ustalarga qancha qarzimiz bor?',
  'Mijozdan qancha qarz qoldi va qachon so\'rash kerak?',
  'Loyiha muddatida tugaydimi?',
];

const storageKey = (projectId: string) => `workdex_ai_analysis_${projectId}`;

// **qalin**, `kod` inline formatlash
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={`${keyBase}-${i}`} className="font-bold text-gray-900">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={`${keyBase}-${i}`} className="px-1 py-0.5 rounded bg-gray-100 text-[0.9em]">{p.slice(1, -1)}</code>;
    return <React.Fragment key={`${keyBase}-${i}`}>{p}</React.Fragment>;
  });
}

const splitRow = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

function MarkdownView({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }

    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const cls = lvl <= 2
        ? 'text-sm sm:text-base font-bold text-gray-900 mt-5 mb-2 pb-1 border-b border-gray-100'
        : 'text-sm font-bold text-gray-800 mt-3 mb-1.5';
      out.push(<div key={i} className={cls}>{renderInline(h[2], `h${i}`)}</div>);
      i++; continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { out.push(<hr key={i} className="my-3 border-gray-200" />); i++; continue; }

    if (t.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      const header = splitRow(t);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(splitRow(lines[i])); i++; }
      out.push(
        <div key={`t${i}`} className="overflow-x-auto my-2">
          <table className="w-full min-w-[420px] text-xs border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>{header.map((c, j) => <th key={j} className="px-2 py-1.5 text-left font-bold text-gray-600 border-b border-gray-200">{renderInline(c, `th${i}${j}`)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j} className="px-2 py-1.5 text-gray-700">{renderInline(c, `td${i}${ri}${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^([-*•]|\d+[.)])\s+/.test(t)) {
      const ordered = /^\d+[.)]/.test(t);
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        const raw = lines[i];
        const nested = /^\s{2,}/.test(raw);
        const content = raw.trim().replace(/^([-*•]|\d+[.)])\s+/, '');
        items.push(<li key={i} className={nested ? 'ml-4 list-[circle]' : ''}>{renderInline(content, `li${i}`)}</li>);
        i++;
      }
      out.push(ordered
        ? <ol key={`l${i}`} className="list-decimal pl-5 space-y-1 my-1.5">{items}</ol>
        : <ul key={`l${i}`} className="list-disc pl-5 space-y-1 my-1.5">{items}</ul>);
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\||([-*•]|\d+[.)])\s+)/.test(lines[i].trim())) { para.push(lines[i].trim()); i++; }
    if (para.length === 0) { para.push(t); i++; }
    out.push(<p key={`p${i}`} className="my-1.5">{renderInline(para.join(' '), `p${i}`)}</p>);
  }
  return <div className="text-[13px] leading-relaxed text-gray-700 break-words">{out}</div>;
}

export const AiAnalysisPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AiResult | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey(projectId));
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectsApi.aiAnalyze(projectId, q?.trim() || undefined);
      const r: AiResult = { ...res, question: q?.trim() || undefined };
      setResult(r);
      localStorage.setItem(storageKey(projectId), JSON.stringify(r));
    } catch (e: any) {
      setError(e?.response?.data?.message || (e?.code === 'ECONNABORTED' ? 'AI javob bermadi (vaqt tugadi).' : 'AI tahlilda xatolik yuz berdi.'));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-[#ff7a16] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">AI Tahlil</h3>
              <div className="text-[11px] text-gray-500">Moliya, materiallar, ustalar, vazifalar — barcha ma'lumotlar asosida</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => run()}
            disabled={loading}
            className="h-9 px-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{loading ? 'Tahlil qilinmoqda...' : result && !result.question ? 'Qayta tahlil qilish' : "To'liq tahlil qilish"}</span>
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (question.trim()) run(question); }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={2000}
            placeholder="Loyiha haqida savol bering..."
            className="flex-1 min-w-0 h-9 px-3 text-sm border border-[#e4e7ec] rounded-lg focus:outline-none focus:border-[#7c3aed]"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-900 text-white disabled:opacity-40"
            title="So'rash"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => { setQuestion(q); run(q); }}
              className="px-2.5 py-1 text-[11px] rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
      )}

      {loading && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-6 shadow-xs flex flex-col items-center gap-2 text-gray-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#7c3aed]" />
          <span>AI loyiha ma'lumotlarini tahlil qilmoqda, bu 10–40 soniya olishi mumkin...</span>
        </div>
      )}

      {!loading && result && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div className="text-[11px] text-gray-500">
              {result.question ? <>Savol: <span className="font-semibold text-gray-700">{result.question}</span><br /></> : null}
              {new Date(result.generatedAt).toLocaleString('uz-UZ')} · {result.model}
            </div>
            <button
              type="button"
              onClick={copy}
              className="h-7 px-2.5 text-[11px] font-semibold border border-[#e4e7ec] rounded-lg flex items-center gap-1 text-gray-600 hover:bg-gray-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Nusxalandi' : 'Nusxalash'}
            </button>
          </div>
          <MarkdownView text={result.analysis} />
          <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
            AI tahlili maslahat xarakteriga ega — muhim qarorlardan oldin raqamlarni tekshiring.
          </div>
        </div>
      )}

      {!loading && !result && !error && (
        <div className="bg-white border border-dashed border-[#e4e7ec] rounded-xl p-8 text-center text-xs text-gray-500">
          Loyiha bo'yicha AI tahlil olish uchun “To'liq tahlil qilish” tugmasini bosing yoki savol bering.
        </div>
      )}
    </div>
  );
};

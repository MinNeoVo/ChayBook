import { useEffect, useState } from "react";
import { Bot, RotateCcw, Save } from "lucide-react";
import { getAdminChatbotPrompt, updateAdminChatbotPrompt } from "../../services/adminChatbotServices";

const MAX_LENGTH = 20000;

export default function AdminChatbotPromptPage() {
  const [prompt, setPrompt] = useState("");
  const [savedPrompt, setSavedPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadPrompt(signal) {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminChatbotPrompt({ signal });
      setPrompt(result.prompt ?? "");
      setSavedPrompt(result.prompt ?? "");
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "Không tải được prompt.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadPrompt(controller.signal);
    return () => controller.abort();
  }, []);

  async function savePrompt(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await updateAdminChatbotPrompt(prompt);
      setPrompt(result.prompt);
      setSavedPrompt(result.prompt);
      setNotice("Đã lưu prompt. Chatbot sẽ áp dụng nội dung này cho các tin nhắn mới.");
    } catch (requestError) {
      setError(requestError.message || "Không lưu được prompt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Bot aria-hidden="true" size={23} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cài đặt ChatbotAI</h1>
          <p className="mt-1 text-sm text-slate-500">Chỉnh hướng dẫn và vai trò mà ChatbotAI dùng khi trả lời người dùng.</p>
        </div>
      </header>

      <form onSubmit={savePrompt} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="chatbot-prompt" className="text-sm font-semibold text-slate-800">Prompt hệ thống</label>
          <span className="text-xs text-slate-500">{prompt.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} ký tự</span>
        </div>
        {loading ? (
          <div className="h-72 animate-pulse rounded-xl bg-slate-100" aria-label="Đang tải prompt" />
        ) : (
          <textarea
            id="chatbot-prompt"
            value={prompt}
            onChange={(event) => { setPrompt(event.target.value); setNotice(""); }}
            maxLength={MAX_LENGTH}
            rows={15}
            required
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm leading-6 text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            placeholder="Nhập hướng dẫn cho ChatbotAI..."
          />
        )}
        <p className="text-sm leading-6 text-slate-500">Dữ liệu công thức phù hợp và câu hỏi của người dùng sẽ được hệ thống nối vào sau prompt này.</p>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <button type="submit" disabled={loading || saving || !prompt.trim() || prompt === savedPrompt} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
            <Save size={17} aria-hidden="true" />{saving ? "Đang lưu..." : "Lưu prompt"}
          </button>
          <button type="button" disabled={loading || saving || prompt === savedPrompt} onClick={() => { setPrompt(savedPrompt); setNotice(""); setError(""); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <RotateCcw size={16} aria-hidden="true" />Hoàn tác
          </button>
        </div>
      </form>
    </div>
  );
}

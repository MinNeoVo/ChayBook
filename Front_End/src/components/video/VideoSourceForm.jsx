import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Crown, Zap } from "lucide-react";

import Button from "../common/Button";
import VideoProgress from "./VideoProgress";
import ProLockModal from "../common/ProLockModal";
import { useAuth } from "../../context/useAuth";

import { submitVideoFile, submitVideoUrl } from "../../services/videoServices";

import {
  MAX_VIDEO_BYTES,
  positiveId,
  videoError,
  youtubeId,
} from "../../utils/videoAnalysis";

export default function VideoSourceForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pending = useRef(null);

  const [mode, setMode] = useState("UPLOAD");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [includeSummary, setIncludeSummary] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => () => pending.current?.abort(), []);

  async function submit(event) {
    event.preventDefault();

    if (!user?.isPro) {
      setShowProModal(true);
      return;
    }

    if (pending.current) {
      return;
    }

    setError("");

    if (mode === "UPLOAD") {
      if (!file || file.size === 0) {
        return setError("Hãy chọn một file video.");
      }

      if (!/\.mp4$/i.test(file.name)) {
        return setError("Hãy chọn file MP4.");
      }

      if (file.size > MAX_VIDEO_BYTES) {
        return setError("Video tối đa 50MB.");
      }
    } else if (!youtubeId(url.trim())) {
      return setError("Hãy nhập link YouTube HTTPS hợp lệ.");
    }

    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);

    try {
      const options = {
        signal: controller.signal,
      };

      const result =
        mode === "UPLOAD"
          ? await submitVideoFile(file, includeSummary, options)
          : await submitVideoUrl(url, includeSummary, options);

      if (controller.signal.aborted) {
        return;
      }

      const id = positiveId(result?.submissionId);

      if (!id) {
        throw new Error("Máy chủ chưa trả mã tiếp nhận video.");
      }

      navigate(`/video-analysis/${id}`, {
        replace: true,
      });
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(videoError(failure));
      }
    } finally {
      if (pending.current === controller) {
        pending.current = null;
      }

      if (!controller.signal.aborted) {
        setBusy(false);
      }
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <fieldset disabled={busy} className="space-y-5">
        <legend className="mb-3 font-semibold">Chọn nguồn video</legend>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="source"
              checked={mode === "UPLOAD"}
              onChange={() => setMode("UPLOAD")}
            />
            Upload file
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="source"
              checked={mode === "YOUTUBE"}
              onChange={() => setMode("YOUTUBE")}
            />
            Link YouTube
          </label>
        </div>

        {mode === "UPLOAD" ? (
          <div className="space-y-3">
            <span className="block text-sm font-medium">
              Video MP4, tối đa 50MB
            </span>
            <div className="flex items-center" aria-live="polite">
              {file ? (
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="min-w-0 break-all text-sm text-gray-700">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    aria-label="Bỏ tệp đã chọn"
                    title="Bỏ tệp đã chọn"
                    onClick={() => {
                      setFile(null);
                      setError("");
                    }}
                    className="shrink-0 cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-chaybook-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X aria-hidden="true" className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <label className="relative inline-flex cursor-pointer items-center gap-2 rounded-xl bg-chaybook-primary px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-chaybook-hover focus-within:ring-2 focus-within:ring-chaybook-primary focus-within:ring-offset-2">
                  <Upload aria-hidden="true" className="h-5 w-5" />
                  <span>Chọn tệp</span>
                  <input
                    type="file"
                    aria-label="Chọn tệp video MP4"
                    accept=".mp4,video/mp4"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
                      setError("");
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                </label>
              )}
            </div>
          </div>
        ) : (
          <label className="block space-y-2">
            <span className="block text-sm font-medium">
              Link video YouTube công khai, tối đa 15 phút
            </span>

            <input
              type="url"
              required
              maxLength={2048}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-gray-200 p-3"
            />
          </label>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeSummary}
            onChange={(event) => setIncludeSummary(event.target.checked)}
          />
          Tạo thêm bản tóm tắt video
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {busy && (
        <VideoProgress
          title="Đang tiếp nhận video…"
          description="Vui lòng chờ gửi xong. Hệ thống sẽ mở phiên xử lý của bạn."
        />
      )}

      {!user?.isPro && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900 text-sm">Tính năng Dành riêng cho Gói Pro</h4>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">PRO VIP</span>
              </div>
              <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                Phân tích và trích xuất công thức món chay từ video YouTube hoặc upload là đặc quyền của gói ChayBook Pro. Nâng cấp ngay để mở khóa!
              </p>
              <button
                type="button"
                onClick={() => setShowProModal(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition-colors cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" /> Nâng cấp Pro để phân tích video
              </button>
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? "Đang gửi video…" : user?.isPro ? "Gửi video để phân tích" : "Gửi video để phân tích (Yêu cầu Pro 👑)"}
      </Button>

      <ProLockModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureName="Phân tích công thức từ Video"
        customMessage="Tính năng phân tích và trích xuất công thức từ video YouTube/file upload chỉ dành riêng cho thành viên ChayBook Pro. Nâng cấp ngay để trải nghiệm!"
      />
    </form>
  );
}

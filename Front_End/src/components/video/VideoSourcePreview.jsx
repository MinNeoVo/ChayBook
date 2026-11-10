import { useRef, useState } from "react";

import { getVideoMediaUrl } from "../../services/videoServices";

import { formatVideoTime, youtubeId } from "../../utils/videoAnalysis";

export default function VideoSourcePreview({ submission, highlights = [] }) {
  const videoRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const [position, setPosition] = useState({
    seconds: 0,
    revision: 0,
  });

  const isUpload = submission.sourceType === "UPLOAD";
  const id = youtubeId(submission.sourceUrl);

  const youtubeUrl = id ? `https://www.youtube.com/watch?v=${id}` : null;

  function seek(seconds) {
    if (!isUpload) {
      setPosition((value) => ({
        seconds,
        revision: value.revision + 1,
      }));

      return;
    }

    const video = videoRef.current;

    if (!video || !ready) {
      return;
    }

    video.currentTime = Math.min(seconds, video.duration);

    video.play().catch(() => {});
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Video nguồn</h2>

      {isUpload ? (
        <video
          ref={videoRef}
          src={getVideoMediaUrl(submission.submissionId)}
          controls
          playsInline
          preload="metadata"
          crossOrigin="use-credentials"
          onLoadedMetadata={() => setReady(true)}
          onError={() => {
            setMediaError(true);
            setReady(false);
          }}
          className="aspect-video w-full rounded-xl bg-black"
        />
      ) : id ? (
        <iframe
          key={position.revision}
          src={`https://www.youtube.com/embed/${id}?start=${position.seconds}&autoplay=${position.revision ? 1 : 0}`}
          title="Video món ăn nguồn"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-xl border-0"
        />
      ) : (
        <p>Không có nguồn video để phát.</p>
      )}

      {mediaError && (
        <p role="alert" className="text-sm text-amber-800">
          Không phát được video. File có thể đã hết hạn lưu, phiên đăng nhập hết
          hạn hoặc trình duyệt không hỗ trợ định dạng. Kết quả đã lưu vẫn giữ
          nguyên.
        </p>
      )}

      {youtubeUrl && (
        <a
          href={`${youtubeUrl}&t=${position.seconds}s`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-chaybook-primary underline"
        >
          Mở trên YouTube nếu không phát được tại đây
        </a>
      )}

      {highlights.length > 0 && (
        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-chaybook-primary">
            Các đoạn có công thức
          </h3>

          {highlights.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => seek(item.startSecond)}
              disabled={isUpload ? !ready : !id}
              className="block w-full rounded-lg bg-white p-3 text-left text-sm hover:bg-green-100 disabled:opacity-50"
            >
              <strong>
                {formatVideoTime(item.startSecond)}–
                {formatVideoTime(item.endSecond)}
              </strong>

              {" · "}
              {item.description}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../components/common/Button";
import VideoAnalysisEntry from "../components/video/VideoAnalysisEntry";
import VideoProgress from "../components/video/VideoProgress";
import VideoSourcePreview from "../components/video/VideoSourcePreview";
import VideoExtractionView from "../components/video/VideoExtractionView";
import VideoDraftEditor from "../components/video/VideoDraftEditor";

import { useVideoAnalysis } from "../hooks/useVideoAnalysis";

import {
  ANALYSIS_EDITABLE,
  positiveId,
  statusLabel,
  videoError,
} from "../utils/videoAnalysis";

function VideoJob({ submissionId }) {
  const navigate = useNavigate();

  const { submission, analysis, loading, waiting, error, reload } =
    useVideoAnalysis(submissionId);

  if (loading) {
    return (
      <VideoProgress
        title="Đang tải trạng thái video…"
        description="Đang lấy kết quả xử lý mới nhất."
      />
    );
  }

  // Mã vẫn được dùng để chọn thông báo phù hợp cho người dùng.
  const code =
    analysis?.errorCode ||
    submission?.errorCode ||
    (submission?.decisionCode !== "ACCEPTED" ? submission?.decisionCode : null);

  const accepted = submission?.status === "ACCEPTED";

  // Chỉ hiển thị nội dung trích xuất của video được chấp nhận.
  const extracted = accepted ? analysis?.extracted : null;

  const editable =
    accepted && ANALYSIS_EDITABLE.includes(analysis?.status) && analysis?.draft;

  const highlights = accepted
    ? extracted?.recipeHighlights || submission?.review?.recipeEvidence || []
    : [];

  return (
    <div className="space-y-6">
      {submission &&
        !error &&
        (waiting ? (
          <p className="text-sm text-gray-600">
            Mỗi tài khoản xử lý một video tại một thời điểm.
          </p>
        ) : (
          <Link to="/video-analysis" className="inline-block text-sm underline">
            Gửi video khác
          </Link>
        ))}

      {error && (
        <div
          role="alert"
          className="space-y-3 rounded-xl bg-red-50 p-4 text-red-800"
        >
          <p>{videoError(error)}</p>

          <Button variant="outline" onClick={reload}>
            Thử tải lại trạng thái
          </Button>

          {error.status === 401 && (
            <Link to="/login" className="block underline">
              Đăng nhập lại
            </Link>
          )}
        </div>
      )}

      {submission && (
        <>
          <section
            aria-live="polite"
            className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"
          >
            {waiting ? (
              <VideoProgress
                title={statusLabel(analysis?.status || submission.status)}
                status={analysis?.status || submission.status}
              />
            ) : (
              <h2 className="text-xl font-semibold">
                {statusLabel(analysis?.status || submission.status)}
              </h2>
            )}

            {code && <p className="text-amber-800">{videoError(code)}</p>}

            {analysis?.status === "CONFIRMED" && (
              <Link
                to="/my-recipes"
                className="inline-block font-medium text-chaybook-primary underline"
              >
                Mở Công thức của tôi
              </Link>
            )}
          </section>

          <VideoSourcePreview
            key={submission.submissionId}
            submission={submission}
            highlights={highlights}
          />

          <VideoExtractionView extracted={extracted} />

          {editable && (
            <VideoDraftEditor
              key={`${analysis.analysisId}:${analysis.version}`}
              analysis={analysis}
              onReload={reload}
              onConfirmed={(id) =>
                navigate(`/my-recipes/${id}`, {
                  replace: true,
                })
              }
            />
          )}

          {accepted && analysis?.status === "PARTIAL" && !analysis.draft && (
            <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
              Chưa có dữ liệu đủ căn cứ để tạo bản nháp. Bạn có thể gửi video rõ
              hơn.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function VideoAnalysisPage() {
  const { submissionId } = useParams();
  const id = positiveId(submissionId);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-chaybook-primary">
          Phân tích công thức từ video
        </h1>

        <Link
          to="/my-recipes"
          className="font-medium text-chaybook-primary underline"
        >
          Công thức của tôi
        </Link>
      </div>

      {submissionId ? (
        id ? (
          <VideoJob key={id} submissionId={id} />
        ) : (
          <p role="alert">Đường dẫn video không hợp lệ.</p>
        )
      ) : (
        <VideoAnalysisEntry />
      )}
    </div>
  );
}

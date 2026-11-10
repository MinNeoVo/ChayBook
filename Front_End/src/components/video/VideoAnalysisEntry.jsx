import { Link, Navigate } from "react-router-dom";
import Button from "../common/Button";
import { useActiveVideoSubmission } from "../../hooks/useActiveVideoSubmission";
import { positiveId, videoError } from "../../utils/videoAnalysis";
import VideoProgress from "./VideoProgress";
import VideoSourceForm from "./VideoSourceForm";

export default function VideoAnalysisEntry() {
  const { submission, loading, error, reload } = useActiveVideoSubmission();

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <VideoProgress title="Đang kiểm tra phiên xử lý…" description="Tìm video đang phân tích của bạn." />
      </section>
    );
  }

  if (error || (submission && !positiveId(submission.submissionId))) {
    return (
      <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-5">
        <p>{error ? videoError(error) : "Máy chủ chưa trả mã tiếp nhận hợp lệ."}</p>
        <p className="text-sm">Cần kiểm tra phiên hiện tại trước khi gửi thêm video.</p>
        <Button onClick={reload}>Thử tải lại trạng thái</Button>
        {error?.status === 401 && <Link to="/login" className="block underline">Đăng nhập lại</Link>}
      </div>
    );
  }

  if (submission) {
    return <Navigate to={`/video-analysis/${submission.submissionId}`} replace />;
  }

  return <VideoSourceForm />;
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Button from "../components/common/Button";
import RecipePagination from "../components/recipes/RecipePagination";

import { getMyRecipes } from "../services/videoServices";

import { videoError } from "../utils/videoAnalysis";
import { useActiveVideoSubmission } from "../hooks/useActiveVideoSubmission";
import VideoProgress from "../components/video/VideoProgress";

export default function MyRecipesPage() {
  const active = useActiveVideoSubmission();
  const [params, setParams] = useSearchParams();

  const requestedPage = Number(params.get("page") || 0);

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage >= 0 &&
    requestedPage <= 2147483647
      ? requestedPage
      : 0;

  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);

  const requestKey = `${page}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();

    getMyRecipes(page, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            data,
            error: null,
          });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            data: null,
            error,
          });
        }
      });

    return () => controller.abort();
  }, [page, requestKey]);

  const current = result?.key === requestKey ? result : null;

  const data = current?.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-chaybook-primary">
            Công thức của tôi
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Những công thức này chỉ thuộc tài khoản của bạn.
          </p>
        </div>

        <Link
          to="/video-analysis"
          className="rounded-xl bg-chaybook-primary px-4 py-3 font-semibold text-white"
        >
          {active.submission ? "Tiếp tục xem video đang phân tích" : "Phân tích video mới"}
        </Link>
      </div>

      {active.submission && (
        <section className="space-y-3 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <VideoProgress title="Video của bạn vẫn đang được xử lý" />
          <Link to={`/video-analysis/${active.submission.submissionId}`} className="inline-block font-medium text-chaybook-primary underline">
            Quay lại phiên phân tích
          </Link>
        </section>
      )}

      {!current && <p role="status">Đang tải công thức…</p>}

      {current?.error && (
        <div role="alert" className="space-y-3 rounded-xl bg-red-50 p-4">
          <p>{videoError(current.error)}</p>

          <Button onClick={() => setRevision((value) => value + 1)}>
            Thử lại
          </Button>

          {current.error.status === 401 && (
            <Link to="/login" className="block underline">
              Đăng nhập lại
            </Link>
          )}
        </div>
      )}

      {data && (
        <>
          {data.content.length === 0 ? (
            <div className="space-y-3 rounded-2xl bg-white p-8 text-center">
              <p>
                {page === 0
                  ? "Bạn chưa xác nhận lưu công thức nào."
                  : "Trang này không có công thức."}
              </p>

              {page > 0 && (
                <Button onClick={() => setParams({ page: "0" })}>
                  Về trang đầu
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.content.map((recipe) => (
                <Link
                  key={recipe.userRecipeId}
                  to={`/my-recipes/${recipe.userRecipeId}`}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-chaybook-primary"
                >
                  <h2 className="text-lg font-semibold">{recipe.name}</h2>

                  <p className="mt-2 text-sm text-gray-600">
                    {recipe.recipe.ingredients.length}
                    {" nguyên liệu · "}
                    {recipe.recipe.steps.length}
                    {" bước"}
                  </p>

                  <span className="mt-3 inline-block text-sm text-chaybook-primary">
                    Xem công thức →
                  </span>
                </Link>
              ))}
            </div>
          )}

          <RecipePagination
            page={data.number}
            size={data.size}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            onPageChange={(next) => setParams({ page: String(next) })}
          />
        </>
      )}
    </div>
  );
}

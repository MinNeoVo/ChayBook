import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Button from "../components/common/Button";
import VideoExtractionView from "../components/video/VideoExtractionView";
import VideoSourcePreview from "../components/video/VideoSourcePreview";

import { getMyRecipe, getVideoSubmission } from "../services/videoServices";

import { positiveId, videoError } from "../utils/videoAnalysis";

function RecipeDetail({ recipeId }) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);

  const requestKey = `${recipeId}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const options = {
          signal: controller.signal,
        };

        const recipe = await getMyRecipe(recipeId, options);

        let submission = null;
        let sourceError = "";

        try {
          submission = await getVideoSubmission(recipe.submissionId, options);
        } catch (error) {
          sourceError = videoError(error);
        }

        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            recipe,
            submission,
            sourceError,
            error: null,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            error,
          });
        }
      }
    }

    load();

    return () => controller.abort();
  }, [recipeId, requestKey]);

  const current = result?.key === requestKey ? result : null;

  if (!current) {
    return <p role="status">Đang tải chi tiết…</p>;
  }

  if (current.error) {
    return (
      <div role="alert" className="space-y-3">
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
    );
  }

  const { recipe, submission, sourceError } = current;

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm text-chaybook-primary">
            Công thức riêng của bạn
          </p>

          <h1 className="mt-1 text-2xl font-bold">{recipe.name}</h1>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Nguyên liệu</h2>

          <ul className="list-disc space-y-2 pl-5">
            {recipe.recipe.ingredients.map((item, index) => (
              <li key={index}>
                {item.name}
                {" — "}
                {item.amountText || "Chưa ghi định lượng"}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Cách làm</h2>

          <ol className="list-decimal space-y-3 pl-5">
            {recipe.recipe.steps.map((step, index) => (
              <li key={index} className="whitespace-pre-wrap">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {submission && (
        <VideoSourcePreview
          key={submission.submissionId}
          submission={submission}
          highlights={recipe.originalExtraction?.recipeHighlights || []}
        />
      )}

      {sourceError && (
        <p className="text-sm text-amber-800">
          Không tải được nguồn video: {sourceError}
        </p>
      )}

      <VideoExtractionView extracted={recipe.originalExtraction} />
    </div>
  );
}

export default function MyRecipeDetailPage() {
  const { userRecipeId } = useParams();
  const id = positiveId(userRecipeId);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Link
        to="/my-recipes"
        className="inline-block text-chaybook-primary underline"
      >
        ← Công thức của tôi
      </Link>

      {id ? (
        <RecipeDetail key={id} recipeId={id} />
      ) : (
        <p role="alert">Mã công thức không hợp lệ.</p>
      )}
    </div>
  );
}

export default function VideoExtractionView({ extracted }) {
  if (!extracted) {
    return null;
  }

  const recipe = extracted.recipe;

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Kết quả AI trích xuất</h2>

      {extracted.summary && (
        <p className="whitespace-pre-wrap">{extracted.summary}</p>
      )}

      {extracted.missingFields?.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Thông tin còn thiếu trong kết quả gốc</p>

          <ul className="list-disc pl-5">
            {extracted.missingFields.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {extracted.warnings?.length > 0 && (
        <ul className="list-disc rounded-xl bg-amber-50 py-3 pl-8 pr-3 text-sm text-amber-900">
          {extracted.warnings.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}

      {recipe ? (
        <details className="rounded-xl border border-gray-200 p-4">
          <summary className="cursor-pointer font-medium">
            Xem công thức gốc để đối chiếu
          </summary>

          <p className="my-3 font-semibold">
            {recipe.name || "Chưa xác định tên món"}
          </p>

          <ul className="list-disc space-y-1 pl-5">
            {recipe.ingredients?.map((item, index) => (
              <li key={index}>
                {item.detectedName}
                {" — "}
                {item.amountText || "Chưa có định lượng"}
              </li>
            ))}
          </ul>

          <ol className="mt-4 list-decimal space-y-2 pl-5">
            {recipe.steps?.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </details>
      ) : (
        <p className="text-sm text-gray-600">
          {extracted.recipePresence === "MENTION_ONLY"
            ? "Video chỉ nhắc tới công thức, chưa cung cấp nội dung để tạo bản nháp."
            : "Chưa có nội dung công thức đủ căn cứ để tạo bản nháp."}
        </p>
      )}
    </section>
  );
}

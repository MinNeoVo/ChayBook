import { useEffect, useRef, useState } from "react";

import Button from "../common/Button";

import {
  confirmVideoRecipe,
  updateVideoDraft,
} from "../../services/videoServices";

import {
  draftError,
  isCompleteDraft,
  normalizeDraft,
  positiveId,
  videoError,
} from "../../utils/videoAnalysis";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white p-2 disabled:bg-gray-100";

const newIngredient = () => ({
  rowId: crypto.randomUUID(),
  ingredientId: null,
  name: "",
  amountText: "",
});

function toForm(draft) {
  return {
    name: draft.name || "",

    ingredients: draft.ingredients.map((item) => ({
      ...item,
      rowId: crypto.randomUUID(),
      amountText: item.amountText || "",
    })),

    steps: draft.steps.map((text) => ({
      rowId: crypto.randomUUID(),
      text,
    })),
  };
}

export default function VideoDraftEditor({ analysis, onConfirmed, onReload }) {
  const pending = useRef(null);

  const [saved, setSaved] = useState(analysis);
  const [form, setForm] = useState(() => toForm(analysis.draft));

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);

  const payload = normalizeDraft({
    ...form,
    steps: form.steps.map((step) => step.text),
  });

  const dirty =
    JSON.stringify(payload) !== JSON.stringify(normalizeDraft(saved.draft));

  const canConfirm =
    !dirty && saved.canConfirm && isCompleteDraft(payload) && !conflict;

  useEffect(() => () => pending.current?.abort(), []);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);

    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty]);

  function changeIngredient(rowId, changes) {
    setForm((value) => ({
      ...value,

      ingredients: value.ingredients.map((item) =>
        item.rowId === rowId ? { ...item, ...changes } : item,
      ),
    }));
  }

  async function act(action) {
    if (pending.current || conflict) {
      return;
    }

    setError("");
    setNotice("");

    if (action === "save" && draftError(payload)) {
      return setError(draftError(payload));
    }

    if (action === "confirm" && !canConfirm) {
      return;
    }

    const controller = new AbortController();
    pending.current = controller;
    setBusy(action);

    try {
      const options = {
        signal: controller.signal,
      };

      if (action === "save") {
        const result = await updateVideoDraft(
          saved.analysisId,
          saved.version,
          payload,
          options,
        );

        if (controller.signal.aborted) {
          return;
        }

        setSaved(result);
        setForm(toForm(result.draft));
        setNotice("Đã lưu bản nháp.");
      } else {
        const result = await confirmVideoRecipe(
          saved.analysisId,
          saved.version,
          options,
        );

        if (controller.signal.aborted) {
          return;
        }

        const id = positiveId(result?.userRecipeId);

        if (!id) {
          throw new Error("Chưa nhận được mã công thức đã lưu.");
        }

        onConfirmed(id);
      }
    } catch (failure) {
      if (controller.signal.aborted) {
        return;
      }

      setConflict(failure.status === 409);

      setError(
        failure.status === 409
          ? "Bản nháp trên máy chủ đã thay đổi. Nội dung bạn đang nhập vẫn được giữ tại đây."
          : videoError(failure),
      );
    } finally {
      if (pending.current === controller) {
        pending.current = null;
      }

      if (!controller.signal.aborted) {
        setBusy("");
      }
    }
  }

  function reloadLatest() {
    const accepted = window.confirm(
      "Tải bản mới sẽ thay nội dung đang sửa bằng bản đã lưu trên máy chủ. Tiếp tục?",
    );

    if (accepted) {
      onReload();
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Xem lại và chỉnh sửa công thức</h2>

      <p className="text-sm text-gray-600">
        Để trống định lượng nếu video không nói rõ. Công thức xác nhận chỉ lưu
        riêng cho bạn.
      </p>

      <fieldset disabled={Boolean(busy) || conflict} className="space-y-5">
        <label className="block space-y-1">
          <span className="font-medium">Tên món</span>

          <input
            value={form.name}
            maxLength={255}
            className={inputClass}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                name: event.target.value,
              }))
            }
          />
        </label>

        <div className="space-y-3">
          <h3 className="font-semibold">Nguyên liệu</h3>

          {form.ingredients.map((item, index) => (
            <div
              key={item.rowId}
              className="space-y-2 rounded-xl bg-gray-50 p-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm">Nguyên liệu {index + 1}</span>

                  <input
                    value={item.name}
                    maxLength={255}
                    className={inputClass}
                    onChange={(event) =>
                      changeIngredient(item.rowId, {
                        name: event.target.value,
                        ingredientId: null,
                      })
                    }
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm">Định lượng</span>

                  <input
                    value={item.amountText}
                    maxLength={255}
                    placeholder="Chưa xác định"
                    className={inputClass}
                    onChange={(event) =>
                      changeIngredient(item.rowId, {
                        amountText: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span
                  className={
                    item.ingredientId ? "text-green-700" : "text-amber-800"
                  }
                >
                  {item.ingredientId
                    ? "Đã đối chiếu danh mục"
                    : "Tên nguyên liệu chưa gắn với danh mục"}
                </span>

                {item.ingredientId && (
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      changeIngredient(item.rowId, {
                        ingredientId: null,
                      })
                    }
                  >
                    Dùng tên tự nhập
                  </button>
                )}

                <button
                  type="button"
                  className="text-red-700 underline"
                  onClick={() =>
                    setForm((value) => ({
                      ...value,

                      ingredients: value.ingredients.filter(
                        (row) => row.rowId !== item.rowId,
                      ),
                    }))
                  }
                >
                  Xóa nguyên liệu {index + 1}
                </button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={
              Boolean(busy) || conflict || form.ingredients.length >= 100
            }
            onClick={() =>
              setForm((value) => ({
                ...value,

                ingredients: [...value.ingredients, newIngredient()],
              }))
            }
          >
            Thêm nguyên liệu
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Cách làm</h3>

          {form.steps.map((step, index) => (
            <div key={step.rowId} className="space-y-1">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Bước {index + 1}</span>

                <textarea
                  value={step.text}
                  rows={3}
                  maxLength={2000}
                  className={inputClass}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,

                      steps: value.steps.map((row) =>
                        row.rowId === step.rowId
                          ? {
                              ...row,
                              text: event.target.value,
                            }
                          : row,
                      ),
                    }))
                  }
                />
              </label>

              <button
                type="button"
                className="text-sm text-red-700 underline"
                onClick={() =>
                  setForm((value) => ({
                    ...value,

                    steps: value.steps.filter(
                      (row) => row.rowId !== step.rowId,
                    ),
                  }))
                }
              >
                Xóa bước {index + 1}
              </button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            disabled={Boolean(busy) || conflict || form.steps.length >= 100}
            onClick={() =>
              setForm((value) => ({
                ...value,

                steps: [
                  ...value.steps,
                  {
                    rowId: crypto.randomUUID(),
                    text: "",
                  },
                ],
              }))
            }
          >
            Thêm bước
          </Button>
        </div>
      </fieldset>

      <p className="text-sm text-gray-600">
        {dirty
          ? "Bạn có thay đổi chưa lưu. Hãy lưu bản nháp trước khi xác nhận hoặc rời trang."
          : "Bản nháp hiện tại đã được lưu."}
      </p>

      {!isCompleteDraft(payload) && (
        <p className="text-sm text-amber-800">
          Cần tên món, ít nhất một nguyên liệu và một bước làm để xác nhận.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={Boolean(busy) || conflict || !dirty}
          onClick={() => act("save")}
        >
          {busy === "save" ? "Đang lưu…" : "Lưu bản nháp"}
        </Button>

        <Button
          disabled={Boolean(busy) || !canConfirm}
          onClick={() => act("confirm")}
        >
          {busy === "confirm" ? "Đang xác nhận…" : "Xác nhận lưu riêng"}
        </Button>

        {conflict && (
          <Button variant="secondary" onClick={reloadLatest}>
            Tải bản mới từ máy chủ
          </Button>
        )}
      </div>
    </section>
  );
}

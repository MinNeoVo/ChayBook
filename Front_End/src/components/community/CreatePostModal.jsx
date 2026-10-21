import { useRef, useState } from "react";
import { ImagePlus, X, Leaf, Loader2, Send } from "lucide-react";
import { isVideoMedia } from "../media/mediaUtils";

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;

function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  categoryLoading = false,
  categoryError = "",
  initialPost = null,
}) {
  const isEditing = Boolean(initialPost);
  const [formData, setFormData] = useState(() => ({
    title: initialPost?.title || "",
    category: initialPost?.categoryId ? String(initialPost.categoryId) : "",
    content: initialPost?.content || "",
    image: null,
    imageUrl: initialPost?.imageUrl ?? initialPost?.image ?? null,
  }));

  const [preview, setPreview] = useState(
    () => initialPost?.imageUrl ?? initialPost?.image ?? null,
  );
  const [imageError, setImageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (!submittingRef.current) {
      onClose?.();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]:
        name === "title" && /\p{Nd}/u.test(value)
          ? "Tiêu đề không được chứa chữ số."
          : "",
    }));
    setSubmitError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      setImageError("Chỉ hỗ trợ ảnh PNG, JPG, WebP hoặc video MP4, WebM, MOV.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_MEDIA_SIZE) {
      setImageError("Ảnh hoặc video không được vượt quá 50 MB.");
      e.target.value = "";
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImageError("");
    setFormData((prev) => ({
      ...prev,
      image: file,
    }));

    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setImageError("");

    setFormData((prev) => ({
      ...prev,
      image: null,
      imageUrl: null,
    }));

    const input = document.getElementById("post-image");
    if (input) input.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const errors = {};
    const title = formData.title.trim();
    const content = formData.content.trim();

    if (!title) errors.title = "Vui lòng nhập tiêu đề bài viết.";
    else if (/\p{Nd}/u.test(title)) errors.title = "Tiêu đề không được chứa chữ số.";
    else if (title.length > 255) errors.title = "Tiêu đề không được vượt quá 255 ký tự.";

    if (!formData.category || !Number.isInteger(Number(formData.category))) {
      errors.category = "Vui lòng chọn danh mục.";
    }

    if (!content) {
      errors.content = "Vui lòng nhập nội dung bài viết.";
    }

    setFieldErrors(errors);
    setSubmitError("");
    if (Object.keys(errors).length > 0) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit?.({
        title,
        categoryId: Number(formData.category),
        content,
        image: formData.image,
        imageUrl: formData.imageUrl,
      });
    } catch (error) {
      setSubmitError(error?.message || "Không thể đăng bài viết. Vui lòng thử lại.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        px-4
        py-6
        backdrop-blur-sm
      "
      onMouseDown={handleClose}
    >
      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chaybook-primary/10">
              <Leaf size={21} className="text-chaybook-primary" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
              </h2>

              <p className="text-xs text-gray-500">
                {isEditing
                  ? "Cập nhật bài viết và gửi lại để kiểm duyệt"
                  : "Chia sẻ hành trình ăn chay với cộng đồng"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="
              rounded-lg
              p-2
              text-gray-500
              transition-colors
              hover:bg-gray-100
              hover:text-gray-800
            "
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================= FORM ================= */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto"
        >
          <fieldset disabled={isSubmitting} className="space-y-5 px-6 py-6">
            {/* Title */}
            <div>
              <label
                htmlFor="post-title"
                className="mb-1.5 block text-sm font-semibold text-gray-800"
              >
                Tiêu đề
              </label>

              <input
                id="post-title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                maxLength={255}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? "post-title-error" : undefined}
                placeholder="Nhập tiêu đề bài viết..."
                className={`
                  w-full
                  rounded-xl
                  border
                  ${fieldErrors.title ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200 focus:border-chaybook-primary focus:ring-chaybook-primary/10"}
                  px-4
                  py-3
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:ring-2
                `}
              />
              {fieldErrors.title && (
                <p id="post-title-error" role="alert" className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="post-category"
                className="mb-1.5 block text-sm font-semibold text-gray-800"
              >
                Danh mục
              </label>
              {categoryError && (
                <p role="alert" className="mb-2 text-sm text-red-600">
                  {categoryError}
                </p>
              )}

              <select
                id="post-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={categoryLoading}
                aria-invalid={Boolean(fieldErrors.category)}
                aria-describedby={fieldErrors.category ? "post-category-error" : undefined}
                className={`w-full rounded-xl border ${fieldErrors.category ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200 focus:border-chaybook-primary focus:ring-chaybook-primary/10"} bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="">
                  {categoryLoading
                    ? "Đang tải danh mục..."
                    : "Chọn danh mục"}
                </option>

                {categories.map((item) => (
                  <option key={item.categoryId} value={item.categoryId}>
                    {item.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category && (
                <p id="post-category-error" role="alert" className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.category}
                </p>
              )}
            </div>

            {/* Content */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="post-content"
                  className="block text-sm font-semibold text-gray-800"
                >
                  Nội dung
                </label>

                <span className="text-[11px] text-gray-400">
                  {formData.content.length}/1000
                </span>
              </div>

              <textarea
                id="post-content"
                name="content"
                value={formData.content}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    handleChange(e);
                  }
                }}
                aria-invalid={Boolean(fieldErrors.content)}
                aria-describedby={fieldErrors.content ? "post-content-error" : undefined}
                rows={5}
                placeholder="Chia sẻ nội dung với cộng đồng..."
                className={`
                  w-full
                  resize-none
                  rounded-xl
                  border
                  ${fieldErrors.content ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200 focus:border-chaybook-primary focus:ring-chaybook-primary/10"}
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:ring-2
                `}
              />
              {fieldErrors.content && (
                <p id="post-content-error" role="alert" className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.content}
                </p>
              )}
            </div>

            {/* Image */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                Hình ảnh hoặc video
              </label>

              {!preview ? (
                <label
                  htmlFor="post-image"
                  className="
                    flex
                    cursor-pointer
                    flex-col
                    items-center
                    justify-center
                    rounded-xl
                    border-2
                    border-dashed
                    border-gray-200
                    px-6
                    py-8
                    transition
                    hover:border-chaybook-primary/50
                    hover:bg-chaybook-primary/5
                  "
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <ImagePlus size={23} className="text-gray-500" />
                  </div>

                  <span className="text-sm font-semibold text-gray-700">
                    Chọn hình ảnh hoặc video
                  </span>

                  <span className="mt-1 text-xs text-gray-400">
                    PNG, JPG, WebP, MP4, WebM hoặc MOV · tối đa 50 MB
                  </span>

                  <input
                    id="post-image"
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative overflow-hidden rounded-xl">
                  {formData.image?.type.startsWith("video/") || isVideoMedia(preview) ? (
                    <video
                      src={preview}
                      controls
                      playsInline
                      className="h-56 w-full bg-black object-contain"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Post preview"
                      className="h-56 w-full object-cover"
                    />
                  )}

                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isSubmitting}
                    className="
                      absolute
                      right-3
                      top-3
                      rounded-full
                      bg-black/60
                      p-2
                      text-white
                      transition
                      hover:bg-black/80
                    "
                    aria-label="Xóa ảnh hoặc video"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}
              {imageError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {imageError}
                </p>
              )}
            </div>
          </fieldset>

          {/* ================= FOOTER ================= */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-semibold
                text-gray-600
                transition-colors
                hover:bg-gray-100
              "
            >
              Cancel
            </button>

            {submitError && (
              <p role="alert" className="mr-auto text-sm text-red-600">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-chaybook-primary
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:opacity-90
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  {isEditing ? "Đang lưu..." : "Đang đăng..."}
                </>
              ) : (
                <>
                  <Send size={17} />
                  {isEditing ? "Lưu thay đổi" : "Đăng bài"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;

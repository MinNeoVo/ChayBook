import { useState } from "react";
import { ImagePlus, X, Leaf, Send } from "lucide-react";

function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  categoryLoading = false,
}) {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",

    image: null,
  });

  const [preview, setPreview] = useState(null);
  const [imageError, setImageError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Chỉ nhận PNG, JPG và JPEG
    const allowedTypes = ["image/png", "image/jpeg"];

    if (!allowedTypes.includes(file.type)) {
      setImageError("Chỉ hỗ trợ ảnh PNG hoặc JPG.");
      e.target.value = "";
      return;
    }

    // Giới hạn 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Ảnh không được vượt quá 5 MB.");
      e.target.value = "";
      return;
    }

    // Xóa preview cũ nếu đang thay ảnh
    if (preview) {
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
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setImageError("");

    setFormData((prev) => ({
      ...prev,
      image: null,
    }));

    const input = document.getElementById("post-image");
    if (input) input.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    if (!formData.category) {
      return;
    }

    if (!formData.content.trim()) {
      return;
    }

    await onSubmit?.({
      title: formData.title.trim(),
      categoryId: Number(formData.category),
      content: formData.content.trim(),
      image: formData.image,
    });
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
      onMouseDown={onClose}
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
              <h2 className="text-lg font-bold text-gray-900">Create a Post</h2>

              <p className="text-xs text-gray-500">
                Share your vegetarian journey with the community
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-2
              text-gray-500
              transition-colors
              hover:bg-gray-100
              hover:text-gray-800
            "
            aria-label="Close"
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
          <div className="space-y-5 px-6 py-6">
            {/* Title */}
            <div>
              <label
                htmlFor="post-title"
                className="mb-1.5 block text-sm font-semibold text-gray-800"
              >
                Title
              </label>

              <input
                id="post-title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Give your post a title..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  px-4
                  py-3
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-chaybook-primary
                  focus:ring-2
                  focus:ring-chaybook-primary/10
                "
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="post-category"
                className="mb-1.5 block text-sm font-semibold text-gray-800"
              >
                Category
              </label>

              <select
                id="post-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={categoryLoading}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-chaybook-primary focus:ring-2 focus:ring-chaybook-primary/10 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {categoryLoading
                    ? "Loading categories..."
                    : "Select category"}
                </option>

                {categories.map((item) => (
                  <option key={item.categoryId} value={item.categoryId}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="post-content"
                  className="block text-sm font-semibold text-gray-800"
                >
                  Content
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
                rows={5}
                placeholder="Tell the community about your post..."
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-gray-200
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-chaybook-primary
                  focus:ring-2
                  focus:ring-chaybook-primary/10
                "
              />
            </div>

            {/* Image */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                Image
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
                    Click to upload an image
                  </span>

                  <span className="mt-1 text-xs text-gray-400">
                    PNG, JPG up to 5MB
                  </span>

                  <input
                    id="post-image"
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {imageError && (
                    <p className="mt-2 text-sm text-red-600" role="alert">
                      {imageError}
                    </p>
                  )}
                </label>
              ) : (
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={preview}
                    alt="Post preview"
                    className="h-56 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
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
                    aria-label="Remove image"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
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

            <button
              type="submit"
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
              "
            >
              <Send size={17} />
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;

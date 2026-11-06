import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChefHat,
  CircleAlert,
  Clock3,
  ImagePlus,
  Leaf,
  Loader2,
  RefreshCcw,
  ScanSearch,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import Button from "../components/common/Button";
import RecipeImage from "../components/recipes/RecipeImage";
import { useAuth } from "../context/useAuth";
import {
  checkRecognitionConnection,
  scanIngredients,
} from "../services/recognitionServices";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Lưu trạng thái nhận diện trong bộ nhớ phiên làm việc (SPA)
// Giữ nguyên khi chuyển qua lại giữa các trang và chỉ reset khi người dùng F5 / Refresh trình duyệt
let recognitionSessionCache = {
  selectedFile: null,
  previewUrl: "",
  scanResult: null,
  scanError: "",
  connectionStatus: {
    loading: false,
    data: null,
    error: "",
  },
};

function formatMinutes(minutes) {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) {
    return null;
  }
  return `${minutes} phút`;
}

function formatConfidence(confidence) {
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    return null;
  }
  const clamped = Math.max(0, Math.min(1, confidence));
  return Math.round(clamped * 100);
}

function SuggestedRecipeCard({ recipe }) {
  const prepTime = formatMinutes(recipe.prepTime);
  const cookTime = formatMinutes(recipe.cookTime);
  const hasTotalTime = prepTime !== null && cookTime !== null;
  const totalTime = hasTotalTime
    ? formatMinutes(recipe.prepTime + recipe.cookTime)
    : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        to={`/recipes/${recipe.recipeId}`}
        aria-label={`Xem công thức: ${recipe.name || "Công thức"}`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chaybook-primary"
      >
        <div className="relative aspect-16/10 overflow-hidden bg-chaybook-container">
          <RecipeImage
            imageUrl={recipe.imageUrl}
            alt={recipe.name ? `Công thức ${recipe.name}` : "Công thức"}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-chaybook-primary shadow-sm backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-chaybook-primary" />
            Khớp {recipe.matchedIngredientCount || 1} nguyên liệu
          </span>
          {totalTime && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-[#2d3130]/85 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <Clock3 aria-hidden="true" size={14} />
              {totalTime} tổng cộng
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-6 text-[#181c1b] transition-colors group-hover:text-chaybook-primary">
            {recipe.name || "Công thức chưa đặt tên"}
          </h3>
          <p className="mb-5 line-clamp-3 text-sm leading-6 text-[#3e4a3d]">
            {recipe.description || ""}
          </p>

          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs font-medium text-[#3e4a3d]">
            {prepTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 aria-hidden="true" size={15} />
                Chuẩn bị {prepTime}
              </span>
            )}
            {cookTime && (
              <span className="inline-flex items-center gap-1.5">
                <ChefHat aria-hidden="true" size={15} />
                Nấu {cookTime}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-semibold text-chaybook-primary">
            <span>Xem công thức</span>
            <ArrowRight
              aria-hidden="true"
              size={18}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </Link>
    </article>
  );
}

function IngredientRecognitionPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(
    () => recognitionSessionCache.selectedFile
  );
  const [previewUrl, setPreviewUrl] = useState(
    () => recognitionSessionCache.previewUrl
  );
  const [isDragging, setIsDragging] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(
    () => recognitionSessionCache.scanError
  );
  const [scanResult, setScanResult] = useState(
    () => recognitionSessionCache.scanResult
  );

  const [ingredientNotice, setIngredientNotice] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState(
    () => recognitionSessionCache.connectionStatus
  );

  const updateSessionCache = (partial) => {
    recognitionSessionCache = {
      ...recognitionSessionCache,
      ...partial,
    };
  };

  const replacePreviewFile = (file) => {
    if (recognitionSessionCache.previewUrl) {
      URL.revokeObjectURL(recognitionSessionCache.previewUrl);
    }

    const nextPreviewUrl = file ? URL.createObjectURL(file) : "";
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    updateSessionCache({
      selectedFile: file,
      previewUrl: nextPreviewUrl,
    });
  };

  const validateAndSelectFile = (file) => {
    if (!file) return;

    setScanError("");
    setIngredientNotice(null);
    updateSessionCache({ scanError: "" });

    if (!file.type || !file.type.startsWith("image/")) {
      const message =
        "Tệp tải lên phải là định dạng hình ảnh (JPG, PNG, WEBP...).";
      setScanError(message);
      updateSessionCache({ scanError: message });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const message = "Dung lượng ảnh không được vượt quá 10 MB.";
      setScanError(message);
      updateSessionCache({ scanError: message });
      return;
    }

    replacePreviewFile(file);
    setScanResult(null);
    updateSessionCache({ scanResult: null });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    validateAndSelectFile(file);
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    validateAndSelectFile(file);
  };

  const handleClearImage = () => {
    replacePreviewFile(null);
    setScanResult(null);
    setScanError("");
    setIngredientNotice(null);
    updateSessionCache({
      scanResult: null,
      scanError: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      const message = "Vui lòng chọn một ảnh nguyên liệu để nhận diện.";
      setScanError(message);
      updateSessionCache({ scanError: message });
      return;
    }

    if (!isLoggedIn) {
      const message =
        "Vui lòng đăng nhập để sử dụng tính năng nhận diện nguyên liệu AI.";
      setScanError(message);
      updateSessionCache({ scanError: message });
      return;
    }

    setIsScanning(true);
    setScanError("");
    setIngredientNotice(null);
    updateSessionCache({ scanError: "" });

    try {
      const response = await scanIngredients(selectedFile);
      setScanResult(response);
      updateSessionCache({ scanResult: response });
    } catch (error) {
      console.error("Failed to recognize ingredients:", error);
      const message =
        error.status === 401 || error.status === 403
          ? "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
          : error.message ||
            "Không thể nhận diện nguyên liệu lúc này. Vui lòng thử lại.";
      setScanError(message);
      updateSessionCache({ scanError: message });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCheckConnection = async () => {
    if (!isLoggedIn) {
      const nextStatus = {
        loading: false,
        data: null,
        error: "Vui lòng đăng nhập để kiểm tra kết nối AI.",
      };
      setConnectionStatus(nextStatus);
      updateSessionCache({ connectionStatus: nextStatus });
      return;
    }

    const loadingStatus = { loading: true, data: null, error: "" };
    setConnectionStatus(loadingStatus);
    updateSessionCache({ connectionStatus: loadingStatus });

    try {
      const data = await checkRecognitionConnection();
      const successStatus = { loading: false, data, error: "" };
      setConnectionStatus(successStatus);
      updateSessionCache({ connectionStatus: successStatus });
    } catch (error) {
      const errorStatus = {
        loading: false,
        data: null,
        error: error.message || "Không thể kết nối tới dịch vụ AI.",
      };
      setConnectionStatus(errorStatus);
      updateSessionCache({ connectionStatus: errorStatus });
    }
  };

  const handleIngredientClick = (item) => {
    const isMatchedInDb =
      item.ingredientId !== null && item.ingredientId !== undefined;

    if (isMatchedInDb) {
      setIngredientNotice(null);
      navigate(`/recipes?ingredient=${encodeURIComponent(item.detectedName)}`);
    } else {
      setIngredientNotice({
        detectedName: item.detectedName,
        message: "Chưa có dữ liệu nguyên liệu",
      });
    }
  };

  const detectedItems = scanResult?.items || [];
  const suggestedRecipes = scanResult?.suggestedRecipes || [];
  const matchedCount = detectedItems.filter(
    (item) => item.ingredientId !== null && item.ingredientId !== undefined
  ).length;
  const displayPreviewUrl = previewUrl || scanResult?.imageUrl || "";

  return (
    <main className="min-h-screen w-full bg-chaybook-container font-sans text-[#181c1b] antialiased">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-12 lg:pb-20">
        {/* ==================== HEADER ==================== */}
        <header className="mb-10 flex flex-col items-center text-center sm:mb-12">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#92f5a4] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#007233]">
            <Sparkles aria-hidden="true" size={16} />
            Nhận diện AI ChayBook
          </span>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-chaybook-primary sm:text-4xl lg:text-5xl">
            Nhận diện nguyên liệu qua ảnh
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[#3e4a3d] sm:text-lg">
            Tải lên hình ảnh các loại rau củ, nấm hoặc nguyên liệu sẵn có trong
            bếp. AI sẽ tự động nhận diện và gợi ý những công thức món chay phù
            hợp nhất cho bạn.
          </p>
        </header>

        {/* ==================== LOGIN NOTICE ==================== */}
        {!isLoggedIn && (
          <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-sm text-amber-900 shadow-xs sm:flex-row sm:px-6">
            <div className="flex items-center gap-3">
              <CircleAlert className="h-5 w-5 shrink-0 text-amber-600" />
              <p>
                Bạn cần đăng nhập tài khoản <strong>ChayBook</strong> để quét
                ảnh nguyên liệu với AI và lưu lịch sử nhận diện.
              </p>
            </div>
            <Link to="/login" className="shrink-0">
              <Button size="sm" className="whitespace-nowrap px-5">
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        )}

        {/* ==================== MAIN GRID ==================== */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* LEFT COLUMN: UPLOAD & CONTROLS */}
          <section
            aria-label="Tải ảnh nguyên liệu"
            className="flex flex-col gap-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8 lg:col-span-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#92f5a4]/50 text-chaybook-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#181c1b]">
                    Ảnh nguyên liệu
                  </h2>
                  <p className="text-xs text-[#3e4a3d]">
                    Hỗ trợ JPG, PNG, WEBP (Tối đa 10 MB)
                  </p>
                </div>
              </div>

              {(selectedFile || displayPreviewUrl) && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  disabled={isScanning}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa ảnh
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="ingredient-image-input"
            />

            {/* Dropzone or Preview */}
            {!displayPreviewUrl ? (
              <label
                htmlFor="ingredient-image-input"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                  isDragging
                    ? "border-chaybook-primary bg-[#92f5a4]/20"
                    : "border-gray-300 bg-chaybook-bg hover:border-chaybook-primary hover:bg-chaybook-container/70"
                }`}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-chaybook-primary shadow-sm">
                  <ImagePlus className="h-7 w-7" />
                </div>
                <p className="mb-1 text-base font-semibold text-[#181c1b]">
                  Kéo thả ảnh vào đây hoặc nhấn để chọn ảnh
                </p>
                <p className="mb-5 text-xs text-[#3e4a3d]">
                  Chụp rõ nét các nguyên liệu trên mặt phẳng đủ ánh sáng
                </p>
                <span className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-chaybook-primary shadow-xs">
                  <Upload className="h-4 w-4" />
                  Chọn tệp từ thiết bị
                </span>
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-gray-200 bg-chaybook-container">
                  <img
                    src={displayPreviewUrl}
                    alt="Xem trước nguyên liệu"
                    className="h-full w-full object-cover"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 text-white backdrop-blur-xs">
                      <Loader2 className="h-9 w-9 animate-spin text-[#92f5a4]" />
                      <p className="text-sm font-semibold">
                        AI đang phân tích nguyên liệu...
                      </p>
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between text-xs text-[#3e4a3d]">
                    <span className="truncate font-medium">
                      {selectedFile.name}
                    </span>
                    <span className="shrink-0">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error Alert */}
            {scanError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handleScan}
                disabled={!selectedFile || isScanning}
                className="h-12 flex-1 gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang nhận diện...
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-5 w-5" />
                    Quét nguyên liệu
                  </>
                )}
              </Button>

              {displayPreviewUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isScanning}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 gap-2 text-sm"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Đổi ảnh khác
                </Button>
              )}
            </div>

            {/* Tips Box */}
            <div className="rounded-xl bg-chaybook-container p-4 text-xs leading-5 text-[#3e4a3d]">
              <div className="mb-1.5 flex items-center gap-2 font-semibold text-chaybook-primary">
                <Leaf className="h-4 w-4 shrink-0" />
                <span>Mẹo để AI nhận diện chính xác hơn</span>
              </div>
              <ul className="list-inside list-disc space-y-1">
                <li>Đặt các nguyên liệu tách rời nhau, tránh chồng lấp.</li>
                <li>Đảm bảo ánh sáng rõ ràng, không bị mờ hoặc ngược sáng.</li>
                <li>
                  Nhấn vào nguyên liệu được nhận diện để tìm ngay các công thức
                  sử dụng nguyên liệu đó.
                </li>
              </ul>
            </div>

            {/* Optional Connection Check */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">
                  Trạng thái dịch vụ Gemini AI
                </span>
                <button
                  type="button"
                  onClick={handleCheckConnection}
                  disabled={connectionStatus.loading}
                  className="cursor-pointer text-xs font-semibold text-chaybook-primary hover:underline disabled:opacity-50"
                >
                  {connectionStatus.loading
                    ? "Đang kiểm tra..."
                    : "Kiểm tra kết nối AI"}
                </button>
              </div>

              {connectionStatus.data && (
                <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-chaybook-primary" />
                  <div>
                    <p className="font-semibold">
                      {connectionStatus.data.message} (
                      {connectionStatus.data.model})
                    </p>
                    {connectionStatus.data.providerResponse && (
                      <p className="mt-0.5 text-emerald-700">
                        Phản hồi: {connectionStatus.data.providerResponse}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {connectionStatus.error && (
                <p className="mt-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700">
                  {connectionStatus.error}
                </p>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: RECOGNITION RESULTS */}
          <section
            aria-label="Kết quả nhận diện nguyên liệu"
            className="flex flex-col gap-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#181c1b]">
                  Nguyên liệu nhận diện được
                </h2>
                <p className="mt-1 text-sm text-[#3e4a3d]">
                  Nhấn vào nguyên liệu để tìm công thức món chay tương ứng
                </p>
              </div>

              {scanResult && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    scanResult.status === "COMPLETED"
                      ? "bg-[#92f5a4]/60 text-[#007233]"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      scanResult.status === "COMPLETED"
                        ? "bg-chaybook-primary"
                        : "bg-amber-600"
                    }`}
                  />
                  {scanResult.status === "COMPLETED"
                    ? `Đã tìm thấy ${detectedItems.length} nguyên liệu`
                    : "Chưa phát hiện nguyên liệu"}
                </span>
              )}
            </div>

            {!scanResult && !isScanning && (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl bg-chaybook-bg px-6 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-chaybook-primary shadow-xs">
                  <ScanSearch className="h-8 w-8" strokeWidth={1.6} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#181c1b]">
                  Chưa có dữ liệu phân tích
                </h3>
                <p className="max-w-md text-sm leading-6 text-[#3e4a3d]">
                  Hãy tải lên một bức ảnh chụp nguyên liệu ở khung bên trái và
                  nhấn <strong>Quét nguyên liệu</strong> để xem kết quả.
                </p>
              </div>
            )}

            {isScanning && (
              <div className="space-y-4 py-6">
                {Array.from({ length: 4 }, (_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-chaybook-bg p-4"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    </div>
                    <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                  </div>
                ))}
              </div>
            )}

            {scanResult && !isScanning && (
              <div className="flex flex-col gap-5">
                {scanResult.message && (
                  <div
                    className={`flex items-center gap-2.5 rounded-xl p-4 text-sm font-medium ${
                      detectedItems.length > 0
                        ? "bg-chaybook-container text-[#181c1b]"
                        : "bg-amber-50 text-amber-900"
                    }`}
                  >
                    {detectedItems.length > 0 ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-chaybook-primary" />
                    ) : (
                      <CircleAlert className="h-5 w-5 shrink-0 text-amber-600" />
                    )}
                    <span>{scanResult.message}</span>
                  </div>
                )}

                {/* Thông báo khi bấm vào nguyên liệu chưa có trong DB */}
                {ingredientNotice && (
                  <div
                    role="alert"
                    className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <CircleAlert className="h-5 w-5 shrink-0 text-amber-600" />
                      <span>
                        <strong>{ingredientNotice.message}</strong> (
                        {ingredientNotice.detectedName})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIngredientNotice(null)}
                      className="cursor-pointer text-xs font-semibold text-amber-800 hover:underline"
                    >
                      Đóng
                    </button>
                  </div>
                )}

                {detectedItems.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      {detectedItems.map((item, index) => {
                        const confidencePercent = formatConfidence(
                          item.confidence
                        );
                        const isMatchedInDb =
                          item.ingredientId !== null &&
                          item.ingredientId !== undefined;
                        const isNoticeSelected =
                          !isMatchedInDb &&
                          ingredientNotice?.detectedName === item.detectedName;

                        return (
                          <button
                            key={
                              item.recognitionItemId ??
                              `${item.detectedName}-${index}`
                            }
                            type="button"
                            onClick={() => handleIngredientClick(item)}
                            className={`group flex w-full cursor-pointer flex-col justify-between gap-3 rounded-xl border p-4 text-left transition-all ${
                              isMatchedInDb
                                ? "border-gray-200/80 bg-chaybook-bg/60 hover:-translate-y-0.5 hover:border-chaybook-primary hover:bg-white hover:shadow-sm"
                                : isNoticeSelected
                                  ? "border-amber-400 bg-amber-50/60"
                                  : "border-gray-200/80 bg-chaybook-bg/60 hover:border-amber-300 hover:bg-white"
                            }`}
                          >
                            <div className="flex w-full items-start justify-between gap-2">
                              <div>
                                <h3 className="text-base font-bold capitalize text-[#181c1b] group-hover:text-chaybook-primary">
                                  {item.detectedName}
                                </h3>
                                <span
                                  className={`mt-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                    isMatchedInDb
                                      ? "bg-[#92f5a4]/50 text-[#007233]"
                                      : "bg-gray-200/80 text-gray-600"
                                  }`}
                                >
                                  {isMatchedInDb
                                    ? "Có trong kho nguyên liệu • Nhấn để tìm món"
                                    : "Chưa có dữ liệu nguyên liệu"}
                                </span>
                              </div>

                              {confidencePercent !== null && (
                                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-chaybook-primary shadow-2xs">
                                  {confidencePercent}%
                                </span>
                              )}
                            </div>

                            {confidencePercent !== null && (
                              <div className="w-full space-y-1">
                                <div className="flex justify-between text-[11px] text-[#3e4a3d]">
                                  <span>Độ tin cậy AI</span>
                                  <span>{confidencePercent}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className="h-full rounded-full bg-chaybook-primary transition-all duration-500"
                                    style={{ width: `${confidencePercent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-chaybook-container/70 px-4 py-3 text-xs text-[#3e4a3d]">
                      <span>
                        Đã khớp{" "}
                        <strong className="text-chaybook-primary">
                          {matchedCount}/{detectedItems.length}
                        </strong>{" "}
                        nguyên liệu với cơ sở dữ liệu công thức ChayBook.
                      </span>
                      <Link
                        to="/recipes"
                        className="inline-flex items-center gap-1 font-semibold text-chaybook-primary hover:underline"
                      >
                        Tìm thêm công thức
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center">
                    <p className="text-sm text-[#3e4a3d]">
                      Không tìm thấy nguyên liệu rõ ràng nào trong ảnh này. Hãy
                      thử chụp gần hơn hoặc chọn một bức ảnh khác.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ==================== SUGGESTED RECIPES SECTION ==================== */}
        {scanResult && !isScanning && (
          <section
            aria-label="Công thức gợi ý từ nguyên liệu"
            className="mt-12"
          >
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-chaybook-primary">
                  Gợi ý món ngon
                </p>
                <h2 className="text-2xl font-bold text-[#181c1b] sm:text-3xl">
                  Công thức phù hợp với nguyên liệu của bạn
                </h2>
              </div>
              <Link
                to="/recipes"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-chaybook-primary hover:underline"
              >
                Xem tất cả công thức
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {suggestedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suggestedRecipes.map((recipe) => (
                  <SuggestedRecipeCard
                    key={recipe.recipeId}
                    recipe={recipe}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-6 py-10 text-center shadow-sm">
                <ChefHat
                  aria-hidden="true"
                  size={40}
                  strokeWidth={1.5}
                  className="mb-3 text-[#6e7b6c]"
                />
                <h3 className="mb-1.5 text-lg font-semibold text-[#181c1b]">
                  Chưa có công thức gợi ý trùng khớp
                </h3>
                <p className="mb-5 max-w-md text-sm leading-6 text-[#3e4a3d]">
                  Các nguyên liệu nhận diện được hiện chưa khớp với công thức
                  đang hoạt động trong hệ thống. Bạn có thể khám phá kho công
                  thức đa dạng của ChayBook.
                </p>
                <Link to="/recipes">
                  <Button variant="outline" size="sm">
                    Khám phá kho công thức
                  </Button>
                </Link>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default IngredientRecognitionPage;

# Admin API audit — 2026-10-15

**Kết quả mới nhất:** xem [kiểm tra MealPlan tests và phân loại file](#verification-2026-10-15-mealplan-tests): **Maven 36/36 PASS**, build PASS, ESLint source không có error; lint toàn thư mục còn lỗi trong cache Vite. Kết quả API/SQL thực tế thuộc [đợt kiểm thử SQL Server riêng](#đợt-kiểm-thử-bổ-sung--sql-server-riêng-2026-10-15). Các phần bên dưới lưu lịch sử từng đợt; kết quả 34/36 và hai lỗi MealPlan là trước lần sửa test mới nhất.

Branch: `update/api_admin`. Baseline: `d9db94c`. Existing local changes in `Front_End/vite.config.js` and two Vite cache directories are preserved.

## Before implementation

| Admin Page | Feature | FE | BE | Integration | Result |
|---|---|---|---|---|---|
| Dashboard | Statistics, chart, latest posts, contributors | Real services, independent loading/error/empty states; 7/30 day chart | `/api/admin/dashboard/statistics/*`, `/admin/users/statistics`, `/admin/articles`; approved feed `/api/posts` | UNVERIFIED | Contracts match in source; no running backend or authenticated session yet. Preserve implementation. No recipe statistic currently offered. |
| Users | List, pagination, page-local search/status filter, activate/disable | Real `adminUserServices`; page-local filtering explicitly labelled | GET `/api/admin/users`, `/statistics`; PATCH `/{id}/status` | PARTIAL | Contracts match; missing success feedback. No role mutation/delete/detail feature exists; do not invent these. |
| Articles | List/detail/create/edit, categories, image selection | `MOCK_ARTICLES`, mock categories; FileReader data URL; local mutation | Admin list/detail/POST/PUT/DELETE and admin categories already exist | MOCK / MISSING FE / MISSING BE | Connect existing CRUD. Cover URL max 255 chars cannot accept data URL. Upload endpoint missing. Existing sort needs server support for oldest ordering across pages. |
| Recipes | Management | Sidebar exists; route/page/services absent | Admin list/detail/POST/PUT/DELETE already exist; ACTIVE/DELETED statuses | MISSING FE | Add admin-only page, reference data, server search/filter/pagination, CRUD; preserve user pages and pagination. No approval workflow exists. |
| Post & Video | Queue, preview, moderation, removal | Mock generator, local mutations and fabricated trend statistics | Admin list/statistics/PATCH status already exist | MOCK / MISSING FE / PARTIAL | Connect server pagination and status transitions. POST and VIDEO IDs overlap: key by type + ID. Detail currently truncated at 500 chars; add admin detail endpoint. Statistics currently include REMOVED records in total. |

## Contract and authorization evidence

- `src/services/api.js`: common fetch wrapper sends `credentials: include`; parses JSON/plain text/204; surfaces status and ProblemDetail. Auth is the `CHAYBOOK_TOKEN` HttpOnly cookie (`CookieBearerTokenResolver`); no JS bearer token needed.
- `App.jsx`, `routes/AdminRoute.jsx`, `layouts/AdminLayout.jsx`: protected admin parent route checks ADMIN; all five sidebar entries exist, Recipes route missing.
- `config/SecurityConfig.java`: `/api/admin/**` requires ADMIN. Article/category/recipe/post/dashboard services additionally check the persisted ACTIVE ADMIN. Users only checks token role at the filter and target USER role in service; stale disabled-admin cookie remains an audit concern.
- `common/pagination/PageResponse.java`: admin responses use `items/page/size/totalElements/totalPages`, distinct from the public recipes `content/number` contract.
- Articles: `admin/article/controller/AdminArticleController.java`, request DTO, service and repository: q searches title, status DRAFT/PUBLISHED, page size 1–10, DELETE hard-deletes.
- Recipes: `admin/recipe/*`, `recipe/dto/RecipeWriteRequest.java`: category/name/description/imageUrl/prepTime/cookTime/instructions/ingredients; category must be ACTIVE RECIPE; ingredient IDs unique with positive finite quantity. DELETE marks DELETED; deleted recipes cannot be edited. No approval or restore API.
- Posts/videos: `admin/post/*`: allowed transitions PENDING→APPROVED/REJECTED, APPROVED→REJECTED/REMOVED, REJECTED→APPROVED; compare-and-set protects concurrent status changes. Removal uses PATCH REMOVED, not hard delete.
- `Database/FixedDB/Fixed_CreateDatabase.sql`: POST/VIDEO have no rejection-reason column; no auto-filter configuration API exists. These require business/schema decisions; do not simulate persistence or alter schema.
- `config/CorsConfig.java`: credentialed CORS currently allows localhost:5173 only. Existing central API URL is in `services/app.js`; integrations reuse it.
- `common/exception/GlobalExceptionHandler.java`: Bean Validation returns 400 with field errors, business exceptions preserve HTTP status; database constraint handling is generic.

## Baseline verification

- Frontend `npm.cmd run build`: PASS (existing >500 kB chunk warning).
- Default Maven Wrapper: BLOCKED (invalid JAVA_HOME; shell default Java 8). JDK 21 found locally; further verification uses process-local JAVA_HOME.
- Live database and authenticated E2E were UNVERIFIED at initial audit. Subsequent connection checks and live verification are recorded below.

## Báo cáo kết quả

`CONNECTED` dưới đây chỉ áp dụng cho các luồng đã chạy với API và SQL Server thật. Các thao tác ghi đã nối API và được kiểm thử cách ly; chưa đánh dấu CRUD ghi database thật là PASS.

| Admin Page | Feature | FE | BE | Integration | Result |
|---|---|---|---|---|---|
| Dashboard | Statistics, chart, latest posts, contributors | Giữ nguyên | Giữ nguyên | CONNECTED cho luồng đọc | Đăng nhập admin, hiển thị trang, 7/30 ngày và API thống kê thật trả 200; 6 service tests qua. Trang hiện không có thẻ thống kê Recipes; không tự mở rộng dashboard đang hoạt động. |
| Users | List, pagination, search/filter, status | Giữ luồng API có sẵn; thêm thông báo thành công | Thêm kiểm tra ACTIVE ADMIN từ database | CONNECTED cho danh sách/thống kê; ghi UNVERIFIED với SQL thật | GET thật 200; PATCH thành công/refresh kiểm thử bằng browser fixture; kiểm thử quyền trong MockMvc và service. Search/filter tiếp tục áp dụng trên trang hiện tại như nhãn UI có sẵn. |
| Articles | List/detail, categories, CRUD, cover image | Bỏ import mock, dùng service thật; phân trang/search/filter/sort server; direct detail route | Dùng CRUD có sẵn; bổ sung sort và upload/read image | CONNECTED cho đọc; ghi UNVERIFIED với SQL thật | GET danh sách, danh mục, chi tiết, oldest và DRAFT filter thật 200; CRUD/upload/refresh qua fixture; lưu ảnh thử thành công trong thư mục tạm. |
| Recipes | Management | Bổ sung parent/list/new/detail/edit routes và form ingredients | Dùng nguyên API admin hiện có | CONNECTED cho đọc; ghi UNVERIFIED với SQL thật | GET list/detail/category/ingredients thật 200; CRUD, soft delete, pagination/search/empty state qua browser fixture. Public Recipes không sửa. |
| Post & Video | List/detail, approve/reject/remove | Bỏ mock, server filtering/pagination, khóa thao tác lúc ghi, refresh sau thành công | Thêm detail, validation; tổng thống kê loại REMOVED; giữ transition/CAS có sẵn | CONNECTED cho đọc; moderation ghi UNVERIFIED với SQL thật | GET thật 200; preview detail thật; PATCH 204 và quyền kiểm tra cách ly. POST/VIDEO trùng ID không cập nhật lẫn nhau. Media lỗi được báo riêng. |

### 1. Phần giữ nguyên

- `Front_End/src/Pages/admin/AdminDashboardPage.jsx` và `Front_End/src/services/adminDashboardServices.js`: không đổi; browser đã kiểm tra với dữ liệu thật.
- Users giữ API danh sách, phân trang, lọc cục bộ, activate/disable. Không thêm đổi role hoặc xóa tài khoản.
- Backend Recipes giữ nguyên controller/service/repository/DTO và cơ chế ACTIVE/DELETED.
- Không sửa User Pages, public recipe service hoặc pagination. Không thay schema, dependency, JWT/cookie flow; không commit/push hoặc chuyển nhánh.
- `Front_End/vite.config.js` và hai thư mục cache có sẵn được giữ nguyên. Các file ảnh untracked xuất hiện trong lúc làm việc cũng được giữ nguyên; test live của tác vụ này chặn mọi business write.

### 2. API thiếu và giới hạn nghiệp vụ

- Đã bổ sung `POST /api/admin/articles/images` (multipart `file`, 201 `{coverImage}`) và `GET /api/article-images/{filename}`. Chỉ GET ảnh được mở công khai để ảnh trong bài đã xuất bản hiển thị được; mọi ghi admin vẫn yêu cầu ADMIN. Dùng hạn mức multipart 5 MB/6 MB sẵn có, kiểm tra chữ ký JPG/PNG/WebP, tên UUID, chặn đường dẫn tùy ý, trả đúng MIME và `nosniff`.
- Đã bổ sung `GET /api/admin/posts-videos/{type}/{contentId}` để duyệt nội dung đầy đủ. Unicode không bị ép sang VARCHAR(500).
- Chưa có API/cột lưu rejection reason và cấu hình auto-filter. UI không giả lập gửi/lưu feedback; thao tác reject thật dùng status hiện có. Các quy tắc minh họa hiện có vẫn chỉ là minh họa. Phần lưu lý do/cấu hình cần thống nhất nghiệp vụ và phê duyệt schema nếu cần.
- Không có nghiệp vụ phê duyệt/restore Recipes, sửa role/xóa user, hay upload ảnh Recipes trong API hiện tại. Recipes dùng trường imageUrl đã có; không tự bổ sung các endpoint này.

### 3. Mock data

- `adminArticleMockData.js` và `data/adminPostVideoMock.js` không còn được import vào luồng admin production; giữ file gốc để không xóa tài nguyên không cần thiết.
- Không tạo mock backend hoặc fallback dữ liệu giả trong ứng dụng. Fixture chỉ nằm trong `Front_End/tests/admin-api.browser.cjs` và bị chặn trong browser test.

### 4. Lỗi tích hợp đã xử lý

- Articles trước đây chỉ đổi state, tự sinh ID/author và gửi ảnh dạng data URL vượt giới hạn 255 ký tự: chuyển sang response backend, upload multipart trả đường dẫn ngắn.
- Summary Articles không chứa content/author/createdAt: thẻ danh sách dùng category/status/updatedAt có thật; chi tiết tải riêng, không gọi detail cho từng thẻ.
- Search Articles hiển thị đúng phạm vi `q` backend hỗ trợ (title); category dùng filter riêng. `sort=newest|oldest` được bổ sung trước phân trang, có kiểm tra input và thứ tự ổn định.
- Sidebar Recipes trỏ vào route chưa tồn tại: thêm routes trong parent AdminRoute hiện có.
- Post và Video có không gian ID riêng: React key và PATCH dùng cả type + ID.
- Thống kê tổng submissions trước đây vẫn tính REMOVED trong khi queue loại bỏ: đồng nhất điều kiện loại REMOVED.
- Bỏ trend phần trăm, thời gian duyệt và thông báo feedback giả. Tải dữ liệu có loading/error/empty, abort request cũ, retry; trang tự điều chỉnh nếu thao tác làm giảm số trang.
- User management trước đây chỉ dựa vào role trong token để xác thực người thao tác: kiểm tra thêm tài khoản ADMIN vẫn ACTIVE trước cả 3 endpoint, giữ nguyên xử lý target USER.
- Video URL không phát được có thông báo và liên kết mở nguồn; thumbnail lỗi dùng fallback.

### 5. Thay đổi chính và endpoint

- `adminContentServices.js`: tái sử dụng `apiFetch`/API base có sẵn, cookie credentials, mapping đúng `items/page/size/totalElements/totalPages`, FormData, 204 và ProblemDetail.
- `useAdminResource.js` và `AdminRequestState.jsx`: trạng thái request, retry và ngăn response cũ ghi vào route/filter mới.
- Recipes form chỉ gửi đúng `RecipeWriteRequest`, kiểm tra required/length/nonnegative integer times/positive finite quantities/duplicate ingredients. Category đã xóa chỉ giữ được khi là category hiện tại; recipe DELETED chỉ đọc.
- Post moderation dùng `PATCH /api/admin/posts-videos/{type}/{id}/status`, body `{status}`; removal là `REMOVED`, giữ nguyên state machine và cập nhật có điều kiện của backend.
- Không gửi business write tới database thật trong kiểm thử. Upload thực tế được kiểm thử trong thư mục tạm của JUnit, không dùng `Back_End/uploads`.

### 6. File được chỉnh sửa hoặc thêm

Frontend:

1. `Front_End/src/App.jsx`
2. `Front_End/src/Pages/admin/AdminArticleManagement.jsx`
3. `Front_End/src/Pages/admin/AdminPostVideoPage.jsx`
4. `Front_End/src/Pages/admin/AdminUsers.jsx`
5. `Front_End/src/Pages/admin/AdminRecipeManagement.jsx` (mới)
6. `Front_End/src/services/adminContentServices.js` (mới)
7. `Front_End/src/hooks/useAdminResource.js` (mới)
8. `Front_End/src/components/admin/AdminRequestState.jsx` (mới)
9. `Front_End/tests/admin-api.browser.cjs` (mới)

Backend:

1. `Back_End/src/main/java/com/chaybook/backend/admin/article/controller/AdminArticleController.java`
2. `Back_End/src/main/java/com/chaybook/backend/admin/article/controller/AdminArticleImageController.java` (mới)
3. `Back_End/src/main/java/com/chaybook/backend/admin/article/service/AdminArticleService.java`
4. `Back_End/src/main/java/com/chaybook/backend/admin/article/service/AdminArticleImageService.java` (mới)
5. `Back_End/src/main/java/com/chaybook/backend/admin/article/service/impl/AdminArticleServiceImpl.java`
6. `Back_End/src/main/java/com/chaybook/backend/admin/post/controller/AdminPostVideoController.java`
7. `Back_End/src/main/java/com/chaybook/backend/admin/post/dto/AdminPostVideoResponse.java`
8. `Back_End/src/main/java/com/chaybook/backend/admin/post/repository/AdminPostVideoRepository.java`
9. `Back_End/src/main/java/com/chaybook/backend/admin/post/service/AdminPostVideoService.java`
10. `Back_End/src/main/java/com/chaybook/backend/admin/post/service/impl/AdminPostVideoServiceImpl.java`
11. `Back_End/src/main/java/com/chaybook/backend/admin/user/controller/AdminUserController.java`
12. `Back_End/src/main/java/com/chaybook/backend/admin/user/service/AdminUserService.java`
13. `Back_End/src/main/java/com/chaybook/backend/config/SecurityConfig.java`
14. `Back_End/src/test/java/com/chaybook/backend/admin/AdminApiSecurityTest.java` (mới)
15. `Back_End/src/test/java/com/chaybook/backend/admin/article/service/AdminArticleIntegrationTest.java` (mới)
16. `Back_End/src/test/java/com/chaybook/backend/admin/post/service/AdminPostVideoServiceTest.java` (mới)
17. `Back_End/src/test/java/com/chaybook/backend/admin/user/service/AdminUserAuthorizationTest.java` (mới)

Báo cáo: `docs/admin-api-audit.md` (mới). `vite.config.js`, cache và ảnh untracked không thuộc thay đổi của tác vụ này.

### 7. Kết quả build/test

| Check | Kết quả | Dẫn chứng |
|---|---|---|
| Frontend build cuối | PASS | `npm.cmd run build`: 1972 modules, ~603 kB JS; cảnh báo chunk >500 kB có từ baseline. |
| Lint tất cả file JS/JSX production có sửa/thêm | PASS | ESLint trên App, 4 admin pages, service, hook, request-state component; exit 0. |
| Backend compile | PASS | Maven Wrapper offline + JDK 21, 176 source files. JAVA_HOME mặc định không hợp lệ; đã dùng JDK 21 có sẵn cho process, không sửa thiết lập máy. |
| Admin tests | PASS, 26 test khác nhau | 5 security/MVC + 3 article/image + 6 dashboard có sẵn + 10 moderation + 2 user authorization. Lượt suite 25/25 và lượt article/image bổ sung 3/3 (2 test trùng suite trước). |
| Full backend test run | FAIL, 2 errors ngoài phần admin | Lượt full chạy 34 tests: 32 qua, 2 lỗi ở `MealPlanServiceTest`; sau đó thêm 1 test ảnh và test ảnh qua. Không đánh dấu toàn bộ suite PASS. |
| Browser fixture test | PASS | 5 trang; Article validation/upload/create/edit/delete/refresh; Recipe create/edit/delete; pagination/search/sort/empty; type+ID moderation; Users success; error/retry; USER/anonymous route guard. |
| SQL Server thật + API đọc | PASS | Admin login 200; GET users/statistics/articles/categories/recipes/ingredients/posts-videos/statistics/dashboard đều 200. Oldest, DRAFT, DELETED, page ngoài phạm vi, VIDEO/PENDING và chart 30 ngày đều kiểm tra. |
| HTTP validation/CORS thật | PASS | Anonymous admin GET 401; negative post page 400; Article size 11 trả 400. Origin localhost:5173 được trả CORS allow-origin đúng trên request admin hợp lệ. USER sample login trả 404 nên không nhận PASS live USER login; quyền USER→403 được kiểm tra bằng real SecurityFilterChain trong MockMvc. |
| Browser dùng API/SQL thật | PASS cho 5 trang và luồng đọc chi tiết | Login qua UI, route/detail, không lỗi JS runtime hay API admin. Browser chuyển tiếp request từ base API hiện có tới backend riêng :8081, không thay response business. Test live chặn mọi business write. |
| Media | UNVERIFIED một phần | URL ảnh có sẵn `/photo-1596097635121-14b63b7a0c19` bị browser chặn ORB; một lần preview video `/videos/bua-sang-10-phut` không tải được. Đây là URL từ dữ liệu hiện có; không tự sửa database. |
| Git whitespace check | PASS | `git diff --check`; Dashboard/public Recipes không có diff. |

Full-suite lỗi chi tiết:

- `MealPlanServiceTest.generateFiltersAllergyRecipesPersistsBmiAndReturnsThreeMealsPerDay`: service trả 422 do danh sách recipe đủ điều kiện rỗng. Test stub `recipeRepository.findAll()` (dòng 87), nhưng service thực tế gọi `findByStatus("ACTIVE")` (dòng 87), nên mock trả danh sách rỗng. Không phải lỗi tích hợp admin.
- `MealPlanServiceTest.generateRejectsWhenAllRecipesMatchSavedAllergies`: `UnnecessaryStubbingException`, các stub tại dòng 127/147/148.
- Cả `MealPlanService.java` lẫn `MealPlanServiceTest.java` không được chỉnh sửa trong tác vụ này; không sửa lan sang nghiệp vụ meal plan để làm xanh suite.

### 8. Phần chưa thể xác minh

- Ghi CRUD/status vào SQL Server thật và persistence sau restart: chủ động không thực hiện tạo/xóa/sửa dữ liệu thật chỉ để test, theo yêu cầu. Đã kiểm thử mapping/refresh bằng fixture và security/validation/service bằng JUnit/MockMvc.
- Phát mọi video/ảnh từ các URL hiện có: phụ thuộc nguồn media; các URL lỗi được ghi phía trên.
- Rejection-reason persistence/notification và auto-filter: chưa có contract/schema được phê duyệt. Không tạo endpoint giả.

### 9. Vấn đề còn tồn tại và cách chạy lại

- Hai lỗi MealPlan test ngoài phạm vi, media nguồn lỗi và các chức năng chưa có nghiệp vụ/API nêu trên.
- File ảnh upload nhưng người dùng hủy form có thể trở thành file không được tham chiếu, giống cơ chế upload file local hiện có; không tự xóa file vì có thể đang được nội dung khác sử dụng.
- API base và CORS localhost có sẵn không được thay đổi cho deployment. Khi đổi domain/port cần cấu hình triển khai phù hợp.
- Cổng 8080 và 5173 đang được tiến trình khác sử dụng lúc kiểm thử. Tác vụ dùng backend riêng 8081 với `ddl-auto=none`, `sql.init.mode=never`, devtools restart tắt; preview build trên 5175. Không dừng tiến trình có sẵn.
- Sau kiểm thử đã dừng các process do tác vụ mở trên 8081/5175; xác nhận hai cổng đã đóng và tiến trình có sẵn trên 8080 vẫn chạy.

Lệnh kiểm tra frontend từ `Front_End`:

```powershell
npm.cmd run build
npm.cmd exec -- eslint src/App.jsx src/Pages/admin/AdminArticleManagement.jsx src/Pages/admin/AdminPostVideoPage.jsx src/Pages/admin/AdminUsers.jsx src/Pages/admin/AdminRecipeManagement.jsx src/services/adminContentServices.js src/hooks/useAdminResource.js src/components/admin/AdminRequestState.jsx
# Dùng Playwright/playwright-core đã cài ở máy; không cần thêm dependency dự án.
$env:PLAYWRIGHT_MODULE = '<duong-dan-playwright-core-da-co>'
$env:ADMIN_FRONTEND_URL = 'http://localhost:5175'
node tests/admin-api.browser.cjs
# Tùy chọn: live READ-ONLY, dùng tài khoản admin mẫu local từ file request hiện có.
$env:ADMIN_LIVE_API = 'http://localhost:8081'
$env:ADMIN_SAMPLE_REQUESTS_PATH = '..\Back_End\test-api.http'
node tests/admin-api.browser.cjs
```

Lệnh kiểm tra backend từ `Back_End`:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
.\mvnw.cmd -o '-Dmaven.repo.local=C:\Users\ASUS\.m2\repository' -DskipTests compile
.\mvnw.cmd -o '-Dmaven.repo.local=C:\Users\ASUS\.m2\repository' '-Dtest=AdminApiSecurityTest,AdminArticleIntegrationTest,AdminDashboardStatisticsServiceTest,AdminPostVideoServiceTest,AdminUserAuthorizationTest' test
```

## Đợt kiểm thử bổ sung — SQL Server riêng (2026-10-15)

### Phạm vi, cách ly và hiện trạng

- Giữ branch `update/api_admin`; không commit/push/pull/merge/reset/stash, không checkout. Đã đọc báo cáo, diff và các service/controller/repository/schema liên quan trước khi sửa.
- Snapshot SHA-256 các file có sẵn được lưu tại `Back_End/target/admin-verification/initial-hashes.json`. Không xóa file ban đầu; giữ nguyên `Front_End/vite.config.js`, cache, uploads và thay đổi chưa commit của đợt trước.
- CRUD chạy trên **database mới `ChayBook_AdminApi_IT_20261015_a25a517b`**, cùng SQL Server local nhưng tách khỏi database ứng dụng. Có 21 bảng từ schema có sẵn và migration status/category/recipe/comment, chỉ dùng tài khoản/dữ liệu tổng hợp. Không clone dữ liệu người dùng thật.
- `scripts/AdminTestDatabase.java` tạo tên ngẫu nhiên, từ chối tên đã tồn tại, chỉ chạy CREATE TABLE trong database mới; loại bỏ USE/DROP trong script rebuild gốc. Không chạy rebuild hoặc migration vào database hiện tại.
- Backend test chạy ở `8082`, `ddl-auto=none`, SQL init tắt. Working directory và uploads riêng: `Back_End/target/admin-verification/ChayBook_AdminApi_IT_20261015_a25a517b/`.
- Build trình duyệt riêng nằm trong `frontend-dist` dưới thư mục trên, gọi **trực tiếp** API `8082`, preview `5175`. CORS thật, cookie thật, multipart thật; không proxy/fulfill payload API và không mock response business trong test mới.
- Quyền ghi được chặn nếu manifest không có tên database test đúng mẫu, không phải localhost hoặc tài khoản đăng nhập không phải admin tổng hợp của manifest. Không gửi business write tới database ứng dụng hiện tại.
- Người dùng đã chọn **giữ dữ liệu media, sửa hiển thị lỗi**. Không cập nhật URL trong database hiện tại.

### Kết quả thực tế theo chức năng

PASS trong bảng này là HTTP server + SQL Server thật trên database test riêng, trừ khi ghi rõ “test cách ly”. Phân biệt với mock service tests trong Maven.

| Admin Page | Feature | API endpoint | FE / BE liên quan | Kết quả và bằng chứng |
|---|---|---|---|---|
| Dashboard | Users, interaction rate, messages, chart, contributors | GET `/api/admin/users/statistics`; `/api/admin/dashboard/statistics/{interaction-rate,ai-messages,interactions,top-contributors}` | `AdminDashboardPage.jsx`, `adminDashboardServices.js`; `AdminDashboardStatisticsController/Service/Repository` | **PASS thực tế**: tổng USER 14, messages 2, interaction rate 100%, chart 7/30 ngày có 3 interactions đúng seed SQL; UI đăng nhập và tải dữ liệu không lỗi runtime. Giữ nguyên implementation Dashboard. |
| Users | List/pagination/search | GET `/api/admin/users?page=0&size=10` | `AdminUsers.jsx`, `adminUserServices.js`; `AdminUserController/Service`, `UserRepository` | **PASS thực tế**: 14 USER, 2 trang, không trả tài khoản ADMIN. Browser tìm `it_member_16`, empty state với từ khóa không khớp. Search/filter vẫn áp dụng trên trang hiện tại như UI đã ghi. |
| Users | Block/unblock và refresh | PATCH `/api/admin/users/16/status` | Như trên | **PASS thực tế**: ACTIVE→DISABLED→ACTIVE; đọc lại sau reload/phiên đăng nhập mới đúng trạng thái. Tài khoản bị disable đăng nhập trả 403. Browser nhận thông báo thành công. |
| Users | Role/authorization | `/api/auth/login`, `/api/auth/me`; toàn bộ `/api/admin/**` | `AdminRoute.jsx`; `SecurityConfig`, các requireAdmin trong service/controller | **PASS thực tế**: ADMIN/USER từ login thật; anonymous admin GET 401, USER GET và business writes 403, sửa trạng thái ADMIN bị 403, status=`ADMIN` bị 400. Không có API đổi role và không bổ sung chức năng đổi role. |
| Users | Admin bị disable nhưng cookie còn hạn | GET 5 nhóm admin sau khi disable tài khoản test số 4 | Các requireActiveAdmin hiện có | **PASS thực tế**: login admin test, giữ cookie, đổi trạng thái đúng tài khoản tổng hợp trong database test, cả 5 nhóm trả 403, sau đó phục hồi ACTIVE. Không đổi tài khoản thật. |
| Articles | Create/read/update/delete | POST/GET `/api/admin/articles`; GET/PUT/DELETE `/{id}` | `AdminArticleManagement.jsx`, `adminContentServices.js`; `AdminArticleController/Service/Repository` | **PASS thực tế**: POST 201 + Location; GET/PUT 200; DELETE 204, GET sau delete 404. Tiếng Việt round-trip đúng. Browser tạo/sửa/xóa và reload sau mỗi ghi. Không dùng ID/author giả. |
| Articles | Upload và public read | POST `/api/admin/articles/images`; GET `/api/article-images/{uuid}.png` | `ArticleForm`; `AdminArticleImageController/Service` | **PASS thực tế**: upload 201, file nằm đúng uploads riêng; ảnh hiển thị trong browser, naturalWidth > 0; anonymous GET 200 đúng bytes/MIME `image/png`, `nosniff`. USER upload 403; SVG giả ảnh 400; >5 MB trả 413. |
| Articles | Sort/filter/validation/loading/empty | GET `?sort=newest|oldest`, `q`, `status`, `categoryId` | List page; `AdminArticleServiceImpl` | **PASS HTTP thực tế**: newest/oldest đúng dữ liệu SQL và phân trang, filter có 1 kết quả đúng; sort lạ/blank title trả 400. Browser kiểm tra required, loading với request thật được trì hoãn, empty từ query thật. |
| Recipes | CRUD và ingredient sync | POST/GET `/api/admin/recipes`; GET/PUT/DELETE `/{id}` | `AdminRecipeManagement.jsx`; `AdminRecipeController/Service`, `RecipeRepository`, `RecipeIngredientRepository` | **PASS thực tế**: tạo 201; sửa 200 và đồng bộ ingredient từ 2 dòng còn đúng 1 dòng, quantity mới 75; delete 200 và status DELETED còn trong admin, public detail 404; edit DELETED trả 409. Browser CRUD và reload đúng dữ liệu. |
| Recipes | Search/pagination/validation | GET `?keyword=IT%20Recipe&page=1&size=10`; POST invalid body | Như trên, `RecipeWriteRequest` | **PASS thực tế**: 12 recipe, trang 2 có 2 dòng. Negative prep time và trùng ingredient trả 400, ingredient không tồn tại 404, dữ liệu không bị lưu sau request lỗi. Browser Next/search/empty đúng. |
| Post & Video | List/detail/full content | GET `/api/admin/posts-videos`; GET `/{type}/{id}` | `AdminPostVideoPage.jsx`; `AdminPostVideoController/Service/Repository` | **PASS thực tế**: nội dung tiếng Việt >500 ký tự không bị cắt; list/detail đúng type + ID, ảnh/video tải từ storage test, WebM phát được trong browser, HTTP media 206. |
| Post & Video | Approve/reject/remove/validation | PATCH `/{type}/{id}/status` | Như trên | **PASS thực tế**: approve/reject/remove 204, reload/phiên mới giữ trạng thái; VIDEO và POST cùng ID không lẫn; lặp transition sai 409, invalid status/type 400, missing ID 404; REMOVED không có trong list/statistics/detail. Browser approve/reject và reload. |
| Admin UI | Error/retry và route guard | GET recipes với cookie USER, rồi retry với cookie ADMIN | `AdminRequestState.jsx`, `useAdminResource.js`, `AdminRoute.jsx` | **PASS thực tế**: backend trả 403 thật → UI alert; đăng nhập lại admin và Retry hồi phục. Reload với USER bị chuyển về `/`; anonymous chuyển `/login`. |
| User regression | Public list/detail contract và Recipes UI | GET `/api/recipes?page=0|1&size=10`, `/recipes/{id}`, `/articles`, `/articles/{id}`, authenticated `/posts` | User Pages/public services giữ nguyên | **PASS thực tế**: public recipes dùng nguyên `content/number`, 10+2 dòng; deleted recipe không lọt ra public; published articles/feed đọc được. Browser USER kiểm tra Recipes trang 1/2 và detail. Không suy rộng thành PASS mọi User Page chưa chạy. |

### Media: lỗi nguồn dữ liệu và phần đã sửa

Đã kiểm tra HTTP trực tiếp các URL có sẵn, đều trả **404, Content-Type HTML**:

| URL hiện có | Chẩn đoán | Xử lý |
|---|---|---|
| `https://example.com/videos/bua-sang-10-phut` | URL mẫu, không phải video | Giữ dữ liệu theo lựa chọn người dùng; UI thông báo không phát được, có link mở nguồn. |
| `https://example.com/videos/canh-bi-do` | Như trên | Như trên. |
| `https://example.com/videos/salad-rau-cu` | Như trên | Như trên. |
| `https://images.unsplash.com/photo-1596097635121-14b63b7a0c19` | Ảnh nguồn không tồn tại; HTML trả về có thể bị ORB chặn | Giữ URL; fallback ảnh. Không thay bằng hình khác không đúng nội dung. |

- `RecipeImage` trong **Admin Recipes** giờ có placeholder “Image unavailable”/“No image”, và tự thử lại đúng khi URL đổi; không sửa component ảnh phía User.
- `VideoPreview` hiển thị thông báo khi URL không có hoặc không hợp lệ, giữ liên kết mở nguồn nếu có URL. Detail VIDEO không còn im lặng hiển thị thumbnail thay cho thông báo video thiếu.
- Test ảnh bị lỗi dùng request **404 thật** từ storage test. Test lỗi video thay tạm bytes của **file WebM tổng hợp trong thư mục test riêng**, nhận lỗi decoder thật, xác nhận fallback, rồi phục hồi file. Không thay video hoặc ảnh hiện có của người dùng.
- Test video hợp lệ tạo WebM riêng bằng MediaRecorder, tải qua backend resource handler và xác nhận `videoWidth > 0`, `play()` thành công. Đây là kiểm thử storage/playback thật, không phải dùng URL demo để nhận PASS.

### Đính chính khả năng lưu lý do từ chối và auto-filter

- Báo cáo trước chỉ kiểm tra POST/VIDEO không có cột reason; kết luận cần schema mới là chưa đủ. **Schema và database hiện tại đều có `AI_MODERATION.reason`, `result`, `reviewed_by`, `reviewed_at`, `post_id`, `video_id`; entity `moderation/entity/AiModeration.java` cũng có mapping.** Seed SQL còn có ví dụ reviewed_by cho bản ghi moderation.
- Có thể tái sử dụng bảng này, nhưng chưa có repository/service/controller cung cấp lịch sử duyệt hoặc contract phân biệt AI và quyết định thủ công; chưa thống nhất required reason, lịch sử nhiều lần duyệt, lý do hiện tại và thông báo tới tác giả. Đợt này chỉ xác định khả năng, **không tự triển khai nghiệp vụ mới**.
- Auto-filter chưa có API/configuration schema/rule execution đã được xác định. Các quy tắc minh họa trên UI không được coi là chức năng hoạt động. **NOT IMPLEMENTED**, không nhận PASS.
- Không thêm cột hoặc migration production; không thêm endpoint giả để báo hoàn thành.

### Build/test, loại bằng chứng và artifacts

| Kiểm tra | Kết quả mới | Loại bằng chứng |
|---|---|---|
| Frontend default build | PASS, 1972 modules; cảnh báo chunk >500 kB còn tồn tại | `npm.cmd run build`; default API base vẫn `http://localhost:8080/api`. |
| Frontend isolated build | PASS | `VITE_API_BASE_URL=http://localhost:8082/api`; output trong thư mục test riêng, không sửa `vite.config.js`. |
| ESLint production files liên quan | PASS | 9 file: App, 4 admin pages, `app.js`, admin service, hook, request-state. |
| Backend compile | PASS | Maven Wrapper/JDK 21, 176 source files, test compile 7 source files. |
| Admin JUnit/MockMvc | **27 PASS** | 6 Security/MVC/CORS + 3 Articles/image + 6 Dashboard + 10 moderation + 2 Users. Đây là test cách ly với mocked services/repositories, không thay thế kết quả SQL thực tế. |
| Full Maven suite | **36 tests, 34 PASS, 2 ERROR** | `mvnw test` trả failure do 2 MealPlan tests có sẵn; không báo toàn bộ suite PASS. Allergy 6/6 và MealPlan 1/3 qua. |
| HTTP API + SQL Server riêng | **8 nhóm PASS thực tế**, chạy 7 nhóm CRUD/regression rồi 1 nhóm stale-cookie | `scripts/admin_sql_api_test.py`; tài khoản tổng hợp thật, Spring Security thật, response SQL thật, không intercept/mock. |
| Browser + SQL Server riêng | **8 nhóm PASS thực tế** | `tests/admin-sql.browser.cjs`: **112 HTTP responses, 11 business writes**, CRUD/auth/refresh/media/error/empty/User Recipes regression. Không sửa payload API/CORS trong harness mới. |
| Persistence qua phiên mới / restart backend test | PASS | GET recipe 13 = DELETED, POST 1 = REJECTED sau backend restart; recipe 14 từ browser = DELETED trong phiên mới. |
| Syntax / whitespace | PASS | Node `--check`, Python compile, `git diff --check`. |
| Bảo toàn code | PASS | Vite local, User Pages, public recipe services, Dashboard và 2 file MealPlan không đổi; không xóa file ban đầu. |

Artifacts nằm dưới `Back_End/target/admin-verification/ChayBook_AdminApi_IT_20261015_a25a517b/` (được gitignore bởi target):

- `browser-results.json`: 8 nhóm qua và từng method/endpoint/status thực tế; không lưu request body hoặc cookie/token.
- `http-receipts*.json`, `persistence-receipts.json`: HTTP evidence; lượt HTTP đầu có log test 7/7, lượt stale-cookie 1/1. Mỗi lần chạy mới tạo receipt file riêng để không ghi đè bằng chứng.
- `test-manifest.json`: tên DB, URL test và credential **tổng hợp**, không đưa vào Git hoặc báo cáo công khai.
- `uploads/`, `frontend-dist/`: media test và build kiểm thử riêng. Database test được giữ để xem xét; không tự drop hoặc xóa dữ liệu hiện có.

### Phân tích hai lỗi MealPlan — không sửa ngoài phạm vi

Cả hai lỗi được tái hiện trong lượt full suite mới nhất:

1. Test thành công stub `recipeRepository.findAll()` tại `MealPlanServiceTest.java:87`, nhưng `MealPlanService.java:87` gọi `findByStatus("ACTIVE")`. Mockito trả danh sách rỗng cho lời gọi chưa stub, service trả 422 tại dòng 92, nên test fail tại dòng 89.
2. Test “all recipes match allergies” cũng stub sai `findAll()` tại dòng 127. Vì danh sách thực tế từ mock rỗng nên helper stubs ID/calories tại 147/148 và stub findAll không được sử dụng; strict Mockito báo `UnnecessaryStubbingException`.

Đề xuất khi mở phạm vi sửa test MealPlan: cập nhật hai stub sang `findByStatus("ACTIVE")`, kiểm tra lại assertions rồi chạy riêng test. Không thay service để gọi findAll vì có thể đưa recipe DELETED vào meal plan. **Không sửa hai file MealPlan trong đợt này**.

### File thêm/sửa riêng trong đợt bổ sung

1. `Back_End/scripts/AdminTestDatabase.java` — tạo database SQL test riêng từ schema hiện có; thao tác fixture admin chỉ nhắm database này.
2. `Back_End/scripts/admin_sql_api_test.py` — kiểm thử HTTP CRUD/ACL/validation/regression thật, guard target và lưu receipts.
3. `Front_End/tests/admin-sql.browser.cjs` — browser thật, native multipart/CORS, refresh, media và User regression.
4. `Front_End/src/Pages/admin/AdminRecipeManagement.jsx` — fallback ảnh lỗi/thiếu và thử lại khi đổi URL.
5. `Front_End/src/Pages/admin/AdminPostVideoPage.jsx` — fallback video thiếu URL.
6. `Front_End/src/services/app.js` — API base nhận `VITE_API_BASE_URL`, bỏ slash cuối; **default giữ nguyên**.
7. `Back_End/src/main/java/com/chaybook/backend/config/CorsConfig.java` — `app.cors.allowed-origins` có thể cấu hình; **default localhost:5173 giữ nguyên**.
8. `Back_End/src/test/java/com/chaybook/backend/admin/AdminApiSecurityTest.java` — kiểm tra CORS default/credentials và origin không được phép.
9. `docs/admin-api-audit.md` — kết quả mới và đính chính moderation schema.

Không triển khai lại CRUD đã hoàn thành. Không cài dependency mới. `Front_End/vite.config.js` vẫn là thay đổi cục bộ ban đầu, không thuộc đợt này.

### Chạy lại an toàn

Mỗi lượt đầy đủ cần tạo **database test mới**; assertions HTTP dùng số lượng/trạng thái seed ban đầu. Không trỏ test ghi vào database ứng dụng hoặc tái dùng dữ liệu thật.

1. Từ `Back_End`, chạy `scripts/AdminTestDatabase.java` bằng JDK 21 với JDBC và spring-security-crypto jars có sẵn trong Maven cache. Script tạo DB riêng, manifest dưới target, không in password.
2. Đọc `latest-test-db.txt` và manifest; đặt `SPRING_DATASOURCE_URL` = URL test, `SERVER_PORT=8082`, `APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5175`, `SPRING_JPA_HIBERNATE_DDL_AUTO=none`, `SPRING_SQL_INIT_MODE=never`. Chạy Maven `spring-boot:run` với `-Dspring-boot.run.workingDirectory=<runDirectory>` và tắt devtools restart.
3. Từ `Back_End`: `python scripts/admin_sql_api_test.py`. Để chạy cả stale-cookie test, đặt `ADMIN_TEST_JAVA` = Java 21 và `ADMIN_TEST_CLASSPATH` = JDBC + crypto jars. Script chỉ sửa tài khoản admin fixture số 4 trong DB test rồi phục hồi.
4. Từ `Front_End`, build với `VITE_API_BASE_URL=<manifest.api>/api`, `--outDir <runDirectory>/frontend-dist`; preview thư mục đó trên localhost:5175. Không đổi cấu hình Vite cục bộ.
5. Đặt `ADMIN_TEST_MANIFEST=<path-to-test-manifest.json>`, `PLAYWRIGHT_MODULE=<Playwright/playwright-core đã có>`; chạy `node tests/admin-sql.browser.cjs`. Harness chặn gọi nhầm base 8080 và không giả dữ liệu API.

### Phần còn tồn tại / chưa kiểm chứng

- Hai lỗi test MealPlan nêu trên vẫn còn; full suite chưa xanh.
- 4 URL media hiện có vẫn 404 theo lựa chọn người dùng; **fallback đã PASS, nguồn media không được coi là đã sửa**.
- Lưu lý do/histories/notification và auto-filter chưa có contract được duyệt; không tự thực hiện.
- Không ghi/xóa dữ liệu database ứng dụng thật. PASS CRUD áp dụng cho cùng code và schema trên **SQL Server test riêng**, không phải xác nhận thao tác ghi production.
- User regression thực tế giới hạn ở Recipes list/detail/pagination, Article read và approved post feed; các trang User khác không đổi nhưng chưa chạy đầy đủ mọi thao tác.
- Đã dừng hai process test do tác vụ mở trên **8082/5175** sau khi lưu bằng chứng; database test và artifacts được giữ. Không dừng process ứng dụng có sẵn trên 8080.

## Verification 2026-10-15: MealPlan tests

### Thay đổi tối thiểu và nguyên nhân đã xác nhận

- Đã đọc báo cáo và kiểm tra Git trước khi sửa. Branch vẫn `update/api_admin`; giữ toàn bộ thay đổi chưa commit có sẵn.
- `MealPlanService.generate` tại `Back_End/src/main/java/com/chaybook/backend/mealplan/service/MealPlanService.java:87` đang gọi `recipeRepository.findByStatus("ACTIVE")`, đúng method đã có trong `RecipeRepository`.
- Hai test tại `Back_End/src/test/java/com/chaybook/backend/mealplan/service/MealPlanServiceTest.java:87,127` lại stub `findAll()`. Test tạo meal plan nhận danh sách mock rỗng rồi trả 422; test tất cả recipe gây dị ứng đi qua nhánh danh sách rỗng và phát sinh `UnnecessaryStubbingException` vì các stub không được dùng.
- Chỉ đổi **hai dòng stub** sang `findByStatus("ACTIVE")`. Giữ nguyên assertions, strict Mockito và fixtures. Không sửa business logic, service hoặc repository; không đưa recipe DELETED vào meal plan.
- Sau sửa, test tạo plan kiểm tra đủ 9 meals/3 ngày, chỉ dùng recipe an toàn và lưu BMI; test dị ứng kiểm tra 422 và không lưu plan; test thiếu BMI giữ nguyên kiểm tra 409.

### Kết quả chạy lại

| Kiểm tra | Kết quả | Bằng chứng / giới hạn |
|---|---|---|
| Toàn bộ Maven tests | **36/36 PASS**, 0 failure, 0 error, 0 skipped; BUILD SUCCESS | JDK 21, Maven Wrapper offline với cache có sẵn. Đây là tests cách ly, không kết nối SQL Server. |
| MealPlan | **3/3 PASS** | `target/surefire-reports/TEST-com.chaybook.backend.mealplan.service.MealPlanServiceTest.xml`. |
| Admin tests | **27/27 PASS** | Security/MVC/CORS 6; Articles/image 3; Dashboard 6; Post & Video 10; Users authorization 2. Service/repository mocks, image files dùng JUnit `@TempDir`. |
| Allergy | **6/6 PASS** | Surefire XML và text report tương ứng. |
| Frontend build | **PASS** | `npm.cmd run build`: 1972 modules; cảnh báo chunk JS >500 kB còn tồn tại, không làm build fail. |
| ESLint 9 file integration | **PASS**, không warning | App, 4 admin pages, `services/app.js`, `adminContentServices.js`, `useAdminResource.js`, `AdminRequestState.jsx`. |
| ESLint toàn `src` | **PASS với 2 warnings**, 0 error, exit 0 | `CommunityPage.jsx:94,164`, `react-hooks/exhaustive-deps`; file User có sẵn, không sửa trong lần này. Report: `target/admin-verification/eslint-source-current.json`. |
| `npm.cmd run lint` (`eslint .`) | **FAIL**, 726 errors + 2 warnings, exit 1 | Toàn bộ 726 errors nằm trong generated dependencies của `.vite-cache-fixed/deps` và `.vite-cache-new/deps` (363 mỗi thư mục). Hai warnings thuộc CommunityPage như trên. ESLint config hiện chỉ ignore `dist`, nên quét cả cache. Report: `target/admin-verification/eslint-full-current.json`. Không sửa generated code, cache hoặc config để che kết quả. |
| Whitespace | **PASS** | `git diff --check`; kiểm tra lại sau cập nhật báo cáo. |
| Bảo toàn phạm vi | **PASS** | Đối chiếu SHA-256 295 file tracked/untracked thuộc source, scripts, tests, uploads, Vite config và docs trước/sau; chỉ test MealPlan và báo cáo này thay đổi. Không xóa file. |

Lệnh Maven thực tế, chạy từ `Back_End`:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
.\mvnw.cmd -o '-Dmaven.repo.local=C:\Users\ASUS\.m2\repository' test
```

Lệnh frontend thực tế, chạy từ `Front_End`:

```powershell
npm.cmd run build
npm.cmd exec -- eslint src/App.jsx src/Pages/admin/AdminArticleManagement.jsx src/Pages/admin/AdminPostVideoPage.jsx src/Pages/admin/AdminUsers.jsx src/Pages/admin/AdminRecipeManagement.jsx src/services/app.js src/services/adminContentServices.js src/hooks/useAdminResource.js src/components/admin/AdminRequestState.jsx
npm.cmd exec -- eslint src --format json --output-file ../Back_End/target/admin-verification/eslint-source-current.json
npm.cmd run lint -- --format json --output-file ../Back_End/target/admin-verification/eslint-full-current.json
```

Không chạy lại harness HTTP/browser hoặc script tạo database trong đợt này. Kết quả CRUD/SQL/browser phía trên là bằng chứng đợt trước, không phải được tái chạy bởi Maven.

### Phân loại file mới / artifacts

Các đường dẫn sau là tương đối từ repository root. **Chỉ phân loại, chưa xóa bất kỳ file hay database nào.** Untracked không đồng nghĩa với file tạm.

**1. Source code cần giữ**

- `Back_End/src/main/java/com/chaybook/backend/admin/article/controller/AdminArticleImageController.java`.
- `Back_End/src/main/java/com/chaybook/backend/admin/article/service/AdminArticleImageService.java`.
- `Front_End/src/Pages/admin/AdminRecipeManagement.jsx`.
- `Front_End/src/components/admin/AdminRequestState.jsx`.
- `Front_End/src/hooks/useAdminResource.js`.
- `Front_End/src/services/adminContentServices.js`.

**2. Test tự động / công cụ fixture hữu ích cần giữ**

- `Back_End/src/test/java/com/chaybook/backend/admin/AdminApiSecurityTest.java`.
- `Back_End/src/test/java/com/chaybook/backend/admin/article/service/AdminArticleIntegrationTest.java`.
- `Back_End/src/test/java/com/chaybook/backend/admin/post/service/AdminPostVideoServiceTest.java`.
- `Back_End/src/test/java/com/chaybook/backend/admin/user/service/AdminUserAuthorizationTest.java`.
- `Back_End/scripts/AdminTestDatabase.java` và `admin_sql_api_test.py`: fixture/test SQL riêng, không phải file dữ liệu thừa. Chỉ chạy khi đích database test đã được kiểm tra.
- `Front_End/tests/admin-sql.browser.cjs`: kiểm thử browser/HTTP/SQL thật trên fixture riêng.
- `Front_End/tests/admin-api.browser.cjs`: kiểm thử UI bằng fixtures và chế độ đọc API; giữ để kiểm tra contract, không dùng fixture PASS làm bằng chứng API/SQL thật.
- `MealPlanServiceTest.java` là test tracked có sẵn được sửa hai stub, cần giữ.

**3. Báo cáo / bằng chứng cần giữ**

- `docs/admin-api-audit.md`: kết quả, phạm vi và giới hạn từng đợt.
- `Back_End/target/surefire-reports/TEST-*.xml` và `*.txt`: bằng chứng lượt Maven mới nhất; thư mục ignored, có thể lưu trữ trước khi dọn output build.
- `Back_End/target/admin-verification/{initial-hashes.json,current-media-urls.txt,eslint-source-current.json,eslint-full-current.json}`: snapshot, media evidence và lint reports; giữ local để đối chiếu.
- Trong `Back_End/target/admin-verification/ChayBook_AdminApi_IT_20261015_a25a517b/`: `browser-results.json`, `http-receipts.json`, `persistence-receipts.json` lưu bằng chứng đợt SQL trước.
- `test-manifest.json` và `latest-test-db.txt` là metadata fixture cần giữ khi còn dùng database test; manifest chứa credentials tổng hợp, không đưa vào Git hoặc công khai.

**4. Output/cache/dữ liệu test có thể dọn sau khi kiểm tra điều kiện**

| Đường dẫn | Nguồn gốc đã kiểm tra | Điều kiện dọn an toàn |
|---|---|---|
| `Front_End/dist/` | Build Vite, ignored; vừa được build lại | Output có thể tạo lại; chỉ dọn khi không dùng để preview/deploy. |
| `Back_End/target/classes/`, `test-classes/`, `generated-sources/`, `generated-test-sources/`, `maven-status/` nếu tồn tại | Output Maven, ignored | Có thể biên dịch lại; không dọn khi backend/test đang sử dụng. Không xóa toàn bộ target vì có bằng chứng và fixture cần giữ. |
| `Front_End/.vite-cache-fixed/`, `.vite-cache-new/` | Mỗi thư mục 23 file dependencies Vite sinh tự động, có `deps/package.json` | Có thể tạo lại; `.vite-cache-fixed` đang được cấu hình bởi `vite.config.js`, `.vite-cache-new` có file đang mở trong IDE. Dừng Vite/preview liên quan và xác nhận không có process dùng trước khi dọn; chưa xóa. |
| `Back_End/target/admin-verification/DatabaseProbe.java` | Probe JDBC đọc dữ liệu của đợt audit trước, không phải source build | Có thể dọn sau khi không cần tái chẩn đoán; giữ kết quả media evidence riêng. |
| `<test-run>/frontend-dist/`, `<test-run>/uploads/` | `<test-run>` là thư mục database test riêng nêu trên; fixture PNG/WebM và ảnh upload tổng hợp do harness tạo | Đã xác định là dữ liệu test; chỉ dọn sau khi lưu receipts và không cần tái kiểm thử media/persistence. Không nhầm với `Back_End/uploads/` của ứng dụng. |

**Các file chưa đủ cơ sở xóa:** `Back_End/uploads/articles/8d4b800b-ef60-45bd-b71c-19d05866073f.png` và `Back_End/uploads/posts/c9749b08-b777-4ff6-bb73-9391183e035a.png` nằm trong storage ứng dụng, ngoài fixture riêng. Chưa xác nhận không còn bản ghi tham chiếu; phải giữ. Không gọi chúng là dữ liệu test chỉ vì Git báo untracked.

Database `ChayBook_AdminApi_IT_20261015_a25a517b` vẫn được giữ. Lần này không kết nối database để xác minh lại; không tự drop. Việc dọn database là thao tác riêng, cần xác nhận đúng database/fixture, không còn kết nối hoặc dữ liệu cần giữ và được người dùng cho phép.

### Phần chưa hoàn thiện và khả năng tiếp tục

- **Có thể tiếp tục phát triển trên `update/api_admin`**: backend suite đã xanh 36/36 và frontend build thành công. Branch còn nhiều thay đổi chưa commit đã có từ đợt trước; không thực hiện thao tác Git làm thay đổi branch/history/index.
- Lệnh lint toàn repository chưa xanh vì cache bị quét. Khi xử lý lint config, có thể giới hạn vào source hoặc ignore hai thư mục cache; không sửa nội dung generated dependencies. Hai warnings CommunityPage vẫn còn, ngoài phạm vi sửa User Pages.
- Lý do từ chối/lịch sử/notification và auto-filter vẫn chưa được triển khai theo contract thống nhất; bảng `AI_MODERATION` có khả năng tái sử dụng như phân tích trước. Users không có API đổi role; chưa bổ sung nghiệp vụ này.
- Bốn URL media nguồn vẫn lỗi theo lựa chọn giữ dữ liệu của người dùng; fallback đã kiểm chứng đợt trước. Không cập nhật URL.
- Chưa kiểm thử toàn bộ mọi thao tác User Pages; regression thực tế trước đây giới hạn ở Recipes/Articles/feed như bảng trên. Lần này không suy rộng Maven PASS thành PASS live API hoặc tất cả User Pages.
- Chỉ sửa hai file trong đợt này: `Back_End/src/test/java/com/chaybook/backend/mealplan/service/MealPlanServiceTest.java` và `docs/admin-api-audit.md`; thêm hai JSON lint report trong `target` ignored. Giữ nguyên Vite config, User Pages, uploads và dữ liệu/database hiện tại. Không commit, push, pull, merge, reset, stash, discard hoặc xóa file/database.

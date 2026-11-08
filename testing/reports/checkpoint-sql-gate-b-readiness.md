# SQL Gate B — COMPLETE; Gate C đang xử lý (2026-11-06)

**Hiện hành:** Batch01 PASS, Batch02 PASS và Batch03 PASS với **124/124 effective-permission checks**; Gate B COMPLETE. Evidence Batch03: `testing/reports/evidence/sql-gate-b/batch03-s3g4_e59a50913259.json`. Gate C state/evidence mới nằm tại `testing/reports/checkpoint-gate-c.md`; không chạy lại Batch01–03 hoặc kiểm tra Gate B đã đạt.

**Nguyên nhân SQL51000 đã xác minh:** [batch02-token-values-s3g4_e59a50913259.json](evidence/sql-gate-b/batch02-token-values-s3g4_e59a50913259.json), `2026-11-06T13:25:46.1614536+00:00`, SHA256 `a67eeb6994d203019c561b2cebe1d36b4d5f5f9a9e32549ddeebbabbb188b75c`. Chỉ đọc scalar của guard lỗi dưới đúng schema user: USER_NAME/schema role/required grants đều đúng; db_owner/db_ddladmin/db_securityadmin/db_accessadmin và forbidden rights đều0. Riêng HAS_PERMS_BY_NAME(DATABASE, IMPERSONATE ANY USER) trả **NULL**, tên permission này có **0** entry trong fn_builtin_permissions(DATABASE). Guard ISNULL(NULL,1) từ chối đúng theo code nhưng tên permission sai. USER::dbo/app IMPERSONATE thực tế đều0. Đây là giá trị của lỗi chưa từng được thu, không thu lại OS/Admin/ETW/TCP hoặc11 nhóm metadata đã PASS. TCP khôi phục theo operator, không tự restart/check service.

**Fix tối thiểu:** thay đúng predicate không hợp lệ bằng EXISTS kiểm tra HAS_PERMS_BY_NAME(p.name,USER,IMPERSONATE) trên mọi user khác có thể impersonate, bỏ qua chính schema user và hai metadata principals không phải target impersonation. NULL vẫn fail closed; không cấp quyền, không bỏ guard hoặc đổi mô hình bảo mật. Đồng bộ generator, repin runner; evidence output dùng tên mới. Static chứng minh nếu khôi phục duy nhất predicate cũ thì SHA256 đúng bản `799c4b8b…`, nên toàn bộ SQL còn lại (guards/NO REVERT/V001–V006/transaction/rollback/history) giữ nguyên; generator AST và predicate parity PASS. Không chạy generator hoặc test đã PASS.

**Batch02 thực thi thành công đúng một lần sau fix:** [batch02-tokenfixed-s3g4_e59a50913259.json](evidence/sql-gate-b/batch02-tokenfixed-s3g4_e59a50913259.json), bắt đầu `2026-11-06T13:27:20.3851179+00:00`, kết thúc `13:27:21.0357472+00:00`, SHA256 `f0eb40d5bddad361edc42e5da09696ac67d4faed1a2052707f26972ea3624ff9`; Batch02 artifact `fe8785b0f43c3740aaa73a94fb035f7001002d6b6e5e33e0a83243eddd6dc150`.1 connection/1 ad hoc command,0 RPC parameters, NO REVERT/schema user cô lập giữ nguyên; ExecuteNonQuery trả về sau COMMIT,0 SQL errors. **Postconditions có sẵn trong batch chạy một lần trước COMMIT:23 domain tables rỗng/25 total tables/6 exact source-history hashes PASS**. Không query kiểm chứng trùng sau commit; không seed, không cleanup rollback cần thiết, connection đã dispose. Không chạy Batch03 hay Gate C trước phê duyệt/điều kiện còn thiếu.

**Phạm vi Batch03 xin phê duyệt duy nhất tiếp theo:** chạy nguyên `03-app-permissions.sql` đã review trên CHAYBOOK_TEST / ChayBook_Test / run s3g4_e59a50913259, operator Windows/kết nối mới. Dưới transaction/exclusive lock: GRANT SELECT/INSERT/UPDATE/DELETE trên từng23 bảng nghiệp vụ cho chaybook_test_app_dml; GRANT SELECT-only trên2 control tables; DENY control writes/ALTER/REFERENCES/TAKE OWNERSHIP, schema ALTER/TAKE OWNERSHIP và app schema/security DDL; DENY IMPERSONATE schema user; thêm chaybook_test_login vào app role. Không login/account/password/schema/config changes; không broad database role. Lỗi trước commit rollback; timeout/disconnect không tự retry. Sau commit kiểm tra effective app DML/forbidden DDL/security/control-write/impersonation một lần bằng principal app trong connection dùng riêng, lưu evidence, đóng connection; kết hợp01/02 evidence để nghiệm thu Gate B. Không coi GRANT chạy thành công là đủ nếu effective-permission postconditions chưa đạt. Batch03 vẫn chưa được phê duyệt hoặc thực thi.

Files đổi: Batch02 predicate, invoke-batch02.ps1 pin/evidence path, generator predicate, README/manifest/checkpoint; thêm2 evidence thật bên trên, giữ nguyên mọi evidence thất bại cũ. Không production/API/source schema changes, không testcase deletion/status fabrication, không stage/commit/push. **Dừng tại điểm cần user phê duyệt Batch03**; sau PASS và Gate B acceptance sẽ tiếp tục Gate C theo checkpoint, không xin lại quyền chạy các test đã được user cho phép.

## TCP timeout trước khi operator khôi phục kết nối (lịch sử)

**Hiện hành: BLOCKED môi trường kết nối; Gate B PARTIAL, Gate C NOT STARTED.** Batch01 PASS kế thừa; Batch02 vẫn là FAIL_SQL51000 lần trước, chưa chạy lại; Batch03 NOT RUN/chưa được duyệt. User fast-track yêu cầu xác minh predicate thực tế trước khi sửa guard, không bỏ guard hoặc nới quyền.

Đã thử **đúng một lần** mở Windows Integrated connection tới tcp127.0.0.1:15433/ChayBook_Test để đọc các scalar predicate của guard đang lỗi, không thu lại11 nhóm metadata cũ hay OS/Admin/ETW/TCP diagnostic. `SqlConnection.Open()` thất bại TCP Provider timeout trước mọi câu SQL: **0 connections opened,0 SQL commands,0 predicate rows**. Không có DDL/DCL/migration hoặc password input. Không thử instance/endpoint khác, không đổi service/firewall/config và không retry.

Evidence thực tế: [batch02-token-predicates-s3g4_e59a50913259.json](evidence/sql-gate-b/batch02-token-predicates-s3g4_e59a50913259.json), bắt đầu `2026-11-06T13:21:38.5131582+00:00`, kết thúc `13:21:43.9414451+00:00`; status UNKNOWN, lý do tại Open là network/instance-specific TCP timeout. Đây **không phải** kết quả predicate rỗng/PASS, không chứng minh service đã dừng, sai quyền hay quyền schema rộng. Predicate SQL51000 cụ thể vẫn chưa xác định; không sửa guard khi chưa có bằng chứng.

Chỉ thêm evidence lần kết nối thực tế và cập nhật manifest/checkpoint; giữ nguyên SQL/runtime evidence cũ và mọi testcase. **Một bước cần operator:** khôi phục khả năng kết nối đúng CHAYBOOK_TEST tại127.0.0.1:15433. Sau đó tiếp tục đúng phép đọc predicate chưa chạy, sửa tối thiểu nếu chứng minh được và thực thi Batch02 trong quyền đã duyệt. Batch03 vẫn phải xin phê duyệt riêng; Gate C chỉ tiếp tục sau Gate B đủ evidence, không tuyên bố COMPLETE khi endpoint chưa kết nối được.

## Lỗi guard SQL51000 trước lần kết nối hôm nay (kế thừa)

**Hiện hành: Batch01 PASS kế thừa; Batch02 FAIL_SQL51000; Batch03 NOT RUN; Gate B PARTIAL/BLOCKED.** User đã cho phép sửa riêng cú pháp/ngữ cảnh SQL15590 và tiếp tục Batch02, không cần xin duyệt lại trong cùng phạm vi. Đã thực thi một lần sau sửa; theo yêu cầu gặp lỗi mới thì dừng, không retry hoặc đổi quyền/guard.

**Fix thực tế:** vị trí NO REVERT vẫn ở context switch trước migration. Không bỏ hoặc đổi EXECUTE AS USER WITH NO REVERT. Thêm `invoke-batch02.ps1` dùng CommandType.Text với **0 parameters**, không Prepare/wrapper RPC; khai báo đầu SQL batch duy nhất RunId literal cố định không secret, không nội suy input. Đây là sửa ngữ cảnh truyền lệnh, không thay mô hình quyền. Batch02 chỉ đổi2 dòng comment hướng dẫn; toàn bộ executable SQL body, isolation/target/run guards, permissions, transaction/rollback và V001–V006 giữ nguyên bytes. Đồng bộ comment header của generator và hướng dẫn README; không chạy generator.

**Static phần mới: PASS** — PowerShell AST/constant RunId/zero-parameter Text/no Prepare/nonpooling/dispose; Python generator AST; khôi phục comment cũ cho hash đúng bản đã duyệt `23726f11…` chứng minh không sửa SQL body. Artifact Batch02 sau đổi comment SHA256 `799c4b8b1c012fde33f3d6080e20c8084c16c4091b2e020f54c992bbb6f4e74d`, runner pin đúng hash này. Không lặp static/source audit cũ.

**Evidence thực thi mới:** [batch02-adhoc-s3g4_e59a50913259.json](evidence/sql-gate-b/batch02-adhoc-s3g4_e59a50913259.json), `2026-11-05T16:04:19.8879811+00:00` → `16:04:20.3098638+00:00`, SHA256 `7ff662af534815f012f97259b39c41069a5b90e51d462a542ac7fc3cd7fc4fd3`.1 connection,1 batch command;0 password/OS/Admin/ETW/TCP/metadata rechecks, không chạy Batch01/03. SQL15590 không còn xuất hiện; execution đến guard sau context switch.

**Lỗi mới chính xác: SQL51000/class16/state1/line68 của command có1 dòng khai báo RunId phía trước:** `DDL requires the restricted database schema token, never the operator/app token`. Guard ở sau EXECUTE AS và trước BEGIN TRANSACTION/source migrations từ chối ít nhất một predicate. **Chưa xác định predicate cụ thể** vì evidence không lưu từng giá trị; không suy ra schema user đang có quyền rộng hoặc tự biến NULL thành PASS. Migration/history writes và postconditions **NOT_REACHED**; không tạo23 domain tables hoặc6 history trong lần này. Không chạy thêm query diagnostic để tìm predicate vì chỉ thị dừng tại lỗi mới.

Cleanup lỗi mới trên chính connection: rollback nếu transaction còn mở, đọc transaction count/state thực tế **0/0**, rồi dispose. Không coi0/0 là commit attestation. Evidence SQL15590 cũ giữ nguyên; manifest ghi cả2 attempts và latest failure, không ghi đè lịch sử. Chỉ sửa header Batch02, thêm runner, đồng bộ generator/README/manifest/checkpoint và thêm evidence thật; không production changes, không stage/commit/push. **Bước còn thiếu:** xác định predicate của guard SQL51000 trước lần xử lý tiếp; không xin duyệt/chạy Batch03 khi Batch02 chưa PASS.

Tham chiếu sửa ngữ cảnh: [EXECUTE AS/NO REVERT](https://learn.microsoft.com/en-us/sql/t-sql/statements/execute-as-transact-sql?view=sql-server-ver16), [SqlClient zero-parameter SQLBATCH versus parameterized RPC](https://raw.githubusercontent.com/microsoft/referencesource/main/System.Data/System/Data/SqlClient/SqlCommand.cs). Tài liệu/source này hỗ trợ fix transport; không thay thế evidence lỗi runtime phía trên.

## Lần lỗi SQL15590 trước khi sửa ngữ cảnh (lịch sử)

**Hiện hành: Batch01 PASS kế thừa; Batch02 FAIL; Batch03 NOT RUN/chưa được duyệt; Gate B PARTIAL/BLOCKED.** User đã phê duyệt duy nhất Batch02 và yêu cầu nếu FAIL thì báo đúng lỗi và dừng; không sửa script, không retry hoặc chuyển Batch03.

Evidence thật: [batch02-s3g4_e59a50913259.json](evidence/sql-gate-b/batch02-s3g4_e59a50913259.json), `2026-11-05T15:56:05.0782377+00:00` → `15:56:05.5014339+00:00`, SHA256 `93032cc6f94acabcfdd700c98776fa1b5640c1960c97cef234756a413bce98b4`. Đã gửi nguyên Batch02 đã duyệt, SHA256 `23726f112c2feec8a204fcd3d2d6c0c903742ec21130c62e967a367d3d652625`, đúng CHAYBOOK_TEST / TCP127.0.0.1:15433 / ChayBook_Test / run s3g4_e59a50913259.1 connection,1 batch command, không retry; typed RunId, không secret. Không chạy lại Batch01/OS/Admin/ETW/TCP/SQL metadata/diagnostic.

**Lỗi chính xác: SQL15590 / class16 / state1 / line54:** `Can only use the 'No Revert' or 'Cookie' options with the 'Execute As' statement at the adhoc level.` Thất bại ở EXECUTE AS USER WITH NO REVERT của đường chạy parameterized, trước BEGIN TRANSACTION và source migrations. Vì vậy không đạt phần tạo23 bảng/ghi6 history; postconditions **NOT_REACHED**, không tự đánh PASS. Không kết luận script đã đạt SQL grammar/runtime chỉ từ static PASS trước đó.

Cleanup duy nhất trên chính connection lỗi: `IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; SELECT @@TRANCOUNT,XACT_STATE()`; thực tế cả hai bằng0. Đây là xác minh cleanup của lỗi mới, không phải kiểm tra lại baseline. Không có active transaction sau lỗi, connection đã dispose; evidence không dùng trạng thái đó như một commit attestation. Không có thao tác reset/drop, đổi quyền hoặc sửa context guard để ép PASS.

Chỉ thêm execution evidence thật, cập nhật schema-review.json và checkpoint này. Không chạy SQL/test nào khác, không sửa script đã review/production, không commit/push. **Công việc còn thiếu:** xử lý lỗi adhoc/context của Batch02 trước lần thực thi tiếp; chưa đưa thêm phương án hay tự chạy lại vì chỉ thị dừng khi FAIL. Batch03 chỉ xin phê duyệt sau Batch02 PASS thực tế.

## Batch01 PASS trước lần thực thi Batch02 (kế thừa)

**Hiện hành: Batch01 PASS_EXECUTION_AND_POSTCONDITIONS; Batch02/03 NOT RUN, chưa được phê duyệt. Gate B PARTIAL.** User đã phê duyệt Batch01 trong yêu cầu hoàn thành Gate B; không hỏi lại hoặc thực thi batch khác.

Evidence thực tế: [batch01-s3g4_e59a50913259.json](evidence/sql-gate-b/batch01-s3g4_e59a50913259.json), `2026-11-05T15:52:15.4177775+00:00`, SHA256 `c607e9ad0227f55ab40d3a0649e2bc535c6fa94cc5efdc95a80bfd1dd3e0bad0`. Approved Batch01 SHA256 `ceb205d0a598308ae7a436a72127aad5d48de4b72c5fcc23b5f30a0b59c30a2b`; target CHAYBOOK_TEST / tcp127.0.0.1:15433 / ChayBook_Test, run s3g4_e59a50913259. ExecuteNonQuery trả về thành công sau COMMIT; **postconditions kiểm tra đúng một lần: PASS** cho schema user WITHOUT LOGIN/no server name-SID mapping, app mapping/role separation,2 control tables, exact marker và history rỗng. Chưa có bảng nghiệp vụ/migration hoặc app DML grants của Batch03. Không tuyên bố full effective-rights/Gate B acceptance trước các bước còn lại.

Thực thi qua Windows operator hiện có,1 connection/1 batch command +1 postcheck command,0 password input. Theo chỉ thị mới cấm kiểm tra lại OS/Admin/TCP, execution adapter trong bộ nhớ kế thừa attestation đã có, không chạy đoạn OS của launcher; nguyên SQL Batch01 và postcheck đã duyệt được giữ nguyên. Artifact bytes pin được giữ, path ScriptBlock bind về đúng review folder; evidence ghi executionMode rõ ràng. **Không sửa file script đã PASS**, không chạy00a/OS/Admin/ETW/TCP/metadata/diagnostic hoặc SQL testcase. Chỉ thêm execution evidence thật và cập nhật manifest/checkpoint; không stage/commit/push.

**Phạm vi xin phê duyệt tiếp theo, duy nhất Batch02:** script `02-reviewed-migrations.sql` đã review, Windows Integrated Security/connection riêng không pooling, run/database/instance như trên; chuyển sang schema database user WITHOUT LOGIN bằng EXECUTE AS USER WITH NO REVERT trước DDL. Áp dụng đúng V001–V006, tạo23 bảng nghiệp vụ cùng PK/FK/index/constraints đã review, ghi6 version/checksum history; marker và2 control tables giữ nguyên. Không seed; V005 backfill không có domain rows trên schema mới. Không tạo login/account/database, không đổi cấu hình/quyền app/production. Fresh-only, exclusive schema lock, một outer transaction; lỗi trong transaction rollback, lỗi timeout/disconnect không tự retry. Kiểm tra postconditions đã nằm trong batch:25 bảng tổng cộng,23 domain tables rỗng và6 history hashes đúng. Đóng/dispose connection sau thành công hoặc lỗi; không dùng context này cho Batch03. Không chạy lại Batch01/postcheck của Batch01.

**Chờ user phê duyệt Batch02 một lần.** Batch03 sẽ được xin phê duyệt riêng sau Batch02 PASS; Gate B chỉ COMPLETE khi đủ execution/postcondition evidence còn thiếu.

## Phương án không mật khẩu trước khi thực thi (lịch sử)

**Hiện hành: GO để xin phê duyệt riêng Batch01 mới; chưa được thực thi. Gate B PARTIAL; Batch01/02/03 NOT RUN.** Blocker schema-password trong RPC/dynamic SQL được loại bỏ ở code bằng cách không dùng schema password. Không tuyên bố XE/driver redaction PASS hoặc SQL live PASS.

**Phương án:** tái sử dụng Windows Authentication của operator `My_Muse\ASUS`, app login hiện có và đúng instance/database/run. Schema principal vẫn tên `chaybook_s3_schema_s3g4_e59a50913259` nhưng là **database user WITHOUT LOGIN**, không tạo SQL login hoặc Windows account. Windows principal riêng chưa có nguồn đã duyệt nên không tự tạo/chọn. Batch01/launcher chỉ nhận typed `@RunId nvarchar(32)`; bỏ hoàn toàn password prompt/parameter/literal/secret-buffer code. Dynamic SQL chỉ còn tên principal đã QUOTENAME. Không cần chứng minh masking của một schema password không còn tồn tại trong đường thực thi mới.

**Dependency đã đồng bộ:** Batch02 nhận kết nối Windows operator riêng, xác nhận schema user authentication NONE/không server name-SID mapping/quyền phụ thêm, rồi `EXECUTE AS USER = @Schema WITH NO REVERT` **trước mọi persistent migration DDL**. Kiểm tra quyền thực tế dưới database token thay cho server-permission functions có thể trả NULL trong context này; không đổi NULL thành PASS. TRUSTWORTHY, database chaining và instance cross-db ownership chaining phải đã OFF; chỉ guard, không đổi cấu hình. Đóng/dispose kết nối không pooling sau Batch02 kể cả lỗi; Batch03 dùng kết nối operator mới. Batch03 giữ DML trên23 bảng và control-table restrictions, thêm DENY IMPERSONATE trên schema user cho app role. Không cấp app quyền impersonation/DDL.

Target/version/address/port/database, run marker, no-ambient-transaction, lock, ownership, schema history, source migration bodies, fresh-only/replay refusal và transaction/rollback giữ nguyên. Launcher vẫn pin artifact bytes và giữ OS guard hiện hữu; **không gọi guard hoặc launcher trong lượt này**. Không đổi Java/production/schema source; đường Java/JDBC dùng schema SQL credentials vẫn khóa và cần review riêng ở Gate C vì user WITHOUT LOGIN không thể đăng nhập JDBC.

**Kiểm tra tĩnh mới: PASS.**9 so sánh diff/contract trên phần vừa sửa; Batch02 từ DomainTables đến cuối (toàn bộ migration/history/lock/rollback) không đổi; Batch03 phần đó chỉ thêm DENY impersonation; Batch01 app preflight và grants/control table definitions không đổi; OS guard launcher không đổi. PowerShell AST/approval inputs/no credential prompt, Python generator AST và identity-template parity PASS. Repin Batch01/launcher và cập nhật artifact hashes manifest; giữ hash bản password-based đã thay thế để đối chiếu. Không chạy generator, không đọc lại/audit nguồn schema đã kiểm chứng. SQL grammar, context runtime và effective rights **chưa live verified**.

**0 kết nối/query SQL,0 batch,0 OS/Admin/ETW/metadata/diagnostic recheck,0 secret input** trong lượt này. Kế thừa nguyên vẹn11 nhóm metadata đã thu thành công và các evidence lịch sử; không tạo evidence thực thi giả. XE/Audit/logging không thay đổi; chúng vẫn có thể ghi nhận SQL text không chứa schema password. Tất cả testcase/ID/kết quả giữ nguyên.

**Phạm vi cần phê duyệt duy nhất lúc này — Batch01:** trên CHAYBOOK_TEST / TCP127.0.0.1:15433 / ChayBook_Test, run s3g4_e59a50913259, tạo schema user WITHOUT LOGIN, app user mapping chỉ nếu thiếu,2 dbo-owned roles,2 control tables/marker và schema-role CREATE TABLE/VIEW DEFINITION + ALTER/REFERENCES/SELECT/INSERT/UPDATE/DELETE trên dbo như bản đã review. Không migration bảng nghiệp vụ, không app DML grant, không server-login/account/config changes. Lỗi trước commit rollback toàn transaction dưới exclusive lock; timeout/disconnect giữ commit outcome UNKNOWN, không retry/drop. Sau commit launcher chỉ đọc postconditions principal/no login mapping/roles/2 control tables/exact marker/empty history và lưu evidence CreateNew; lỗi sau commit phải dừng, không chạy Batch02. Live postconditions và database-isolation preconditions chưa được chứng minh bởi static checks, sẽ fail closed khi thực thi đã duyệt.

Lệnh operator đề xuất **chỉ sau phê duyệt Batch01 mới**, không phải lệnh yêu cầu chạy ngay:

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\testing\sqlserver\gate-b-review\invoke-batch01.ps1 -RunId s3g4_e59a50913259 -Execute -PasswordlessSchemaApproved
```

Files thực sự sửa: `01-identity-and-ownership.sql`, `02-reviewed-migrations.sql`, `03-app-permissions.sql`, `invoke-batch01.ps1`, `schema-review.json`, `README.md` trong gate-b-review; `testing/tools/prepare-gate-b-batches.py`; checkpoint này. Không tạo file evidence/diagnostic mới, không stage/commit/push. Chờ **phê duyệt chạy duy nhất Batch01 mới theo phạm vi trên**; Batch02 và03 vẫn cần từng phê duyệt riêng.

Tham chiếu cơ chế: [CREATE USER WITHOUT LOGIN](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-user-transact-sql?view=sql-server-ver16), [EXECUTE AS USER và NO REVERT](https://learn.microsoft.com/en-us/sql/t-sql/statements/execute-as-transact-sql?view=sql-server-ver16). Đây là đối chiếu tài liệu, không phải SQL execution evidence.

## SQL metadata và blocker của phương án mật khẩu cũ (lịch sử)

**Hiện hành: NO-GO cho Batch01 theo phương án truyền mật khẩu hiện tại. Batch01/02/03: NOT RUN; Gate B chưa COMPLETE.** Không còn blocker thiếu quyền Administrator hoặc thiếu SQL metadata trong lượt này. Không chạy lại OS/Admin/listener/PID/image/00a/ETW32 session, không nhập secret hay đọc payload.

Evidence mới thực thi: [sql-metadata-driver-fixed-s3g4-e59a50913259.json](evidence/batch01-secret-telemetry/sql-metadata-driver-fixed-s3g4-e59a50913259.json), `2026-11-05T15:10:27.9256188+00:00` → `15:10:28.4296724+00:00`, SHA256 `d2dad5c2dc2d43b55593ef86a12e3c7e82137bb7f54d1b0d5fc51f446a6beebe`. **1 SQL connection/12 metadata commands**: identity guard +11 nhóm còn thiếu đều VERIFIED về thu thập, không đồng nghĩa secret safety PASS. SQL target guard xác nhận CHAYBOOK_TEST/major16/ChayBook_Test/local TCP127.0.0.1:15433; SQL operator ASUS/sysadmin và visibility đủ. Quyền SQL này không đòi kiểm tra lại token OS High.

| Phân loại | Kết quả mới / kết luận |
|---|---|
| VERIFIED — Audit |0 server audits,0 server audit-specification details,0 current-database audit-specification details dưới full visibility tại thời điểm query |
| VERIFIED — XE |3 configured sessions/137 events/40 actions: system_health running21 events; telemetry_xevents running104; AlwaysOn_health stopped12. Không thu event payload |
| RISK — XE |system_health có action `sql_text` trên error_reported, wait_info, wait_info_external, memory_node_oom_ring_buffer_recorded; có tsql_stack. Thu thập phụ thuộc event/filter, **không khẳng định password đã/luôn bị ghi**. Chưa có bằng chứng exclusion/redaction cho outer RPC parameter và dynamic CREATE LOGIN; metadata không đủ loại trừ capture |
| VERIFIED — Trace/flags |1 default trace running,34 event definitions,0 filters; default trace enabled1. Không cấu hình generic RPC/batch/statement events trong snapshot. Audit Addlogin event không thu TextData/BinaryData; một số event khác có text/binary. Global trace flags0. Không đọc .trc/error-log hoặc payload |
| VERIFIED một phần — driver |Phân tích file **đã thu** remaining-telemetry-s3g4-e59a50913259.json: managed provider/GUID mapping VERIFIED,0 candidate match trong snapshot32 session cũ, session requery0. Không thu lại registration/reflection/ETW. Native BID/APM/debugger/dumps/redaction vẫn UNKNOWN; empty registration không chứng minh tắt capture |

**Lỗi Testing mới đã sửa:** SqlConnectionStringBuilder được PowerShell adapt như IDictionary; gán CLR names DataSource/InitialCatalog/IntegratedSecurity/ConnectTimeout/ApplicationName gây ArgumentException trước Open. Đã chứng minh bằng constructor-only probe (0 Open). [read-gate-b-sql-metadata.ps1](../tools/read-gate-b-sql-metadata.ps1) dùng canonical dictionary keywords để thu đúng11 nhóm thiếu; giữ SQL target/visibility guard, exact auth/encryption/retry/timeout. Áp dụng cùng fix và Persist Security Info cho launcher [invoke-batch01.ps1](../sqlserver/gate-b-review/invoke-batch01.ps1); giữ typed NVarChar32/128, hidden prompt, run/hash guards, transaction/rollback của SQL và toàn bộ OS guard hiện hữu. Không sửa collector/handoff lịch sử hoặc Batch01–03 SQL. AST reader/launcher và constructor-only verification của **đoạn builder launcher vừa sửa** PASS; 0 Open/prompt/batch trong verification. Cập nhật hash launcher và trạng thái metadata trong schema-review.json, bỏ blocker OS/metadata cũ khỏi trạng thái hiện hành.

Evidence thất bại giữ nguyên: remaining-telemetry JSON ghi stage SERVICE_ATTESTATION/0 SQL; sql-metadata-s3g4-e59a50913259.json ghi0 SQL do lỗi builder trước Open. Chúng không thay thế xác nhận Listen mới và không phải kết quả catalog rỗng. Không chạy lại collector đã tạo các file này; snapshot SQL thành công ở file mới phía trên.

**Blocker thực sự:** đường truyền SchemaPassword vẫn là RPC input và password literal trong server dynamic SQL; typed binding/Encrypt không chứng minh che secret trước các capture paths quan sát được. Không tắt/sửa logging, không thử password giả/thật, không thêm audit vòng nữa. Chưa đủ cơ sở xin phê duyệt chạy Batch01 hiện tại. SQL133 testcase/38P0 chưa mở khóa bằng execution evidence; mọi ID/kết quả giữ nguyên.

**Một hành động tiếp theo cần user:** cung cấp **Windows identity riêng đã được phê duyệt cho schema account**, khác operator ASUS và app, để chuẩn bị phương án Windows Authentication không truyền schema password. Đây là đề xuất xử lý blocker, **chưa đổi identity/batch hoặc tạo/cấp quyền SQL/Windows**; không tự chọn tài khoản khi thiếu nguồn chuẩn. Sau khi có identity sẽ chuẩn bị thay đổi Testing cụ thể để review, rồi xin phê duyệt riêng trước từng Batch01→02→03. Không coi đây là quyền thực thi hay Gate B PASS.

Files lượt này: thêm SQL-only reader và2 JSON evidence kết quả thực tế; sửa launcher, schema-review.json và checkpoint này. Không sửa production, SQL config/schema/permissions/telemetry, không stage/commit/push.

## Tiếp tục end-to-end trước khi có SQL metadata (lịch sử)

**Hiện hành: NO-GO xin phê duyệt Batch01; Gate B chưa COMPLETE.** 00a PASS kế thừa, không chạy lại. Batch01/02/03: **NOT RUN**. Không đổi testcase/ID/kết quả Sprint 3.

| Phân loại | Evidence và giới hạn |
|---|---|
| VERIFIED — diagnostic | `service-guard-diagnostic-s3g4-e59a50913259.json`, observedAt `2026-11-05T14:35:00.5071770+00:00`, SHA256 `49edd6acd686b1dd7d3235551f0184549c941ca74fd38e6e7a7de10cb6c48abe`: service RUNNING/PID18720, executable đúng CHAYBOOK_TEST, major16. Guard đầu bị từ chối: **LISTENER_COUNT**, expected1/actual0; netstat `CLOSED`, structured State1/CLOSED. Đây là rejection đúng theo snapshot; không chứng minh false negative, không sửa/nới guard. `LOOPBACK_SOCKET_OWNERS=VERIFIED` trên tập rỗng không phải listener PASS |
| PASS theo operator — listener hiện tại | User xác nhận riêng `127.0.0.1:15433 / Listen / PID18720` trong yêu cầu end-to-end. Khác snapshot CLOSED lịch sử; giữ nguyên JSON cũ. Chưa có file listener mới độc lập; required pre-connect guard của lần thu SQL tiếp theo sẽ lưu observation máy đọc được và từ chối nếu state/owner/address/count không còn đúng |
| VERIFIED một phần — driver mapping | Reflection metadata trên System.Data của Windows PowerShell: `System.Data.SqlEventSource`, name `Microsoft-AdoNet-SystemData`, GUID `6a4dfe53-eb50-5332-8473-7b7e10a94fd1`. Không tạo instance EventSource/SqlConnection. Đối chiếu offline GUID này với snapshot32 session: **0 match**; không suy ra capture hiện tại tắt hoặc bao phủ native BID/APM/debugger |
| VERIFIED — binding hiện có | Launcher Batch01 dùng hidden SecureString prompt và typed NVarChar parameters RunId32/SchemaPassword128; không nội suy password vào client command text/args/file. Không chạy launcher, không yêu cầu/đọc/tạo secret |
| UNKNOWN — còn thiếu |11 nhóm SQL: Audit/specifications, XE/events/actions/fields/targets, Trace/events/filters/default-trace setting, global trace flags chưa queried. Driver native BID/APM/debugger và end-to-end redaction chưa có chứng cứ đủ |
| RISK | Bound RPC vẫn mang SchemaPassword; Batch01 sinh literal password trong dynamic CREATE LOGIN. Binding/Encrypt/SET NULL không chứng minh server/client capture sẽ che secret; chưa có evidence xảy ra lộ secret |

Chuẩn bị duy nhất [complete-batch01-telemetry.ps1](../tools/complete-batch01-telemetry.ps1) để thu **phần còn thiếu**. Script pin collector SHA93f17bd4… và snapshot SHA2f9d6074…, giữ nguyên OS/SQL target/visibility guards, chỉ dùng Windows operator ASUS/High và TCP127.0.0.1:15433/ChayBook_Test. Giữ pre-connect observation để nếu fail không mất endpoint/count diagnostic. Bỏ toàn bộ policy/log-channel và32 ETW session inventory đã thu; chỉ bổ sung registration/type GUID mapping và đối chiếu snapshot lịch sử, ghi rõ coverage partial. Metadata queries không lấy statement/RPC/event/trace/audit payload, predicate values, target_data hoặc secret. Output CreateNew, không overwrite; decision luôn `PENDING_ANALYSIS_NOT_PASS`. Không thay telemetry/config/quyền, không gọi00a/01–03, không testcase.

Kiểm tra offline: AST wrapper và collector SQL-only ghép từ source pin **PASS**; reflection và đối chiếu GUID thực tế như trên. Script collector **chưa thực thi**. Lượt này **0 SQL connection/command,0 batch,0 secret input**. Chỉ thêm script trên và cập nhật checkpoint; không sửa production, không commit/push.

**Một bước tiếp theo:** Codex không kế thừa token High của console operator (token Medium đã có evidence; không kiểm tra lặp). Chạy đúng một lệnh dưới đây từ **PowerShell Administrator tại repo** rồi cung cấp file output; không chạy lại handoff/diagnostic. Không cần mật khẩu và đây không phải phê duyệt Batch01.

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\testing\tools\complete-batch01-telemetry.ps1
```

Output dự kiến: `testing/reports/evidence/batch01-secret-telemetry/remaining-telemetry-s3g4-e59a50913259.json`. Chờ evidence để đánh giá capture/redaction; không coi dòng `REMAINING_METADATA_RECORDED` là PASS. Nếu A đủ an toàn mới trình phạm vi/rollback/postcheck và xin phê duyệt **riêng từng** Batch01 →02 →03. Nếu còn UNKNOWN ảnh hưởng secret, giữ NO-GO; không tắt logging để vượt gate. SQL133 testcase (38P0) chưa mở khóa bằng execution evidence; chưa chạy Gate C.

## Chẩn đoán SERVICE_ATTESTATION trước đó (lịch sử)

## Kết luận hiện hành: NO-GO; chưa có bằng chứng cho phép sửa guard

Đối chiếu JSON Administrator, handoff và collector trực tiếp. **Không thể xác định hồi tố guard chính xác đã thất bại:** JSON chỉ có SERVICE_ATTESTATION/UNKNOWN,0 SQL connection/command, không có actual service/PID/path/socket, exception type/native code hoặc lastGuard. Handoff pin collector hash93f17bd4… rồi gọi nguyên prefix; không chứa một guard service khác. Đây không phải kết quả SQL bị từ chối quyền.

**Thiếu sót diagnostic đã chứng minh:** `testing/tools/review-batch01-telemetry.ps1:30` dùng một stage cho toàn bộ OS chain; catch tại169–170 ghi lý do chung rồi `$Error.Clear()`, không lưu guard ID/actual/exception. High SID trong JSON chỉ xác nhận entry token, không chỉ ra guard OS nào lỗi. Không thể lấy lỗi access5 từ snapshot token Medium để gán cho lần Admin. **Chưa chứng minh false negative**, không thay đổi/nới lỏng guard, collector, handoff hoặc Batch01–03.

| Guard nguồn trong collector | Expected | Actual trong JSON Administrator |
|---|---|---|
|32 SCM query | Query đúng MSSQL$CHAYBOOK_TEST, exit0 | Không lưu |
|34 service state | STATE4/RUNNING | Không lưu |
|35 PID parser | PID numeric từ service | Không lưu |
|38 SCM configuration | Query-config exit0 | Không lưu |
|39 executable parser | BINARY_PATH_NAME quoted sqlservr.exe | Không lưu |
|41 PID/install | PID>0; MSSQL16.CHAYBOOK_TEST/MSSQL/Binn/sqlservr.exe | Không lưu |
|42 process/version | Get-Process.Path khớp configured binary; ProductMajorPart16 | Không lưu |
|44 netstat | Exit0 | Không lưu |
|48 listener ownership | Mọi LISTENING15433 row phải127.0.0.1 và đúng PID service | Không lưu |
|52 listener count | Chính xác1 listener hợp lệ | Không lưu |

Nguồn actual: `admin-telemetry-s3g4-e59a50913259.json`, SHA2562f9d6074…; các field expected lấy từ chính collector đã được pin. File JSON lịch sử giữ nguyên. Quyền truy cập/sai PID/sai service/executable/listener hoặc false negative parser/getter đều chưa phân biệt được từ file này; lỗi duy nhất đã xác nhận là mất diagnostic, không phải một lỗi target cụ thể.

Chuẩn bị [diagnose-gate-b-service.ps1](../tools/diagnose-gate-b-service.ps1): **OS-only, chưa thực thi**. Một lần chạy thu expected/actual10 predicate đúng thứ tự nguồn, `firstRejectedOriginalGuard`, SCM exit/raw metadata, .NET path/version và lỗi đã lọc; nếu image không đọc được mới dùng native QUERY_LIMITED_INFORMATION để phân biệt access-denied với getter không trả dữ liệu. Chỉ port15433 được lấy netstat/CIM metadata; không đọc memory/module/event/log payload. Kết quả API thay thế chỉ là diagnostic, không bypass guard. Snapshot mới được ghi rõ không thể khôi phục actual lịch sử. Không lặp policy/log channels hoặc ETW32 session, không SQL/password/config changes, không tự elevation. AST parse PASS; không chạy probe/testcase. Chỉ thêm script diagnostic và cập nhật checkpoint trong lượt này.

Chạy **một lần từ PowerShell Administrator tại repo**, không chạy lại handoff:

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\testing\tools\diagnose-gate-b-service.ps1
```

Output mới: `testing/reports/evidence/batch01-secret-telemetry/service-guard-diagnostic-s3g4-e59a50913259.json`, từ chối overwrite. Admin/operator check là precondition cho đúng tiến trình probe, không audit lại High/logging. Có thể xác định nhiều blocker cùng lượt; guard đầu bị reject và lỗi phụ thuộc phải tách rõ. Native5/CIM AccessDenied là lỗi quyền; null Path riêng lẻ không chứng minh access-denied hoặc sai executable. Actual path/PID/address khác là mismatch cần giữ BLOCKED. Native image đúng nhưng .NET getter rỗng, hoặc structured LISTEN đúng owner trong khi text parser không nhận diện, là evidence để đánh giá false negative theo snapshot; chỉ khi chứng minh tương đương mới sửa đúng getter/parser, giữ checks instance/path/version/loopback/PID/count. Không bật debug privilege hoặc sửa hệ thống để ép khớp.

**Phương án tiếp:** sau khi target được attested, thu nhánh SQL metadata-only của collector (Audit/specifications, XE events/actions/fields/targets, Trace/events/filters/config, trace flags) với identity/visibility guard; không chạy full handoff hay Batch01–03. Mapping driver chỉ bổ sung catalog GUID↔provider-name còn thiếu trên snapshot32 session, ghi rõ freshness/coverage; không coi empty mapping là tắt driver tracing. Chưa có metadata/redaction nên vẫn NO-GO xin phê duyệt Batch01. Lượt Codex này không mở SQL hoặc chạy bất kỳ OS probe/batch/testcase nào; chỉ đọc file, kiểm tra cú pháp script mới, không đổi config/quyền/production, không commit/push.

## Phân tích evidence Administrator trước đó (lịch sử)

## Kết luận hiện hành: NO-GO để xin phê duyệt Batch01

Đọc trực tiếp [admin-telemetry-s3g4-e59a50913259.json](evidence/batch01-secret-telemetry/admin-telemetry-s3g4-e59a50913259.json),135782 bytes; JSON parse/shape/types hợp lệ cho **collection một phần**, không phải collection SQL hoàn tất. SHA256 `2f9d6074d732f4d6e3fe318d581265686006cd084acfea7fb84ccc97627b0750`. observedAt `2026-11-05T11:17:40.3806994+00:00`, file mtime `2026-11-05T11:20:15.632019+00:00`; thứ tự thời gian hợp lệ, không ở tương lai khi phân tích. observedAt là thời điểm bắt đầu, mtime không thay thế timestamp hoàn tất có chữ ký.

| Phân loại | Evidence quan trọng / giới hạn |
|---|---|
| VERIFIED trong artifact | Run `s3g4_e59a50913259`; target khai báo CHAYBOOK_TEST /127.0.0.1:15433 /ChayBook_Test khớp yêu cầu; observedWindowsIdentity `My_Muse\ASUS`; operatorIntegrity VERIFIED/High SID `S-1-16-12288`, scope THIS_OPERATOR_PROCESS. Đây là xác nhận trường evidence, không phải truy vấn token/server mới của agent |
| VERIFIED về trạng thái thu thập | `reviewStage=SERVICE_ATTESTATION`, `osAttestation.status=UNKNOWN`, `sqlConnections=0`, `sqlCommands=0`; không có `identityAndVisibility`. Collector chưa đến bước xác minh SQL identity/visibility hoặc query metadata |
| UNKNOWN — Audit | `audits`, `serverAuditActions`, `databaseAuditActions` đều NOT QUERIED/UNKNOWN; không được diễn giải thành không có audit/specification |
| UNKNOWN — XE | `xeEvents`, `xeActions`, `xeFieldsAndTargets` đều NOT QUERIED/UNKNOWN; chưa biết active events/actions, filters hoặc destinations có thu SQL text/RPC không |
| UNKNOWN — SQL Trace/flags | `traces`, `traceEvents`, `traceFilters`, `loggingSettings`, `globalTraceFlags` đều NOT QUERIED/UNKNOWN; không được kết luận default trace tắt hoặc không có trace flag |
| VERIFIED một phần — driver ETW |32/32 session có `metadataRead=true`,1015 mục GUID được ghi nhận; `registeredDriverProviders=[]`, mọi `knownDriverGuids` rỗng. Không có mapping driver đầy đủ nên zero known matches không chứng minh không có driver capture |
| UNKNOWN — driver/redaction | `driverTracing.redaction=UNKNOWN`, `otherCapture=UNKNOWN_APM_BID_DEBUGGER_DUMPS`; status OBSERVED_PROVIDER_METADATA_NOT_COMPLETE_CAPTURE_OR_REDACTION_PROOF chỉ chứng minh đã thu metadata, không phải an toàn secret |
| RISK | Outer RPC có input parameter SchemaPassword và Batch01 sinh password literal trong dynamic CREATE LOGIN. Chưa có evidence loại trừ capture hoặc xác nhận redaction cho các kênh đó. Không khẳng định đã xảy ra lộ mật khẩu; không có secret được nhập để thử |

Có12 entry SQL trạng thái UNKNOWN gồm11 nhóm metadata và reviewBoundary; chúng không phải12 phép query bị lỗi vì counter SQL bằng0. High token không tự giải quyết guard service/process/listener và không chứng minh quyền nhìn SQL catalog. JSON chỉ lưu boundary tổng quát SERVICE_ATTESTATION, **không đủ để xác định chính xác lần chạy Admin bị chặn bởi process image, listener, version hay bước guard nào khác**. Không gán lại lỗi access5 của snapshot cũ thành nguyên nhân đã chứng minh cho lần Admin này. `decision=PENDING_ANALYSIS_NOT_PASS` và dòng console READ_ONLY_ADMIN_METADATA_RECORDED không phải PASS.

Giảm thiểu trong hợp đồng hiện có, không đổi SQL/logging: giữ launcher đã review với hidden prompt/typed SqlParameter, không secret trong args/env/file, không nội suy secret vào PowerShell/command text phía client và không in raw exception/parameter; dùng phiên operator được kiểm soát, secret test riêng được quản lý an toàn sau khi được phép. Các biện pháp này giảm lộ phía client; password literal vẫn tồn tại phía server, chưa đủ chứng minh redaction. Không đề xuất tắt audit/trace, đổi quyền hoặc xoay/tạo credential trong lượt này.

**Hành động tiếp theo:** thu diagnostic read-only xác định guard SERVICE_ATTESTATION nào thất bại trước khi cân nhắc chạy lại collector; không chạy lại mù nguyên handoff. Sau khi target attestation đạt, bổ sung các metadata SQL chưa có và mapping/coverage driver-provider còn thiếu; dùng lại32 session metadata và logging policies đã VERIFIED khi còn phù hợp. Cần đánh giá capture/redaction trên dữ liệu đủ trước khi đề nghị phê duyệt Batch01 riêng. Không chạy Batch01–03 để kiểm tra. Lượt phân tích này chỉ đọc evidence hiện có và sửa checkpoint; không mở SQL connection, chạy handoff/testcase, nhập/tạo secret, đổi config/quyền hoặc commit/push.

## Snapshot trước khi đọc evidence Administrator (lịch sử)

## Tiếp tục sau khi operator xác nhận High Mandatory Level

**NO-GO để xin phê duyệt Batch01:** chưa có metadata SQL/driver capture đầy đủ. Operator báo console High `S-1-16-12288`, nhưng `rtk proxy whoami /groups` từ tiến trình Codex ngoài sandbox thực tế vẫn **Medium `S-1-16-8192`**, Administrators **deny only**. Không kế thừa token High của console operator; không tự UAC/elevate, đổi quyền hoặc bypass guard. [Evidence token mới](evidence/batch01-secret-telemetry/codex-integrity-followup.json).

| Phân loại hiện hành | Kết luận |
|---|---|
| VERIFIED mới | Token Codex Medium; không phải Administrator token. Đây không phải phủ nhận High token của console operator khác |
| VERIFIED dùng lại | Các quan sát policy/log channels/service configuration ở lượt trước; không chạy lại các bước đã đạt |
| UNKNOWN | Runtime image/listener attestation, Audit/XE/SQL Trace/trace flags và active driver capture chưa có evidence mới từ phiên Admin; không suy ra tắt/không có |
| RISK | Chưa chứng minh redaction/exclusion cho RPC parameters và password literal trong dynamic SQL; token Admin hay parameter binding không tự giải quyết rủi ro capture |

Tạo [admin-readonly-handoff.ps1](evidence/batch01-secret-telemetry/admin-readonly-handoff.ps1) **chỉ là artifact bàn giao, chưa thực thi**. Nó yêu cầu High SID ngay trong process, pin hash collector read-only hiện có, giữ nguyên phần guard OS/SQL và chỉ lấy metadata chưa có; bỏ phần policy/log channel đã VERIFIED. Thu thêm provider registration/session-membership ETW metadata, không đọc payload và không coi metadata/provider list là chứng nhận redaction/APM/debugger. AST của handoff và collector SQL-only ghép lại: PASS; không chạy script để test. Lượt Codex này có **0 SQL connection/query,0 batch/testcase/secret input,0 configuration change**.

Chạy từ **PowerShell Administrator đang mở, tại thư mục repo** (không chạy launcher Batch01):

```powershell
rtk proxy powershell -NoProfile -ExecutionPolicy Bypass -File .\testing\reports\evidence\batch01-secret-telemetry\admin-readonly-handoff.ps1
```

ExecutionPolicy chỉ áp dụng child process; không sửa Windows policy. Script tự từ chối token không High hoặc evidence đã tồn tại; không retry/bypass khi target/visibility chưa đạt. Output dự kiến `testing/reports/evidence/batch01-secret-telemetry/admin-telemetry-s3g4-e59a50913259.json`, trạng thái **PENDING_ANALYSIS_NOT_PASS**. Cần phân tích file thực tế: đúng service/process/listener và SQL instance/catalog, quyền nhìn metadata đầy đủ, event/action/filter/target/trace flags, known driver-provider capture và phần redaction chưa rõ. Nếu còn UNKNOWN/RISK ảnh hưởng secret thì chưa GO; không bật/tắt telemetry để ép đạt, không chạy01–03 hoặc nhập password. Chỉ sau khi đủ bằng chứng mới quyết định có thể xin phê duyệt Batch01 riêng.

## Snapshot review trước đó (giữ nguyên evidence)

**Kết luận: NO-GO để xin phê duyệt thực thi Batch01 ở trạng thái evidence hiện tại.** Review chỉ đọc bị chặn ở OS pre-connect attestation; SQL metadata chưa được truy vấn, không suy ra Audit/XE/Trace tắt.00a PASS theo user, Batch01 static PASS nhưng01–03 chưa thực thi. Agent SQL connections/metadata commands/DDL/DCL/testcase/secret inputs/payload reads: **0**; không thay telemetry/quyền/Windows config hoặc MSSQLSERVER, không commit/push.

## Kết quả telemetry thực tế — 2026-11-05 (timestamp trong evidence)

| Phân loại | Kết quả / giới hạn |
|---|---|
| VERIFIED | HKLM PowerShell ScriptBlockLogging: EnableScriptBlockLogging=1; host Windows PowerShell5.1 x64. Chỉ xác nhận logging script text, không chứng minh capture runtime password |
| VERIFIED | Microsoft-Windows-PowerShell/Operational và Windows PowerShell log channels bật; không đọc event bodies |
| VERIFIED |5 policy keys không tồn tại: HKLM Transcription/ModuleLogging và HKCU của operator ASUS cho Transcription/ScriptBlockLogging/ModuleLogging. Không đồng nghĩa mọi transcription/module logging đều tắt |
| VERIFIED | SCM service CHAYBOOK_TEST RUNNING/PID18720 và configured binary -sCHAYBOOK_TEST; đây không phải full runtime image/listener attestation |
| UNKNOWN | Phiên sandbox là CodexSandboxOffline; thử ngoài sandbox dùng đúng ASUS nhưng Get-Process.Path rỗng, native QUERY_LIMITED_INFORMATION bị ACCESS_DENIED5; Get-NetTCPConnection Listen gặp CimJobException. Không tự nâng quyền/UAC, không bypass target guard |
| UNKNOWN | SQL Server Audit/server+database specifications, XE events/actions/targets, SQL Trace/default trace/filters và trace flags/error-log configuration: **NOT QUERIED** do OS boundary chưa đạt. Không phải kết quả SQL rỗng hay lỗi quyền SQL đã quan sát |
| UNKNOWN | ETW chỉ liệt kê session names: không có tên khớp SqlClient/AdoNet/BID/PowerShell; chưa kiểm tra provider membership, không suy ra không có listener. Per-process SqlClient/BID/APM/debugger/dump và ad hoc console logging chưa attest |
| RISK | Chưa có bằng chứng end-to-end redaction/exclusion cho outer RPC parameters và dynamic CREATE LOGIN password literal. Không có mật khẩu nào được nhập/gửi để kiểm tra và không đọc payload có thể chứa secret cũ |

[Metadata đầu](evidence/batch01-secret-telemetry/metadata.json), [follow-up đúng operator](evidence/batch01-secret-telemetry/sql-operator-followup.json), [diagnostic OS bị chặn](evidence/batch01-secret-telemetry/os-boundary-diagnostics.json). Đầu tiên quan sát machine policies/log metadata; follow-up chỉ xử lý SQL boundary và HKCU operator khác context, không lặp HKLM/log channels đã VERIFIED. Các cách đọc image/listener thay thế chỉ xử lý boundary chưa PASS; đều không đổi hệ thống.

Script chỉ đọc mới: `testing/tools/review-batch01-telemetry.ps1`; không đọc01–03, không đọc .xel/.trc/audit/error-log bodies/target_data/cache SQL/passwords. Evidence hiện có bất biến; tham số EvidenceName chỉ nhận basename .json mới để operator đủ quyền có thể thu phần còn thiếu. Cần phiên operator đọc được process image/listener, sau đó query metadata Audit/XE/Trace với full visibility; nếu còn denial/ẩn metadata thì giữ UNKNOWN. Không cần chạy lại00a, launcher, migration hoặc testcase, không tự bật/tắt audit để giải quyết. Giữ `-SecretTelemetryReviewed` chưa được xác nhận; chưa đủ cơ sở GO cho xin phê duyệt Batch01.

## Binding Batch01 hiện hành

Run duy nhất: **s3g4_e59a50913259**; schema login dự kiến `chaybook_s3_schema_s3g4_e59a50913259`. Operator `My_Muse\ASUS`, fixed TCP127.0.0.1:15433, CHAYBOOK_TEST / ChayBook_Test. Chưa có ownership marker do Batch01 chưa chạy;00a chỉ bỏ memberships, không tạo marker.

Tạo [invoke-batch01.ps1](../sqlserver/gate-b-review/invoke-batch01.ps1). Mặc định REVIEW_ONLY, không prompt/OS/SQL; `-Execute` chỉ dành cho operator sau phê duyệt, `-SecretTelemetryReviewed` là xác nhận của operator, không tự chứng minh hoặc thay đổi telemetry. Kiểm tra pinned hash trước prompt; dùng đúng bytes đã kiểm tra, không đọc lại rồi thay chuỗi. SHA256 Batch01 giữ nguyên `ea2e94e0f379c4085f3fd0d40d04289d0925f10342902c75a0bf2abcb20f3466`.

Nhập password chỉ bằng `Read-Host -AsSecureString`; bind `@RunId` NVarChar32 và `@SchemaPassword` NVarChar128 bằng SqlParameter, không nội suy SQL/sqlcmd -v, không argument/env/file/log. Windows Integrated Security cho operator; không dùng secret schema để đăng nhập operator. Fixed TCP/catalog, encrypted transport theo hợp đồng test, pooling/reconnect tắt; kiểm tra lại service/PID/binary/listener trước kết nối khi operator thực thi. Giữ toàn bộ guard/transaction/rollback/quyền của Batch01, chỉ một ExecuteNonQuery, không02/03 hoặc retry. Lỗi thô/CommandText/parameter không được in; timeout/mất kết nối khi đã gửi lệnh cần attestation kết quả commit, không chạy lại mù.

**Rủi ro còn lại:** Batch01 tạo chuỗi `CREATE LOGIN ... PASSWORD='...'` trong server memory; QUOTENAME chống lỗi quoting/injection, không mã hóa/che mật khẩu. RPC/statement tracing, driver diagnostics hoặc debugger/dump đặc quyền có thể quan sát secret; không giả định SQL Server tự redact mọi đường capture. SET NULL/dispose/ZeroFreeBSTR không xóa được mọi bản sao managed string/driver/server/cache/log. Không đổi sang HASHED hoặc Windows schema identity vì sẽ đổi hợp đồng đã review. Dùng secret mạnh riêng cho run, lưu bằng secret manager được duyệt, hạn chế observer/dump và xác nhận cơ chế redaction/exclusion đã duyệt trước prompt; không tự tắt audit/trace hay đổi Windows/SQL config. TLS không che dữ liệu khỏi server; TrustServerCertificate theo hợp đồng loopback không phải xác minh PKI.

Lệnh đề xuất **chỉ sau khi được phép thực thi Batch01 và đã xác nhận telemetry** (không có password trong command/history):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\testing\sqlserver\gate-b-review\invoke-batch01.ps1 -RunId s3g4_e59a50913259 -Execute -SecretTelemetryReviewed
```

ExecutionPolicy chỉ áp dụng process được gọi, không sửa policy Windows lưu trữ. Bỏ `-Execute` thì chỉ REVIEW_ONLY. Agent không chạy launcher ở mode nào; chỉ AST ParseFile và nạp metadata thư viện System.Data: PASS, không mở SqlConnection. Không chạy testcase. Tài liệu API: [SqlParameter](https://learn.microsoft.com/en-us/dotnet/api/system.data.sqlclient.sqlparameter?view=netframework-4.8.1), [CREATE LOGIN](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-login-transact-sql?view=sql-server-ver16), [RPC TextData capture](https://learn.microsoft.com/en-us/sql/relational-databases/event-classes/rpc-completed-event-class?view=sql-server-ver16).

## Evidence mới và identity

Evidence user mới: **00a đã thực thi PASS**, app `chaybook_test_login` không còn membership trực tiếp; run s3g4_e59a50913259; Batch01–03 chưa thực thi. Target/operator như trên. Evidence trước đó tiếp tục được ghi nhận: operator sysadmin1/ALTER ANY LOGIN1; MDF/LDF tại `D:\ChayBook_Test_SQLData`; public SELECT chỉ trên `sys.*`. Đây là evidence user cung cấp, không phải SQL observation mới của agent; không chạy lại00a hoặc kiểm tra SQL trực tiếp.

| Identity | Hợp đồng hiện có | Đối chiếu |
|---|---|---|
| App SQL Integration | `chaybook_test_login` | `SqlServerSafety.APP_USER` và canonical guard bắt buộc `CHAYBOOK_TEST_DB_USER` bằng tên này; test profile datasource.username lấy biến đó. Đây là identity runtime Testing được thiết kế, chưa phải quan sát session live/production |
| Schema/DDL | `chaybook_s3_schema_<run>` |01 provision riêng;02 bắt buộc login/user này, từ chối app/operator; không đổi |
| Operator | `My_Muse\ASUS` | Evidence user đủ quyền guard01/03; không dùng làm datasource app |

**Hai membership rộng đã được loại theo evidence00a PASS.** Không đổi login/user/role definitions; các guard01/03 vẫn kiểm tra app state sạch tại thời điểm thực thi, không nới guard.

[00a-reviewed-app-role-removal.sql](../sqlserver/gate-b-review/00a-reviewed-app-role-removal.sql): **PASS theo user, không chạy lại**; guard exactly2 memberships sẽ từ chối replay ở state hiện tại. Artifact SQL vẫn là template review gốc, không tự sửa header thành execution evidence.

Thứ tự tiếp theo sau duyệt: **01(operator, secure bind) →02(schema identity) →03(operator)**;00a đã xong. App tạm chưa có domain DML cho đến03. Không tự cấp lại role rộng nếu batch sau lỗi. Sau provisioning attest quyền hiệu lực app/schema rồi Gate C riêng; chưa có Gate B live PASS.

## Review cuối: PASS chỉ là review tĩnh, không phải SQL live PASS

| Hạng mục | Kết quả | Phạm vi |
|---|---|---|
| Batch01 | PASS | Sau sửa: run marker nghiêm ngặt như02/03; chặn ambient transaction; TRY/CATCH rollback; kiểm kê sau khi lấy cùng schema lock; từ chối app ownership/default schema ngoài hợp đồng |
| Batch02 | PASS | Chỉ nhận marker/history sau01, schema identity riêng; fresh-only chống replay; outer transaction/rollback; đủ6 migration hashes/25 tables; kiểm tra domain data được compile qua dynamic SQL sau CREATE, lỗi ở cấp này đi qua outer CATCH |
| Batch03 | PASS về scope cấp quyền |23 DML grants object-scoped +2 SELECT control, deny ghi control/DDL app; không login/user mới hoặc role rộng; quyền public/inherited vẫn phải attest |
| Run marker | PASS | nvarchar17 ký tự/34 bytes, prefix+hex phân biệt hoa thường; marker varchar phải17 bytes và so sánh BIN2; cùng marker và schema lock xuyên01–03 |
| Schema account | PASS về thiết kế |01 chuẩn bị identity riêng;02 từ chối operator/app,03 xác nhận mapping; chưa provision hay kiểm chứng credential thực tế |
| Operator permission | PASS theo evidence user mới | `My_Muse\ASUS`: sysadmin1/ALTER ANY LOGIN1; không phải truy vấn SQL mới |
| App membership hiện hành | PASS theo evidence user |00a PASS; không còn membership trực tiếp; không truy vấn/chạy lại |
| Secret binding Batch01 | PASS về chuẩn bị, BLOCKED thực thi | Launcher parse PASS; chờ xác nhận telemetry và phê duyệt, chưa nhập secret/kết nối |

Sửa đúng wrapper Testing, không đổi bất kỳ thân migration/source schema nào. Kiểm tra tĩnh sau sửa:12 source/origin hashes khớp,37/37 đoạn nguồn giữ nguyên và đúng thứ tự,6 history records đúng hash,23 DML targets khớp inventory,23 post-DDL empty checks qua dynamic SQL. Đồng bộ generator và hash cả3 batch trong `schema-review.json`; không chạy generator để overwrite delivery, không chạy suite/testcase.

**Còn thiếu trước GO cho Batch01:** xác nhận đường capture/telemetry nhạy cảm đã được xử lý phù hợp và phê duyệt thực thi Batch01 riêng. Run đã xác định; secret chỉ nhập tại console được duyệt, không gửi chat/source/history. App membership/operator/data-path blockers cũ đã được giải quyết theo user. Preflight vẫn phải từ chối state khác dự kiến. Chưa chứng nhận runtime SQL/rollback/effective privileges; Gate C riêng sau provisioning.

## Đầu vào hiện hành

Evidence chuẩn bị trước đó: sys.tables0, chưa có migration history; evidence mới bổ sung quyền operator và memberships như trên. Không tự kết nối lại. [OS snapshot STOPPED/PID0 trước đó](evidence/sql-gate-b-readiness/os-attestation.json) là lịch sử, không đại diện trạng thái mới.0 bảng nghiệp vụ không loại trừ control tables/view/procedure/role có sẵn; pre-step/01 tiếp tục từ chối objects/quyền ngoài dự kiến. Windows sysadmin không thay cho app/schema identity tối thiểu.

## Nguồn chuẩn và migration

Nguồn repository: `Database/FixedDB/Fixed_CreateDatabase.sql` (21 bảng) cộng5 patch bên dưới. Bản gốc có USE/DROP, **không dùng làm script thực thi**. Schema test lấy từ6 bản V001–V006 hiện có trong `Back_End/src/test/resources/sqlserver/`, đối chiếu cả source/origin SHA256 với manifest trước khi tạo bundle; không sửa nguồn.

| Chưa áp dụng theo đầu vào DB rỗng | Nguồn patch/base |
|---|---|
| V001__base.sql | Fixed_CreateDatabase.sql — chỉ phần CREATE đã được tách ở test copy |
| V002__AddAuthOtpChallenge.sql | AddAuthOtpChallenge.sql |
| V003__UpdateComment_Category_Recipe.sql | UpdateComment_Category_Recipe.sql |
| V004__Update_Artical_Post.sql | Update_Artical_Post.sql |
| V005__Add_Status_And_Admin_Decision.sql | Add_Status_And_Admin_Decision.sql |
| V006__AddIngredientStatus.sql | AddIngredientStatus.sql |

Không thiếu file nguồn migration. `AddAuthOtpVerified.sql` đã nằm trong V002; `UpdateRecipe.sql` cập nhật ảnh mẫu và `Fixed_SampleData.sql` là seed, đều loại khỏi bundle schema. V005 giữ backfill nguồn nhưng trên schema mới không có dòng nghiệp vụ để cập nhật; không thêm seed. Giữ nguyên VARCHAR OTP và việc COMMENT parent/reply chưa có self-FK, không tự sửa nghiệp vụ/schema.

**Dự kiến23 bảng nghiệp vụ +2 bảng Testing =25 bảng.** Phần nghiệp vụ: **23 PK,34 FK,6 UNIQUE,10 CHECK,23 DEFAULT,3 index bổ sung**, ngoài index hỗ trợ PK/UNIQUE. Hai bảng control có thêm2 PK. [Inventory chi tiết](../sqlserver/gate-b-review/schema-review.json) chứa toàn bộ table/PK/FK, tên constraint/index, provenance và hash artifact.

## Artifact đã chuẩn bị

- [Batch02](../sqlserver/gate-b-review/02-reviewed-migrations.sql): bind `@RunId`; schema identity riêng; guard đúng instance/version/catalog/IP/port, ownership; chỉ nhận2 control tables và history trống sau batch01. 37 đoạn SQL nguồn được nhúng nguyên nội dung qua Unicode dynamic batches, giữ thứ tự GO; outer transaction/app lock; ghi đúng6 raw-UTF8 hashes, kiểm tra25 bảng và không có domain data. Refuse schema/history có sẵn hoặc chạy lần2, không repair/reset/replay.
- [Batch03](../sqlserver/gate-b-review/03-app-permissions.sql): operator đã duyệt; yêu cầu đúng identities/role/tables/history; DML riêng từng23 bảng cho role app; SELECT-only và deny ghi/ALTER/REFERENCES/ownership trên2 bảng control, hạn chế DDL cho app. Không tạo login/user, đổi mật khẩu, revoke quyền hiện có hoặc cấp role rộng. App/schema tách biệt; quyền public/inherited phải attest riêng.
- Tạo `testing/tools/prepare-gate-b-batches.py`: chỉ đọc SQL/manifest và sinh file review, không DB client, từ chối overwrite. Kiểm tra tĩnh delivery: source/origin hashes khớp, **37/37** đoạn nhúng khôi phục đúng nguồn, **23/23** DML targets khớp inventory. **PASS_STATIC_ONLY**, chưa chứng nhận cú pháp SQL/JPA/quyền thực tế. Cập nhật README; không chạy suite.
- Cấu hình Testing đã kiểm tra ở Task4 vẫn `ddl-auto=validate`, `sql.init.mode=never`; khóa live/migration không thay đổi.

## Cần phê duyệt trước thực thi

1. 00a đã PASS theo user; không chạy lại. Xác nhận secret telemetry/redaction và phê duyệt Batch01 với launcher được chuẩn bị; không tự thay đổi auditing/Windows/SQL config.
2. Phê duyệt batch01 riêng: run marker, schema login/user với secret bind an toàn, roles,2 control tables; app login `chaybook_test_login` phải được xác minh riêng, không tự tạo/reset. Nếu thiếu login hoặc có objects/quyền khác dự kiến thì dừng, trình scope mới; không drop/adopt/revoke tự động.
3. Phê duyệt batch02 DDL/history trên database rỗng đã chuẩn bị, rồi batch03 DCL object-scoped. Không tạo/xóa/restore database, không đổi production hoặc MSSQLSERVER. Không ghi secret vào artifact/report.
4. Thu evidence schema/history/ownership/effective rights bằng từng identity và validate-only JDBC/JPA; **Gate C live-run approval riêng** mới cho mở runner trong scope duyệt, smoke owned-fixture/cleanup trước P0. Migration-reentry vẫn cần quyết định riêng.

Sau khi đủ schema, quyền và Gate C: **133 case có thể bắt đầu kiểm chứng SQL (38 P0/94 P1/1 P2),63 method đã map**. Nhóm124 không vướng quyết định owner đã đăng ký;9 case ALLERGY-005, POST-015, MOD-015, AI-015, MEDIA-008, SEC-006/008/019/020 còn chờ quyết định. Không đồng nghĩa133 PASS; hiện chưa có SQL live PASS mới.

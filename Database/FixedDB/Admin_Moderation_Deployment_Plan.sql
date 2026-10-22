/* READ-ONLY deployment preparation. This file only emits commands for review.
   Do not execute the emitted BACKUP/RESTORE or the migration without approval.

   Approved deployment order:
   1. Stop application writers; record row counts and the emitted backup path.
   2. Execute BACKUP, VERIFYONLY and restore to the NEW recovery database below.
      Compare POST/VIDEO/AI_MODERATION row counts and legacy values on that copy.
   3. Execute Add_Status_And_Admin_Decision.sql on ChayBook_Project.
   4. Verify constraints/indexes, legacy data and application health before reopening writes.

   Recovery: SQL errors roll back the migration transaction automatically. If a
   later application check fails, keep writers stopped and roll back the application
   release; the migration is additive, so retain its audit table and new column.
   The verified restored copy is available for investigation/recovery. A production
   restore or cutover requires separate approval and reconciliation of newer data.
   Never DROP the audit table or overwrite decisions as a down-migration.

   AddAuthOtpChallenge.sql is independent of Post/Video moderation and is NOT part
   of this deployment. No historical Admin decisions/reasons will be fabricated.
   Legacy VIDEO.PUBLISHED becomes APPROVED (currently one row). Other unknown/null
   Post/Video states fail validation and roll back; review them before retrying.
*/
USE ChayBook_Project;
GO
SET NOCOUNT ON;

DECLARE @stamp VARCHAR(32) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 126), '-', ''), ':', ''), 'T', '_');
DECLARE @backupDir NVARCHAR(4000) = CONVERT(NVARCHAR(4000), SERVERPROPERTY('InstanceDefaultBackupPath'));
DECLARE @dataDir NVARCHAR(4000) = CONVERT(NVARCHAR(4000), SERVERPROPERTY('InstanceDefaultDataPath'));
DECLARE @logDir NVARCHAR(4000) = CONVERT(NVARCHAR(4000), SERVERPROPERTY('InstanceDefaultLogPath'));
IF @backupDir IS NULL OR @dataDir IS NULL OR @logDir IS NULL
    THROW 51010, 'Resolve SQL Server backup/data/log directories before deployment.', 1;

DECLARE @backup NVARCHAR(4000) = @backupDir + N'\ChayBook_Project_before_admin_moderation_' + @stamp + N'.bak';
DECLARE @recovery SYSNAME = N'ChayBook_Project_Recovery_' + @stamp;
DECLARE @moves NVARCHAR(MAX);
SELECT @moves = STRING_AGG(CONVERT(NVARCHAR(MAX),
    N'MOVE N''' + REPLACE(name, '''', '''''') + N''' TO N''' +
    REPLACE(CASE WHEN type = 1 THEN @logDir ELSE @dataDir END + N'\' + @recovery +
        N'_' + CONVERT(NVARCHAR(12), file_id) + CASE WHEN type = 1 THEN N'.ldf' ELSE N'.mdf' END, '''', '''''') + N''''), N', ')
FROM sys.database_files;

SELECT 1 AS step, N'BACKUP DATABASE [ChayBook_Project] TO DISK=N''' + REPLACE(@backup, '''', '''''') + N''' WITH COPY_ONLY, CHECKSUM;' AS command
UNION ALL SELECT 2, N'RESTORE VERIFYONLY FROM DISK=N''' + REPLACE(@backup, '''', '''''') + N''' WITH CHECKSUM;'
UNION ALL SELECT 3, N'USE master; RESTORE DATABASE ' + QUOTENAME(@recovery) + N' FROM DISK=N''' + REPLACE(@backup, '''', '''''') + N''' WITH ' + @moves + N', CHECKSUM;'
ORDER BY step;

SELECT DB_NAME() AS database_name,
    OBJECT_ID(N'dbo.ADMIN_CONTENT_DECISION', N'U') AS decision_table,
    COL_LENGTH(N'dbo.AI_MODERATION', N'moderation_status') AS moderation_status_column,
    (SELECT COUNT_BIG(*) FROM dbo.POST) AS post_count,
    (SELECT COUNT_BIG(*) FROM dbo.VIDEO) AS video_count,
    (SELECT COUNT_BIG(*) FROM dbo.AI_MODERATION) AS ai_moderation_count;

SELECT N'POST' AS content_type, status, COUNT_BIG(*) AS row_count FROM dbo.POST GROUP BY status
UNION ALL SELECT N'VIDEO', status, COUNT_BIG(*) FROM dbo.VIDEO GROUP BY status;
GO

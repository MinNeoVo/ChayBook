/* READ ONLY. Requires approval before running any referenced migration on main DB.
   1. Stop application writers. Execute the backup and restore-verification commands
      emitted by Admin_Moderation_Deployment_Plan.sql; verify the restored copy.
   2. Run AddAuthOtpChallenge.sql if AUTH_OTP_CHALLENGE is absent/incomplete.
   3. Run Add_Status_And_Admin_Decision.sql as reviewed in Task 1.
   4. Run Add_AI_Guest_Ownership.sql if guest_key is absent.
   5. Verify schema, existing row counts and application health before reopening writes.

   Impact: adds the OTP table, a nullable 64-character hash column on AI_CONVERSATION,
   and its owner constraint, in addition to the Task 1 changes. Existing conversations,
   messages and account data are retained. Legacy guest rows remain unclaimed; only
   newly created guests receive a server-issued HttpOnly identity cookie.

   Recovery: each migration rolls back its own SQL errors. If post-deploy checks fail,
   keep writers stopped, roll back the application release and retain the additive
   schema/audit data. Investigate on the verified restored copy. Replacing main DB or
   cutting over to that copy needs separate approval and reconciliation of newer data.
   Do not drop audit/history/OTP tables or guest ownership data as a down-migration.

   Provider configuration is separate: GEOAPIFY_ENABLED and GEOAPIFY_API_KEY are
   required for real Places. Automated tests use local Gemini/Geoapify stubs only.
*/
USE ChayBook_Project;
GO
SELECT DB_NAME() AS database_name,
    OBJECT_ID(N'dbo.AUTH_OTP_CHALLENGE',N'U') AS otp_table,
    OBJECT_ID(N'dbo.ADMIN_CONTENT_DECISION',N'U') AS decision_table,
    COL_LENGTH(N'dbo.AI_MODERATION',N'moderation_status') AS moderation_status_column,
    COL_LENGTH(N'dbo.AI_CONVERSATION',N'guest_key') AS guest_ownership_column;
SELECT N'USER' AS entity,COUNT_BIG(*) AS row_count FROM dbo.[USER]
UNION ALL SELECT N'POST',COUNT_BIG(*) FROM dbo.POST
UNION ALL SELECT N'VIDEO',COUNT_BIG(*) FROM dbo.VIDEO
UNION ALL SELECT N'AI_MODERATION',COUNT_BIG(*) FROM dbo.AI_MODERATION
UNION ALL SELECT N'AI_CONVERSATION',COUNT_BIG(*) FROM dbo.AI_CONVERSATION
UNION ALL SELECT N'AI_MESSAGE',COUNT_BIG(*) FROM dbo.AI_MESSAGE;
GO

import java.nio.file.*;
import java.sql.*;
import java.util.*;

/** No application DDL/DML. Reuses the explicitly guarded local test DB utilities. */
public class Task2DatabaseTest {
    static void migrate(Connection c) throws Exception {
        for(String file:List.of("AddAuthOtpChallenge.sql","Add_AI_Guest_Ownership.sql"))
            for(String batch:AdminTestDatabase.batches(Files.readString(Path.of("../Database/FixedDB",file))))
                AdminModerationDatabaseTest.run(c,batch);
    }
    public static void main(String[] args) throws Exception {
        try(var reader=Files.newBufferedReader(Path.of("src/main/resources/application.properties"))) { AdminModerationDatabaseTest.config.load(reader); }
        AdminModerationDatabaseTest.original=AdminModerationDatabaseTest.config.getProperty("spring.datasource.url");
        if(!AdminModerationDatabaseTest.original.matches("(?i)^jdbc:sqlserver://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?;.*")) throw new IllegalStateException("Local only");
        try(var main=DriverManager.getConnection(AdminModerationDatabaseTest.original,AdminModerationDatabaseTest.config.getProperty("spring.datasource.username"),AdminModerationDatabaseTest.config.getProperty("spring.datasource.password"))) {
            System.out.println("MAIN_SELECT_ONLY="+AdminModerationDatabaseTest.scalar(main,"SELECT CONCAT(DB_NAME(),';otp=',COALESCE(OBJECT_ID('AUTH_OTP_CHALLENGE'),0),';decision=',COALESCE(OBJECT_ID('ADMIN_CONTENT_DECISION'),0),';moderation=',COALESCE(COL_LENGTH('AI_MODERATION','moderation_status'),0),';guest=',COALESCE(COL_LENGTH('AI_CONVERSATION','guest_key'),0))"));
        }
        if(args.length==1 && args[0].equals("prepare")) {
            String db=Files.readString(AdminTestDatabase.ARTIFACTS.resolve("latest-test-db.txt")).strip(); AdminModerationDatabaseTest.guard(db);
            try(var c=AdminModerationDatabaseTest.connect(db)) { migrate(c); }
            System.out.println("PREPARED_ISOLATED_TASK2_DB="+db); return;
        }
        if(args.length==1 && args[0].equals("schema")) return;
        if(args.length==1 && args[0].equals("audit")) {
            String db=Files.readString(AdminTestDatabase.ARTIFACTS.resolve("task2-integration-db.txt")).strip(); AdminModerationDatabaseTest.guard(db);
            String state=Files.readString(AdminTestDatabase.ARTIFACTS.resolve(db).resolve("task2-api-state.json"));
            var id=java.util.regex.Pattern.compile("\"recipeId\"\\s*:\\s*(\\d+)").matcher(state);
            if(!id.find()) throw new IllegalStateException("No successful Recipe integration state");
            try(var c=AdminModerationDatabaseTest.connect(db)) {
                AdminModerationDatabaseTest.expect("1",c,"SELECT COUNT(*) FROM RECIPE WHERE recipe_id="+id.group(1)+" AND servings=3 AND difficulty='Medium' AND calories=234.5 AND protein=12.25 AND carbs=30.5 AND fat=7.75 AND status='DELETED'");
                AdminModerationDatabaseTest.expect("0",c,"SELECT COUNT(*) FROM AI_MESSAGE WHERE message LIKE '%FAIL_PROVIDER%'");
                AdminModerationDatabaseTest.expect("0",c,"SELECT COUNT(*) FROM AI_CONVERSATION WHERE user_id IS NULL AND (guest_key IS NULL OR LEN(guest_key)<>64)");
                AdminModerationDatabaseTest.expect("DELETED",c,"SELECT status FROM POST WHERE post_id=1");
                System.out.println("PASS Task2 SQL: recipe nutrition unchanged, guest ownership hashes persisted, provider failures rolled back, author deletion persisted");
            }
            return;
        }
        if(args.length!=0) throw new IllegalArgumentException("Expected prepare, schema or no argument");
        String db="ChayBook_ModerationMigration_IT_"+java.time.LocalDate.now().toString().replace("-","")+"_"+UUID.randomUUID().toString().substring(0,8);
        String restored=db+"_restore";
        AdminModerationDatabaseTest.guard(db); AdminModerationDatabaseTest.guard(restored);
        Path artifacts=AdminTestDatabase.ARTIFACTS.resolve(db); Files.createDirectories(artifacts);
        String backup=artifacts.resolve("before-task2.bak").toString().replace("'","''");
        try(var master=AdminModerationDatabaseTest.connect("master")) { AdminTestDatabase.execute(master,"CREATE DATABASE ["+db+"]"); }
        try(var c=AdminModerationDatabaseTest.connect(db)) {
            for(String batch:AdminTestDatabase.batches(Files.readString(Path.of("../Database/FixedDB/Fixed_CreateDatabase.sql"))))
                if(batch.toUpperCase(Locale.ROOT).startsWith("CREATE TABLE ")) AdminModerationDatabaseTest.run(c,batch);
            AdminModerationDatabaseTest.run(c,"INSERT INTO AI_CONVERSATION(title) VALUES(N'Legacy guest history')");
            AdminModerationDatabaseTest.run(c,"BACKUP DATABASE ["+db+"] TO DISK=N'"+backup+"' WITH COPY_ONLY,CHECKSUM");
            AdminModerationDatabaseTest.run(c,"RESTORE VERIFYONLY FROM DISK=N'"+backup+"' WITH CHECKSUM");
            AdminModerationDatabaseTest.run(c,"CREATE TABLE AUTH_OTP_CHALLENGE(dummy INT)");
            try { migrate(c); throw new AssertionError("Expected incompatible schema refusal"); }
            catch(SQLException e) { if(e.getErrorCode()!=51020) throw e; }
            AdminModerationDatabaseTest.expect("0",c,"SELECT @@TRANCOUNT");
            AdminModerationDatabaseTest.run(c,"DROP TABLE AUTH_OTP_CHALLENGE");
            // Inject a constraint-name collision after ADD COLUMN to prove DDL rollback.
            AdminModerationDatabaseTest.run(c,"CREATE TABLE test_collision(x INT CONSTRAINT CK_AI_CONVERSATION_GUEST_OWNER CHECK(x>0))");
            try { migrate(c); throw new AssertionError("Expected guest migration failure"); }
            catch(SQLException e) { if(e.getErrorCode()!=2714 && e.getErrorCode()!=1750) throw e; }
            AdminModerationDatabaseTest.expect("0",c,"SELECT COUNT(*) FROM sys.columns WHERE object_id=OBJECT_ID('AI_CONVERSATION') AND name='guest_key'");
            AdminModerationDatabaseTest.run(c,"DROP TABLE test_collision");
            migrate(c); migrate(c); migrate(c);
            AdminModerationDatabaseTest.expect("1",c,"SELECT COUNT(*) FROM AI_CONVERSATION WHERE guest_key IS NULL AND title=N'Legacy guest history'");
            AdminModerationDatabaseTest.run(c,"INSERT INTO AUTH_OTP_CHALLENGE(email,purpose,otp_hash,expires_at) VALUES('synthetic@admin-api-it.invalid','REGISTER','synthetic',DATEADD(minute,10,GETDATE()))");
            migrate(c);
            AdminModerationDatabaseTest.expect("1",c,"SELECT COUNT(*) FROM AUTH_OTP_CHALLENGE WHERE attempts=0 AND verified=0");
            AdminModerationDatabaseTest.reject(c,"INSERT INTO AUTH_OTP_CHALLENGE(email,purpose,otp_hash,expires_at) VALUES('invalid@admin-api-it.invalid','INVALID','synthetic',GETDATE())");
            AdminModerationDatabaseTest.reject(c,"UPDATE AI_CONVERSATION SET guest_key='invalid' WHERE conversation_id=1");
            System.out.println("PASS Task2 migrations: legacy preservation, repeated execution, OTP defaults/constraints, incompatible schema refusal, transactional DDL rollback");
        }
        try(var master=AdminModerationDatabaseTest.connect("master")) {
            String data=artifacts.resolve(restored+".mdf").toString().replace("'","''");
            String log=artifacts.resolve(restored+".ldf").toString().replace("'","''");
            AdminTestDatabase.execute(master,"RESTORE DATABASE ["+restored+"] FROM DISK=N'"+backup+"' WITH MOVE N'"+db+"' TO N'"+data+"',MOVE N'"+db+"_log' TO N'"+log+"',CHECKSUM");
        }
        try(var c=AdminModerationDatabaseTest.connect(restored)) {
            AdminModerationDatabaseTest.expect("Legacy guest history",c,"SELECT title FROM AI_CONVERSATION WHERE conversation_id=1");
            AdminModerationDatabaseTest.expect("0",c,"SELECT COUNT(*) FROM sys.tables WHERE name='AUTH_OTP_CHALLENGE'");
            AdminModerationDatabaseTest.expect("0",c,"SELECT COUNT(*) FROM sys.columns WHERE object_id=OBJECT_ID('AI_CONVERSATION') AND name='guest_key'");
            migrate(c);
            AdminModerationDatabaseTest.expect("1",c,"SELECT COUNT(*) FROM AI_CONVERSATION WHERE guest_key IS NULL");
            System.out.println("PASS Task2 recovery: CHECKSUM backup, VERIFYONLY, actual restore, legacy schema/data and successful re-migration");
        }
        try(var master=AdminModerationDatabaseTest.connect("master")) {
            for(String name:List.of(restored,db)) { AdminModerationDatabaseTest.guard(name); AdminTestDatabase.execute(master,"DROP DATABASE ["+name+"]"); }
        }
        Files.writeString(artifacts.resolve("results.txt"),"PASS Task2 migration and actual backup/restore verification; main DB SELECT only.\n");
        System.out.println("EVIDENCE="+artifacts);
    }
}

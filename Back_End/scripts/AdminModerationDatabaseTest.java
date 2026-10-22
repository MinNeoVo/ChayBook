import java.nio.file.*;
import java.sql.*;
import java.util.*;

/** JDBC regression for the migration and audit records. Compile with AdminTestDatabase.java.
 * The application database is SELECT-only; all mutations require unique, guarded test names.
 */
public class AdminModerationDatabaseTest {
    static Properties config = new Properties();
    static String original;
    static String migration;
    static Connection connect(String database) throws SQLException {
        return DriverManager.getConnection(original.replaceFirst("(?i)(;databaseName=)[^;]+", "$1" + database),
                config.getProperty("spring.datasource.username"), config.getProperty("spring.datasource.password"));
    }
    static void guard(String database) {
        if (!database.matches("ChayBook_(AdminApi|ModerationMigration)_IT_[0-9]{8}_[a-f0-9]{8}(_restore)?"))
            throw new IllegalStateException("Refusing mutation outside an isolated test database");
    }
    static void run(Connection c, String sql) throws SQLException {
        guard(c.getCatalog()); AdminTestDatabase.execute(c, sql);
    }
    static String scalar(Connection c, String sql) throws SQLException {
        try (var s=c.createStatement(); var r=s.executeQuery(sql)) { r.next(); return r.getString(1); }
    }
    static void expect(String value, Connection c, String sql) throws SQLException {
        String actual=scalar(c,sql);
        if (!Objects.equals(value,actual)) throw new AssertionError(sql + " expected=" + value + " actual=" + actual);
    }
    static void migrate(Connection c) throws SQLException {
        for (String batch: AdminTestDatabase.batches(migration))
            if (!batch.toUpperCase(Locale.ROOT).startsWith("USE ")) run(c,batch);
    }
    static void reject(Connection c, String sql) throws SQLException {
        try { run(c,sql); throw new AssertionError("Expected SQL constraint rejection"); }
        catch (SQLException e) { if (e.getErrorCode()!=547 && e.getErrorCode()!=515) throw e; }
    }
    static String applicationSnapshot() throws SQLException {
        // Never issue DDL, DML, USE or BACKUP through this application connection.
        try (var c=DriverManager.getConnection(original,config.getProperty("spring.datasource.username"),config.getProperty("spring.datasource.password"))) {
            return scalar(c,"SELECT CONCAT(DB_NAME(),';audit=',COALESCE(OBJECT_ID('dbo.ADMIN_CONTENT_DECISION'),0),';aiStatus=',COALESCE(COL_LENGTH('dbo.AI_MODERATION','moderation_status'),0),';otp=',COALESCE(OBJECT_ID('dbo.AUTH_OTP_CHALLENGE'),0),';posts=',(SELECT COUNT_BIG(*) FROM POST),';videos=',(SELECT COUNT_BIG(*) FROM VIDEO),';ai=',(SELECT COUNT_BIG(*) FROM AI_MODERATION))");
        }
    }
    public static void main(String[] args) throws Exception {
        try(var reader=Files.newBufferedReader(Path.of("src/main/resources/application.properties"))) { config.load(reader); }
        original=config.getProperty("spring.datasource.url");
        if (!original.matches("(?i)^jdbc:sqlserver://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?;.*;?databaseName=[^;]+.*"))
            throw new IllegalStateException("Only local SQL Server is supported");
        migration=Files.readString(Path.of("../Database/FixedDB/Add_Status_And_Admin_Decision.sql"));
        String before=applicationSnapshot();
        System.out.println("APPLICATION_SELECT_ONLY="+before);
        if (args.length==1 && args[0].equals("schema")) {
            try(var c=DriverManager.getConnection(original,config.getProperty("spring.datasource.username"),config.getProperty("spring.datasource.password"))) {
                for(String table:List.of("POST","VIDEO")) {
                    try(var s=c.createStatement(); var r=s.executeQuery("SELECT COALESCE(status,'NULL'),COUNT_BIG(*) FROM "+table+" GROUP BY status ORDER BY status")) {
                        while(r.next()) System.out.println("APPLICATION_STATUS_SELECT_ONLY="+table+";"+r.getString(1)+";"+r.getLong(2));
                    }
                }
            }
            return;
        }
        if (args.length==1 && args[0].equals("audit")) { audit(); return; }
        if (args.length==1 && args[0].equals("migrate-test")) {
            String db=Files.readString(AdminTestDatabase.ARTIFACTS.resolve("latest-test-db.txt")).strip(); guard(db);
            try(var c=connect(db)) { migrate(c); }
            System.out.println("PASS latest migration applied only to isolated test database "+db);
            return;
        }
        if (args.length==1 && args[0].equals("plan")) {
            StringBuilder output=new StringBuilder();
            try(var c=DriverManager.getConnection(original,config.getProperty("spring.datasource.username"),config.getProperty("spring.datasource.password"))) {
                for(String batch:AdminTestDatabase.batches(Files.readString(Path.of("../Database/FixedDB/Admin_Moderation_Deployment_Plan.sql")))) {
                    if(batch.toUpperCase(Locale.ROOT).startsWith("USE ")) continue;
                    try(var statement=c.createStatement()) {
                        boolean result=statement.execute(batch);
                        do {
                            if(result) try(var rows=statement.getResultSet()) {
                                while(rows.next()) {
                                    for(int i=1; i<=rows.getMetaData().getColumnCount(); i++) output.append(rows.getString(i)).append(" | ");
                                    output.append('\n');
                                }
                            }
                            result=statement.getMoreResults();
                        } while(result || statement.getUpdateCount()!=-1);
                    }
                }
            }
            Path plan=AdminTestDatabase.ARTIFACTS.resolve("production-moderation-plan.txt");
            Files.writeString(plan,output);
            System.out.println("PASS SELECT-only deployment plan compiled; generated commands were NOT executed: "+plan);
            return;
        }
        if (args.length!=0) throw new IllegalArgumentException("Expected no arguments, schema, plan or audit");
        String db="ChayBook_ModerationMigration_IT_"+java.time.LocalDate.now().toString().replace("-","")+"_"+UUID.randomUUID().toString().substring(0,8);
        String restored=db+"_restore"; guard(db); guard(restored);
        Path artifacts=AdminTestDatabase.ARTIFACTS.resolve(db); Files.createDirectories(artifacts);
        String backup=artifacts.resolve("before-migration.bak").toString();
        try(var master=connect("master")) {
            AdminTestDatabase.execute(master,"CREATE DATABASE ["+db+"]");
        }
        try(var c=connect(db)) {
            for(String batch:AdminTestDatabase.batches(Files.readString(Path.of("../Database/FixedDB/Fixed_CreateDatabase.sql"))))
                if(batch.toUpperCase(Locale.ROOT).startsWith("CREATE TABLE ")) run(c,batch);
            run(c,"INSERT INTO [USER](username,email,password_hash,role,status) VALUES('migration_admin','migration@admin-api-it.invalid','synthetic','ADMIN','ACTIVE')");
            run(c,"INSERT INTO POST(user_id,title,content,status) VALUES(1,N'Legacy approved',N'Legacy content','APPROVED'),(1,N'Legacy removed',NULL,'REMOVED'),(1,N'Legacy deleted',NULL,'DELETED')");
            run(c,"INSERT INTO VIDEO(created_by,title,video_url,status) VALUES(1,N'Legacy video','synthetic.webm','PUBLISHED')");
            run(c,"INSERT INTO AI_MODERATION(post_id,result,reason,confidence,reviewed_by,reviewed_at) VALUES(1,N'SAFE',N'Legacy AI reason',0.95,1,CONVERT(datetime,'20260101')),(2,NULL,NULL,NULL,NULL,NULL)");
            // A restorable pre-migration backup is the recovery plan; no destructive down-migration.
            run(c,"BACKUP DATABASE ["+db+"] TO DISK=N'"+backup.replace("'","''")+"' WITH COPY_ONLY, CHECKSUM");
            run(c,"RESTORE VERIFYONLY FROM DISK=N'"+backup.replace("'","''")+"' WITH CHECKSUM");
            migrate(c);
            expect("APPROVED",c,"SELECT status FROM VIDEO WHERE video_id=1");
            expect("COMPLETED",c,"SELECT moderation_status FROM AI_MODERATION WHERE moderation_id=1");
            run(c,"ALTER TABLE AI_MODERATION DROP CONSTRAINT DF_AI_MODERATION_moderation_status");
            run(c,"ALTER TABLE AI_MODERATION ADD CONSTRAINT Legacy_AI_Status_Default DEFAULT 'PROCESSING' FOR moderation_status");
            migrate(c);
            expect("1",c,"SELECT COUNT(*) FROM sys.default_constraints WHERE parent_object_id=OBJECT_ID('AI_MODERATION') AND parent_column_id=COLUMNPROPERTY(OBJECT_ID('AI_MODERATION'),'moderation_status','ColumnId')");
            run(c,"ALTER TABLE POST DROP CONSTRAINT CK_POST_MODERATION_STATUS");
            run(c,"ALTER TABLE VIDEO DROP CONSTRAINT CK_VIDEO_MODERATION_STATUS");
            run(c,"UPDATE POST SET status='UNKNOWN' WHERE post_id=1");
            run(c,"UPDATE VIDEO SET status='PUBLISHED' WHERE video_id=1");
            try { migrate(c); throw new AssertionError("Expected invalid legacy status to roll back"); }
            catch(SQLException expected) { if(expected.getErrorCode()!=547) throw expected; }
            expect("PUBLISHED",c,"SELECT status FROM VIDEO WHERE video_id=1");
            run(c,"UPDATE POST SET status='APPROVED' WHERE post_id=1");
            migrate(c);
            expect("APPROVED",c,"SELECT status FROM VIDEO WHERE video_id=1");
            expect("FAILED",c,"SELECT moderation_status FROM AI_MODERATION WHERE moderation_id=2");
            expect("Legacy AI reason",c,"SELECT reason FROM AI_MODERATION WHERE moderation_id=1");
            expect("1",c,"SELECT reviewed_by FROM AI_MODERATION WHERE moderation_id=1");
            expect("0",c,"SELECT COUNT(*) FROM ADMIN_CONTENT_DECISION"); // Never invent legacy Admin decisions.
            run(c,"INSERT INTO ADMIN_CONTENT_DECISION(post_id,admin_id,previous_status,decision,reason) VALUES(1,1,'APPROVED','REJECTED',N'Admin reason')");
            migrate(c); migrate(c);
            expect("1",c,"SELECT COUNT(*) FROM ADMIN_CONTENT_DECISION");
            expect("3",c,"SELECT COUNT(*) FROM POST");
            expect("REMOVED",c,"SELECT status FROM POST WHERE post_id=2");
            expect("DELETED",c,"SELECT status FROM POST WHERE post_id=3");
            expect("3",c,"SELECT COUNT(*) FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID('ADMIN_CONTENT_DECISION') AND is_disabled=0 AND is_not_trusted=0");
            expect("3",c,"SELECT COUNT(*) FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('ADMIN_CONTENT_DECISION') AND is_disabled=0 AND is_not_trusted=0");
            expect("3",c,"SELECT COUNT(*) FROM sys.indexes WHERE object_id=OBJECT_ID('ADMIN_CONTENT_DECISION') AND name LIKE 'IX_ADMIN_CONTENT_DECISION_%'");
            reject(c,"INSERT INTO ADMIN_CONTENT_DECISION(post_id,admin_id,previous_status,decision) VALUES(1,1,'PENDING','REJECTED')");
            reject(c,"INSERT INTO ADMIN_CONTENT_DECISION(post_id,video_id,admin_id,previous_status,decision) VALUES(1,1,1,'PENDING','APPROVED')");
            reject(c,"INSERT INTO ADMIN_CONTENT_DECISION(post_id,admin_id,previous_status,decision) VALUES(99999,1,'PENDING','APPROVED')");
            reject(c,"INSERT INTO ADMIN_CONTENT_DECISION(post_id,admin_id,previous_status,decision) VALUES(1,99999,'PENDING','APPROVED')");
            reject(c,"UPDATE AI_MODERATION SET moderation_status='INVALID' WHERE moderation_id=1");
            reject(c,"UPDATE AI_MODERATION SET moderation_status=NULL WHERE moderation_id=1");
            reject(c,"UPDATE VIDEO SET status='PUBLISHED' WHERE video_id=1");
            reject(c,"UPDATE POST SET status='DENIED' WHERE post_id=1");
            reject(c,"UPDATE POST SET status=NULL WHERE post_id=1");
            run(c,"INSERT INTO AI_MODERATION(post_id) VALUES(1)");
            expect("PROCESSING",c,"SELECT moderation_status FROM AI_MODERATION WHERE moderation_id=3");
            // Failure inside the migration must roll back even the backfill.
            run(c,"ALTER TABLE AI_MODERATION DROP CONSTRAINT CK_AI_MODERATION_moderation_status");
            run(c,"ALTER TABLE AI_MODERATION ALTER COLUMN moderation_status NVARCHAR(20) NULL");
            run(c,"UPDATE AI_MODERATION SET moderation_status=CASE WHEN moderation_id=1 THEN 'INVALID' ELSE NULL END");
            try { migrate(c); throw new AssertionError("Expected migration rollback"); }
            catch(SQLException expected) { if(expected.getErrorCode()!=547) throw expected; }
            expect("2",c,"SELECT COUNT(*) FROM AI_MODERATION WHERE moderation_status IS NULL");
            expect("0",c,"SELECT @@TRANCOUNT");
            System.out.println("PASS migration: legacy data, three runs, audit preservation, constraints, defaults, transactional rollback");
        }
        try(var master=connect("master")) {
            // Every destination is a new test name; no REPLACE and no production file paths.
            String data=artifacts.resolve(restored+".mdf").toString().replace("'","''");
            String log=artifacts.resolve(restored+"_log.ldf").toString().replace("'","''");
            AdminTestDatabase.execute(master,"RESTORE DATABASE ["+restored+"] FROM DISK=N'"+backup.replace("'","''")+"' WITH MOVE N'"+db+"' TO N'"+data+"', MOVE N'"+db+"_log' TO N'"+log+"', CHECKSUM");
        }
        try(var c=connect(restored)) {
            expect("3",c,"SELECT COUNT(*) FROM POST");
            expect("2",c,"SELECT COUNT(*) FROM AI_MODERATION");
            expect("0",c,"SELECT COUNT(*) FROM sys.tables WHERE name='ADMIN_CONTENT_DECISION'");
            expect("0",c,"SELECT COUNT(*) FROM sys.columns WHERE object_id=OBJECT_ID('AI_MODERATION') AND name='moderation_status'");
            expect("Legacy AI reason",c,"SELECT reason FROM AI_MODERATION WHERE moderation_id=1");
            expect("PUBLISHED",c,"SELECT status FROM VIDEO WHERE video_id=1");
            migrate(c);
            expect("APPROVED",c,"SELECT status FROM VIDEO WHERE video_id=1");
            expect("COMPLETED",c,"SELECT moderation_status FROM AI_MODERATION WHERE moderation_id=1");
            System.out.println("PASS recovery: backup CHECKSUM, VERIFYONLY, real restore, old data and schema, successful re-migration");
        }
        String after=applicationSnapshot();
        if(!before.equals(after)) throw new AssertionError("Application SELECT snapshot changed during test");
        Files.writeString(artifacts.resolve("results.txt"),"PASS migration + recovery\nApplication SELECT snapshot unchanged: "+after+"\nBackup: "+backup+"\n");
        System.out.println("PASS application schema/count snapshot unchanged; evidence="+artifacts);
        // Keep only the backup/results. Remove databases created by this exact run.
        try(var master=connect("master")) {
            for(String name:List.of(restored,db)) { guard(name); AdminTestDatabase.execute(master,"DROP DATABASE ["+name+"]"); }
        }
    }
    static void audit() throws Exception {
        String db=Files.readString(AdminTestDatabase.ARTIFACTS.resolve("latest-test-db.txt")).strip(); guard(db);
        try(var c=connect(db)) {
            expect("0",c,"SELECT COUNT(*) FROM ADMIN_CONTENT_DECISION WHERE admin_id NOT IN (1,4) OR decided_at IS NULL OR previous_status IS NULL OR (decision='REJECTED' AND NULLIF(LTRIM(RTRIM(reason)),N'') IS NULL)");
            for(String table:List.of("POST","VIDEO")) {
                String fk=table.equals("POST")?"post_id":"video_id";
                expect("0",c,"SELECT COUNT(*) FROM (SELECT previous_status,LAG(decision) OVER(PARTITION BY "+fk+" ORDER BY decision_id) last_decision FROM ADMIN_CONTENT_DECISION WHERE "+fk+" IS NOT NULL) d WHERE last_decision IS NOT NULL AND previous_status<>last_decision");
                expect("REMOVED",c,"SELECT status FROM "+table+" WHERE "+fk+"=2");
            }
            expect("AI-only assessment; not an admin rejection reason",c,"SELECT reason FROM AI_MODERATION WHERE post_id=1");
            for(String column:List.of("post_id","video_id")) {
                expect("1",c,"SELECT COUNT(*) FROM ADMIN_CONTENT_DECISION WHERE "+column+"=6");
            }
            expect("Resubmission feedback",c,"SELECT reason FROM ADMIN_CONTENT_DECISION WHERE post_id=7 AND decision='REJECTED'");
            expect("PENDING",c,"SELECT status FROM POST WHERE post_id=7");
            System.out.println("PASS SQL audit: authenticated Admin, previous/next status chain, timestamps, rejection reasons, original AI reason preserved");
        }
    }
}

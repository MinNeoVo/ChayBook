import java.nio.file.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import org.springframework.security.crypto.bcrypt.BCrypt;

/** Creates a NEW, uniquely named local integration DB. Never runs the rebuild
 * script against the configured application DB and never drops an existing DB.
 * Run from Back_End with the existing JDBC and spring-security-crypto jars.
 */
public class AdminTestDatabase {
    static final Path ARTIFACTS = Path.of("target", "admin-verification").toAbsolutePath();

    public static void main(String[] args) throws Exception {
        Properties config = new Properties();
        try (var reader = Files.newBufferedReader(Path.of("src/main/resources/application.properties"))) { config.load(reader); }
        String originalUrl = config.getProperty("spring.datasource.url");
        if (!originalUrl.matches("(?i)^jdbc:sqlserver://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?;.*")
                || !originalUrl.matches("(?i).*;databaseName=[^;]+.*")) {
            throw new IllegalStateException("An explicit local SQL Server database is required");
        }
        String run = UUID.randomUUID().toString().replace("-", "");
        String database = "ChayBook_AdminApi_IT_" + LocalDate.now().toString().replace("-", "") + "_" + run.substring(0, 8);
        String testUrl = originalUrl.replaceFirst("(?i)(;databaseName=)[^;]+", "$1" + database);
        String masterUrl = originalUrl.replaceFirst("(?i)(;databaseName=)[^;]+", "$1master");
        String username = config.getProperty("spring.datasource.username");
        String password = config.getProperty("spring.datasource.password");
        if (args.length > 0) {
            if (args.length != 1 || !Set.of("stale-admin-active", "stale-admin-disabled").contains(args[0])) {
                throw new IllegalArgumentException("Only named synthetic-admin fixture operations are supported");
            }
            String ownedDatabase = Files.readString(ARTIFACTS.resolve("latest-test-db.txt")).strip();
            if (!ownedDatabase.matches("ChayBook_AdminApi_IT_[0-9]{8}_[a-f0-9]{8}")) throw new IllegalStateException("Not an isolated test database");
            String ownedUrl = originalUrl.replaceFirst("(?i)(;databaseName=)[^;]+", "$1" + ownedDatabase);
            try (var connection = DriverManager.getConnection(ownedUrl, username, password)) {
                if (!ownedDatabase.equals(connection.getCatalog())) throw new IllegalStateException("Fixture database mismatch");
                try (var statement = connection.prepareStatement("UPDATE [USER] SET status=? WHERE user_id=4 AND email='stale@admin-api-it.invalid' AND role='ADMIN'")) {
                    statement.setString(1, args[0].endsWith("-disabled") ? "DISABLED" : "ACTIVE");
                    if (statement.executeUpdate() != 1) throw new IllegalStateException("Synthetic admin fixture not found");
                }
            }
            System.out.println("SYNTHETIC_ADMIN_FIXTURE_UPDATED=" + ownedDatabase);
            return;
        }
        try (var connection = DriverManager.getConnection(masterUrl, username, password); var statement = connection.createStatement()) {
            var permission = statement.executeQuery("SELECT HAS_PERMS_BY_NAME(NULL,NULL,'CREATE ANY DATABASE')");
            permission.next();
            if (permission.getInt(1) != 1) throw new IllegalStateException("Cannot create an isolated database; no writes attempted to the application DB");
            try (var check = connection.prepareStatement("SELECT DB_ID(?)")) {
                check.setString(1, database);
                var result = check.executeQuery(); result.next();
                if (result.getObject(1) != null) throw new IllegalStateException("Refusing to reuse an existing database");
            }
            statement.execute("CREATE DATABASE [" + database + "]");
        }
        Files.createDirectories(ARTIFACTS);
        Path runDirectory = ARTIFACTS.resolve(database);
        Files.createDirectory(runDirectory);
        Files.writeString(ARTIFACTS.resolve("latest-test-db.txt"), database);
        String testPassword = UUID.randomUUID().toString();
        String email = "admin-" + run.substring(0, 8) + "@admin-api-it.invalid";
        try (var connection = DriverManager.getConnection(testUrl, username, password)) {
            if (!database.equals(connection.getCatalog())) throw new IllegalStateException("Database isolation check failed");
            String schema = Files.readString(Path.of("..", "Database", "FixedDB", "Fixed_CreateDatabase.sql"));
            int tables = 0;
            for (String batch : batches(schema)) {
                // Deliberately discard USE, DROP, PRINT and verification SELECT batches.
                if (batch.toUpperCase(Locale.ROOT).startsWith("CREATE TABLE ")) {
                    execute(connection, batch); tables++;
                }
            }
            if (tables != 21) throw new IllegalStateException("Expected 21 CREATE TABLE batches, found " + tables);
            String migrations = Files.readString(Path.of("..", "Database", "FixedDB", "UpdateComment_Category_Recipe.sql"));
            for (String batch : batches(migrations)) {
                if (batch.toUpperCase(Locale.ROOT).startsWith("IF NOT EXISTS")) execute(connection, batch);
            }
            String hash = BCrypt.hashpw(testPassword, BCrypt.gensalt());
            addUser(connection, "it_admin_" + run.substring(0, 8), email, hash, "ADMIN", "ACTIVE");
            addUser(connection, "it_user", "user@admin-api-it.invalid", hash, "USER", "ACTIVE");
            addUser(connection, "it_disabled", "disabled@admin-api-it.invalid", hash, "USER", "DISABLED");
            addUser(connection, "it_stale_admin", "stale@admin-api-it.invalid", hash, "ADMIN", "ACTIVE");
            for (int index = 5; index <= 16; index++) addUser(connection, "it_member_" + index, "member" + index + "@admin-api-it.invalid", hash, "USER", "ACTIVE");
            execute(connection, "INSERT INTO CATEGORY(name,type,status) VALUES (N'IT Articles','ARTICLE','ACTIVE'),(N'IT Recipes','RECIPE','ACTIVE'),(N'IT Posts','POST','ACTIVE')");
            execute(connection, "INSERT INTO INGREDIENT(name,description) VALUES (N'IT Tofu',N'Test ingredient'),(N'IT Mushroom',N'Test ingredient')");
            for (int index = 1; index <= 8; index++) execute(connection,
                    "INSERT INTO ARTICLE(category_id,created_by,title,content,cover_image,status,created_at,updated_at) VALUES(1,1,?,?,?,'PUBLISHED',DATEADD(day,?,CONVERT(datetime,'20260101')),GETDATE())",
                    "IT Article " + index, "Nội dung tiếng Việt " + index, "/uploads/posts/fixture.png", index);
            for (int index = 1; index <= 12; index++) {
                execute(connection, "INSERT INTO RECIPE(category_id,created_by,name,description,image_url,prep_time,cook_time,servings,instructions,calories,protein,carbs,fat,status) VALUES(2,1,?,N'Test soup','/uploads/posts/fixture.png',5,10,2,N'Cook gently',200,15,20,8,'ACTIVE')", "IT Recipe " + index);
                execute(connection, "INSERT INTO RECIPE_INGREDIENT(recipe_id,ingredient_id,quantity,unit) VALUES(?,1,100,N'g')", index);
            }
            for (String status : List.of("PENDING", "APPROVED", "REJECTED", "REMOVED")) {
                execute(connection, "INSERT INTO POST(user_id,category_id,title,content,image_url,status) VALUES(2,3,?,?,?,?)", "IT Post " + status, "Nội dung đầy đủ tiếng Việt. ".repeat(40), "/uploads/posts/fixture.png", status);
                execute(connection, "INSERT INTO VIDEO(category_id,created_by,title,description,video_url,thumbnail_url,status) VALUES(3,2,?,?,?, ?,?)", "IT Video " + status, "Mô tả đầy đủ. ".repeat(60), "/uploads/posts/fixture.webm", "/uploads/posts/fixture.png", status);
            }
            execute(connection, "INSERT INTO POST_INTERACTION(post_id,user_id,type) VALUES(2,2,'LIKE'),(2,5,'BOOKMARK')");
            execute(connection, "INSERT INTO [COMMENT](post_id,user_id,content,status) VALUES(2,2,N'IT comment','ACTIVE')");
            execute(connection, "INSERT INTO AI_CONVERSATION(user_id,title) VALUES(2,N'IT conversation')");
            execute(connection, "INSERT INTO AI_MESSAGE(conversation_id,sender,message) VALUES(1,'USER',N'IT prompt'),(1,'AI',N'IT reply')");
        }
        Path media = runDirectory.resolve("uploads/posts"); Files.createDirectories(media);
        Files.write(media.resolve("fixture.png"), Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII="));
        String manifest = "{\n  \"database\": " + json(database) + ",\n  \"url\": " + json(testUrl)
                + ",\n  \"runDirectory\": " + json(runDirectory.toString()) + ",\n  \"adminEmail\": " + json(email)
                + ",\n  \"password\": " + json(testPassword) + ",\n  \"api\": \"http://localhost:8082\"\n}\n";
        Files.writeString(runDirectory.resolve("test-manifest.json"), manifest);
        System.out.println("ISOLATED_DATABASE=" + database);
        System.out.println("SCHEMA_TABLES=21; SYNTHETIC_DATA_ONLY=true; ORIGINAL_DATABASE_UNCHANGED=true");
        System.out.println("MANIFEST=" + runDirectory.resolve("test-manifest.json"));
    }

    static List<String> batches(String sql) {
        String clean = sql.replaceAll("(?s)/\\*.*?\\*/", "").replaceAll("(?m)^\\s*--.*$", "");
        return Arrays.stream(clean.split("(?im)^\\s*GO\\s*$")).map(String::trim).filter(value -> !value.isBlank()).toList();
    }
    static void addUser(Connection c, String name, String email, String hash, String role, String status) throws SQLException {
        execute(c, "INSERT INTO [USER](username,email,password_hash,full_name,role,status) VALUES(?,?,?,N'Integration test',?,?)", name, email, hash, role, status);
    }
    static void execute(Connection connection, String sql, Object... parameters) throws SQLException {
        try (var statement = connection.prepareStatement(sql)) {
            for (int index = 0; index < parameters.length; index++) {
                Object value = parameters[index];
                if (value instanceof String text) statement.setNString(index + 1, text); else statement.setObject(index + 1, value);
            }
            statement.execute();
        }
    }
    static String json(String value) { return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""; }
}

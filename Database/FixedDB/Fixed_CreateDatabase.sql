
USE ChayBook_Project;
GO

/* =========================================================
   CHAYBOOK - DATABASE REBUILD
   21 TABLES
   All text columns use NVARCHAR
   WARNING: Existing tables and their data will be deleted.
   ========================================================= */

-- =========================================================
-- 00. DROP EXISTING TABLES
-- Drop child tables before parent tables
-- =========================================================

DROP TABLE IF EXISTS AI_MODERATION;
DROP TABLE IF EXISTS AI_RECOGNITION_ITEM;
DROP TABLE IF EXISTS AI_MESSAGE;
DROP TABLE IF EXISTS MEAL_PLAN_ITEM;
DROP TABLE IF EXISTS POST_INTERACTION;
DROP TABLE IF EXISTS COMMENT;
DROP TABLE IF EXISTS RECIPE_INGREDIENT;
DROP TABLE IF EXISTS USER_ALLERGY;
DROP TABLE IF EXISTS ALLERGY_INGREDIENT;
DROP TABLE IF EXISTS AI_RECOGNITION;
DROP TABLE IF EXISTS AI_CONVERSATION;
DROP TABLE IF EXISTS MEAL_PLAN;
DROP TABLE IF EXISTS BMI_RECORD;
DROP TABLE IF EXISTS ARTICLE;
DROP TABLE IF EXISTS VIDEO;
DROP TABLE IF EXISTS POST;
DROP TABLE IF EXISTS RECIPE;
DROP TABLE IF EXISTS INGREDIENT;
DROP TABLE IF EXISTS ALLERGY;
DROP TABLE IF EXISTS CATEGORY;
DROP TABLE IF EXISTS [USER];
GO


-- =========================================================
-- 01. USER
-- =========================================================

CREATE TABLE [USER] (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255),
    avatar_url NVARCHAR(255),
    role NVARCHAR(20) NOT NULL DEFAULT N'USER',
    status NVARCHAR(20) NOT NULL DEFAULT N'ACTIVE',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,

    CONSTRAINT CK_USER_ROLE
        CHECK (role IN (N'USER', N'ADMIN')),

    CONSTRAINT CK_USER_STATUS
        CHECK (status IN (N'ACTIVE', N'DISABLED'))
);
GO


-- =========================================================
-- 02. CATEGORY
-- =========================================================

CREATE TABLE CATEGORY (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(50),
    description NVARCHAR(MAX)
);
GO


-- =========================================================
-- 03. ALLERGY
-- =========================================================

CREATE TABLE ALLERGY (
    allergy_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE
);
GO


-- =========================================================
-- 04. INGREDIENT
-- =========================================================

CREATE TABLE INGREDIENT (
    ingredient_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    description NVARCHAR(MAX)
);
GO


-- =========================================================
-- 05. ARTICLE
-- =========================================================

CREATE TABLE ARTICLE (
    article_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT,
    created_by INT,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX),
    cover_image NVARCHAR(255),
    status NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,

    CONSTRAINT FK_ARTICLE_CATEGORY
        FOREIGN KEY (category_id)
        REFERENCES CATEGORY(category_id),

    CONSTRAINT FK_ARTICLE_USER
        FOREIGN KEY (created_by)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- 06. RECIPE
-- =========================================================

CREATE TABLE RECIPE (
    recipe_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT,
    created_by INT,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    image_url NVARCHAR(255),
    prep_time INT,
    cook_time INT,
    servings INT,
    difficulty NVARCHAR(50),
    instructions NVARCHAR(MAX),
    calories FLOAT,
    protein FLOAT,
    carbs FLOAT,
    fat FLOAT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,

    CONSTRAINT FK_RECIPE_CATEGORY
        FOREIGN KEY (category_id)
        REFERENCES CATEGORY(category_id),

    CONSTRAINT FK_RECIPE_USER
        FOREIGN KEY (created_by)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- 07. VIDEO
-- =========================================================

CREATE TABLE VIDEO (
    video_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT,
    created_by INT,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    video_url NVARCHAR(255) NOT NULL,
    thumbnail_url NVARCHAR(255),
    duration INT,
    status NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,

    CONSTRAINT FK_VIDEO_CATEGORY
        FOREIGN KEY (category_id)
        REFERENCES CATEGORY(category_id),

    CONSTRAINT FK_VIDEO_USER
        FOREIGN KEY (created_by)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- 08. POST
-- =========================================================

CREATE TABLE POST (
    post_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    category_id INT,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX),
    image_url NVARCHAR(255),
    status NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,

    CONSTRAINT FK_POST_USER
        FOREIGN KEY (user_id)
        REFERENCES [USER](user_id),

    CONSTRAINT FK_POST_CATEGORY
        FOREIGN KEY (category_id)
        REFERENCES CATEGORY(category_id)
);
GO


-- =========================================================
-- 09. COMMENT
-- =========================================================

CREATE TABLE COMMENT (
    comment_id INT IDENTITY(1,1) PRIMARY KEY,
    post_id INT,
    user_id INT,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,

    CONSTRAINT FK_COMMENT_POST
        FOREIGN KEY (post_id)
        REFERENCES POST(post_id),

    CONSTRAINT FK_COMMENT_USER
        FOREIGN KEY (user_id)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- 10. POST_INTERACTION
-- =========================================================

CREATE TABLE POST_INTERACTION (
    interaction_id INT IDENTITY(1,1) PRIMARY KEY,
    post_id INT,
    user_id INT,
    type NVARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT UQ_POST_INTERACTION
        UNIQUE (post_id, user_id, type),

    CONSTRAINT FK_INTERACTION_POST
        FOREIGN KEY (post_id)
        REFERENCES POST(post_id),

    CONSTRAINT FK_INTERACTION_USER
        FOREIGN KEY (user_id)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- 11. USER_ALLERGY
-- =========================================================

CREATE TABLE USER_ALLERGY (
    user_id INT NOT NULL,
    allergy_id INT NOT NULL,

    CONSTRAINT PK_USER_ALLERGY
        PRIMARY KEY (user_id, allergy_id),

    CONSTRAINT FK_UA_USER
        FOREIGN KEY (user_id)
        REFERENCES [USER](user_id),

    CONSTRAINT FK_UA_ALLERGY
        FOREIGN KEY (allergy_id)
        REFERENCES ALLERGY(allergy_id)
);
GO


-- =========================================================
-- 12. RECIPE_INGREDIENT
-- =========================================================

CREATE TABLE RECIPE_INGREDIENT (
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity FLOAT,
    unit NVARCHAR(50),

    CONSTRAINT PK_RECIPE_INGREDIENT
        PRIMARY KEY (recipe_id, ingredient_id),

    CONSTRAINT FK_RI_RECIPE
        FOREIGN KEY (recipe_id)
        REFERENCES RECIPE(recipe_id),

    CONSTRAINT FK_RI_INGREDIENT
        FOREIGN KEY (ingredient_id)
        REFERENCES INGREDIENT(ingredient_id)
);
GO


-- =========================================================
-- 13. ALLERGY_INGREDIENT
-- =========================================================

CREATE TABLE ALLERGY_INGREDIENT (
    allergy_id INT NOT NULL,
    ingredient_id INT NOT NULL,

    CONSTRAINT PK_ALLERGY_INGREDIENT
        PRIMARY KEY (allergy_id, ingredient_id),

    CONSTRAINT FK_AI_ALLERGY
        FOREIGN KEY (allergy_id)
        REFERENCES ALLERGY(allergy_id),

    CONSTRAINT FK_AI_INGREDIENT
        FOREIGN KEY (ingredient_id)
        REFERENCES INGREDIENT(ingredient_id)
);
GO


-- =========================================================
-- 14. BMI_RECORD
-- =========================================================

CREATE TABLE BMI_RECORD (
    bmi_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    height FLOAT,
    weight FLOAT,
    bmi FLOAT,
    category NVARCHAR(50),
    calculated_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_BMI_USER
        FOREIGN KEY (user_id)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- 15. MEAL_PLAN
-- =========================================================

CREATE TABLE MEAL_PLAN (
    meal_plan_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    bmi_id INT,
    health_goal NVARCHAR(255),
    duration_days INT,
    dietary_preference NVARCHAR(255),
    generated_at DATETIME DEFAULT GETDATE(),
    status NVARCHAR(50),

    CONSTRAINT FK_MP_USER
        FOREIGN KEY (user_id)
        REFERENCES [USER](user_id),

    CONSTRAINT FK_MP_BMI
        FOREIGN KEY (bmi_id)
        REFERENCES BMI_RECORD(bmi_id)
);
GO


-- =========================================================
-- 16. MEAL_PLAN_ITEM
-- =========================================================

CREATE TABLE MEAL_PLAN_ITEM (
    meal_item_id INT IDENTITY(1,1) PRIMARY KEY,
    meal_plan_id INT,
    recipe_id INT,
    day_number INT,
    meal_type NVARCHAR(50),

    CONSTRAINT FK_MPI_MEALPLAN
        FOREIGN KEY (meal_plan_id)
        REFERENCES MEAL_PLAN(meal_plan_id),

    CONSTRAINT FK_MPI_RECIPE
        FOREIGN KEY (recipe_id)
        REFERENCES RECIPE(recipe_id)
);
GO


-- =========================================================
-- 17. AI_CONVERSATION
-- =========================================================

CREATE TABLE AI_CONVERSATION (
    conversation_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    title NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,

    CONSTRAINT FK_AICONV_USER
        FOREIGN KEY (user_id)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- 18. AI_MESSAGE
-- =========================================================

CREATE TABLE AI_MESSAGE (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT,
    sender NVARCHAR(50) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_AIMSG_CONV
        FOREIGN KEY (conversation_id)
        REFERENCES AI_CONVERSATION(conversation_id)
);
GO


-- =========================================================
-- 19. AI_RECOGNITION
-- =========================================================

CREATE TABLE AI_RECOGNITION (
    recognition_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    image_url NVARCHAR(255),
    status NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_AIRECOGNITION_USER
        FOREIGN KEY (user_id)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- 20. AI_RECOGNITION_ITEM
-- =========================================================

CREATE TABLE AI_RECOGNITION_ITEM (
    recognition_item_id INT IDENTITY(1,1) PRIMARY KEY,
    recognition_id INT,
    ingredient_id INT,
    confidence FLOAT,

    CONSTRAINT FK_AIRECOGNITIONITEM_RECOGNITION
        FOREIGN KEY (recognition_id)
        REFERENCES AI_RECOGNITION(recognition_id),

    CONSTRAINT FK_AIRECOGNITIONITEM_INGREDIENT
        FOREIGN KEY (ingredient_id)
        REFERENCES INGREDIENT(ingredient_id)
);
GO


-- =========================================================
-- 21. AI_MODERATION
-- =========================================================

CREATE TABLE AI_MODERATION (
    moderation_id INT IDENTITY(1,1) PRIMARY KEY,
    post_id INT,
    video_id INT,
    result NVARCHAR(255),
    reason NVARCHAR(MAX),
    confidence FLOAT,
    reviewed_by INT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_AIMOD_POST
        FOREIGN KEY (post_id)
        REFERENCES POST(post_id),

    CONSTRAINT FK_AIMOD_VIDEO
        FOREIGN KEY (video_id)
        REFERENCES VIDEO(video_id),

    CONSTRAINT FK_AIMOD_REVIEWER
        FOREIGN KEY (reviewed_by)
        REFERENCES [USER](user_id)
);
GO


-- =========================================================
-- VERIFY
-- =========================================================

PRINT N'ChayBook: 21 tables created successfully with NVARCHAR.';
GO

SELECT
    TABLE_NAME,
    COUNT(*) AS column_count
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN (
    'USER', 'CATEGORY', 'ALLERGY', 'INGREDIENT',
    'ARTICLE', 'RECIPE', 'VIDEO', 'POST', 'COMMENT',
    'POST_INTERACTION', 'USER_ALLERGY',
    'RECIPE_INGREDIENT', 'ALLERGY_INGREDIENT',
    'BMI_RECORD', 'MEAL_PLAN', 'MEAL_PLAN_ITEM',
    'AI_CONVERSATION', 'AI_MESSAGE',
    'AI_RECOGNITION', 'AI_RECOGNITION_ITEM',
    'AI_MODERATION'
)
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;
GO
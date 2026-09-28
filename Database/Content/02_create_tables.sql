USE ChayBook_Project;
GO

-- =========================================================
-- 01. USER
-- =========================================================

CREATE TABLE [USER] (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(255),

    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,

    CONSTRAINT CK_USER_ROLE
        CHECK (role IN ('USER', 'ADMIN')),

    CONSTRAINT CK_USER_STATUS
        CHECK (status IN ('ACTIVE', 'DISABLED'))
);
GO


-- =========================================================
-- 02. CATEGORY
-- =========================================================

CREATE TABLE CATEGORY (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    description VARCHAR(MAX)
);
GO


-- =========================================================
-- 03. ALLERGY
-- =========================================================

CREATE TABLE ALLERGY (
    allergy_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);
GO


-- =========================================================
-- 04. INGREDIENT
-- =========================================================

CREATE TABLE INGREDIENT (
    ingredient_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(MAX)
);
GO


-- =========================================================
-- 05. ARTICLE
-- =========================================================

CREATE TABLE ARTICLE (
    article_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT,
    created_by INT,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(MAX),
    cover_image VARCHAR(255),
    status VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);
GO


-- =========================================================
-- 06. RECIPE
-- =========================================================

CREATE TABLE RECIPE (
    recipe_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT,
    created_by INT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(MAX),
    image_url VARCHAR(255),
    prep_time INT,
    cook_time INT,
    servings INT,
    difficulty VARCHAR(50),
    instructions VARCHAR(MAX),
    calories FLOAT,
    protein FLOAT,
    carbs FLOAT,
    fat FLOAT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);
GO


-- =========================================================
-- 07. VIDEO
-- =========================================================

CREATE TABLE VIDEO (
    video_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT,
    created_by INT,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(MAX),
    video_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    duration INT,
    status VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);
GO


-- =========================================================
-- 08. POST
-- =========================================================

CREATE TABLE POST (
    post_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(MAX),
    image_url VARCHAR(255),
    status VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);
GO


-- =========================================================
-- 09. COMMENT
-- =========================================================

CREATE TABLE COMMENT (
    comment_id INT IDENTITY(1,1) PRIMARY KEY,
    post_id INT,
    user_id INT,
    content VARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);
GO


-- =========================================================
-- 10. POST_INTERACTION
-- =========================================================

CREATE TABLE POST_INTERACTION (
    interaction_id INT IDENTITY(1,1) PRIMARY KEY,
    post_id INT,
    user_id INT,
    type VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT UQ_POST_INTERACTION
        UNIQUE (post_id, user_id, type)
);
GO


-- =========================================================
-- 11. USER_ALLERGY
-- =========================================================

CREATE TABLE USER_ALLERGY (
    user_id INT NOT NULL,
    allergy_id INT NOT NULL,

    PRIMARY KEY (user_id, allergy_id)
);
GO


-- =========================================================
-- 12. RECIPE_INGREDIENT
-- =========================================================

CREATE TABLE RECIPE_INGREDIENT (
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity FLOAT,
    unit VARCHAR(50),

    PRIMARY KEY (recipe_id, ingredient_id)
);
GO


-- =========================================================
-- 13. ALLERGY_INGREDIENT
-- =========================================================

CREATE TABLE ALLERGY_INGREDIENT (
    allergy_id INT NOT NULL,
    ingredient_id INT NOT NULL,

    PRIMARY KEY (allergy_id, ingredient_id)
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
    category VARCHAR(50),
    calculated_at DATETIME DEFAULT GETDATE()
);
GO


-- =========================================================
-- 15. MEAL_PLAN
-- =========================================================

CREATE TABLE MEAL_PLAN (
    meal_plan_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    bmi_id INT,
    health_goal VARCHAR(255),
    duration_days INT,
    dietary_preference VARCHAR(255),
    generated_at DATETIME DEFAULT GETDATE(),
    status VARCHAR(50)
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
    meal_type VARCHAR(50)
);
GO


-- =========================================================
-- 17. AI_CONVERSATION
-- =========================================================

CREATE TABLE AI_CONVERSATION (
    conversation_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);
GO


-- =========================================================
-- 18. AI_MESSAGE
-- =========================================================

CREATE TABLE AI_MESSAGE (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT,
    sender VARCHAR(50) NOT NULL,
    message VARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO


-- =========================================================
-- 19. AI_RECOGNITION
-- =========================================================

CREATE TABLE AI_RECOGNITION (
    recognition_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    image_url VARCHAR(255),
    status VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
);
GO


-- =========================================================
-- 20. AI_RECOGNITION_ITEM
-- =========================================================

CREATE TABLE AI_RECOGNITION_ITEM (
    recognition_item_id INT IDENTITY(1,1) PRIMARY KEY,
    recognition_id INT,
    ingredient_id INT,
    confidence FLOAT
);
GO


-- =========================================================
-- 21. AI_MODERATION
-- =========================================================

CREATE TABLE AI_MODERATION (
    moderation_id INT IDENTITY(1,1) PRIMARY KEY,
    post_id INT,
    video_id INT,
    result VARCHAR(255),
    reason VARCHAR(MAX),
    confidence FLOAT,
    reviewed_by INT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT GETDATE()
);
GO


PRINT '21 tables created successfully.';
GO
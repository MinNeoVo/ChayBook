-- Bang quan ly nguoi dung (Phan BE User/Auth)
CREATE TABLE [USER] (
    user_id INT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);

-- ==========================================
-- PHAN CONTENT
-- ==========================================
CREATE TABLE CATEGORY (
    category_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    description VARCHAR(MAX)
);

CREATE TABLE ALLERGY (
    allergy_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE INGREDIENT (
    ingredient_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(MAX)
);

CREATE TABLE ARTICLE (
    article_id INT PRIMARY KEY,
    category_id INT,
    created_by INT,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(MAX),
    cover_image VARCHAR(255),
    status VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);

CREATE TABLE RECIPE (
    recipe_id INT PRIMARY KEY,
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

CREATE TABLE VIDEO (
    video_id INT PRIMARY KEY,
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

CREATE TABLE POST (
    post_id INT PRIMARY KEY,
    user_id INT,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(MAX),
    image_url VARCHAR(255),
    status VARCHAR(50),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);

CREATE TABLE COMMENT (
    comment_id INT PRIMARY KEY,
    post_id INT,
    user_id INT,
    content VARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);

CREATE TABLE POST_INTERACTION (
    interaction_id INT PRIMARY KEY,
    post_id INT,
    user_id INT,
    type VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Bang trung gian (Junction Tables)
CREATE TABLE USER_ALLERGY (
    user_id INT,
    allergy_id INT,
    PRIMARY KEY (user_id, allergy_id)
);

CREATE TABLE RECIPE_INGREDIENT (
    recipe_id INT,
    ingredient_id INT,
    quantity FLOAT,
    unit VARCHAR(50),
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- ==========================================
-- PHAN BMI/AI
-- ==========================================
CREATE TABLE BMI_RECORD (
    bmi_id INT PRIMARY KEY,
    user_id INT,
    height FLOAT,
    weight FLOAT,
    bmi FLOAT,
    category VARCHAR(50),
    calculated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE MEAL_PLAN (
    meal_plan_id INT PRIMARY KEY,
    user_id INT,
    bmi_id INT,
    health_goal VARCHAR(255),
    duration_days INT,
    dietary_preference VARCHAR(255),
    generated_at DATETIME DEFAULT GETDATE(),
    status VARCHAR(50)
);

CREATE TABLE MEAL_PLAN_ITEM (
    meal_item_id INT PRIMARY KEY,
    meal_plan_id INT,
    recipe_id INT,
    day_number INT,
    meal_type VARCHAR(50)
);

CREATE TABLE AI_CONVERSATION (
    conversation_id INT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME
);

CREATE TABLE AI_MESSAGE (
    message_id INT PRIMARY KEY,
    conversation_id INT,
    sender VARCHAR(50) NOT NULL,
    message VARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE AI_MODERATION (
    moderation_id INT PRIMARY KEY,
    post_id INT,
    video_id INT,
    result VARCHAR(255),
    reason VARCHAR(MAX),
    confidence FLOAT,
    reviewed_by INT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT GETDATE()
);
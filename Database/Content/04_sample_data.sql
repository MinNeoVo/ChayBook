USE ChayBook_Project;
GO

-- =========================================================
-- 01. USER
-- =========================================================

INSERT INTO [USER]
(
    username,
    email,
    password_hash,
    full_name,
    role,
    status
)
VALUES
(
    'hungnhan',
    'hungnhan@chaybook.com',
    'hashed_pass_1',
    'Hung Nhan',
    'ADMIN',
    'ACTIVE'
),
(
    'thiennhan',
    'thiennhan@chaybook.com',
    'hashed_pass_2',
    'Thien Nhan',
    'USER',
    'ACTIVE'
),
(
    'khang',
    'khang@chaybook.com',
    'hashed_pass_3',
    'Khang Content',
    'USER',
    'ACTIVE'
),
(
    'tien',
    'tien@chaybook.com',
    'hashed_pass_4',
    'Tien Vo',
    'USER',
    'ACTIVE'
);
GO


-- =========================================================
-- 02. CATEGORY
-- =========================================================

INSERT INTO CATEGORY
(
    name,
    type,
    description
)
VALUES
(
    'Mon chay truyen thong',
    'RECIPE',
    'Cac mon an chay dam vi truyen thong Viet Nam'
),
(
    'Kien thuc dinh duong',
    'ARTICLE',
    'Bai viet chia se kien thuc ve dinh duong'
),
(
    'Mon chay nhanh',
    'RECIPE',
    'Cac mon chay don gian va nhanh gon'
),
(
    'Cong dong',
    'POST',
    'Bai dang chia se tu cong dong'
);
GO


-- =========================================================
-- 03. ALLERGY
-- =========================================================

INSERT INTO ALLERGY
(
    name
)
VALUES
('Dau phong'),
('Dau nanh'),
('Sua'),
('Gluten');
GO


-- =========================================================
-- 04. INGREDIENT
-- =========================================================

INSERT INTO INGREDIENT
(
    name,
    description
)
VALUES
(
    'Dau hu',
    'Nguon protein thuc vat pho bien'
),
(
    'Dau phong',
    'Loai hat co the gay di ung'
),
(
    'Dau nanh',
    'Nguyen lieu giau protein thuc vat'
),
(
    'Nam dui ga',
    'Loai nam co huong vi dam da'
),
(
    'Rau cai xanh',
    'Loai rau xanh giau vitamin va khoang chat'
),
(
    'Gao',
    'Nguon tinh bot pho bien'
),
(
    'Sua dau nanh',
    'Do uong co nguon goc tu dau nanh'
);
GO


-- =========================================================
-- 05. ALLERGY_INGREDIENT
-- =========================================================

INSERT INTO ALLERGY_INGREDIENT
(
    allergy_id,
    ingredient_id
)
SELECT
    a.allergy_id,
    i.ingredient_id
FROM ALLERGY a
CROSS JOIN INGREDIENT i
WHERE a.name = 'Dau phong'
AND i.name = 'Dau phong';

INSERT INTO ALLERGY_INGREDIENT
(
    allergy_id,
    ingredient_id
)
SELECT
    a.allergy_id,
    i.ingredient_id
FROM ALLERGY a
CROSS JOIN INGREDIENT i
WHERE a.name = 'Dau nanh'
AND i.name = 'Dau nanh';

INSERT INTO ALLERGY_INGREDIENT
(
    allergy_id,
    ingredient_id
)
SELECT
    a.allergy_id,
    i.ingredient_id
FROM ALLERGY a
CROSS JOIN INGREDIENT i
WHERE a.name = 'Dau nanh'
AND i.name = 'Sua dau nanh';

INSERT INTO ALLERGY_INGREDIENT
(
    allergy_id,
    ingredient_id
)
SELECT
    a.allergy_id,
    i.ingredient_id
FROM ALLERGY a
CROSS JOIN INGREDIENT i
WHERE a.name = 'Sua'
AND i.name = 'Sua dau nanh';

INSERT INTO ALLERGY_INGREDIENT
(
    allergy_id,
    ingredient_id
)
SELECT
    a.allergy_id,
    i.ingredient_id
FROM ALLERGY a
CROSS JOIN INGREDIENT i
WHERE a.name = 'Gluten'
AND i.name = 'Gao';
GO


-- =========================================================
-- 06. RECIPE
-- =========================================================

INSERT INTO RECIPE
(
    category_id,
    created_by,
    name,
    description,
    prep_time,
    cook_time,
    servings,
    difficulty,
    instructions,
    calories,
    protein,
    carbs,
    fat
)
SELECT
    c.category_id,
    u.user_id,
    'Dau hu sot nam',
    'Dau hu chien ket hop voi nam va nuoc sot dam da.',
    10,
    20,
    2,
    'EASY',
    'Chien dau hu. Xao nam. Them nuoc sot va nau trong vai phut.',
    250.5,
    15.2,
    18.5,
    12.3
FROM CATEGORY c
CROSS JOIN [USER] u
WHERE c.name = 'Mon chay truyen thong'
AND u.username = 'khang';

INSERT INTO RECIPE
(
    category_id,
    created_by,
    name,
    description,
    prep_time,
    cook_time,
    servings,
    difficulty,
    instructions,
    calories,
    protein,
    carbs,
    fat
)
SELECT
    c.category_id,
    u.user_id,
    'Com rau cai xanh',
    'Mon com chay don gian voi rau cai xanh.',
    10,
    15,
    1,
    'EASY',
    'Nau com. Xao rau cai xanh. Ket hop va thuong thuc.',
    320.0,
    8.5,
    55.0,
    6.2
FROM CATEGORY c
CROSS JOIN [USER] u
WHERE c.name = 'Mon chay nhanh'
AND u.username = 'khang';

INSERT INTO RECIPE
(
    category_id,
    created_by,
    name,
    description,
    prep_time,
    cook_time,
    servings,
    difficulty,
    instructions,
    calories,
    protein,
    carbs,
    fat
)
SELECT
    c.category_id,
    u.user_id,
    'Canh nam rau cai',
    'Mon canh chay don gian va de nau.',
    10,
    15,
    2,
    'EASY',
    'Dun nuoc. Cho nam va rau vao. Nau den khi chin.',
    180.0,
    7.2,
    20.5,
    5.4
FROM CATEGORY c
CROSS JOIN [USER] u
WHERE c.name = 'Mon chay nhanh'
AND u.username = 'khang';
GO


-- =========================================================
-- 07. RECIPE_INGREDIENT
-- =========================================================

INSERT INTO RECIPE_INGREDIENT
(
    recipe_id,
    ingredient_id,
    quantity,
    unit
)
SELECT
    r.recipe_id,
    i.ingredient_id,
    2,
    'mieng'
FROM RECIPE r
CROSS JOIN INGREDIENT i
WHERE r.name = 'Dau hu sot nam'
AND i.name = 'Dau hu';

INSERT INTO RECIPE_INGREDIENT
(
    recipe_id,
    ingredient_id,
    quantity,
    unit
)
SELECT
    r.recipe_id,
    i.ingredient_id,
    200,
    'gram'
FROM RECIPE r
CROSS JOIN INGREDIENT i
WHERE r.name = 'Dau hu sot nam'
AND i.name = 'Nam dui ga';

INSERT INTO RECIPE_INGREDIENT
(
    recipe_id,
    ingredient_id,
    quantity,
    unit
)
SELECT
    r.recipe_id,
    i.ingredient_id,
    150,
    'gram'
FROM RECIPE r
CROSS JOIN INGREDIENT i
WHERE r.name = 'Com rau cai xanh'
AND i.name = 'Rau cai xanh';

INSERT INTO RECIPE_INGREDIENT
(
    recipe_id,
    ingredient_id,
    quantity,
    unit
)
SELECT
    r.recipe_id,
    i.ingredient_id,
    1,
    'bat'
FROM RECIPE r
CROSS JOIN INGREDIENT i
WHERE r.name = 'Com rau cai xanh'
AND i.name = 'Gao';

INSERT INTO RECIPE_INGREDIENT
(
    recipe_id,
    ingredient_id,
    quantity,
    unit
)
SELECT
    r.recipe_id,
    i.ingredient_id,
    150,
    'gram'
FROM RECIPE r
CROSS JOIN INGREDIENT i
WHERE r.name = 'Canh nam rau cai'
AND i.name = 'Nam dui ga';

INSERT INTO RECIPE_INGREDIENT
(
    recipe_id,
    ingredient_id,
    quantity,
    unit
)
SELECT
    r.recipe_id,
    i.ingredient_id,
    100,
    'gram'
FROM RECIPE r
CROSS JOIN INGREDIENT i
WHERE r.name = 'Canh nam rau cai'
AND i.name = 'Rau cai xanh';
GO


-- =========================================================
-- 08. ARTICLE
-- =========================================================

INSERT INTO ARTICLE
(
    category_id,
    created_by,
    title,
    content,
    status
)
SELECT
    c.category_id,
    u.user_id,
    'Lam sao de an chay khong thieu chat?',
    'Bai viet huong dan cach xay dung che do an chay can bang va day du dinh duong.',
    'PUBLISHED'
FROM CATEGORY c
CROSS JOIN [USER] u
WHERE c.name = 'Kien thuc dinh duong'
AND u.username = 'khang';

INSERT INTO ARTICLE
(
    category_id,
    created_by,
    title,
    content,
    status
)
SELECT
    c.category_id,
    u.user_id,
    'Protein thuc vat co tu dau?',
    'Gioi thieu cac nguon protein thuc vat pho bien nhu dau hu, dau nanh va cac loai dau hat.',
    'PUBLISHED'
FROM CATEGORY c
CROSS JOIN [USER] u
WHERE c.name = 'Kien thuc dinh duong'
AND u.username = 'khang';
GO


-- =========================================================
-- 09. VIDEO
-- =========================================================

INSERT INTO VIDEO
(
    category_id,
    created_by,
    title,
    description,
    video_url,
    thumbnail_url,
    duration,
    status
)
SELECT
    c.category_id,
    u.user_id,
    'Cach lam dau hu sot nam',
    'Video huong dan nau mon dau hu sot nam.',
    'https://example.com/video/dau-hu-sot-nam',
    'https://example.com/image/dau-hu-sot-nam.jpg',
    300,
    'PUBLISHED'
FROM CATEGORY c
CROSS JOIN [USER] u
WHERE c.name = 'Mon chay truyen thong'
AND u.username = 'khang';

INSERT INTO VIDEO
(
    category_id,
    created_by,
    title,
    description,
    video_url,
    thumbnail_url,
    duration,
    status
)
SELECT
    c.category_id,
    u.user_id,
    'Com rau cai nhanh trong 15 phut',
    'Cong thuc mon chay don gian cho ngay ban ron.',
    'https://example.com/video/com-rau-cai',
    'https://example.com/image/com-rau-cai.jpg',
    240,
    'PUBLISHED'
FROM CATEGORY c
CROSS JOIN [USER] u
WHERE c.name = 'Mon chay nhanh'
AND u.username = 'khang';
GO


-- =========================================================
-- 10. POST
-- =========================================================

INSERT INTO POST
(
    user_id,
    category_id,
    title,
    content,
    status
)
SELECT
    u.user_id,
    c.category_id,
    'Chao mung den voi ChayBook!',
    'Cung nhau chia se hanh trinh an chay nhe.',
    'APPROVED'
FROM [USER] u
CROSS JOIN CATEGORY c
WHERE u.username = 'hungnhan'
AND c.name = 'Cong dong';

INSERT INTO POST
(
    user_id,
    category_id,
    title,
    content,
    status
)
SELECT
    u.user_id,
    c.category_id,
    'Hom nay ban an mon chay gi?',
    'Minh vua nau dau hu sot nam. Rat ngon va de lam!',
    'APPROVED'
FROM [USER] u
CROSS JOIN CATEGORY c
WHERE u.username = 'tien'
AND c.name = 'Cong dong';
GO


-- =========================================================
-- 11. COMMENT
-- =========================================================

INSERT INTO COMMENT
(
    post_id,
    user_id,
    content
)
SELECT
    p.post_id,
    u.user_id,
    'Tuyet voi qua!'
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Chao mung den voi ChayBook!'
AND u.username = 'thiennhan';

INSERT INTO COMMENT
(
    post_id,
    user_id,
    content
)
SELECT
    p.post_id,
    u.user_id,
    'Rat vui khi tham gia ChayBook.'
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Chao mung den voi ChayBook!'
AND u.username = 'tien';

INSERT INTO COMMENT
(
    post_id,
    user_id,
    content
)
SELECT
    p.post_id,
    u.user_id,
    'Mon nay nhin rat ngon!'
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Hom nay ban an mon chay gi?'
AND u.username = 'hungnhan';
GO


-- =========================================================
-- 12. POST_INTERACTION
-- =========================================================

INSERT INTO POST_INTERACTION
(
    post_id,
    user_id,
    type
)
SELECT
    p.post_id,
    u.user_id,
    'LIKE'
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Chao mung den voi ChayBook!'
AND u.username = 'thiennhan';

INSERT INTO POST_INTERACTION
(
    post_id,
    user_id,
    type
)
SELECT
    p.post_id,
    u.user_id,
    'LIKE'
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Chao mung den voi ChayBook!'
AND u.username = 'tien';

INSERT INTO POST_INTERACTION
(
    post_id,
    user_id,
    type
)
SELECT
    p.post_id,
    u.user_id,
    'LIKE'
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Hom nay ban an mon chay gi?'
AND u.username = 'hungnhan';

INSERT INTO POST_INTERACTION
(
    post_id,
    user_id,
    type
)
SELECT
    p.post_id,
    u.user_id,
    'BOOKMARK'
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Hom nay ban an mon chay gi?'
AND u.username = 'thiennhan';
GO


-- =========================================================
-- 13. USER_ALLERGY
-- =========================================================

INSERT INTO USER_ALLERGY
(
    user_id,
    allergy_id
)
SELECT
    u.user_id,
    a.allergy_id
FROM [USER] u
CROSS JOIN ALLERGY a
WHERE u.username = 'tien'
AND a.name = 'Dau phong';

INSERT INTO USER_ALLERGY
(
    user_id,
    allergy_id
)
SELECT
    u.user_id,
    a.allergy_id
FROM [USER] u
CROSS JOIN ALLERGY a
WHERE u.username = 'tien'
AND a.name = 'Dau nanh';
GO


-- =========================================================
-- 14. BMI_RECORD
-- =========================================================

INSERT INTO BMI_RECORD
(
    user_id,
    height,
    weight,
    bmi,
    category
)
SELECT
    u.user_id,
    177,
    55,
    17.56,
    'UNDERWEIGHT'
FROM [USER] u
WHERE u.username = 'tien';

INSERT INTO BMI_RECORD
(
    user_id,
    height,
    weight,
    bmi,
    category
)
SELECT
    u.user_id,
    177,
    58,
    18.51,
    'NORMAL'
FROM [USER] u
WHERE u.username = 'tien';
GO


-- =========================================================
-- 15. MEAL_PLAN
-- =========================================================

INSERT INTO MEAL_PLAN
(
    user_id,
    bmi_id,
    health_goal,
    duration_days,
    dietary_preference,
    status
)
SELECT
    u.user_id,
    b.bmi_id,
    'Tang can',
    3,
    'VEGETARIAN',
    'COMPLETED'
FROM [USER] u
CROSS JOIN BMI_RECORD b
WHERE u.username = 'tien'
AND b.height = 177
AND b.weight = 55;
GO


-- =========================================================
-- 16. MEAL_PLAN_ITEM
-- =========================================================

INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    1,
    'BREAKFAST'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Dau hu sot nam';

INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    1,
    'LUNCH'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Com rau cai xanh';

INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    1,
    'DINNER'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Canh nam rau cai';


INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    2,
    'BREAKFAST'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Com rau cai xanh';

INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    2,
    'LUNCH'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Dau hu sot nam';

INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    2,
    'DINNER'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Canh nam rau cai';


INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    3,
    'BREAKFAST'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Canh nam rau cai';

INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    3,
    'LUNCH'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Dau hu sot nam';

INSERT INTO MEAL_PLAN_ITEM
(
    meal_plan_id,
    recipe_id,
    day_number,
    meal_type
)
SELECT
    mp.meal_plan_id,
    r.recipe_id,
    3,
    'DINNER'
FROM MEAL_PLAN mp
CROSS JOIN RECIPE r
WHERE mp.duration_days = 3
AND r.name = 'Com rau cai xanh';
GO


-- =========================================================
-- 17. AI_CONVERSATION
-- =========================================================

INSERT INTO AI_CONVERSATION
(
    user_id,
    title
)
SELECT
    user_id,
    'Hoi dap dinh duong'
FROM [USER]
WHERE username = 'tien';

INSERT INTO AI_CONVERSATION
(
    user_id,
    title
)
SELECT
    user_id,
    'Tu van thuc don'
FROM [USER]
WHERE username = 'tien';
GO


-- =========================================================
-- 18. AI_MESSAGE
-- =========================================================

INSERT INTO AI_MESSAGE
(
    conversation_id,
    sender,
    message
)
SELECT
    c.conversation_id,
    'USER',
    'Dau hu co nhieu protein khong?'
FROM AI_CONVERSATION c
WHERE c.title = 'Hoi dap dinh duong';

INSERT INTO AI_MESSAGE
(
    conversation_id,
    sender,
    message
)
SELECT
    c.conversation_id,
    'AI',
    'Dau hu la mot nguon protein thuc vat pho bien.'
FROM AI_CONVERSATION c
WHERE c.title = 'Hoi dap dinh duong';

INSERT INTO AI_MESSAGE
(
    conversation_id,
    sender,
    message
)
SELECT
    c.conversation_id,
    'USER',
    'Hay tao cho toi thuc don 3 ngay.'
FROM AI_CONVERSATION c
WHERE c.title = 'Tu van thuc don';

INSERT INTO AI_MESSAGE
(
    conversation_id,
    sender,
    message
)
SELECT
    c.conversation_id,
    'AI',
    'Toi se dua vao BMI, muc tieu suc khoe va di ung cua ban.'
FROM AI_CONVERSATION c
WHERE c.title = 'Tu van thuc don';
GO


-- =========================================================
-- 19. AI_RECOGNITION
-- =========================================================

INSERT INTO AI_RECOGNITION
(
    user_id,
    image_url,
    status
)
SELECT
    user_id,
    'https://example.com/uploads/ingredient-01.jpg',
    'COMPLETED'
FROM [USER]
WHERE username = 'tien';
GO


-- =========================================================
-- 20. AI_RECOGNITION_ITEM
-- =========================================================

INSERT INTO AI_RECOGNITION_ITEM
(
    recognition_id,
    ingredient_id,
    confidence
)
SELECT
    ar.recognition_id,
    i.ingredient_id,
    0.96
FROM AI_RECOGNITION ar
CROSS JOIN INGREDIENT i
WHERE i.name = 'Dau hu';

INSERT INTO AI_RECOGNITION_ITEM
(
    recognition_id,
    ingredient_id,
    confidence
)
SELECT
    ar.recognition_id,
    i.ingredient_id,
    0.91
FROM AI_RECOGNITION ar
CROSS JOIN INGREDIENT i
WHERE i.name = 'Nam dui ga';
GO


-- =========================================================
-- 21. AI_MODERATION
-- =========================================================

INSERT INTO AI_MODERATION
(
    post_id,
    video_id,
    result,
    reason,
    confidence,
    reviewed_by,
    reviewed_at
)
SELECT
    p.post_id,
    NULL,
    'SAFE',
    'No violation detected.',
    0.98,
    u.user_id,
    GETDATE()
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Chao mung den voi ChayBook!'
AND u.username = 'hungnhan';

INSERT INTO AI_MODERATION
(
    post_id,
    video_id,
    result,
    reason,
    confidence,
    reviewed_by,
    reviewed_at
)
SELECT
    p.post_id,
    NULL,
    'SAFE',
    'No violation detected.',
    0.97,
    u.user_id,
    GETDATE()
FROM POST p
CROSS JOIN [USER] u
WHERE p.title = 'Hom nay ban an mon chay gi?'
AND u.username = 'hungnhan';

INSERT INTO AI_MODERATION
(
    post_id,
    video_id,
    result,
    reason,
    confidence,
    reviewed_by,
    reviewed_at
)
SELECT
    NULL,
    v.video_id,
    'SAFE',
    'Video content is suitable.',
    0.95,
    u.user_id,
    GETDATE()
FROM VIDEO v
CROSS JOIN [USER] u
WHERE v.title = 'Cach lam dau hu sot nam'
AND u.username = 'hungnhan';
GO


-- =========================================================
-- CHECK DATA
-- =========================================================

SELECT 'USER' AS TableName, COUNT(*) AS Total FROM [USER]
UNION ALL
SELECT 'CATEGORY', COUNT(*) FROM CATEGORY
UNION ALL
SELECT 'ALLERGY', COUNT(*) FROM ALLERGY
UNION ALL
SELECT 'INGREDIENT', COUNT(*) FROM INGREDIENT
UNION ALL
SELECT 'ARTICLE', COUNT(*) FROM ARTICLE
UNION ALL
SELECT 'RECIPE', COUNT(*) FROM RECIPE
UNION ALL
SELECT 'VIDEO', COUNT(*) FROM VIDEO
UNION ALL
SELECT 'POST', COUNT(*) FROM POST
UNION ALL
SELECT 'COMMENT', COUNT(*) FROM COMMENT
UNION ALL
SELECT 'POST_INTERACTION', COUNT(*) FROM POST_INTERACTION
UNION ALL
SELECT 'USER_ALLERGY', COUNT(*) FROM USER_ALLERGY
UNION ALL
SELECT 'RECIPE_INGREDIENT', COUNT(*) FROM RECIPE_INGREDIENT
UNION ALL
SELECT 'ALLERGY_INGREDIENT', COUNT(*) FROM ALLERGY_INGREDIENT
UNION ALL
SELECT 'BMI_RECORD', COUNT(*) FROM BMI_RECORD
UNION ALL
SELECT 'MEAL_PLAN', COUNT(*) FROM MEAL_PLAN
UNION ALL
SELECT 'MEAL_PLAN_ITEM', COUNT(*) FROM MEAL_PLAN_ITEM
UNION ALL
SELECT 'AI_CONVERSATION', COUNT(*) FROM AI_CONVERSATION
UNION ALL
SELECT 'AI_MESSAGE', COUNT(*) FROM AI_MESSAGE
UNION ALL
SELECT 'AI_RECOGNITION', COUNT(*) FROM AI_RECOGNITION
UNION ALL
SELECT 'AI_RECOGNITION_ITEM', COUNT(*) FROM AI_RECOGNITION_ITEM
UNION ALL
SELECT 'AI_MODERATION', COUNT(*) FROM AI_MODERATION;
GO

PRINT 'Sample data inserted successfully.';
GO
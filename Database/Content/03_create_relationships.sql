USE ChayBook_Project;
GO

-- =========================================================
-- ARTICLE
-- =========================================================

ALTER TABLE ARTICLE
ADD CONSTRAINT FK_ARTICLE_CATEGORY
FOREIGN KEY (category_id)
REFERENCES CATEGORY(category_id);
GO

ALTER TABLE ARTICLE
ADD CONSTRAINT FK_ARTICLE_USER
FOREIGN KEY (created_by)
REFERENCES [USER](user_id);
GO


-- =========================================================
-- RECIPE
-- =========================================================

ALTER TABLE RECIPE
ADD CONSTRAINT FK_RECIPE_CATEGORY
FOREIGN KEY (category_id)
REFERENCES CATEGORY(category_id);
GO

ALTER TABLE RECIPE
ADD CONSTRAINT FK_RECIPE_USER
FOREIGN KEY (created_by)
REFERENCES [USER](user_id);
GO


-- =========================================================
-- VIDEO
-- =========================================================

ALTER TABLE VIDEO
ADD CONSTRAINT FK_VIDEO_CATEGORY
FOREIGN KEY (category_id)
REFERENCES CATEGORY(category_id);
GO

ALTER TABLE VIDEO
ADD CONSTRAINT FK_VIDEO_USER
FOREIGN KEY (created_by)
REFERENCES [USER](user_id);
GO


-- =========================================================
-- POST
-- =========================================================

ALTER TABLE POST
ADD CONSTRAINT FK_POST_USER
FOREIGN KEY (user_id)
REFERENCES [USER](user_id);
GO

ALTER TABLE POST
ADD CONSTRAINT FK_POST_CATEGORY
FOREIGN KEY (category_id)
REFERENCES CATEGORY(category_id);
GO


-- =========================================================
-- COMMENT
-- =========================================================

ALTER TABLE COMMENT
ADD CONSTRAINT FK_COMMENT_POST
FOREIGN KEY (post_id)
REFERENCES POST(post_id);
GO

ALTER TABLE COMMENT
ADD CONSTRAINT FK_COMMENT_USER
FOREIGN KEY (user_id)
REFERENCES [USER](user_id);
GO


-- =========================================================
-- POST_INTERACTION
-- =========================================================

ALTER TABLE POST_INTERACTION
ADD CONSTRAINT FK_INTERACTION_POST
FOREIGN KEY (post_id)
REFERENCES POST(post_id);
GO

ALTER TABLE POST_INTERACTION
ADD CONSTRAINT FK_INTERACTION_USER
FOREIGN KEY (user_id)
REFERENCES [USER](user_id);
GO


-- =========================================================
-- RECIPE_INGREDIENT
-- =========================================================

ALTER TABLE RECIPE_INGREDIENT
ADD CONSTRAINT FK_RI_RECIPE
FOREIGN KEY (recipe_id)
REFERENCES RECIPE(recipe_id);
GO

ALTER TABLE RECIPE_INGREDIENT
ADD CONSTRAINT FK_RI_INGREDIENT
FOREIGN KEY (ingredient_id)
REFERENCES INGREDIENT(ingredient_id);
GO


-- =========================================================
-- USER_ALLERGY
-- =========================================================

ALTER TABLE USER_ALLERGY
ADD CONSTRAINT FK_UA_USER
FOREIGN KEY (user_id)
REFERENCES [USER](user_id);
GO

ALTER TABLE USER_ALLERGY
ADD CONSTRAINT FK_UA_ALLERGY
FOREIGN KEY (allergy_id)
REFERENCES ALLERGY(allergy_id);
GO


-- =========================================================
-- ALLERGY_INGREDIENT
-- =========================================================

ALTER TABLE ALLERGY_INGREDIENT
ADD CONSTRAINT FK_AI_ALLERGY
FOREIGN KEY (allergy_id)
REFERENCES ALLERGY(allergy_id);
GO

ALTER TABLE ALLERGY_INGREDIENT
ADD CONSTRAINT FK_AI_INGREDIENT
FOREIGN KEY (ingredient_id)
REFERENCES INGREDIENT(ingredient_id);
GO


-- =========================================================
-- BMI_RECORD
-- =========================================================

ALTER TABLE BMI_RECORD
ADD CONSTRAINT FK_BMI_USER
FOREIGN KEY (user_id)
REFERENCES [USER](user_id);
GO


-- =========================================================
-- MEAL_PLAN
-- =========================================================

ALTER TABLE MEAL_PLAN
ADD CONSTRAINT FK_MP_USER
FOREIGN KEY (user_id)
REFERENCES [USER](user_id);
GO

ALTER TABLE MEAL_PLAN
ADD CONSTRAINT FK_MP_BMI
FOREIGN KEY (bmi_id)
REFERENCES BMI_RECORD(bmi_id);
GO


-- =========================================================
-- MEAL_PLAN_ITEM
-- =========================================================

ALTER TABLE MEAL_PLAN_ITEM
ADD CONSTRAINT FK_MPI_MEALPLAN
FOREIGN KEY (meal_plan_id)
REFERENCES MEAL_PLAN(meal_plan_id);
GO

ALTER TABLE MEAL_PLAN_ITEM
ADD CONSTRAINT FK_MPI_RECIPE
FOREIGN KEY (recipe_id)
REFERENCES RECIPE(recipe_id);
GO


-- =========================================================
-- AI_CONVERSATION
-- =========================================================

ALTER TABLE AI_CONVERSATION
ADD CONSTRAINT FK_AICONV_USER
FOREIGN KEY (user_id)
REFERENCES [USER](user_id);
GO


-- =========================================================
-- AI_MESSAGE
-- =========================================================

ALTER TABLE AI_MESSAGE
ADD CONSTRAINT FK_AIMSG_CONV
FOREIGN KEY (conversation_id)
REFERENCES AI_CONVERSATION(conversation_id);
GO


-- =========================================================
-- AI_RECOGNITION
-- =========================================================

ALTER TABLE AI_RECOGNITION
ADD CONSTRAINT FK_AIRECOGNITION_USER
FOREIGN KEY (user_id)
REFERENCES [USER](user_id);
GO


-- =========================================================
-- AI_RECOGNITION_ITEM
-- =========================================================

ALTER TABLE AI_RECOGNITION_ITEM
ADD CONSTRAINT FK_AIRECOGNITIONITEM_RECOGNITION
FOREIGN KEY (recognition_id)
REFERENCES AI_RECOGNITION(recognition_id);
GO

ALTER TABLE AI_RECOGNITION_ITEM
ADD CONSTRAINT FK_AIRECOGNITIONITEM_INGREDIENT
FOREIGN KEY (ingredient_id)
REFERENCES INGREDIENT(ingredient_id);
GO


-- =========================================================
-- AI_MODERATION
-- =========================================================

ALTER TABLE AI_MODERATION
ADD CONSTRAINT FK_AIMOD_POST
FOREIGN KEY (post_id)
REFERENCES POST(post_id);
GO

ALTER TABLE AI_MODERATION
ADD CONSTRAINT FK_AIMOD_VIDEO
FOREIGN KEY (video_id)
REFERENCES VIDEO(video_id);
GO

ALTER TABLE AI_MODERATION
ADD CONSTRAINT FK_AIMOD_REVIEWER
FOREIGN KEY (reviewed_by)
REFERENCES [USER](user_id);
GO


PRINT 'All foreign keys created successfully.';
GO
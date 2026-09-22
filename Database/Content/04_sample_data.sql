-- Them du lieu gia lap cho Nguoi dung
INSERT INTO [USER] (user_id, username, email, password_hash, full_name, role, status) VALUES 
(1, 'hungnhan', 'hungnhan@chaybook.com', 'hashed_pass_1', 'Hung Nhan', 'Admin', 'Active'),
(2, 'thiennhan', 'thiennhan@chaybook.com', 'hashed_pass_2', 'Thien Nhan', 'AI Developer', 'Active'),
(3, 'khang', 'khang@chaybook.com', 'hashed_pass_3', 'Khang Content', 'Content Creator', 'Active');

-- Them Danh muc Content
INSERT INTO CATEGORY (category_id, name, type, description) VALUES 
(1, 'Mon chay truyen thong', 'Recipe', 'Cac mon an chay dam vi truyen thong Viet Nam'),
(2, 'Kien thuc dinh duong', 'Article', 'Bai viet chia se khoa hoc ve an chay');

-- Them Nguyen lieu
INSERT INTO INGREDIENT (ingredient_id, name, description) VALUES 
(1, 'Dau hu non', 'Thanh phan cung cap protein chinh'),
(2, 'Nam dui ga', 'Tang huong vi dam da cho mon an');

-- Them Cong thuc mau
INSERT INTO RECIPE (recipe_id, category_id, created_by, name, prep_time, cook_time, servings, difficulty, calories) VALUES 
(1, 1, 3, 'Dau hu non sot nam', 15, 20, 2, 'De', 250.5);

-- Lien ket cong thuc va nguyen lieu
INSERT INTO RECIPE_INGREDIENT (recipe_id, ingredient_id, quantity, unit) VALUES 
(1, 1, 2, 'Mieng'),
(1, 2, 200, 'Gram');

-- Them mot bai viet Content
INSERT INTO ARTICLE (article_id, category_id, created_by, title, content, status) VALUES 
(1, 2, 3, 'Lam sao de an chay khong thieu chat?', 'Day la bai viet huong dan an chay dung cach...', 'Published');

-- Them Post cong dong
INSERT INTO POST (post_id, user_id, category_id, title, content, status) VALUES 
(1, 1, 2, 'Chao mung den voi ChayBook!', 'Cung nhau chia se hanh trinh an chay nhe.', 'Approved');

-- Binh luan mau
INSERT INTO COMMENT (comment_id, post_id, user_id, content) VALUES 
(1, 1, 2, 'Tuyet voi qua!');
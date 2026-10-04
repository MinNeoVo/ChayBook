
USE ChayBook_Project;
GO

/* =========================================================
   CHAYBOOK - SAMPLE DATA FOR ALL 21 TABLES
   SQL Server | NVARCHAR | Vietnamese Unicode
   Run on an empty database.
   ========================================================= */

SET NOCOUNT ON;
GO

-- =========================================================
-- 01. USER
-- Password hashes below are DEMO placeholders.
-- Replace them with valid BCrypt hashes before login testing.
-- =========================================================

INSERT INTO [USER]
    (username, email, password_hash, full_name, avatar_url,
     role, status, created_at, updated_at)
VALUES
(N'tiennguyen', N'tien@example.com', N'DEMO_HASH_1',
 N'Nguyễn Tiến', N'https://i.pravatar.cc/150?img=12',
 N'USER', N'ACTIVE', GETDATE(), NULL),

(N'linhtran', N'linh@example.com', N'DEMO_HASH_2',
 N'Trần Ngọc Linh', N'https://i.pravatar.cc/150?img=47',
 N'USER', N'ACTIVE', GETDATE(), NULL),

(N'minhle', N'minh@example.com', N'DEMO_HASH_3',
 N'Lê Minh', N'https://i.pravatar.cc/150?img=11',
 N'USER', N'ACTIVE', GETDATE(), NULL),

(N'admin', N'admin@chaybook.com', N'DEMO_HASH_4',
 N'Quản trị viên ChayBook', NULL,
 N'ADMIN', N'ACTIVE', GETDATE(), NULL);
GO


-- =========================================================
-- 02. CATEGORY
-- ARTICLE: 1-4
-- RECIPE : 5-10
-- POST   : 11-14
-- =========================================================

INSERT INTO CATEGORY (name, type, description)
VALUES
(N'Kiến thức dinh dưỡng', N'ARTICLE',
 N'Kiến thức về dinh dưỡng và chế độ ăn chay'),

(N'Sức khỏe và lối sống', N'ARTICLE',
 N'Ăn chay lành mạnh và xây dựng lối sống tích cực'),

(N'Hướng dẫn cho người mới', N'ARTICLE',
 N'Hướng dẫn bắt đầu chế độ ăn chay'),

(N'Nguyên liệu chay', N'ARTICLE',
 N'Thông tin về nguyên liệu có nguồn gốc thực vật'),

(N'Món chay truyền thống', N'RECIPE',
 N'Các món chay truyền thống Việt Nam'),

(N'Món chay nhanh', N'RECIPE',
 N'Các món chay dễ làm và tiết kiệm thời gian'),

(N'Món chính', N'RECIPE',
 N'Các món chính dùng trong bữa ăn chay'),

(N'Canh và súp', N'RECIPE',
 N'Các món canh và súp chay'),

(N'Salad và món trộn', N'RECIPE',
 N'Salad và các món trộn từ rau củ'),

(N'Đồ uống chay', N'RECIPE',
 N'Sinh tố và đồ uống từ thực vật'),

(N'Chia sẻ kinh nghiệm', N'POST',
 N'Chia sẻ kinh nghiệm ăn chay'),

(N'Hỏi đáp ăn chay', N'POST',
 N'Đặt câu hỏi và trao đổi trong cộng đồng'),

(N'Nhật ký ăn chay', N'POST',
 N'Ghi lại hành trình ăn chay'),

(N'Đánh giá quán chay', N'POST',
 N'Chia sẻ trải nghiệm tại các quán chay');
GO


-- =========================================================
-- 03. ALLERGY
-- =========================================================

INSERT INTO ALLERGY (name)
VALUES
(N'Đậu phộng'),
(N'Đậu nành'),
(N'Sữa'),
(N'Gluten'),
(N'Hạt điều');
GO


-- =========================================================
-- 04. INGREDIENT
-- =========================================================

INSERT INTO INGREDIENT (name, description)
VALUES
(N'Đậu phụ', N'Nguồn protein thực vật từ đậu nành'),
(N'Đậu phộng', N'Các loại đậu phộng dùng trong chế biến món ăn'),
(N'Đậu nành', N'Nguyên liệu thực vật giàu protein'),
(N'Gạo lứt', N'Ngũ cốc nguyên hạt'),
(N'Bông cải xanh', N'Rau xanh giàu chất xơ'),
(N'Cà rốt', N'Rau củ dùng trong nhiều món chay'),
(N'Nấm hương', N'Nấm có hương vị đặc trưng'),
(N'Yến mạch', N'Ngũ cốc thường dùng cho bữa sáng'),
(N'Hạt điều', N'Loại hạt dùng làm sữa và nước sốt'),
(N'Cà chua', N'Rau quả dùng trong salad và món nấu'),
(N'Rau xà lách', N'Rau ăn sống hoặc làm salad'),
(N'Khoai lang', N'Củ giàu tinh bột và chất xơ'),
(N'Gừng', N'Gia vị có mùi thơm đặc trưng'),
(N'Bí đỏ', N'Rau củ dùng nấu canh và súp'),
(N'Bánh mì nguyên cám', N'Bánh mì làm từ bột nguyên cám');
GO



-- =========================================================
-- 05. ARTICLE
-- =========================================================

INSERT INTO ARTICLE
    (category_id, created_by, title, content, cover_image,
     status, created_at, updated_at)
VALUES
(1, 4,
 N'Ăn chay thế nào để bổ sung đủ protein mỗi ngày?',
 N'Protein là một chất dinh dưỡng quan trọng, tham gia vào quá trình xây dựng và sửa chữa các mô trong cơ thể. Khi chuyển sang chế độ ăn chay, nhiều người lo lắng rằng việc không sử dụng thịt cá sẽ khiến cơ thể thiếu protein. Tuy nhiên, nếu biết cách lựa chọn và kết hợp thực phẩm, bạn vẫn có thể xây dựng một chế độ ăn đa dạng từ thực vật.

Các nguồn protein thực vật phổ biến bao gồm đậu phụ, đậu nành, đậu lăng, đậu xanh, các loại đậu khác, hạt và một số loại ngũ cốc. Đậu phụ có thể được chế biến thành nhiều món ăn khác nhau như đậu phụ sốt cà chua, đậu phụ áp chảo hoặc canh đậu phụ. Các loại đậu có thể dùng trong món súp, salad hoặc ăn kèm với cơm và rau củ.

Một cách đơn giản để cân đối bữa ăn là kết hợp nguồn protein với ngũ cốc nguyên hạt và rau củ. Ví dụ, bữa trưa có thể gồm cơm gạo lứt, đậu phụ sốt nấm và rau xanh. Bữa tối có thể sử dụng đậu lăng, rau củ và một phần ngũ cốc phù hợp với nhu cầu cá nhân. Việc thay đổi nguyên liệu thường xuyên giúp thực đơn phong phú hơn và hạn chế sự nhàm chán.

Bạn cũng nên chú ý đến tổng lượng thực phẩm ăn trong ngày thay vì chỉ tập trung vào một nguyên liệu riêng lẻ. Nhu cầu protein phụ thuộc vào độ tuổi, cân nặng, mức độ vận động và tình trạng sức khỏe. Với người có nhu cầu dinh dưỡng đặc biệt, việc tham khảo chuyên gia dinh dưỡng có thể giúp xây dựng thực đơn phù hợp hơn.

Điều quan trọng nhất là duy trì sự đa dạng và cân bằng trong chế độ ăn. Một bữa ăn chay được lên kế hoạch tốt không chỉ có rau xanh mà còn cần các nguồn năng lượng, protein, chất béo và những vi chất cần thiết cho cơ thể.',
 N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
 N'PUBLISHED', GETDATE(), NULL),

(2, 4,
 N'Bắt đầu ăn chay một cách khoa học và bền vững',
 N'Ăn chay có thể xuất phát từ nhiều lý do khác nhau, chẳng hạn như mong muốn thay đổi thói quen ăn uống, quan tâm đến môi trường hoặc lựa chọn lối sống phù hợp với cá nhân. Dù bắt đầu vì lý do nào, việc xây dựng thói quen ăn chay nên được thực hiện từng bước thay vì thay đổi toàn bộ thực đơn một cách đột ngột.

Trước tiên, hãy tìm hiểu những thực phẩm bạn thường ăn và lựa chọn các món có nguồn gốc thực vật để thay thế dần. Bạn có thể bắt đầu với những bữa ăn quen thuộc như cơm cùng rau củ, đậu phụ, nấm hoặc các loại đậu. Khi đã quen với cách chuẩn bị và chế biến, hãy thử thêm những nguyên liệu mới để tăng sự đa dạng cho thực đơn.

Một bữa ăn cân bằng nên có nhiều nhóm thực phẩm khác nhau. Rau củ và trái cây cung cấp vitamin, khoáng chất và chất xơ. Các loại đậu, đậu phụ và thực phẩm phù hợp khác cung cấp protein. Gạo, khoai, yến mạch và ngũ cốc cung cấp năng lượng. Một lượng chất béo phù hợp từ các loại hạt hoặc dầu thực vật cũng có thể góp phần tạo nên bữa ăn đa dạng.

Khi ăn chay lâu dài, bạn nên quan tâm đến một số chất dinh dưỡng có thể khó bổ sung đầy đủ nếu lựa chọn thực phẩm chưa phù hợp, đặc biệt là vitamin B12 đối với chế độ ăn thuần thực vật. Sắt, canxi, vitamin D, i-ốt và omega-3 cũng cần được chú ý tùy theo thực đơn. Hãy ưu tiên nguồn thực phẩm phù hợp và tìm tư vấn chuyên môn khi cần thiết.

Để tiết kiệm thời gian, bạn có thể lên kế hoạch cho các bữa ăn trong tuần, lập danh sách nguyên liệu trước khi đi chợ và sơ chế một số thực phẩm có thể bảo quản an toàn. Chuẩn bị trước giúp giảm việc phải quyết định ăn gì mỗi ngày và hạn chế phụ thuộc vào các món ăn chế biến sẵn.

Không cần phải có một thực đơn hoàn hảo ngay từ ngày đầu tiên. Hãy bắt đầu với những thay đổi có thể duy trì, quan sát nhu cầu của bản thân và điều chỉnh dần. Sự nhất quán cùng một chế độ ăn đa dạng thường hữu ích hơn việc áp dụng những quy tắc quá khắt khe trong thời gian ngắn.',
 N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85',
 N'PUBLISHED', GETDATE(), NULL),

(3, 4,
 N'7 điều người mới ăn chay nên biết trước khi bắt đầu',
 N'Khi mới bắt đầu ăn chay, bạn có thể cảm thấy khó khăn trong việc lựa chọn món ăn, chuẩn bị nguyên liệu hoặc tìm kiếm thực đơn phù hợp. Việc hiểu một số nguyên tắc cơ bản sẽ giúp bạn tự tin hơn và xây dựng thói quen ăn uống dễ duy trì trong cuộc sống hằng ngày.

Thứ nhất, hãy xác định kiểu ăn chay phù hợp với mình. Một số người vẫn sử dụng trứng và sữa, trong khi người ăn chay thuần thực vật tránh tất cả thực phẩm có nguồn gốc động vật. Việc hiểu rõ lựa chọn của bản thân sẽ giúp bạn đọc nhãn thực phẩm và lựa chọn món ăn chính xác hơn.

Thứ hai, đừng chỉ ăn rau xanh mà bỏ qua các nhóm thực phẩm khác. Một chế độ ăn đa dạng cần có nguồn protein, thực phẩm cung cấp năng lượng, chất béo phù hợp, trái cây và rau củ. Bạn có thể kết hợp đậu phụ, các loại đậu, gạo lứt, khoai lang, nấm và rau xanh trong những bữa ăn quen thuộc.

Thứ ba, hãy chú ý đến vitamin B12 nếu bạn ăn chay thuần thực vật. Những người không sử dụng thực phẩm động vật cần tìm nguồn bổ sung B12 đáng tin cậy thông qua thực phẩm tăng cường hoặc sản phẩm bổ sung phù hợp. Khi chưa chắc chắn về nhu cầu của mình, bạn nên tham khảo nhân viên y tế hoặc chuyên gia dinh dưỡng.

Thứ tư, hãy học cách đọc nhãn thực phẩm. Một sản phẩm có nhãn chay không đồng nghĩa với việc sản phẩm đó luôn giàu dinh dưỡng. Bạn nên quan tâm đến thành phần, lượng đường, natri, chất béo và các thông tin dinh dưỡng khác để lựa chọn phù hợp với nhu cầu cá nhân.

Thứ năm, hãy lên kế hoạch trước. Việc chuẩn bị một danh sách các món quen thuộc cho bữa sáng, bữa trưa và bữa tối sẽ giúp bạn tiết kiệm thời gian. Những món đơn giản như yến mạch, khoai lang hấp, cơm với đậu phụ và rau củ có thể là lựa chọn thuận tiện khi bạn bận rộn.

Thứ sáu, đừng ngại thử những nguyên liệu mới. Đậu lăng, nấm, các loại hạt và ngũ cốc nguyên hạt có thể giúp thực đơn phong phú hơn. Bạn có thể thử các phương pháp chế biến khác nhau như hấp, luộc, áp chảo hoặc nấu súp để tìm ra hương vị yêu thích.

Cuối cùng, hãy kiên nhẫn với quá trình thay đổi. Nếu cảm thấy mệt mỏi, khó duy trì bữa ăn hoặc lo lắng về tình trạng dinh dưỡng, hãy xem lại thực đơn và tìm tư vấn phù hợp. Ăn chay nên là một thói quen được xây dựng dựa trên sự hiểu biết, tính linh hoạt và nhu cầu thực tế của mỗi người.',
 N'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=85',
 N'PUBLISHED', GETDATE(), NULL),

(4, 4,
 N'Bí quyết bảo quản rau củ tươi lâu và hạn chế lãng phí',
 N'Rau củ tươi là một phần quan trọng trong thực đơn ăn chay, nhưng nếu không được bảo quản đúng cách, chúng có thể nhanh héo, mất độ giòn hoặc hư hỏng trước khi sử dụng. Một vài thói quen đơn giản sẽ giúp bạn quản lý nguyên liệu tốt hơn và hạn chế lượng thực phẩm phải bỏ đi.

Trước khi bảo quản, hãy kiểm tra và loại bỏ những phần bị dập nát hoặc có dấu hiệu hư hỏng. Nên tách riêng các loại rau có đặc điểm bảo quản khác nhau. Một số loại rau lá cần được giữ trong môi trường mát và có độ ẩm phù hợp, trong khi khoai lang, hành khô hoặc một số loại củ có thể cần nơi khô ráo, thoáng mát theo hướng dẫn bảo quản riêng.

Với rau lá như xà lách và một số loại rau xanh, hãy hạn chế để rau tiếp xúc với lượng nước dư thừa khi cất giữ. Bạn có thể dùng hộp hoặc túi bảo quản sạch, có khả năng thoát ẩm phù hợp. Khi rau đã được rửa, cần làm ráo nước trước khi bảo quản để hạn chế tình trạng úng và hư hỏng.

Các loại nấm cũng nên được bảo quản trong điều kiện phù hợp với hướng dẫn của nhà sản xuất hoặc người bán. Không nên để nguyên liệu tươi ở nhiệt độ phòng quá lâu khi chúng cần được làm lạnh. Những thực phẩm đã cắt, nấu chín hoặc chế biến cần được bảo quản an toàn và sử dụng trong thời gian thích hợp.

Một mẹo hữu ích khác là sắp xếp thực phẩm theo nguyên tắc sử dụng trước những nguyên liệu mua từ lâu hoặc sắp hết hạn. Bạn có thể dành một buổi trong tuần để kiểm tra tủ lạnh, lên danh sách các nguyên liệu còn lại và chọn món ăn dựa trên những gì đang có.

Chẳng hạn, cà rốt, nấm và đậu phụ có thể được kết hợp trong món xào hoặc món canh. Rau lá còn tươi có thể dùng cho salad, còn bí đỏ có thể được chế biến thành súp. Việc kết hợp nguyên liệu linh hoạt giúp bạn giảm số lượng thực phẩm tồn đọng và tiết kiệm chi phí mua sắm.

Cuối cùng, hãy mua lượng thực phẩm phù hợp với số người ăn và tần suất nấu nướng của gia đình. Bảo quản đúng cách, lên kế hoạch trước và tận dụng nguyên liệu hợp lý sẽ giúp việc chuẩn bị các bữa ăn chay trở nên thuận tiện hơn.',
 N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85',
 N'PUBLISHED', GETDATE(), NULL);
GO



-- =========================================================
-- 06. RECIPE
-- =========================================================

INSERT INTO RECIPE
    (category_id, created_by, name, description, image_url,
     prep_time, cook_time, servings, difficulty, instructions,
     calories, protein, carbs, fat, created_at, updated_at)
VALUES
(7, 2,
 N'Đậu phụ sốt cà chua',
 N'Món chay đơn giản, dùng với cơm nóng.',
 N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
 10, 15, 2, N'DỄ',
 N'1. Cắt đậu phụ thành miếng. 2. Xào cà chua. 3. Thêm đậu phụ và gia vị, đun đến khi thấm.',
 280, 16, 22, 12, GETDATE(), NULL),

(5, 2,
 N'Canh bí đỏ nấu nấm',
 N'Canh chay thanh nhẹ với bí đỏ và nấm.',
 N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=80',
 10, 20, 3, N'DỄ',
 N'1. Gọt và cắt bí đỏ. 2. Rửa sạch nấm. 3. Nấu bí đến mềm rồi thêm nấm và nêm vừa ăn.',
 150, 5, 25, 3, GETDATE(), NULL),

(9, 2,
 N'Salad rau củ và đậu phụ',
 N'Salad tươi mát với rau xanh và đậu phụ.',
 N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
 15, 5, 2, N'DỄ',
 N'1. Rửa sạch rau củ. 2. Cắt đậu phụ. 3. Trộn các nguyên liệu với nước sốt phù hợp.',
 320, 18, 28, 14, GETDATE(), NULL),

(6, 2,
 N'Khoai lang hấp',
 N'Món ăn đơn giản thích hợp cho bữa sáng hoặc bữa phụ.',
 N'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=1200&q=80',
 5, 20, 2, N'DỄ',
 N'1. Rửa sạch khoai lang. 2. Hấp đến khi khoai mềm. 3. Để nguội vừa ăn.',
 180, 3, 41, 0.3, GETDATE(), NULL),

(7, 2,
 N'Cơm gạo lứt với rau củ',
 N'Bữa ăn kết hợp ngũ cốc nguyên hạt và rau củ.',
 NULL,
 15, 25, 2, N'TRUNG BÌNH',
 N'1. Nấu gạo lứt. 2. Sơ chế rau củ. 3. Hấp hoặc xào rau củ và dùng cùng cơm.',
 350, 10, 65, 6, GETDATE(), NULL),

(10, 2,
 N'Sinh tố chuối yến mạch',
 N'Đồ uống từ thực vật cho bữa sáng.',
 NULL,
 5, 0, 1, N'DỄ',
 N'1. Chuẩn bị chuối và yến mạch. 2. Cho vào máy xay cùng đồ uống thực vật. 3. Xay mịn.',
 250, 7, 45, 5, GETDATE(), NULL);
GO


-- =========================================================
-- 07. VIDEO
-- =========================================================

INSERT INTO VIDEO
    (category_id, created_by, title, description, video_url,
     thumbnail_url, duration, status, created_at, updated_at)
VALUES
(6, 2,
 N'Hướng dẫn làm salad rau củ',
 N'Cách sơ chế rau củ và trộn salad tại nhà.',
 N'https://example.com/videos/salad-rau-cu',
 N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
 225, N'PUBLISHED', GETDATE(), NULL),

(5, 2,
 N'Cách nấu canh bí đỏ chay',
 N'Hướng dẫn nấu canh bí đỏ với nấm.',
 N'https://example.com/videos/canh-bi-do',
 NULL,
 300, N'PUBLISHED', GETDATE(), NULL),

(6, 3,
 N'Chuẩn bị bữa sáng trong 10 phút',
 N'Gợi ý bữa sáng đơn giản cho người bận rộn.',
 N'https://example.com/videos/bua-sang-10-phut',
 NULL,
 180, N'PENDING', GETDATE(), NULL);
GO


-- =========================================================
-- 08. POST
-- =========================================================

INSERT INTO POST
    (user_id, category_id, title, content, image_url,
     status, created_at, updated_at)
VALUES
(1, 11,
 N'Bữa trưa chay hôm nay của mình',
 N'Hôm nay mình chuẩn bị cơm gạo lứt, đậu phụ sốt cà chua và rau xanh. Mọi người thường ăn gì vào bữa trưa?',
 N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
 N'APPROVED', GETDATE(), NULL),

(2, 12,
 N'Người mới ăn chay nên bắt đầu từ đâu?',
 N'Mình muốn thay đổi chế độ ăn nhưng chưa biết cách lên thực đơn cân bằng. Mong mọi người chia sẻ kinh nghiệm.',
 NULL,
 N'APPROVED', GETDATE(), NULL),

(3, 13,
 N'Tuần đầu tiên ăn chay',
 N'Mình đang tập nấu các món đơn giản tại nhà. Việc chuẩn bị nguyên liệu từ trước giúp tiết kiệm khá nhiều thời gian.',
 NULL,
 N'PENDING', GETDATE(), NULL),

(1, 14,
 N'Gợi ý quán chay ngon',
 N'Mọi người có thể gợi ý một số quán chay ngon tại Thành phố Hồ Chí Minh không?',
 NULL,
 N'APPROVED', GETDATE(), NULL);
GO


-- =========================================================
-- 09. COMMENT
-- =========================================================

INSERT INTO [COMMENT]
    (post_id, user_id, content, created_at, updated_at)
VALUES
(1, 2,
 N'Món ăn nhìn ngon quá, cảm ơn bạn đã chia sẻ!',
 GETDATE(), NULL),

(1, 3,
 N'Mình cũng thường kết hợp gạo lứt với đậu phụ.',
 GETDATE(), NULL),

(2, 1,
 N'Bạn có thể bắt đầu với những món đơn giản và lên thực đơn theo tuần.',
 GETDATE(), NULL),

(4, 2,
 N'Mình cũng đang tìm quán chay ở khu vực Gò Vấp.',
 GETDATE(), NULL);
GO


-- =========================================================
-- 10. POST_INTERACTION
-- type examples: LIKE, BOOKMARK
-- =========================================================

INSERT INTO POST_INTERACTION
    (post_id, user_id, type, created_at)
VALUES
(1, 2, N'LIKE', GETDATE()),
(1, 3, N'LIKE', GETDATE()),
(1, 1, N'BOOKMARK', GETDATE()),
(2, 1, N'LIKE', GETDATE()),
(2, 3, N'BOOKMARK', GETDATE()),
(4, 2, N'LIKE', GETDATE());
GO


-- =========================================================
-- 11. USER_ALLERGY
-- =========================================================

INSERT INTO USER_ALLERGY (user_id, allergy_id)
VALUES
(1, 1),
(1, 5),
(2, 2),
(3, 4);
GO


-- =========================================================
-- 12. RECIPE_INGREDIENT
-- quantity is a sample amount; unit is descriptive.
-- =========================================================

INSERT INTO RECIPE_INGREDIENT
    (recipe_id, ingredient_id, quantity, unit)
VALUES
-- Recipe 1: Đậu phụ sốt cà chua
(1, 1, 200, N'g'),
(1, 10, 150, N'g'),

-- Recipe 2: Canh bí đỏ nấu nấm
(2, 14, 300, N'g'),
(2, 7, 100, N'g'),
(2, 13, 5, N'g'),

-- Recipe 3: Salad rau củ và đậu phụ
(3, 1, 150, N'g'),
(3, 11, 100, N'g'),
(3, 10, 100, N'g'),
(3, 6, 50, N'g'),

-- Recipe 4: Khoai lang hấp
(4, 12, 300, N'g'),

-- Recipe 5: Cơm gạo lứt với rau củ
(5, 4, 150, N'g'),
(5, 5, 100, N'g'),
(5, 6, 80, N'g'),

-- Recipe 6: Sinh tố chuối yến mạch
(6, 8, 40, N'g');
GO


-- =========================================================
-- 13. ALLERGY_INGREDIENT
-- =========================================================

INSERT INTO ALLERGY_INGREDIENT (allergy_id, ingredient_id)
VALUES
(1, 2),  -- Đậu phộng
(2, 3),  -- Đậu nành
(5, 9);  -- Hạt điều
GO


-- =========================================================
-- 14. BMI_RECORD
-- height in cm, weight in kg
-- =========================================================

INSERT INTO BMI_RECORD
    (user_id, height, weight, bmi, category, calculated_at)
VALUES
(1, 170, 60, 20.76, N'Bình thường', GETDATE()),
(1, 170, 62, 21.45, N'Bình thường', GETDATE()),
(2, 160, 50, 19.53, N'Bình thường', GETDATE()),
(3, 175, 75, 24.49, N'Bình thường', GETDATE());
GO


-- =========================================================
-- 15. MEAL_PLAN
-- bmi_id references BMI_RECORD
-- =========================================================

INSERT INTO MEAL_PLAN
    (user_id, bmi_id, health_goal, duration_days,
     dietary_preference, generated_at, status)
VALUES
(1, 1, N'Duy trì cân nặng', 7,
 N'Ăn chay có trứng và sữa', GETDATE(), N'COMPLETED'),

(2, 3, N'Ăn uống cân bằng', 3,
 N'Ăn chay thuần thực vật', GETDATE(), N'COMPLETED');
GO


-- =========================================================
-- 16. MEAL_PLAN_ITEM
-- meal_type examples: BREAKFAST, LUNCH, DINNER
-- =========================================================

INSERT INTO MEAL_PLAN_ITEM
    (meal_plan_id, recipe_id, day_number, meal_type)
VALUES
-- Meal plan 1
(1, 6, 1, N'BREAKFAST'),
(1, 5, 1, N'LUNCH'),
(1, 1, 1, N'DINNER'),
(1, 4, 2, N'BREAKFAST'),
(1, 3, 2, N'LUNCH'),
(1, 2, 2, N'DINNER'),
(1, 6, 3, N'BREAKFAST'),
(1, 1, 3, N'LUNCH'),
(1, 5, 3, N'DINNER'),

-- Meal plan 2
(2, 4, 1, N'BREAKFAST'),
(2, 3, 1, N'LUNCH'),
(2, 2, 1, N'DINNER'),
(2, 6, 2, N'BREAKFAST'),
(2, 5, 2, N'LUNCH'),
(2, 1, 2, N'DINNER'),
(2, 4, 3, N'BREAKFAST'),
(2, 3, 3, N'LUNCH'),
(2, 2, 3, N'DINNER');
GO


-- =========================================================
-- 17. AI_CONVERSATION
-- =========================================================

INSERT INTO AI_CONVERSATION
    (user_id, title, created_at, updated_at)
VALUES
(1, N'Tư vấn dinh dưỡng khi ăn chay', GETDATE(), NULL),
(2, N'Gợi ý bữa ăn từ nguyên liệu có sẵn', GETDATE(), NULL);
GO


-- =========================================================
-- 18. AI_MESSAGE
-- =========================================================

INSERT INTO AI_MESSAGE
    (conversation_id, sender, message, created_at)
VALUES
(1, N'USER',
 N'Làm sao để bổ sung đủ protein khi ăn chay?',
 GETDATE()),

(1, N'ASSISTANT',
 N'Bạn có thể bổ sung protein từ đậu phụ, các loại đậu, hạt và ngũ cốc. Hãy kết hợp nhiều nguồn thực phẩm trong ngày.',
 GETDATE()),

(2, N'USER',
 N'Mình có bí đỏ, nấm và đậu phụ. Có thể nấu món gì?',
 GETDATE()),

(2, N'ASSISTANT',
 N'Bạn có thể nấu canh bí đỏ với nấm và chế biến đậu phụ sốt cà chua để dùng cùng cơm.',
 GETDATE());
GO


-- =========================================================
-- 19. AI_RECOGNITION
-- =========================================================

INSERT INTO AI_RECOGNITION
    (user_id, image_url, status, created_at)
VALUES
(1,
 N'https://example.com/uploads/vegetables-01.jpg',
 N'COMPLETED', GETDATE()),

(2,
 N'https://example.com/uploads/ingredients-02.jpg',
 N'COMPLETED', GETDATE());
GO


-- =========================================================
-- 20. AI_RECOGNITION_ITEM
-- recognition_id and ingredient_id must exist
-- =========================================================

INSERT INTO AI_RECOGNITION_ITEM
    (recognition_id, ingredient_id, confidence)
VALUES
(1, 5, 0.98),
(1, 6, 0.96),
(1, 10, 0.93),
(2, 1, 0.97),
(2, 7, 0.91);
GO


-- =========================================================
-- 21. AI_MODERATION
-- Each sample targets either a post or a video.
-- =========================================================

INSERT INTO AI_MODERATION
    (post_id, video_id, result, reason, confidence,
     reviewed_by, reviewed_at, created_at)
VALUES
(1, NULL,
 N'APPROVED',
 N'Nội dung phù hợp với quy định cộng đồng.',
 0.98, 4, GETDATE(), GETDATE()),

(3, NULL,
 N'PENDING',
 N'Bài đăng đang chờ quản trị viên xem xét.',
 0.72, NULL, NULL, GETDATE()),

(NULL, 1,
 N'APPROVED',
 N'Video hướng dẫn nấu ăn chay phù hợp với quy định.',
 0.96, 4, GETDATE(), GETDATE());
GO


-- =========================================================
-- VERIFY: COUNT ROWS IN ALL 21 TABLES
-- =========================================================

SELECT N'USER' AS table_name, COUNT(*) AS total_rows FROM [USER]
UNION ALL SELECT N'CATEGORY', COUNT(*) FROM CATEGORY
UNION ALL SELECT N'ALLERGY', COUNT(*) FROM ALLERGY
UNION ALL SELECT N'INGREDIENT', COUNT(*) FROM INGREDIENT
UNION ALL SELECT N'ARTICLE', COUNT(*) FROM ARTICLE
UNION ALL SELECT N'RECIPE', COUNT(*) FROM RECIPE
UNION ALL SELECT N'VIDEO', COUNT(*) FROM VIDEO
UNION ALL SELECT N'POST', COUNT(*) FROM POST
UNION ALL SELECT N'COMMENT', COUNT(*) FROM [COMMENT]
UNION ALL SELECT N'POST_INTERACTION', COUNT(*) FROM POST_INTERACTION
UNION ALL SELECT N'USER_ALLERGY', COUNT(*) FROM USER_ALLERGY
UNION ALL SELECT N'RECIPE_INGREDIENT', COUNT(*) FROM RECIPE_INGREDIENT
UNION ALL SELECT N'ALLERGY_INGREDIENT', COUNT(*) FROM ALLERGY_INGREDIENT
UNION ALL SELECT N'BMI_RECORD', COUNT(*) FROM BMI_RECORD
UNION ALL SELECT N'MEAL_PLAN', COUNT(*) FROM MEAL_PLAN
UNION ALL SELECT N'MEAL_PLAN_ITEM', COUNT(*) FROM MEAL_PLAN_ITEM
UNION ALL SELECT N'AI_CONVERSATION', COUNT(*) FROM AI_CONVERSATION
UNION ALL SELECT N'AI_MESSAGE', COUNT(*) FROM AI_MESSAGE
UNION ALL SELECT N'AI_RECOGNITION', COUNT(*) FROM AI_RECOGNITION
UNION ALL SELECT N'AI_RECOGNITION_ITEM', COUNT(*) FROM AI_RECOGNITION_ITEM
UNION ALL SELECT N'AI_MODERATION', COUNT(*) FROM AI_MODERATION
ORDER BY table_name;
GO

PRINT N'Đã thêm sample data cho 21 bảng ChayBook.';
GO
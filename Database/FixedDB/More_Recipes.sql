USE ChayBook_Project;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @CreatedBy INT = (
        SELECT TOP (1) user_id
        FROM dbo.[USER]
        WHERE role = N'ADMIN'
          AND status = N'ACTIVE'
        ORDER BY user_id
    );

    IF @CreatedBy IS NULL
        THROW 50001, N'Không tìm thấy tài khoản ADMIN đang hoạt động.', 1;

    DECLARE @RecipeData TABLE (
        category_name NVARCHAR(255) NOT NULL,
        recipe_name NVARCHAR(255) NOT NULL PRIMARY KEY,
        description NVARCHAR(MAX) NOT NULL,
        image_url NVARCHAR(255) NOT NULL,
        prep_time INT NOT NULL,
        cook_time INT NOT NULL,
        servings INT NOT NULL,
        difficulty NVARCHAR(50) NOT NULL,
        instructions NVARCHAR(MAX) NOT NULL,
        calories FLOAT NOT NULL,
        protein FLOAT NOT NULL,
        carbs FLOAT NOT NULL,
        fat FLOAT NOT NULL,
        ingredient_names NVARCHAR(MAX) NOT NULL
    );

    INSERT INTO @RecipeData VALUES
    (N'Món chính', N'Đậu lăng đỏ hầm khoai tây',
     N'Đậu lăng đỏ hầm mềm cùng khoai tây và hành tây.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     15, 35, 3, N'TRUNG BÌNH',
     N'Rửa đậu lăng. Cắt khoai tây và hành tây. Nấu tất cả với nước đến khi mềm, nêm gia vị chay.',
     310, 17, 52, 5, N'Đậu lăng đỏ|Khoai tây|Hành tây'),

    (N'Salad và món trộn', N'Salad đậu gà xoài dưa leo',
     N'Salad tươi mát kết hợp đậu gà, xoài và dưa leo.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     15, 20, 2, N'DỄ',
     N'Luộc mềm đậu gà. Cắt xoài và dưa leo, trộn đều với đậu gà và rau mùi.',
     290, 13, 48, 6, N'Đậu gà|Xoài|Dưa leo|Rau mùi'),

    (N'Món chay nhanh', N'Đậu đen xào hành tỏi',
     N'Đậu đen mềm xào nhanh cùng hành tây và tỏi.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     10, 20, 2, N'DỄ',
     N'Ngâm và luộc mềm đậu đen. Phi thơm tỏi, thêm hành tây và đậu đen, đảo đều.',
     270, 16, 45, 4, N'Đậu đen|Hành tây|Tỏi'),

    (N'Canh và súp', N'Canh đậu xanh ngô ngọt',
     N'Canh chay thanh nhẹ từ đậu xanh và ngô ngọt.',
     N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=85',
     10, 30, 3, N'DỄ',
     N'Ngâm đậu xanh. Nấu đậu với nước đến khi gần mềm, thêm ngô ngọt và nấu chín.',
     220, 12, 40, 3, N'Đậu xanh|Ngô ngọt|Sả'),

    (N'Món chay nhanh', N'Đậu Hà Lan xào nấm đùi gà',
     N'Đậu Hà Lan xào nấm đùi gà và tỏi.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 12, 2, N'DỄ',
     N'Cắt nấm thành lát. Xào tỏi và nấm, thêm đậu Hà Lan, đảo đến khi vừa chín.',
     190, 12, 25, 5, N'Đậu Hà Lan|Nấm đùi gà|Tỏi'),

    (N'Món chính', N'Bowl quinoa đậu edamame',
     N'Quinoa ăn cùng đậu edamame, ớt chuông và dưa leo.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     15, 20, 2, N'DỄ',
     N'Nấu chín quinoa và edamame. Cắt ớt chuông, dưa leo rồi xếp cùng quinoa thành bowl.',
     360, 17, 55, 9, N'Quinoa|Đậu edamame|Ớt chuông|Dưa leo'),

    (N'Món chính', N'Tempeh kho cà tím',
     N'Tempeh và cà tím nấu mềm cùng hành tây.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     15, 25, 3, N'TRUNG BÌNH',
     N'Cắt tempeh và cà tím. Áp chảo tempeh, thêm cà tím, hành tây và nước, kho đến khi mềm.',
     330, 23, 28, 13, N'Tempeh|Cà tím|Hành tây'),

    (N'Món chay nhanh', N'Mì căn xào ớt chuông',
     N'Mì căn xào ớt chuông và hành tây.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 15, 2, N'DỄ',
     N'Cắt mì căn và ớt chuông. Xào hành tây, thêm mì căn và ớt chuông, đảo đến khi chín.',
     300, 27, 26, 10, N'Mì căn|Ớt chuông|Hành tây'),

    (N'Đồ uống chay', N'Sinh tố chuối hạt chia',
     N'Sinh tố chuối xay cùng hạt chia.',
     N'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=85',
     5, 0, 1, N'DỄ',
     N'Cho chuối, hạt chia và nước hoặc thức uống thực vật vào máy xay. Xay mịn và dùng ngay.',
     220, 5, 42, 6, N'Chuối|Hạt chia'),

    (N'Đồ uống chay', N'Sinh tố chuối hạnh nhân',
     N'Sinh tố chuối và hạnh nhân xay mịn.',
     N'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=85',
     5, 0, 1, N'DỄ',
     N'Cho chuối, hạnh nhân và nước vào máy xay. Xay đến khi hỗn hợp mịn.',
     250, 7, 34, 11, N'Chuối|Hạnh nhân'),

    (N'Salad và món trộn', N'Salad rau bina hạt bí',
     N'Rau bina trộn ớt chuông và hạt bí.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 0, 2, N'DỄ',
     N'Rửa và để ráo rau bina. Cắt ớt chuông, trộn với rau rồi rắc hạt bí.',
     210, 9, 18, 12, N'Rau bina|Hạt bí|Ớt chuông'),

    (N'Salad và món trộn', N'Salad cải xoăn hạt hướng dương',
     N'Cải xoăn trộn quả bơ và hạt hướng dương.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     12, 0, 2, N'DỄ',
     N'Cắt nhỏ cải xoăn và bóp nhẹ cho mềm. Thêm quả bơ và hạt hướng dương, trộn đều.',
     280, 8, 22, 20, N'Cải xoăn|Hạt hướng dương|Quả bơ'),

    (N'Món chay nhanh', N'Bí ngòi xào óc chó',
     N'Bí ngòi xào nhanh với hạt óc chó và tỏi.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 10, 2, N'DỄ',
     N'Cắt bí ngòi thành lát. Xào tỏi và bí ngòi đến khi vừa mềm, thêm hạt óc chó.',
     260, 7, 19, 19, N'Bí ngòi|Hạt óc chó|Tỏi'),

    (N'Salad và món trộn', N'Salad quả bơ rau bina',
     N'Rau bina và quả bơ dùng cùng dưa leo tươi.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 0, 2, N'DỄ',
     N'Rửa rau bina, cắt quả bơ và dưa leo. Trộn nhẹ các nguyên liệu trước khi dùng.',
     240, 6, 20, 17, N'Quả bơ|Rau bina|Dưa leo'),

    (N'Món chay nhanh', N'Kiều mạch xào đậu edamame',
     N'Kiều mạch xào cùng edamame và ớt chuông.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 20, 2, N'DỄ',
     N'Nấu chín kiều mạch. Xào edamame và ớt chuông, thêm kiều mạch rồi đảo nóng.',
     320, 16, 50, 7, N'Kiều mạch|Đậu edamame|Ớt chuông'),

    (N'Canh và súp', N'Súp hạt kê bí đỏ',
     N'Súp chay nấu từ hạt kê, bí đỏ và hành tây.',
     N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=85',
     10, 30, 3, N'DỄ',
     N'Vo hạt kê, cắt bí đỏ và hành tây. Nấu với nước đến khi bí và hạt kê mềm.',
     240, 7, 48, 3, N'Hạt kê|Bí đỏ|Hành tây'),

    (N'Canh và súp', N'Súp súp lơ trắng đậu Hà Lan',
     N'Súp rau củ từ súp lơ trắng, đậu Hà Lan và khoai tây.',
     N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=85',
     10, 25, 3, N'DỄ',
     N'Cắt súp lơ và khoai tây. Nấu đến khi mềm, thêm đậu Hà Lan rồi nghiền hoặc xay.',
     230, 10, 39, 4, N'Súp lơ trắng|Đậu Hà Lan|Khoai tây'),

    (N'Món chay nhanh', N'Cải xoăn xào nấm đùi gà',
     N'Cải xoăn xào nấm đùi gà và tỏi.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 12, 2, N'DỄ',
     N'Rửa cải xoăn, cắt nấm. Xào tỏi và nấm trước, thêm cải xoăn, đảo đến khi vừa chín.',
     180, 9, 19, 7, N'Cải xoăn|Nấm đùi gà|Tỏi'),

    (N'Món chay nhanh', N'Bí ngòi xào hành tây ớt chuông',
     N'Bí ngòi xào cùng hành tây và ớt chuông.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 12, 2, N'DỄ',
     N'Cắt bí ngòi và ớt chuông. Xào hành tây, cho rau củ vào đảo đến khi chín.',
     170, 5, 24, 6, N'Bí ngòi|Hành tây|Ớt chuông'),

    (N'Món chính', N'Cà tím om rau mùi',
     N'Cà tím om mềm cùng hành tây và rau mùi.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     10, 25, 3, N'DỄ',
     N'Cắt cà tím và hành tây. Om cùng một ít nước đến khi cà tím mềm, thêm rau mùi trước khi dùng.',
     190, 5, 28, 7, N'Cà tím|Hành tây|Rau mùi'),

    (N'Canh và súp', N'Canh đậu lăng đỏ súp lơ trắng',
     N'Đậu lăng đỏ nấu cùng súp lơ trắng và tỏi.',
     N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=85',
     10, 30, 3, N'DỄ',
     N'Nấu đậu lăng với nước đến khi gần mềm. Thêm súp lơ và tỏi, nấu đến khi tất cả chín.',
     280, 16, 44, 4, N'Đậu lăng đỏ|Súp lơ trắng|Tỏi'),

    (N'Món chính', N'Đậu gà nấu rau bina',
     N'Đậu gà nấu cùng rau bina và ớt chuông.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     15, 25, 3, N'TRUNG BÌNH',
     N'Luộc mềm đậu gà. Nấu cùng ớt chuông và một ít nước; thêm rau bina ở cuối và nấu vừa chín.',
     300, 17, 43, 7, N'Đậu gà|Rau bina|Ớt chuông'),

    (N'Đồ uống chay', N'Sinh tố thanh long chuối',
     N'Sinh tố trái cây từ thanh long và chuối.',
     N'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=85',
     5, 0, 1, N'DỄ',
     N'Cắt thanh long và chuối, xay cùng nước đến khi mịn.',
     190, 3, 44, 2, N'Thanh long|Chuối'),

    (N'Salad và món trộn', N'Salad quinoa quả bơ',
     N'Quinoa trộn quả bơ và dưa leo.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     15, 20, 2, N'DỄ',
     N'Nấu chín quinoa và để nguội. Cắt quả bơ, dưa leo rồi trộn cùng quinoa.',
     350, 10, 48, 14, N'Quinoa|Quả bơ|Dưa leo'),

    (N'Món chính', N'Tempeh xào nấm đùi gà',
     N'Tempeh xào nấm đùi gà và tỏi.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     10, 15, 2, N'DỄ',
     N'Cắt tempeh và nấm thành lát. Xào tỏi, áp chảo tempeh rồi thêm nấm và nấu chín.',
     340, 25, 24, 15, N'Tempeh|Nấm đùi gà|Tỏi'),

    (N'Salad và món trộn', N'Salad edamame ngô ngọt',
     N'Edamame trộn cùng ngô ngọt và ớt chuông.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 10, 2, N'DỄ',
     N'Luộc chín edamame và ngô. Để nguội, trộn với ớt chuông cắt hạt lựu.',
     260, 13, 38, 6, N'Đậu edamame|Ngô ngọt|Ớt chuông'),

    (N'Canh và súp', N'Canh khoai tây cải xoăn',
     N'Canh chay nấu từ khoai tây, cải xoăn và hành tây.',
     N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=85',
     10, 25, 3, N'DỄ',
     N'Cắt khoai tây và hành tây. Nấu đến khi khoai mềm, thêm cải xoăn và nấu thêm vài phút.',
     210, 7, 38, 4, N'Khoai tây|Cải xoăn|Hành tây'),

    (N'Món chính', N'Đậu lăng đỏ om nấm',
     N'Đậu lăng đỏ om cùng nấm đùi gà và hành tây.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     15, 30, 3, N'DỄ',
     N'Nấu đậu lăng với nước đến khi gần mềm. Thêm nấm và hành tây, nấu đến khi chín.',
     290, 17, 43, 5, N'Đậu lăng đỏ|Nấm đùi gà|Hành tây'),

    (N'Đồ uống chay', N'Sinh tố xoài thanh long',
     N'Sinh tố xoài và thanh long xay cùng nước.',
     N'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=85',
     5, 0, 1, N'DỄ',
     N'Cắt xoài và thanh long, xay cùng nước đến khi hỗn hợp mịn.',
     200, 3, 48, 2, N'Xoài|Thanh long'),

    (N'Salad và món trộn', N'Salad dưa hấu xoài rau mùi',
     N'Salad trái cây tươi từ dưa hấu, xoài và rau mùi.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 0, 2, N'DỄ',
     N'Cắt dưa hấu và xoài thành miếng vừa ăn. Trộn nhẹ với rau mùi và dùng lạnh.',
     150, 3, 36, 1, N'Dưa hấu|Xoài|Rau mùi'),

    (N'Món chay truyền thống', N'Đậu que xào tỏi',
     N'Đậu que xào tỏi giữ độ giòn và màu xanh.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 12, 2, N'DỄ',
     N'Tước xơ và cắt đậu que. Xào tỏi, thêm đậu que và đảo đến khi vừa chín.',
     140, 5, 22, 4, N'Đậu que|Tỏi'),

    (N'Canh và súp', N'Canh cải thìa nấm kim châm',
     N'Canh chay nhẹ với cải thìa và nấm kim châm.',
     N'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=85',
     10, 15, 3, N'DỄ',
     N'Rửa cải thìa và nấm kim châm. Đun nước sôi, cho nấm vào trước rồi thêm cải thìa, nấu vừa chín.',
     110, 6, 16, 2, N'Cải thìa|Nấm kim châm|Sả'),

    (N'Món chính', N'Mì căn xào bí ngòi',
     N'Mì căn xào bí ngòi và ớt chuông.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 15, 2, N'DỄ',
     N'Cắt mì căn và rau củ. Xào mì căn trước, thêm bí ngòi và ớt chuông, đảo đến khi chín.',
     310, 27, 28, 11, N'Mì căn|Bí ngòi|Ớt chuông'),

    (N'Đồ uống chay', N'Sinh tố dưa hấu chuối',
     N'Sinh tố mát lạnh từ dưa hấu và chuối.',
     N'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=85',
     5, 0, 1, N'DỄ',
     N'Bỏ hạt dưa hấu nếu cần. Xay dưa hấu và chuối đến khi mịn, dùng ngay.',
     170, 3, 40, 1, N'Dưa hấu|Chuối'),

    (N'Món chính', N'Đậu đỏ hầm tempeh',
     N'Đậu đỏ hầm mềm cùng tempeh và hành tây.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     15, 40, 3, N'TRUNG BÌNH',
     N'Ngâm và luộc mềm đậu đỏ. Thêm tempeh và hành tây, hầm thêm đến khi nguyên liệu thấm mềm.',
     330, 20, 48, 7, N'Đậu đỏ|Tempeh|Hành tây'),

    (N'Món chay nhanh', N'Đậu edamame xào cải thìa',
     N'Edamame xào cải thìa và tỏi.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 12, 2, N'DỄ',
     N'Luộc sơ edamame. Xào tỏi và cải thìa, thêm edamame rồi đảo đến khi nóng.',
     210, 14, 24, 7, N'Đậu edamame|Cải thìa|Tỏi'),

    (N'Món chính', N'Đậu gà hầm bí ngòi',
     N'Đậu gà hầm với bí ngòi và cà tím.',
     N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85',
     15, 30, 3, N'TRUNG BÌNH',
     N'Luộc mềm đậu gà. Thêm bí ngòi và cà tím, nấu với nước đến khi rau củ chín mềm.',
     300, 16, 45, 6, N'Đậu gà|Bí ngòi|Cà tím'),

    (N'Salad và món trộn', N'Salad cải xoăn hạt lanh',
     N'Cải xoăn trộn dưa leo và hạt lanh.',
     N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85',
     10, 0, 2, N'DỄ',
     N'Rửa cải xoăn và dưa leo. Cắt nhỏ, trộn đều rồi rắc hạt lanh lên trên.',
     180, 7, 20, 9, N'Cải xoăn|Dưa leo|Hạt lanh');

    IF EXISTS (
        SELECT 1
        FROM @RecipeData rd
        WHERE NOT EXISTS (
            SELECT 1
            FROM dbo.CATEGORY c
            WHERE c.name = rd.category_name
              AND c.type = N'RECIPE'
        )
    )
        THROW 50002, N'Thiếu category RECIPE cần thiết trong database.', 1;

    IF EXISTS (
        SELECT 1
        FROM @RecipeData rd
        CROSS APPLY STRING_SPLIT(rd.ingredient_names, N'|') s
        WHERE NOT EXISTS (
            SELECT 1
            FROM dbo.INGREDIENT i
            WHERE i.name = LTRIM(RTRIM(s.value))
              AND i.status = N'ACTIVE'
        )
    )
        THROW 50003, N'Thiếu ingredient ACTIVE cần thiết trong database.', 1;

    DECLARE @InsertedRecipes TABLE (
        recipe_id INT NOT NULL,
        recipe_name NVARCHAR(255) NOT NULL
    );

    INSERT INTO dbo.RECIPE (
        category_id,
        created_by,
        name,
        description,
        image_url,
        prep_time,
        cook_time,
        servings,
        difficulty,
        instructions,
        calories,
        protein,
        carbs,
        fat,
        created_at,
        status
    )
    OUTPUT inserted.recipe_id, inserted.name
        INTO @InsertedRecipes (recipe_id, recipe_name)
    SELECT
        (
            SELECT TOP (1) c.category_id
            FROM dbo.CATEGORY c
            WHERE c.name = rd.category_name
              AND c.type = N'RECIPE'
            ORDER BY c.category_id
        ),
        @CreatedBy,
        rd.recipe_name,
        rd.description,
        rd.image_url,
        rd.prep_time,
        rd.cook_time,
        rd.servings,
        rd.difficulty,
        rd.instructions,
        rd.calories,
        rd.protein,
        rd.carbs,
        rd.fat,
        GETDATE(),
        N'ACTIVE'
    FROM @RecipeData rd
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.RECIPE existing
        WHERE existing.name = rd.recipe_name
    );

    INSERT INTO dbo.RECIPE_INGREDIENT (
        recipe_id,
        ingredient_id,
        quantity,
        unit
    )
    SELECT
        ir.recipe_id,
        i.ingredient_id,
        NULL,
        NULL
    FROM @InsertedRecipes ir
    JOIN @RecipeData rd
      ON rd.recipe_name = ir.recipe_name
    CROSS APPLY STRING_SPLIT(rd.ingredient_names, N'|') s
    JOIN dbo.INGREDIENT i
      ON i.name = LTRIM(RTRIM(s.value))
     AND i.status = N'ACTIVE';

    COMMIT TRANSACTION;

    SELECT
        r.recipe_id,
        r.name,
        r.status,
        COUNT(ri.ingredient_id) AS ingredient_count
    FROM @InsertedRecipes added
    JOIN dbo.RECIPE r
      ON r.recipe_id = added.recipe_id
    LEFT JOIN dbo.RECIPE_INGREDIENT ri
      ON ri.recipe_id = r.recipe_id
    GROUP BY r.recipe_id, r.name, r.status
    ORDER BY r.recipe_id;

    SELECT COUNT(*) AS inserted_recipe_count
    FROM @InsertedRecipes;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
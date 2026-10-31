USE ChayBook_Project;
GO

IF COL_LENGTH(N'dbo.AI_RECOGNITION_ITEM', N'detected_name') IS NULL
BEGIN
    ALTER TABLE dbo.AI_RECOGNITION_ITEM
    ADD detected_name NVARCHAR(255) NULL;
END;
GO

DECLARE @NewIngredients TABLE (
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000) NOT NULL
);

INSERT INTO @NewIngredients (name, description)
VALUES
(N'Đậu lăng đỏ', N'Các hạt đậu lăng đỏ, nguồn protein thực vật dùng trong súp và cà ri chay'),
(N'Đậu gà', N'Các hạt đậu gà, thường dùng trong món hầm, salad và món chay'),
(N'Đậu đen', N'Các hạt đậu đen dùng trong món hầm, súp và món ăn từ thực vật'),
(N'Đậu đỏ', N'Các hạt đậu đỏ dùng trong món ngọt chay và món hầm'),
(N'Đậu xanh', N'Các hạt đậu xanh dùng trong món cháo, chè và món chay'),
(N'Đậu Hà Lan', N'Các hạt đậu Hà Lan dùng trong súp, món xào và món trộn'),
(N'Đậu que', N'Quả đậu non dùng làm rau trong các món chay'),
(N'Đậu edamame', N'Đậu nành non còn nguyên hạt, dùng trong món trộn và món ăn nhẹ'),
(N'Tempeh', N'Sản phẩm lên men từ đậu nành, nguồn protein thực vật'),
(N'Mì căn', N'Đạm lúa mì dùng làm nguyên liệu cho các món chay'),

(N'Hạt chia', N'Hạt thực vật giàu chất xơ, dùng trong món ăn và đồ uống'),
(N'Hạt lanh', N'Hạt thực vật dùng trong món ăn sáng và món nướng thuần chay'),
(N'Hạt bí', N'Hạt bí đỏ đã tách vỏ, dùng trong món trộn và món ăn nhẹ'),
(N'Hạt hướng dương', N'Hạt hướng dương dùng trong salad và món ăn nhẹ'),
(N'Hạt óc chó', N'Quả óc chó dùng trong món trộn, món nướng và nước sốt chay'),
(N'Hạnh nhân', N'Hạt hạnh nhân dùng trong món ăn và đồ uống thực vật'),
(N'Quinoa', N'Hạt diêm mạch dùng thay đổi nguồn ngũ cốc trong bữa ăn chay'),
(N'Kiều mạch', N'Hạt kiều mạch dùng trong cháo, mì và món ăn từ thực vật'),
(N'Hạt kê', N'Ngũ cốc kê dùng trong cháo và các món ăn chay'),
(N'Rau bina', N'Rau lá xanh dùng trong salad, canh và món xào chay'),

(N'Cải thìa', N'Rau cải thìa dùng trong canh, mì và món xào chay'),
(N'Súp lơ trắng', N'Rau họ cải dùng trong món hấp, nướng và món xào'),
(N'Cải xoăn', N'Rau lá xanh dùng trong salad, súp và món xào'),
(N'Ớt chuông', N'Quả ớt ngọt dùng trong salad, món nướng và món xào chay'),
(N'Dưa leo', N'Quả dưa leo dùng trong salad và món ăn tươi'),
(N'Ngô ngọt', N'Hạt ngô ngọt dùng trong súp, salad và món chay'),
(N'Cà tím', N'Rau quả dùng trong món kho, món nướng và món xào chay'),
(N'Bí ngòi', N'Rau quả dùng trong món xào, món nướng và mì rau củ'),
(N'Hành tây', N'Củ hành tây dùng làm gia vị và nguyên liệu món chay'),
(N'Tỏi', N'Củ tỏi dùng làm gia vị cho các món có nguồn gốc thực vật'),

(N'Sả', N'Thân sả dùng tạo hương vị cho món canh, món kho và món xào chay'),
(N'Rau mùi', N'Rau gia vị dùng trong món canh, salad và món chay'),
(N'Khoai tây', N'Củ khoai tây dùng trong món hầm, súp và món nướng'),
(N'Nấm đùi gà', N'Nấm đùi gà dùng trong món xào, món nướng và món kho chay'),
(N'Nấm kim châm', N'Nấm kim châm dùng trong lẩu chay, canh và món xào'),
(N'Quả bơ', N'Quả bơ dùng trong salad, món ăn sáng và sốt thực vật'),
(N'Chuối', N'Quả chuối dùng trong món ăn, món tráng miệng và đồ uống thực vật'),
(N'Xoài', N'Quả xoài dùng trong salad, món trộn và đồ uống thực vật'),
(N'Dưa hấu', N'Quả dưa hấu dùng trong món ăn tươi và đồ uống'),
(N'Thanh long', N'Quả thanh long dùng trong món ăn tươi và đồ uống thực vật');

INSERT INTO dbo.INGREDIENT (name, description)
SELECT newIngredient.name, newIngredient.description
FROM @NewIngredients AS newIngredient
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.INGREDIENT AS existingIngredient
    WHERE existingIngredient.name = newIngredient.name
);

SELECT @@ROWCOUNT AS insertedIngredientCount;

SELECT ingredient_id, name, description
FROM dbo.INGREDIENT
WHERE name IN (SELECT name FROM @NewIngredients)
ORDER BY name;
GO
USE ChayBook_Project;
GO

UPDATE RECIPE
SET image_url = CASE recipe_id
    WHEN 1 THEN 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85'
    WHEN 2 THEN 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=85'
    WHEN 3 THEN 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85'
    WHEN 4 THEN 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=1200&q=85'
    WHEN 5 THEN 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85'
    WHEN 6 THEN 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=85'
    ELSE image_url
END
WHERE recipe_id IN (1, 2, 3, 4, 5, 6);
GO

-- Kiểm tra kết quả
SELECT recipe_id, name, image_url
FROM RECIPE
ORDER BY recipe_id;
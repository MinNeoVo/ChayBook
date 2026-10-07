USE ChayBook_Project;
GO

INSERT INTO POST
(
    user_id,
    category_id,
    title,
    content,
    image_url,
    status,
    created_at,
    updated_at
)
SELECT
    u.user_id,

    CASE p.rn
        WHEN 1 THEN 11
        WHEN 2 THEN 12
        WHEN 3 THEN 13
        WHEN 4 THEN 14
        WHEN 5 THEN 11
        WHEN 6 THEN 12
        WHEN 7 THEN 13
        WHEN 8 THEN 14
        WHEN 9 THEN 11
        WHEN 10 THEN 12
    END AS category_id,

    p.title,
    p.content,
    p.image_url,
    'APPROVED',
    p.created_at,
    p.created_at

FROM
(
    SELECT
        user_id,
        ROW_NUMBER() OVER (ORDER BY user_id) AS rn
    FROM [USER]
) u

JOIN
(
    VALUES
    (
        1,
        N'Bữa sáng chay đơn giản cho ngày bận rộn',
        N'Sáng nay mình thử bánh mì nguyên cám với bơ đậu phộng và chuối. Nhanh, dễ làm mà vẫn đủ năng lượng cho một buổi học.',
        N'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -10, GETDATE())
    ),
    (
        2,
        N'Mọi người thường ăn gì khi mới bắt đầu ăn chay?',
        N'Mình mới bắt đầu ăn chay nên còn khá bỡ ngỡ. Mọi người có món nào dễ ăn và dễ chuẩn bị cho người mới không?',
        N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -9, GETDATE())
    ),
    (
        3,
        N'Gợi ý một bữa trưa chay đủ chất',
        N'Bữa trưa hôm nay của mình gồm cơm gạo lứt, đậu hũ áp chảo, rau xanh và một ít nấm. Ăn khá nhẹ nhưng vẫn no lâu.',
        N'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -8, GETDATE())
    ),
    (
        4,
        N'Cách làm đậu hũ sốt cà chua',
        N'Đậu hũ chiên vàng rồi nấu cùng cà chua, hành và một chút gia vị. Đây là món mình làm thường xuyên vì rất nhanh và dễ ăn với cơm.',
        N'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -7, GETDATE())
    ),
    (
        5,
        N'Một ngày ăn chay của mình',
        N'Sáng mình ăn yến mạch với trái cây, trưa ăn cơm với rau và đậu hũ, tối dùng salad cùng khoai lang. Mọi người thường ăn chay như thế nào?',
        N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -6, GETDATE())
    ),
    (
        6,
        N'Món canh chay mình thích nhất',
        N'Canh nấm rau củ là món mình rất thích trong những ngày trời nóng. Có thể thay đổi nguyên liệu tùy theo rau củ có sẵn trong tủ lạnh.',
        N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -5, GETDATE())
    ),
    (
        7,
        N'Có nên ăn chay hoàn toàn không?',
        N'Mình đang tìm hiểu giữa ăn chay hoàn toàn và ăn chay linh hoạt. Nếu bạn đã có kinh nghiệm, hãy chia sẻ cách bạn bắt đầu nhé.',
        NULL,
        DATEADD(DAY, -4, GETDATE())
    ),
    (
        8,
        N'Bữa tối nhanh chỉ với 20 phút',
        N'Tối nay mình làm mì rau củ với nấm và đậu hũ. Tổng thời gian chuẩn bị và nấu chỉ khoảng 20 phút.',
        N'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -3, GETDATE())
    ),
    (
        9,
        N'Chia sẻ thực đơn chay cuối tuần',
        N'Thứ bảy mình thường chuẩn bị trước một số nguyên liệu như rau củ, nấm và đậu hũ để cả tuần nấu ăn nhanh hơn.',
        N'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -2, GETDATE())
    ),
    (
        10,
        N'Món chay nào khiến bạn nhớ nhất?',
        N'Với mình đó là món đậu hũ kho nấm mà mẹ thường nấu. Đơn giản nhưng rất ngon và gắn với nhiều kỷ niệm.',
        N'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
        DATEADD(DAY, -1, GETDATE())
    )
) p(rn, title, content, image_url, created_at)

ON u.rn = ((p.rn - 1) % (SELECT COUNT(*) FROM [USER])) + 1;

GO
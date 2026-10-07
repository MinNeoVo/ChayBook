USE ChayBook_Project;
GO

INSERT INTO ARTICLE
(
    category_id,
    created_by,
    title,
    content,
    cover_image,
    status,
    created_at,
    updated_at
)
VALUES
(
    1,
    1,
    N'Ăn chay có đủ chất dinh dưỡng không?',
    N'Ăn chay hoàn toàn có thể cung cấp đầy đủ chất dinh dưỡng nếu xây dựng thực đơn đa dạng và cân bằng giữa các nhóm thực phẩm.',
    'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    2,
    1,
    N'5 loại thực phẩm giàu protein cho người ăn chay',
    N'Đậu nành, đậu lăng, đậu gà, các loại hạt và sản phẩm từ đậu là những nguồn protein phổ biến trong chế độ ăn chay.',
    'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    3,
    1,
    N'Làm sao để bắt đầu ăn chay?',
    N'Người mới nên bắt đầu từ từ, ưu tiên rau củ, đậu, ngũ cốc nguyên hạt và theo dõi phản ứng của cơ thể.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    4,
    1,
    N'Cách chọn rau củ tươi khi đi chợ',
    N'Hãy ưu tiên rau củ có màu sắc tự nhiên, bề mặt không bị dập nát và có độ cứng phù hợp với từng loại.',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    1,
    1,
    N'Ăn chay và sức khỏe tim mạch',
    N'Chế độ ăn nhiều rau củ, trái cây, đậu và ngũ cốc nguyên hạt có thể là một phần của lối sống tốt cho sức khỏe tim mạch.',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    2,
    1,
    N'Gợi ý bữa sáng chay nhanh gọn',
    N'Một bữa sáng đơn giản có thể gồm yến mạch, trái cây, sữa đậu nành và các loại hạt.',
    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    3,
    1,
    N'Những sai lầm người mới ăn chay thường gặp',
    N'Bỏ qua protein, ăn quá ít năng lượng và chỉ tập trung vào rau xanh là những sai lầm phổ biến.',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    4,
    1,
    N'Bảo quản trái cây đúng cách',
    N'Mỗi loại trái cây có cách bảo quản khác nhau. Một số loại nên để ở nhiệt độ phòng trong khi những loại khác phù hợp với tủ lạnh.',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    1,
    1,
    N'Có nên ăn chay mỗi ngày?',
    N'Ăn chay mỗi ngày có thể phù hợp với nhiều người nếu thực đơn được xây dựng cân bằng và đáp ứng nhu cầu dinh dưỡng.',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    2,
    1,
    N'Các loại đậu tốt cho người ăn chay',
    N'Đậu đen, đậu đỏ, đậu xanh, đậu gà và đậu lăng đều có thể được sử dụng để đa dạng hóa thực đơn.',
    'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    3,
    1,
    N'Thực đơn chay cho người bận rộn',
    N'Chuẩn bị trước nguyên liệu và sử dụng các món đơn giản giúp người bận rộn vẫn duy trì chế độ ăn chay.',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    4,
    1,
    N'Mẹo giữ rau xanh lâu hơn',
    N'Rau xanh nên được làm sạch, để ráo và bảo quản phù hợp để hạn chế mất nước và hư hỏng.',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    1,
    1,
    N'Ăn chay có giúp kiểm soát cân nặng?',
    N'Việc kiểm soát cân nặng phụ thuộc vào tổng lượng năng lượng và chất lượng thực phẩm chứ không chỉ đơn giản là ăn chay.',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    2,
    1,
    N'Protein thực vật đến từ đâu?',
    N'Protein thực vật có thể được bổ sung từ đậu, đậu phụ, các loại hạt, ngũ cốc và nhiều thực phẩm có nguồn gốc thực vật khác.',
    'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    3,
    1,
    N'Cách xây dựng một đĩa ăn chay cân bằng',
    N'Một đĩa ăn cân bằng nên kết hợp rau củ, nguồn protein thực vật, tinh bột phù hợp và chất béo lành mạnh.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    4,
    1,
    N'Những loại rau củ nên có trong bếp',
    N'Rau lá xanh, cà rốt, bí đỏ, cà chua và các loại rau củ theo mùa là những lựa chọn dễ sử dụng.',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    1,
    1,
    N'Ăn chay và chất xơ',
    N'Rau củ, trái cây, đậu và ngũ cốc nguyên hạt là những nguồn chất xơ quan trọng trong chế độ ăn chay.',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    2,
    1,
    N'Đậu phụ có thể chế biến món gì?',
    N'Đậu phụ có thể được áp chảo, kho, nấu canh, sốt cà chua hoặc kết hợp với nhiều loại rau củ.',
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    3,
    1,
    N'Lên kế hoạch ăn chay trong một tuần',
    N'Lập kế hoạch trước giúp bạn kiểm soát nguyên liệu, tiết kiệm thời gian và đảm bảo bữa ăn đa dạng.',
    'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
),
(
    4,
    1,
    N'Đi chợ thông minh cho người ăn chay',
    N'Lập danh sách trước khi đi chợ giúp giảm mua dư thực phẩm và hạn chế lãng phí.',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
    'PUBLISHED',
    GETDATE(),
    GETDATE()
);
GO
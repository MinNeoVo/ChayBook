USE ChayBook_Project;
GO

IF OBJECT_ID('CHATBOT_PROMPT', 'U') IS NULL
BEGIN
    CREATE TABLE CHATBOT_PROMPT (
        prompt_id INT NOT NULL PRIMARY KEY,
        prompt_text NVARCHAR(MAX) NOT NULL,
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_CHATBOT_PROMPT_UPDATED_AT DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_CHATBOT_PROMPT_SINGLETON CHECK (prompt_id = 1)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM CHATBOT_PROMPT WHERE prompt_id = 1)
BEGIN
    INSERT INTO CHATBOT_PROMPT (prompt_id, prompt_text)
    VALUES (1, N'Bạn là trợ lý dinh dưỡng của mạng xã hội ẩm thực chay ChayBook.
QUAN TRỌNG: Chỉ tư vấn về ăn chay, công thức món chay, thực đơn và dinh dưỡng thực vật. Nếu người dùng hỏi các chủ đề không liên quan (như chính trị, lập trình, game, toán học...), hãy từ chối trả lời một cách lịch sự, ngắn gọn và nhắc lại vai trò của bạn.');
END;
GO

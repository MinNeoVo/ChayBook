package com.chaybook.backend.admin.chatbot.service;

import com.chaybook.backend.admin.chatbot.dto.ChatbotPromptResponse;
import com.chaybook.backend.admin.chatbot.dto.UpdateChatbotPromptRequest;
import com.chaybook.backend.admin.chatbot.entity.ChatbotPrompt;
import com.chaybook.backend.admin.chatbot.repository.ChatbotPromptRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.enums.UserStatus;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ChatbotPromptService {
    public static final int PROMPT_ID = 1;
    public static final String DEFAULT_PROMPT = "Bạn là trợ lý dinh dưỡng của mạng xã hội ẩm thực chay ChayBook.\n"
            + "QUAN TRỌNG: Chỉ tư vấn về ăn chay, công thức món chay, thực đơn và dinh dưỡng thực vật. "
            + "Nếu người dùng hỏi các chủ đề không liên quan (như chính trị, lập trình, game, toán học...), "
            + "hãy từ chối trả lời một cách lịch sự, ngắn gọn và nhắc lại vai trò của bạn.";

    private final ChatbotPromptRepository promptRepository;
    private final UserRepository userRepository;

    public ChatbotPromptService(ChatbotPromptRepository promptRepository, UserRepository userRepository) {
        this.promptRepository = promptRepository;
        this.userRepository = userRepository;
    }

    private void requireAdmin(Integer userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại"));
        if (user.getStatusValue() != UserStatus.ACTIVE || !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Admin ACTIVE được thực hiện thao tác này");
        }
    }

    public String getActivePrompt() {
        return promptRepository.findById(PROMPT_ID).map(ChatbotPrompt::getPromptText).orElse(DEFAULT_PROMPT);
    }

    public ChatbotPromptResponse getPrompt(Integer userId) {
        requireAdmin(userId);
        return new ChatbotPromptResponse(getActivePrompt());
    }

    @Transactional
    public ChatbotPromptResponse updatePrompt(Integer userId, UpdateChatbotPromptRequest request) {
        requireAdmin(userId);
        ChatbotPrompt prompt = promptRepository.findById(PROMPT_ID).orElseGet(() -> {
            ChatbotPrompt created = new ChatbotPrompt();
            created.setPromptId(PROMPT_ID);
            return created;
        });
        prompt.setPromptText(request.prompt().strip());
        promptRepository.save(prompt);
        return new ChatbotPromptResponse(prompt.getPromptText());
    }
}

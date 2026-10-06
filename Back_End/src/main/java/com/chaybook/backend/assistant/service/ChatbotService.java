package com.chaybook.backend.assistant.service;

import com.chaybook.backend.assistant.client.GeminiClient;
import com.chaybook.backend.assistant.entity.AiConversation;
import com.chaybook.backend.assistant.entity.AiMessage;
import com.chaybook.backend.assistant.repository.AiConversationRepository;
import com.chaybook.backend.assistant.repository.AiMessageRepository;
import com.chaybook.backend.recipe.entity.Recipe;
import com.chaybook.backend.recipe.repository.RecipeRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    @Autowired
    private GeminiClient geminiClient;

    @Autowired
    private GuestTrialLimiter trialLimiter;

    @Autowired
    private AiConversationRepository conversationRepository;

    @Autowired
    private AiMessageRepository messageRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private UserRepository userRepository;

    public String sendMessage(Integer userId, String guestId, Integer conversationId, String userMessage) {
        try {
            // 1. Kiểm tra giới hạn dùng thử nếu là Guest
            if (userId == null) {
                if (!trialLimiter.isAllowed(guestId)) {
                    throw new RuntimeException("Bạn đã hết lượt dùng thử hôm nay. Vui lòng đăng nhập để tiếp tục.");
                }
            }

            // 2. Lấy hoặc tạo Conversation
            AiConversation conversation;
            if (conversationId != null) {
                conversation = conversationRepository.findById(conversationId)
                        .orElseThrow(() -> new RuntimeException(
                                "Không tìm thấy hội thoại (Conversation ID: " + conversationId + ")"));
            } else {
                conversation = new AiConversation();
                if (userId != null) {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy User (User ID: " + userId + ")"));
                    conversation.setUser(user);
                }
                conversation.setTitle(generateTitle(userMessage));
                conversation = conversationRepository.save(conversation);
            }

            // 3. Lưu tin nhắn của USER
            AiMessage userMsg = new AiMessage();
            userMsg.setConversation(conversation);
            userMsg.setSender("USER");
            userMsg.setMessage(userMessage);
            messageRepository.save(userMsg);

            // 4. RAG - Tìm Recipe liên quan
            String contextData = findRelevantContext(userMessage);

            // 5. Ghép Prompt với Guardrails
            String fullPrompt = buildPrompt(contextData, userMessage);

            // 6. Gọi Gemini API
            String aiReply = geminiClient.generateContent(fullPrompt);

            // 7. Lưu tin nhắn của AI
            AiMessage aiMsg = new AiMessage();
            aiMsg.setConversation(conversation);
            aiMsg.setSender("AI");
            aiMsg.setMessage(aiReply);
            messageRepository.save(aiMsg);

            // 8. Tăng số đếm nếu là Guest
            if (userId == null) {
                trialLimiter.increment(guestId);
            }

            return aiReply;

        } catch (Exception e) {
            System.err.println("========== LỖI TẠI CHATBOT SERVICE ==========");
            e.printStackTrace();
            System.err.println("=============================================");
            throw new RuntimeException(e.getMessage());
        }
    }

    private String findRelevantContext(String userMessage) {
        if (userMessage.length() < 2)
            return "";

        List<Recipe> recipes = recipeRepository.findAll();

        String matched = recipes.stream()
                .filter(r -> userMessage.toLowerCase().contains(r.getName().toLowerCase()))
                .map(r -> String.format("- %s: %.1f calo, %.1fg protein, %.1fg carbs, %.1fg fat",
                        r.getName(), r.getCalories(), r.getProtein(), r.getCarbs(), r.getFat()))
                .collect(Collectors.joining("\n"));

        return matched;
    }

    private String buildPrompt(String contextData, String userMessage) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Bạn là trợ lý dinh dưỡng của mạng xã hội ẩm thực chay ChayBook.\n");
        prompt.append("QUAN TRỌNG: Chỉ tư vấn về ăn chay, công thức món chay, thực đơn và dinh dưỡng thực vật. ");
        prompt.append("Nếu người dùng hỏi các chủ đề KHÔNG liên quan (như chính trị, lập trình, game, toán học...), ");
        prompt.append("hãy từ chối trả lời một cách lịch sự, ngắn gọn và nhắc lại vai trò của bạn.\n\n");

        if (contextData != null && !contextData.isEmpty()) {
            prompt.append("Dữ liệu món ăn tham khảo từ hệ thống ChayBook:\n");
            prompt.append(contextData).append("\n\n");
        }

        prompt.append("Câu hỏi của người dùng: ").append(userMessage).append("\n");
        prompt.append("Trả lời của bạn:");

        return prompt.toString();
    }

    private String generateTitle(String firstMessage) {
        return firstMessage.length() > 50 ? firstMessage.substring(0, 50) + "..." : firstMessage;
    }
}
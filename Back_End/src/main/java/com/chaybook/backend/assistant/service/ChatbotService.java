package com.chaybook.backend.assistant.service;

import com.chaybook.backend.assistant.client.GeminiClient;
import com.chaybook.backend.assistant.dto.ChatMessageRequest;
import com.chaybook.backend.assistant.dto.ChatMessageResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import com.chaybook.backend.assistant.dto.ChatConversationResponse;
import com.chaybook.backend.assistant.dto.ChatHistoryMessageResponse;

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

    // Đổi chữ ký hàm ở đầu ChatbotService
    public ChatMessageResponse sendMessage(Integer userId, String guestId, ChatMessageRequest request) {
        boolean guestRequest = userId == null;
        if (guestRequest && !trialLimiter.tryAcquire(guestId)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã dùng hết 3 lượt hỏi dành cho khách. Vui lòng đăng nhập để tiếp tục.");
        }

        try {
            Integer conversationId = request.getConversationId();
            String userMessage = request.getMessage();

            // 2. Lấy hoặc tạo Conversation VÀ CHẶN IDOR
            AiConversation conversation;
            if (conversationId != null) {
                conversation = conversationRepository.findById(conversationId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy hội thoại (Conversation ID: " + conversationId + ")"));

                // --- KIỂM TRA IDOR (BẢO MẬT) ---
                Integer ownerId = conversation.getUser() != null ? conversation.getUser().getUserId() : null;

                if (userId != null) {
                    // User đã đăng nhập không được truy cập hội thoại của người khác hoặc hội thoại
                    // của guest
                    if (ownerId == null || !ownerId.equals(userId)) {
                        throw new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Bạn không có quyền truy cập hội thoại này.");
                    }
                } else {
                    // Guest không được truy cập hội thoại của người dùng đã đăng nhập
                    if (ownerId != null) {
                        throw new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Khách không thể truy cập hội thoại của người dùng.");
                    }
                }
                // ---------------------------------

            } else {
                conversation = new AiConversation();
                if (userId != null) {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Không tìm thấy tài khoản người dùng."));
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

            String aiReply;
            if (isMealPlanRequest(userMessage)) {
                aiReply = "Bạn có thể tạo thực đơn tại trang sau:\n\n"
                        + "[Đi đến trang tạo thực đơn](/meal-plan)";
            } else {
                // 4. Tìm recipe được nhắc đến để bổ sung dữ liệu và link thật từ database.
                List<Recipe> relatedRecipes = findRelevantRecipes(userMessage);
                String contextData = buildRecipeContext(relatedRecipes);

                // 5. Ghép Prompt với Guardrails
                String fullPrompt = buildPrompt(contextData, userMessage);

                // 6. Gọi Gemini API
                aiReply = geminiClient.generateContent(fullPrompt);
                aiReply = appendRecipeLinks(aiReply, relatedRecipes);
            }

            // 7. Lưu tin nhắn của AI
            AiMessage aiMsg = new AiMessage();
            aiMsg.setConversation(conversation);
            aiMsg.setSender("AI");
            aiMsg.setMessage(aiReply);
            aiMsg = messageRepository.save(aiMsg); // Gán lại để lấy được messageId vừa sinh ra

            // Trả về JSON DTO hoàn chỉnh cho Frontend
            return new ChatMessageResponse(
                    conversation.getConversationId(),
                    aiMsg.getMessageId(),
                    aiReply,
                    guestRequest ? trialLimiter.getRemaining(guestId) : null);

        } catch (RuntimeException e) {
            if (guestRequest) {
                trialLimiter.release(guestId);
            }
            throw e;
        }
    }

    public List<ChatConversationResponse> getUserConversations(Integer userId) {
        return conversationRepository
                .findByUserUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(conversation -> new ChatConversationResponse(
                        conversation.getConversationId(),
                        conversation.getTitle(),
                        conversation.getCreatedAt(),
                        conversation.getUpdatedAt()))
                .toList();
    }

    public List<ChatHistoryMessageResponse> getConversationMessages(
            Integer userId,
            Integer conversationId) {
        AiConversation conversation = conversationRepository
                .findByConversationIdAndUserUserId(conversationId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy hội thoại."));

        return messageRepository
                .findByConversationConversationIdOrderByCreatedAtAsc(
                        conversation.getConversationId())
                .stream()
                .map(message -> new ChatHistoryMessageResponse(
                        message.getMessageId(),
                        message.getSender(),
                        message.getMessage(),
                        message.getCreatedAt()))
                .toList();
    }

    private List<Recipe> findRelevantRecipes(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return List.of();
        }

        String normalizedMessage = normalizeForSearch(userMessage);
        return recipeRepository.findAll().stream()
                .filter(recipe -> recipe.getStatusValue() == com.chaybook.backend.recipe.enums.RecipeStatus.ACTIVE)
                .filter(recipe -> recipe.getName() != null && !recipe.getName().isBlank())
                .filter(recipe -> normalizedMessage.contains(normalizeForSearch(recipe.getName())))
                .toList();
    }

    private String buildRecipeContext(List<Recipe> recipes) {
        return recipes.stream()
                .map(recipe -> String.format(Locale.ROOT,
                        "- %s: %s calo, %s g protein, %s g carbs, %s g fat",
                        recipe.getName(), formatNutrition(recipe.getCalories()),
                        formatNutrition(recipe.getProtein()), formatNutrition(recipe.getCarbs()),
                        formatNutrition(recipe.getFat())))
                .collect(Collectors.joining("\n"));
    }

    private String appendRecipeLinks(String aiReply, List<Recipe> recipes) {
        if (recipes.isEmpty()) {
            return aiReply;
        }

        String links = recipes.stream()
                .map(recipe -> String.format("- [%s](/recipes/%d)", recipe.getName(), recipe.getRecipeId()))
                .collect(Collectors.joining("\n"));
        return aiReply + "\n\n**Xem công thức trong ChayBook:**\n" + links;
    }

    private boolean isMealPlanRequest(String userMessage) {
        String normalizedMessage = normalizeForSearch(userMessage);
        return normalizedMessage.contains("mealplan")
                || normalizedMessage.contains("meal plan")
                || normalizedMessage.contains("tao thuc don")
                || normalizedMessage.contains("lap thuc don")
                || normalizedMessage.contains("len thuc don")
                || normalizedMessage.contains("goi y thuc don")
                || normalizedMessage.contains("xay dung thuc don");
    }

    private String normalizeForSearch(String value) {
        String withoutAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');
        return withoutAccents.toLowerCase(Locale.ROOT);
    }

    private String formatNutrition(Double value) {
        return value == null ? "chưa có dữ liệu" : String.format(Locale.ROOT, "%.1f", value);
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

package com.chaybook.backend.recognition.service.impl;

import com.chaybook.backend.ingredient.entity.*;
import com.chaybook.backend.ingredient.repository.IngredientRepository;
import com.chaybook.backend.media.dto.MediaUploadResponse;
import com.chaybook.backend.media.service.MediaService;
import com.chaybook.backend.recipe.entity.RecipeStatus;
import com.chaybook.backend.recognition.dto.*;
import com.chaybook.backend.recognition.entity.*;
import com.chaybook.backend.recognition.provider.ContentRecognitionProvider;
import com.chaybook.backend.recognition.repository.*;
import com.chaybook.backend.recognition.service.RecognitionService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.*;
@Service
public class RecognitionServiceImpl implements RecognitionService {

    private static final long MAX_IMAGE_SIZE_BYTES = 10L * 1024 * 1024;

    private final ContentRecognitionProvider contentRecognitionProvider;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final IngredientRepository ingredientRepository;
    private final AiRecognitionRepository aiRecognitionRepository;
    private final AiRecognitionItemRepository aiRecognitionItemRepository;
    private final RecognitionRecipeRepository recognitionRecipeRepository;
    private final MediaService mediaService;

    public RecognitionServiceImpl(
            ContentRecognitionProvider contentRecognitionProvider,
            ObjectMapper objectMapper,
            UserRepository userRepository,
            IngredientRepository ingredientRepository,
            AiRecognitionRepository aiRecognitionRepository,
            AiRecognitionItemRepository aiRecognitionItemRepository,
            RecognitionRecipeRepository recognitionRecipeRepository,
            MediaService mediaService
    ) {
        this.contentRecognitionProvider = contentRecognitionProvider;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.ingredientRepository = ingredientRepository;
        this.aiRecognitionRepository = aiRecognitionRepository;
        this.aiRecognitionItemRepository = aiRecognitionItemRepository;
        this.recognitionRecipeRepository = recognitionRecipeRepository;
        this.mediaService = mediaService;
    }

    @Override
    public String checkConnection() {
        return contentRecognitionProvider.generateText(
                "Hãy trả lời chính xác bằng tiếng Việt: "
                        + "Đã kết nối Gemini thành công."
        );
    }

    @Override
    @Transactional
    public RecognizeIngredientResponse recognize(
            Integer userId,
            MultipartFile image
    ) {
        validateImage(image);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Không tìm thấy tài khoản đăng nhập."
                ));

        String mimeType = image.getContentType();
        byte[] imageBytes;

        try {
            imageBytes = image.getBytes();
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không đọc được ảnh đã tải lên."
            );
        }

        String prompt = """
                Bạn là hệ thống nhận diện nguyên liệu nấu ăn.
                Hãy chỉ trả về JSON hợp lệ theo cấu trúc:
                {"items":[{"detectedName":"tên nguyên liệu tiếng Việt","confidence":0.95}]}

                Nhận diện tất cả nguyên liệu nhìn thấy rõ trong ảnh.
                Không đoán những nguyên liệu không nhìn thấy rõ.
                Confidence phải nằm trong khoảng từ 0 đến 1.
                Nếu không nhận diện được nguyên liệu nào, trả về {"items":[]}.
                Không thêm markdown hoặc giải thích ngoài JSON.
                """;

        String modelText = contentRecognitionProvider.generateContent(
                prompt,
                imageBytes,
                mimeType
        );

        RecognitionModelResponse modelResponse =
                parseModelResponse(modelText);

        List<RecognitionModelResponse.DetectedIngredient> detectedItems =
                normalizeItems(modelResponse);

        MediaUploadResponse uploadedImage = mediaService.upload(image);

        RecognitionStatus status = detectedItems.isEmpty()
                ? RecognitionStatus.FAILED
                : RecognitionStatus.COMPLETED;

        AiRecognition recognition = aiRecognitionRepository.save(
                new AiRecognition(
                        user,
                        uploadedImage.getUrl(),
                        status.name(),
                        null
                )
        );

        List<AiRecognitionItem> savedItems = new ArrayList<>();
        Set<Integer> matchedIngredientIds = new LinkedHashSet<>();

        for (RecognitionModelResponse.DetectedIngredient detected
                : detectedItems) {
            Optional<Ingredient> matchedIngredient =
                    ingredientRepository.findByNameIgnoreCaseAndStatus(
                            detected.detectedName(),
                            IngredientStatus.ACTIVE.name()
                    );

            Ingredient ingredient = matchedIngredient.orElse(null);

            if (ingredient != null) {
                matchedIngredientIds.add(ingredient.getIngredientId());
            }

            savedItems.add(new AiRecognitionItem(
                    recognition,
                    ingredient,
                    detected.detectedName(),
                    detected.confidence()
            ));
        }

        List<AiRecognitionItem> storedItems =
                aiRecognitionItemRepository.saveAll(savedItems);

        List<RecognizedIngredientResponse> itemResponses =
                storedItems.stream()
                        .map(item -> new RecognizedIngredientResponse(
                                item.getRecognitionItemId(),
                                item.getIngredient() == null
                                        ? null
                                        : item.getIngredient()
                                        .getIngredientId(),
                                item.getDetectedName(),
                                item.getConfidence()
                        ))
                        .toList();

        List<RecipeSuggestionResponse> suggestedRecipes =
                matchedIngredientIds.isEmpty()
                        ? List.of()
                        : recognitionRecipeRepository.findSuggestions(
                                new ArrayList<>(matchedIngredientIds),
                                RecipeStatus.ACTIVE.name()
                        ).stream()
                        .limit(5)
                        .toList();

        String message = detectedItems.isEmpty()
                ? "Không quét được nguyên liệu trong ảnh. Vui lòng thử ảnh khác."
                : "Đã nhận diện nguyên liệu.";

        return new RecognizeIngredientResponse(
                recognition.getRecognitionId(),
                uploadedImage.getUrl(),
                status,
                message,
                itemResponses,
                suggestedRecipes
        );
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng gửi một ảnh."
            );
        }

        if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dung lượng ảnh không được vượt quá 10 MB."
            );
        }

        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tệp tải lên phải là ảnh."
            );
        }
    }

    private RecognitionModelResponse parseModelResponse(String modelText) {
        try {
            return objectMapper.readValue(
                    removeCodeFence(modelText),
                    RecognitionModelResponse.class
            );
        } catch (JacksonException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Không đọc được kết quả nhận diện từ AI."
            );
        }
    }

    private String removeCodeFence(String text) {
        String result = text == null ? "" : text.strip();

        if (result.startsWith("```")) {
            int firstLineBreak = result.indexOf('\n');
            if (firstLineBreak >= 0) {
                result = result.substring(firstLineBreak + 1).strip();
            }

            if (result.endsWith("```")) {
                result = result.substring(0, result.length() - 3).strip();
            }
        }

        return result;
    }

    private List<RecognitionModelResponse.DetectedIngredient> normalizeItems(
            RecognitionModelResponse response
    ) {
        if (response == null || response.items() == null) {
            return List.of();
        }

        return response.items().stream()
                .filter(item -> item != null
                        && item.detectedName() != null
                        && !item.detectedName().isBlank())
                .map(item -> new RecognitionModelResponse.DetectedIngredient(
                        item.detectedName().strip(),
                        item.confidence()
                ))
                .filter(item -> item.confidence() == null
                        || (item.confidence() >= 0.0
                        && item.confidence() <= 1.0))
                .collect(
                        java.util.stream.Collectors.collectingAndThen(
                                java.util.stream.Collectors.toMap(
                                        item -> item.detectedName()
                                                .toLowerCase(Locale.ROOT),
                                        item -> item,
                                        (first, second) ->
                                                first.confidence() == null
                                                        ? second
                                                        : second.confidence()
                                                        == null
                                                        || first.confidence()
                                                        >= second.confidence()
                                                        ? first
                                                        : second,
                                        java.util.LinkedHashMap::new
                                ),
                                map -> List.copyOf(map.values())
                        )
                );
    }
}
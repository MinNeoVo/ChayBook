package com.chaybook.backend.shop.service.impl;

import com.chaybook.backend.shop.context.RecommendationContextResolver;
import com.chaybook.backend.shop.dto.DietaryMode;
import com.chaybook.backend.shop.dto.RecommendationSource;
import com.chaybook.backend.shop.dto.ShopRecommendationRequest;
import com.chaybook.backend.shop.dto.ShopRecommendationResponse;
import com.chaybook.backend.shop.dto.ShopResponse;
import com.chaybook.backend.shop.model.RankedShop;
import com.chaybook.backend.shop.model.RecommendationContext;
import com.chaybook.backend.shop.model.ShopCandidate;
import com.chaybook.backend.shop.model.ShopSearchQuery;
import com.chaybook.backend.shop.policy.ShopRecommendationPolicy;
import com.chaybook.backend.shop.provider.ShopSearchProvider;
import com.chaybook.backend.shop.service.ShopRecommendationService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class ShopRecommendationServiceImpl implements ShopRecommendationService {
    private static final int CANDIDATE_LIMIT = 20;

    private final Map<RecommendationSource, RecommendationContextResolver> resolvers;
    private final ObjectProvider<ShopSearchProvider> searchProviders;
    private final ShopRecommendationPolicy recommendationPolicy;
    private final UserRepository userRepository;

    public ShopRecommendationServiceImpl(
            List<RecommendationContextResolver> contextResolvers,
            ObjectProvider<ShopSearchProvider> searchProviders,
            ShopRecommendationPolicy recommendationPolicy,
            UserRepository userRepository
    ) {
        Map<RecommendationSource, RecommendationContextResolver> resolverMap =
                new EnumMap<>(RecommendationSource.class);
        for (RecommendationContextResolver resolver : contextResolvers) {
            if (resolverMap.putIfAbsent(resolver.supportedSource(), resolver) != null) {
                throw new IllegalArgumentException("Duplicate shop context resolver: " + resolver.supportedSource());
            }
        }
        this.resolvers = Map.copyOf(resolverMap);
        this.searchProviders = searchProviders;
        this.recommendationPolicy = recommendationPolicy;
        this.userRepository = userRepository;
    }

    @Override
    public ShopRecommendationResponse recommend(Integer userId, ShopRecommendationRequest request) {
        requireActiveUser(userId);
        RecommendationContextResolver resolver = resolvers.get(request.source());
        if (resolver == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nguồn gợi ý không được hỗ trợ.");
        }

        // Each database resolver completes its read-only transaction before the provider call.
        RecommendationContext context = resolver.resolve(userId, request);
        if (context.dishName() == null || context.dishName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Món ăn chưa có tên để tìm quán.");
        }

        ShopSearchProvider searchProvider = searchProviders.getIfAvailable();
        if (searchProvider == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Chức năng tìm quán chưa sẵn sàng."
            );
        }

        ShopSearchQuery query = createSearchQuery(request, context);
        List<ShopCandidate> candidates = searchProvider.search(query);
        if (candidates == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Dịch vụ tìm quán trả dữ liệu không hợp lệ.");
        }
        boolean fallbackUsed = !searchProvider.supportsDishSearch();
        List<ShopResponse> items = recommendationPolicy
                .select(candidates, query, request.limit())
                .stream()
                .map(shop -> toResponse(shop, context, fallbackUsed))
                .toList();
        return new ShopRecommendationResponse(items, fallbackUsed);
    }

    private void requireActiveUser(Integer userId) {
        if (userId == null || userId <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Tài khoản đăng nhập không còn tồn tại."
                ));
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản không hoạt động.");
        }
    }

    private ShopSearchQuery createSearchQuery(ShopRecommendationRequest request, RecommendationContext context) {
        String dishName = context.dishName()
                .strip()
                .replaceAll("(?U)\\s+", " ");
        return new ShopSearchQuery(
                dishName,
                request.latitude().doubleValue(),
                request.longitude().doubleValue(),
                request.radiusMeters(),
                request.dietaryMode(),
                CANDIDATE_LIMIT
        );
    }

    private ShopResponse toResponse(
            RankedShop shop,
            RecommendationContext context,
            boolean fallbackUsed
    ) {
        ShopCandidate candidate = shop.candidate();

        String reason = fallbackUsed
                ? "Quán chay gần vị trí đã chọn; chưa xác minh món "
                    + context.dishName()
                : "Kết quả tìm kiếm theo món " + context.dishName()
                    + "; cần kiểm tra thực đơn với quán.";

        return new ShopResponse(
                candidate.placeId(),
                candidate.name(),
                candidate.address(),
                candidate.latitude(),
                candidate.longitude(),
                shop.distanceMeters(),
                reason,
                "UNVERIFIED",
                candidate.dietaryEvidence(),
                candidate.mapUrl(),
                candidate.attributions()
        );
    }
}

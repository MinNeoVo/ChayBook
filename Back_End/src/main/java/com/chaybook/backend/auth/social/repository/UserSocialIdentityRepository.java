package com.chaybook.backend.auth.social.repository;

import com.chaybook.backend.auth.social.entity.SocialProvider;
import com.chaybook.backend.auth.social.entity.UserSocialIdentity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSocialIdentityRepository extends JpaRepository<UserSocialIdentity, Long> {
    @EntityGraph(attributePaths = "user")
    Optional<UserSocialIdentity> findByProviderAndProviderUserId(SocialProvider provider, String providerUserId);

    boolean existsByUser_UserIdAndProvider(Integer userId, SocialProvider provider);

    List<UserSocialIdentity> findAllByUser_UserIdOrderByProviderAsc(Integer userId);
}

package com.chaybook.backend.auth.social.entity;

import com.chaybook.backend.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "USER_SOCIAL_IDENTITY", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_SOCIAL_PROVIDER_SUBJECT", columnNames = {"provider", "provider_user_id"}),
        @UniqueConstraint(name = "UQ_SOCIAL_USER_PROVIDER", columnNames = {"user_id", "provider"})
})
public class UserSocialIdentity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "social_identity_id")
    private Long socialIdentityId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20, updatable = false)
    private SocialProvider provider;

    @Column(name = "provider_user_id", nullable = false, length = 255, updatable = false)
    private String providerUserId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected UserSocialIdentity() {
    }

    public UserSocialIdentity(User user, SocialProvider provider, String providerUserId) {
        this.user = user;
        this.provider = provider;
        this.providerUserId = providerUserId;
    }

    public Long getSocialIdentityId() { return socialIdentityId; }
    public User getUser() { return user; }
    public SocialProvider getProvider() { return provider; }
    public String getProviderUserId() { return providerUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

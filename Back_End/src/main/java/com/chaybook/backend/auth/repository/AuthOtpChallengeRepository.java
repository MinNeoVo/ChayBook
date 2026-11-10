package com.chaybook.backend.auth.repository;

import com.chaybook.backend.auth.entity.AuthOtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AuthOtpChallengeRepository extends JpaRepository<AuthOtpChallenge, Long> {
    Optional<AuthOtpChallenge> findByEmailAndPurpose(String email, String purpose);
    void deleteByEmailAndPurpose(String email, String purpose);
}

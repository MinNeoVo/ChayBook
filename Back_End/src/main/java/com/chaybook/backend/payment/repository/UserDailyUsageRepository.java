package com.chaybook.backend.payment.repository;

import com.chaybook.backend.payment.entity.UserDailyUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface UserDailyUsageRepository extends JpaRepository<UserDailyUsage, Integer> {

    Optional<UserDailyUsage> findByUserUserIdAndUsageDate(Integer userId, LocalDate usageDate);
}


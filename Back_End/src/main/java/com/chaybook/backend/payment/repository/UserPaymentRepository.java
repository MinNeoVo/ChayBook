package com.chaybook.backend.payment.repository;

import com.chaybook.backend.payment.entity.UserPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserPaymentRepository extends JpaRepository<UserPayment, Integer> {

    Optional<UserPayment> findByOrderCode(Long orderCode);

    List<UserPayment> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    List<UserPayment> findByUserUserIdAndStatusOrderByCreatedAtDesc(Integer userId, String status);

    List<UserPayment> findByUserUserIdAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            Integer userId, String status, LocalDateTime after);
}


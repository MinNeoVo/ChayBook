package com.chaybook.backend.user.repository;

import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.projection.UserStatisticsProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCaseAndUserIdNot(
            String username,
            Integer userId
    );

    Page<User> findByRoleIgnoreCase(String role, Pageable pageable);

    @Query(
            value = """
                SELECT
                    COUNT_BIG(*) AS totalAccounts,

                    COUNT_BIG(
                        CASE
                            WHEN UPPER(u.status) = 'ACTIVE' THEN 1
                        END
                    ) AS activeAccounts,

                    COUNT_BIG(
                        CASE
                            WHEN UPPER(u.status) = 'DISABLED' THEN 1
                        END
                    ) AS disabledAccounts,

                    COUNT_BIG(
                        CASE
                            WHEN u.created_at >= :weekStart
                             AND u.created_at <= :currentTime
                            THEN 1
                        END
                    ) AS newAccountsThisWeek

                FROM [USER] u
                WHERE UPPER(u.role) = 'USER'
                """,
            nativeQuery = true
    )
    UserStatisticsProjection getUserStatistics(
            @Param("weekStart") LocalDateTime weekStart,
            @Param("currentTime") LocalDateTime currentTime
    );
}
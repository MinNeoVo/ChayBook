package com.chaybook.backend.bmi.repository;

import com.chaybook.backend.bmi.entity.BmiRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BmiRecordRepository extends JpaRepository<BmiRecord, Integer> {

    Optional<BmiRecord> findFirstByUserUserIdOrderByCalculatedAtDesc(Integer userId);

    List<BmiRecord> findByUserUserIdOrderByCalculatedAtDesc(Integer userId);
}
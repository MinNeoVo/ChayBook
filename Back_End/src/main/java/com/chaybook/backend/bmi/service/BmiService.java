package com.chaybook.backend.bmi.service;

import com.chaybook.backend.bmi.dto.BmiCreateRequest;
import com.chaybook.backend.bmi.dto.BmiHistoryItem;
import com.chaybook.backend.bmi.dto.BmiResponse;
import com.chaybook.backend.bmi.entity.BmiRecord;
import com.chaybook.backend.bmi.repository.BmiRecordRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BmiService {

    private final BmiRecordRepository bmiRecordRepository;

    private final UserRepository userRepository;

    BmiService(BmiRecordRepository bmiRecordRepository, UserRepository userRepository) {
        this.bmiRecordRepository = bmiRecordRepository;
        this.userRepository = userRepository;
    }

    // ===== API 1: Tạo BMI Record =====
    public BmiResponse createBmiRecord(
            Integer authenticatedUserId,
            BmiCreateRequest request
    ) {
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (request.getHeight() == null || request.getHeight() <= 0
                || request.getWeight() == null || request.getWeight() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Height and weight must be greater than zero"
            );
        }

        double heightInMeters = request.getHeight() / 100.0;
        double bmiValue = request.getWeight() / (heightInMeters * heightInMeters);
        bmiValue = Math.round(bmiValue * 100.0) / 100.0;

        String category = classifyBmi(bmiValue);

        BmiRecord record = new BmiRecord();
        record.setUser(user);
        record.setWeight(request.getWeight());
        record.setHeight(request.getHeight());
        record.setBmi(bmiValue);
        record.setCategory(category);

        BmiRecord saved = bmiRecordRepository.save(record);

        return toResponse(saved);
    }

    // ===== API 2: Lấy BMI mới nhất =====
    public BmiResponse getLatestBmi(Integer userId) {
        BmiRecord record = bmiRecordRepository
                .findFirstByUserUserIdOrderByCalculatedAtDesc(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No BMI record found for this user"
                ));

        return toResponse(record);
    }

    // ===== API 3: Lấy lịch sử BMI =====
    public List<BmiHistoryItem> getBmiHistory(Integer userId) {
        List<BmiRecord> records = bmiRecordRepository
                .findByUserUserIdOrderByCalculatedAtDesc(userId);

        return records.stream()
                .map(this::toHistoryItem)
                .collect(Collectors.toList());
    }

    private String classifyBmi(double bmi) {
        if (bmi < 18.5)
            return "UNDERWEIGHT";
        if (bmi < 25)
            return "NORMAL";
        if (bmi < 30)
            return "OVERWEIGHT";
        return "OBESE";
    }

    private BmiResponse toResponse(BmiRecord record) {
        BmiResponse response = new BmiResponse();
        response.setBmiRecordId(record.getBmiId());
        response.setUserId(record.getUser().getUserId());
        response.setWeight(record.getWeight());
        response.setHeight(record.getHeight());
        response.setBmi(record.getBmi());
        response.setCategory(record.getCategory());
        response.setCreatedAt(record.getCalculatedAt());
        return response;
    }

    private BmiHistoryItem toHistoryItem(BmiRecord record) {
        BmiHistoryItem item = new BmiHistoryItem();
        item.setBmiRecordId(record.getBmiId());
        item.setWeight(record.getWeight());
        item.setHeight(record.getHeight());
        item.setBmi(record.getBmi());
        item.setCategory(record.getCategory());
        item.setCreatedAt(record.getCalculatedAt());
        return item;
    }
}

package com.chaybook.backend.allergy.service;

import com.chaybook.backend.allergy.dto.AllergyResponse;
import com.chaybook.backend.allergy.entity.Allergy;
import com.chaybook.backend.allergy.repository.AllergyRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class AllergyService {
    private static final Logger log = LoggerFactory.getLogger(AllergyService.class);

    private final AllergyRepository allergyRepository;
    private final UserRepository userRepository;

    public AllergyService(
            AllergyRepository allergyRepository,
            UserRepository userRepository
    ) {
        this.allergyRepository = allergyRepository;
        this.userRepository = userRepository;
    }

    public List<AllergyResponse> getAllAllergies() {
        try {
            return allergyRepository.findAll(Sort.by(Sort.Direction.ASC, "allergyId"))
                    .stream()
                    .map(this::toResponse)
                    .toList();
        } catch (RuntimeException exception) {
            log.error("Failed to load available allergies", exception);
            throw exception;
        }
    }

    public List<AllergyResponse> getUserAllergies(Integer userId) {
        try {
            User user = findUser(userId);
            return user.getAllergies().stream()
                    .sorted(Comparator.comparing(Allergy::getAllergyId))
                    .map(this::toResponse)
                    .toList();
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Failed to load allergies for userId={}", userId, exception);
            throw exception;
        }
    }

    @Transactional
    public List<AllergyResponse> replaceUserAllergies(
            Integer userId,
            List<Integer> requestedAllergyIds
    ) {
        try {
            if (requestedAllergyIds == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "allergyIds is required");
            }

            Set<Integer> uniqueIds = new LinkedHashSet<>(requestedAllergyIds);
            List<Allergy> requestedAllergies = allergyRepository.findAllById(uniqueIds);
            Set<Integer> foundIds = new HashSet<>();
            requestedAllergies.forEach(allergy -> foundIds.add(allergy.getAllergyId()));

            List<Integer> unknownIds = uniqueIds.stream()
                    .filter(allergyId -> !foundIds.contains(allergyId))
                    .toList();
            if (!unknownIds.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unknown allergy IDs: " + unknownIds
                );
            }

            User user = findUser(userId);
            user.setAllergies(new HashSet<>(requestedAllergies));
            userRepository.saveAndFlush(user);

            return requestedAllergies.stream()
                    .sorted(Comparator.comparing(Allergy::getAllergyId))
                    .map(this::toResponse)
                    .toList();
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Failed to replace allergies for userId={}", userId, exception);
            throw exception;
        }
    }

    private User findUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AllergyResponse toResponse(Allergy allergy) {
        return new AllergyResponse(allergy.getAllergyId(), allergy.getName());
    }
}

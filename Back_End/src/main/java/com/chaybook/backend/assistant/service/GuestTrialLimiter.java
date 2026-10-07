package com.chaybook.backend.assistant.service;

import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class GuestTrialLimiter {

    private static final int DAILY_LIMIT = 3;

    private final Map<String, AtomicInteger> usageMap = new ConcurrentHashMap<>();

    public boolean isAllowed(String guestId) {
        String key = buildKey(guestId);
        AtomicInteger count = usageMap.computeIfAbsent(key, k -> new AtomicInteger(0));
        return count.get() < DAILY_LIMIT;
    }

    public void increment(String guestId) {
        String key = buildKey(guestId);
        usageMap.computeIfAbsent(key, k -> new AtomicInteger(0)).incrementAndGet();
    }

    private String buildKey(String guestId) {
        return guestId + "_" + LocalDate.now();
    }
}
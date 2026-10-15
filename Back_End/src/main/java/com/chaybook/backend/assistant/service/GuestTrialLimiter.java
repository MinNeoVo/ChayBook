package com.chaybook.backend.assistant.service;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class GuestTrialLimiter {

    private static final int TRIAL_LIMIT = 3;

    private final Map<String, AtomicInteger> usageMap = new ConcurrentHashMap<>();

    public boolean tryAcquire(String guestId) {
        AtomicInteger count = usageMap.computeIfAbsent(guestId, key -> new AtomicInteger());
        int currentCount = count.get();

        while (currentCount < TRIAL_LIMIT) {
            if (count.compareAndSet(currentCount, currentCount + 1)) {
                return true;
            }
            currentCount = count.get();
        }

        return false;
    }

    public void release(String guestId) {
        usageMap.computeIfAbsent(guestId, key -> new AtomicInteger()).decrementAndGet();
    }

    public int getRemaining(String guestId) {
        AtomicInteger count = usageMap.get(guestId);
        return count == null ? TRIAL_LIMIT : Math.max(0, TRIAL_LIMIT - count.get());
    }
}
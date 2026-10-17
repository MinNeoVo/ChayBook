package com.chaybook.backend.assistant.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GuestTrialLimiterTest {

    @Test
    void allowsThreeQuestionsAndRejectsTheFourthForTheSameGuest() {
        GuestTrialLimiter limiter = new GuestTrialLimiter();

        assertTrue(limiter.tryAcquire("guest-1"));
        assertTrue(limiter.tryAcquire("guest-1"));
        assertTrue(limiter.tryAcquire("guest-1"));
        assertFalse(limiter.tryAcquire("guest-1"));
    }

    @Test
    void tracksGuestTrialsIndependently() {
        GuestTrialLimiter limiter = new GuestTrialLimiter();

        assertTrue(limiter.tryAcquire("guest-1"));
        assertTrue(limiter.tryAcquire("guest-2"));
    }

    @Test
    void releasesTrialWhenQuestionCouldNotBeCompleted() {
        GuestTrialLimiter limiter = new GuestTrialLimiter();

        assertTrue(limiter.tryAcquire("guest-1"));
        limiter.release("guest-1");

        assertTrue(limiter.tryAcquire("guest-1"));
        assertTrue(limiter.tryAcquire("guest-1"));
        assertTrue(limiter.tryAcquire("guest-1"));
        assertFalse(limiter.tryAcquire("guest-1"));
    }
}

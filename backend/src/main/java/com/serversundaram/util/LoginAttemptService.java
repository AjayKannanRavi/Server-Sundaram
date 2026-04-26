package com.serversundaram.util;

import lombok.Getter;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Service to track and prevent brute-force login attacks.
 * Locks accounts after 5 failed attempts for 15 minutes.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_DURATION_MINUTES = 15;

    private final ConcurrentMap<String, LoginAttempt> loginAttempts = new ConcurrentHashMap<>();

    /**
     * Record a failed login attempt
     */
    public void recordFailedLogin(String username, Long hotelId) {
        String key = buildKey(username, hotelId);
        LoginAttempt attempt = loginAttempts.computeIfAbsent(key, k -> new LoginAttempt());
        attempt.recordFailure();
    }

    /**
     * Record a successful login (clears attempt counter)
     */
    public void recordSuccessfulLogin(String username, Long hotelId) {
        String key = buildKey(username, hotelId);
        loginAttempts.remove(key);
    }

    /**
     * Check if account is currently locked
     */
    public boolean isBlocked(String username, Long hotelId) {
        String key = buildKey(username, hotelId);
        LoginAttempt attempt = loginAttempts.get(key);

        if (attempt == null) {
            return false;
        }

        if (attempt.isLocked()) {
            long lockDurationMs = Duration.ofMinutes(LOCK_DURATION_MINUTES).toMillis();
            if (System.currentTimeMillis() - attempt.getLastFailureTime() > lockDurationMs) {
                // Lock has expired, remove the entry
                loginAttempts.remove(key);
                return false;
            }
            return true;
        }

        return false;
    }

    /**
     * Get remaining lock time in seconds (or 0 if not locked)
     */
    public long getRemainingLockTimeSeconds(String username, Long hotelId) {
        String key = buildKey(username, hotelId);
        LoginAttempt attempt = loginAttempts.get(key);

        if (attempt == null || !attempt.isLocked()) {
            return 0;
        }

        long lockDurationMs = Duration.ofMinutes(LOCK_DURATION_MINUTES).toMillis();
        long elapsedMs = System.currentTimeMillis() - attempt.getLastFailureTime();
        long remainingMs = lockDurationMs - elapsedMs;

        return Math.max(0, remainingMs / 1000);
    }

    private String buildKey(String username, Long hotelId) {
        return username.toLowerCase() + "_" + (hotelId != null ? hotelId : "master");
    }

    /**
     * Internal class to track login attempts
     */
    @Getter
    private static class LoginAttempt {
        private int failureCount = 0;
        private long lastFailureTime = 0;

        void recordFailure() {
            this.failureCount++;
            this.lastFailureTime = System.currentTimeMillis();
        }

        boolean isLocked() {
            return failureCount >= MAX_ATTEMPTS;
        }
    }
}

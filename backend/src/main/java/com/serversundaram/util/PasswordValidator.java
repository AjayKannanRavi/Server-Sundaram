package com.serversundaram.util;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.stereotype.Component;

/**
 * Password strength validator for secure password requirements.
 * Enforces:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
@Component
public class PasswordValidator {

    private static final int MIN_LENGTH = 8;

    public ValidationResult validate(String password) {
        if (password == null || password.isBlank()) {
            return ValidationResult.failed("Password cannot be empty");
        }

        if (password.length() < MIN_LENGTH) {
            return ValidationResult.failed("Password must be at least " + MIN_LENGTH + " characters");
        }

        if (!password.matches(".*[A-Z].*")) {
            return ValidationResult.failed("Password must contain at least one uppercase letter (A-Z)");
        }

        if (!password.matches(".*[a-z].*")) {
            return ValidationResult.failed("Password must contain at least one lowercase letter (a-z)");
        }

        if (!password.matches(".*[0-9].*")) {
            return ValidationResult.failed("Password must contain at least one digit (0-9)");
        }

        if (!password.matches(".*[!@#$%^&*].*")) {
            return ValidationResult.failed("Password must contain at least one special character (!@#$%^&*)");
        }

        return ValidationResult.success();
    }

    @Getter
    @AllArgsConstructor
    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        public static ValidationResult success() {
            return new ValidationResult(true, "Password is valid");
        }

        public static ValidationResult failed(String message) {
            return new ValidationResult(false, message);
        }
    }
}

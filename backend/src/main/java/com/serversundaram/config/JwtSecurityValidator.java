package com.serversundaram.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Validator for JWT secret configuration security.
 * Ensures that default/weak secrets are not used in production.
 * Minimum required secret length: 256 bits (43+ characters when base64 encoded).
 */
@Component
@RequiredArgsConstructor
public class JwtSecurityValidator implements InitializingBean {

    private static final Logger log = LoggerFactory.getLogger(JwtSecurityValidator.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final JwtProperties jwtProperties;
    private final Environment environment;

    @Override
    public void afterPropertiesSet() throws Exception {
        String secret = jwtProperties.getSecret();
        boolean strictMode = isStrictMode();

        if (secret == null || secret.isBlank()) {
            if (strictMode) {
                throw new IllegalStateException(
                    "SECURITY ERROR: JWT_SECRET is not configured. " +
                    "Set the JWT_SECRET environment variable to a strong secret (256+ bits). " +
                    "Example: export JWT_SECRET=$(openssl rand -base64 32)"
                );
            }

            jwtProperties.setSecret(generateEphemeralSecret());
            log.warn(
                "JWT_SECRET is not configured. Generated an ephemeral secret for local development. " +
                "Set JWT_SECRET to a strong secret to keep tokens valid across restarts."
            );
            return;
        }

        if (isDefaultSecret(secret)) {
            if (strictMode) {
                throw new IllegalStateException(
                    "SECURITY ERROR: Default JWT secret detected! " +
                    "Set JWT_SECRET environment variable to a strong secret (256+ bits). " +
                    "NEVER use default/placeholder secrets in production."
                );
            }

            jwtProperties.setSecret(generateEphemeralSecret());
            log.warn(
                "Default JWT secret detected. Generated an ephemeral secret for local development. " +
                "Set JWT_SECRET to a strong secret to keep tokens valid across restarts."
            );
            return;
        }

        if (secret.length() < 32) {
            if (strictMode) {
                throw new IllegalStateException(
                    "SECURITY ERROR: JWT secret is too short (" + secret.length() + " characters). " +
                    "Set JWT_SECRET to a strong secret (256+ bits)."
                );
            }

            log.warn(
                "SECURITY WARNING: JWT secret is less than 256 bits ({} characters). " +
                "Recommended minimum: 43+ characters. " +
                "Generate strong secret: openssl rand -base64 32",
                secret.length()
            );
        } else {
            log.info("JWT configuration validated successfully. Secret length: {} characters", secret.length());
        }
    }

    private boolean isStrictMode() {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                return true;
            }
        }

        return false;
    }

    private boolean isDefaultSecret(String secret) {
        return secret.contains("your-super-secret") || secret.contains("change-this-in-production");
    }

    private String generateEphemeralSecret() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }
}

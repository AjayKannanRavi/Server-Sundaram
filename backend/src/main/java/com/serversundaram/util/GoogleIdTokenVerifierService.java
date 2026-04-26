package com.serversundaram.util;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Slf4j
public class GoogleIdTokenVerifierService {

    @Value("${app.auth.google-client-id:}")
    private String googleClientId;

    public GoogleUserInfo verify(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new IllegalArgumentException("Google token is required");
        }

        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException("Google client ID is not configured");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            Object emailVerifiedValue = payload.get("email_verified");
            boolean emailVerified = Boolean.TRUE.equals(emailVerifiedValue)
                    || "true".equalsIgnoreCase(String.valueOf(emailVerifiedValue));

            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google account email is missing");
            }
            if (!emailVerified) {
                throw new IllegalArgumentException("Google account email is not verified");
            }

            return new GoogleUserInfo(email.trim().toLowerCase(),
                    (String) payload.get("name"),
                    (String) payload.get("picture"));
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to verify Google ID token", ex);
            throw new IllegalStateException("Unable to verify Google token");
        }
    }

    public record GoogleUserInfo(String email, String name, String pictureUrl) {}
}

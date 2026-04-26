package com.serversundaram.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import com.serversundaram.config.JwtProperties;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtTokenUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenUtil.class);
    private final JwtProperties jwtProperties;

    /**
     * Generate a JWT token with user and tenant information
     */
    public String generateToken(Long userId, Long tenantId, String username, List<String> roles) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(
                jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8)
            );

            return Jwts.builder()
                .claim("userId", userId)
                .claim("tenantId", tenantId)
                .claim("username", username)
                .claim("role", roles != null && !roles.isEmpty() ? roles.get(0) : null)
                .claim("roles", roles)
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpirationMs()))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
        } catch (Exception e) {
            log.error("Error generating JWT token: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating JWT token", e);
        }
    }

    /**
     * Validate JWT token and extract claims
     */
    public Claims validateAndGetClaims(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(
                jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8)
            );

            return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (Exception e) {
            log.error("Error validating JWT token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Extract userId from token
     */
    public Long getUserId(String token) {
        Claims claims = validateAndGetClaims(token);
        if (claims == null) return null;
        return claims.get("userId", Long.class);
    }

    /**
     * Extract tenantId from token
     */
    public Long getTenantId(String token) {
        Claims claims = validateAndGetClaims(token);
        if (claims == null) return null;
        return claims.get("tenantId", Long.class);
    }

    /**
     * Extract username from token
     */
    public String getUsername(String token) {
        Claims claims = validateAndGetClaims(token);
        if (claims == null) return null;
        return claims.getSubject();
    }

    /**
     * Extract roles from token
     */
    @SuppressWarnings("unchecked")
    public List<String> getRoles(String token) {
        Claims claims = validateAndGetClaims(token);
        if (claims == null) return null;
        return claims.get("roles", List.class);
    }

    /**
     * Check if token is valid
     */
    public boolean isTokenValid(String token) {
        return validateAndGetClaims(token) != null;
    }
}

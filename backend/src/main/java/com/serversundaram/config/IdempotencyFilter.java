package com.serversundaram.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Filter to provide application-level idempotency based on Idempotency-Key header.
 * Applies mainly to POST, PUT, and PATCH methods.
 */
@Component
@Order(1) // Execute early
public class IdempotencyFilter extends OncePerRequestFilter {

    private static final String IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

    // Simple in-memory cache for idempotency. Key: Idempotency-Key, Value: CachedResponse
    private final ConcurrentHashMap<String, CachedResponse> idempotencyCache = new ConcurrentHashMap<>();
    
    // Cache expiry time (e.g., 24 hours)
    private static final long CACHE_EXPIRY_MS = TimeUnit.HOURS.toMillis(24);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String method = request.getMethod();
        // Only apply to methods that mutate state
        if (!("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method))) {
            filterChain.doFilter(request, response);
            return;
        }

        String idempotencyKey = request.getHeader(IDEMPOTENCY_KEY_HEADER);

        // If no idempotency key is provided, proceed normally
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Clean up expired cache entries (Naive implementation for demonstration)
        cleanupExpiredEntries();

        // Check cache
        CachedResponse cachedResponse = idempotencyCache.get(idempotencyKey);
        if (cachedResponse != null) {
            // Return cached response
            response.setStatus(cachedResponse.status);
            response.setContentType(cachedResponse.contentType);
            if (cachedResponse.body != null) {
                response.getOutputStream().write(cachedResponse.body);
            }
            return;
        }

        // Wrap response to cache its body
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        // Process the request
        filterChain.doFilter(request, responseWrapper);

        // Cache the response
        byte[] responseBody = responseWrapper.getContentAsByteArray();
        idempotencyCache.put(idempotencyKey, new CachedResponse(
                responseWrapper.getStatus(),
                responseWrapper.getContentType(),
                responseBody,
                System.currentTimeMillis()
        ));

        // Copy body back to original response
        responseWrapper.copyBodyToResponse();
    }

    private void cleanupExpiredEntries() {
        long now = System.currentTimeMillis();
        idempotencyCache.entrySet().removeIf(entry -> (now - entry.getValue().timestamp) > CACHE_EXPIRY_MS);
    }

    private static class CachedResponse {
        int status;
        String contentType;
        byte[] body;
        long timestamp;

        CachedResponse(int status, String contentType, byte[] body, long timestamp) {
            this.status = status;
            this.contentType = contentType;
            this.body = body;
            this.timestamp = timestamp;
        }
    }
}

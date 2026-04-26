package com.serversundaram.config;

import com.serversundaram.util.JwtTokenUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * JWT-based tenant filter that extracts tenant_id from JWT claims
 * and enforces tenant isolation for all requests
 */
@Component
@RequiredArgsConstructor
public class JwtTenantFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtTenantFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String HOTEL_HEADER = "X-Hotel-Id";
    private static final String TENANT_HEADER = "X-Tenant-ID";

    private final JwtTokenUtil jwtTokenUtil;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip JWT extraction for public endpoints
        String requestPath = request.getRequestURI();
        if (isPublicEndpoint(requestPath)) {
            // Even for public endpoints, set TenantContext from X-Hotel-Id header
            // so customer-facing services (OTP, restaurant info) can resolve the tenant.
            String hotelIdHeader = request.getHeader(HOTEL_HEADER);
            if (hotelIdHeader != null && !hotelIdHeader.isBlank() && !hotelIdHeader.equalsIgnoreCase("master")) {
                try {
                    Long.parseLong(hotelIdHeader.trim()); // validate it's numeric
                    TenantContext.setCurrentTenant(hotelIdHeader.trim());
                } catch (NumberFormatException ignored) {
                    // non-numeric hotel header — don't set a bad tenant context
                }
            }
            try {
                filterChain.doFilter(request, response);
            } finally {
                TenantContext.clear();
            }
            return;
        }

        // Extract Bearer token from Authorization header
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);
        String token = null;

        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            token = authHeader.substring(BEARER_PREFIX.length());
        }

        if (token == null || token.isEmpty()) {
            log.warn("Missing JWT token for request: {}", requestPath);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Missing Authorization header\"}");
            return;
        }

        // Validate token and extract tenant context
        Long tenantId = jwtTokenUtil.getTenantId(token);
        if (tenantId == null || !jwtTokenUtil.isTokenValid(token)) {
            log.warn("Invalid or expired JWT token for request: {}", requestPath);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Invalid or expired token\"}");
            return;
        }

        if (hasTenantMismatchHint(request, tenantId)) {
            log.warn("Tenant mismatch detected for request: {}", requestPath);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Tenant mismatch\"}");
            return;
        }

        // Use JWT tenant ID as the source of truth (it's already cryptographically verified)
        // JWT verification is our security boundary; headers are informational only
        try {
            List<String> roles = jwtTokenUtil.getRoles(token);
            var authorities = (roles == null ? Collections.<String>emptyList() : roles)
                    .stream()
                    .filter(role -> role != null && !role.isBlank())
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            String username = jwtTokenUtil.getUsername(token);
            var authentication = new UsernamePasswordAuthenticationToken(username, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            TenantContext.setCurrentTenant(Objects.requireNonNull(tenantId).toString());
            log.debug("JWT tenant context set for tenantId: {} on request: {}", tenantId, requestPath);
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
            TenantContext.clear();
        }
    }

    /**
     * Check if endpoint is public (doesn't require JWT)
     */
    private boolean isPublicEndpoint(String requestPath) {
        return requestPath.startsWith("/api/saas") ||
               requestPath.startsWith("/uploads") ||
               requestPath.startsWith("/api/health") ||
               requestPath.equals("/api/staff/login") ||
               requestPath.equals("/api/staff/login/google") ||
               // Customer-facing public endpoints (no auth required before OTP login)
               requestPath.equals("/api/customers/otp/send") ||
               requestPath.equals("/api/customers/otp/verify") ||
               requestPath.startsWith("/api/menu") ||
               requestPath.equals("/api/orders") ||
               requestPath.equals("/api/orders/session") ||
               requestPath.matches("^/api/orders/\\d+$") ||
               requestPath.matches("^/api/orders/\\d+/items$") ||
               requestPath.matches("^/api/orders/\\d+/status$") ||
               requestPath.equals("/api/reviews") ||
               requestPath.matches("^/api/reviews/session/.+$") ||
               requestPath.startsWith("/api/restaurant") ||
               requestPath.equals("/ws") ||
               requestPath.startsWith("/ws/") ||
               requestPath.equals("/") ||
               requestPath.startsWith("/swagger") ||
               requestPath.startsWith("/v3/api-docs");
    }

    private boolean hasTenantMismatchHint(HttpServletRequest request, Long jwtTenantId) {
        String headerTenant = request.getHeader(TENANT_HEADER);
        String hotelHeaderTenant = request.getHeader(HOTEL_HEADER);
        String queryTenant = request.getParameter("hotelId");

        return mismatches(headerTenant, jwtTenantId)
                || mismatches(hotelHeaderTenant, jwtTenantId)
                || mismatches(queryTenant, jwtTenantId);
    }

    private boolean mismatches(String hint, Long jwtTenantId) {
        if (hint == null || hint.isBlank()) {
            return false;
        }

        try {
            return !jwtTenantId.equals(Long.parseLong(hint.trim()));
        } catch (NumberFormatException ex) {
            return true;
        }
    }
}

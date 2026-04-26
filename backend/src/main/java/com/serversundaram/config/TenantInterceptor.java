package com.serversundaram.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class TenantInterceptor implements HandlerInterceptor {

    private static final String TENANT_HEADER = "X-Hotel-Id";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);
        boolean hasBearerToken = authHeader != null && authHeader.startsWith(BEARER_PREFIX);
        if (hasBearerToken) {
            // JWT filter already resolved tenant and security context; do not override with headers.
            return true;
        }

        String tenantIdStr = request.getHeader(TENANT_HEADER);
        if (tenantIdStr != null && !tenantIdStr.isEmpty()) {
            try {
                TenantContext.setCurrentTenant(tenantIdStr);
            } catch (NumberFormatException e) {
                // Invalid tenant ID format
            }
        }
        return true;
    }

    @Override
    public void afterCompletion(@NonNull jakarta.servlet.http.HttpServletRequest request, @NonNull jakarta.servlet.http.HttpServletResponse response, @NonNull Object handler, @Nullable Exception ex) throws Exception {
        TenantContext.clear();
    }
}

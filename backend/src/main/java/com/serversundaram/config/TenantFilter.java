package com.serversundaram.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;

public class TenantFilter implements Filter {

    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final String HOTEL_HEADER = "X-Hotel-Id";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private final AppWorkflowProperties appWorkflowProperties;

    public TenantFilter(AppWorkflowProperties appWorkflowProperties) {
        this.appWorkflowProperties = appWorkflowProperties;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        String tenantId = null;
        String authHeader = req.getHeader(AUTHORIZATION_HEADER);
        boolean hasBearerToken = authHeader != null && authHeader.startsWith(BEARER_PREFIX);

        // For authenticated requests, tenant identity is derived from JWT in JwtTenantFilter.
        if (!hasBearerToken) {
            tenantId = req.getHeader(HOTEL_HEADER);
            if (tenantId == null || tenantId.isEmpty()) {
                tenantId = req.getHeader(TENANT_HEADER);
            }

            // Fallback to query parameter if header is missing
            if (tenantId == null || tenantId.isEmpty()) {
                tenantId = req.getParameter("hotelId");
            }
        }

        String path = req.getRequestURI();
        boolean isMasterPath = appWorkflowProperties.getTenant().getMasterPathPrefixes()
                .stream()
                .anyMatch(path::startsWith);

        try {
            if (tenantId != null && !tenantId.isEmpty()) {
                TenantContext.setCurrentTenant(tenantId);
            } else if (isMasterPath || !appWorkflowProperties.getTenant().isRequireHeaderForOperationalApis()) {
                TenantContext.setCurrentTenant("master");
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}

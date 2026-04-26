package com.serversundaram.config;

import org.springframework.stereotype.Component;

@Component
public class CurrentTenantIdentifierResolverImpl implements org.hibernate.context.spi.CurrentTenantIdentifierResolver<String> {

    private static final String DEFAULT_TENANT_ID = "master";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContext.getCurrentTenant();
        return (tenantId != null) ? tenantId : DEFAULT_TENANT_ID;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}

package com.serversundaram.config;

import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

public class TenantContext {
    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();

    public static void setCurrentTenant(@NonNull String tenant) {
        currentTenant.set(tenant);
    }

    public static @Nullable String getCurrentTenant() {
        return currentTenant.get();
    }

    public static @Nullable Long getCurrentTenantAsLong() {
        String tenant = currentTenant.get();
        if (tenant == null || "master".equals(tenant)) {
            return null;
        }
        try {
            return Long.parseLong(tenant);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static @NonNull Long requireCurrentTenantAsLong() {
        Long tenantId = getCurrentTenantAsLong();
        if (tenantId == null) {
            throw new IllegalStateException("Missing tenant context from authenticated JWT.");
        }
        return tenantId;
    }

    public static void clear() {
        currentTenant.remove();
    }
}

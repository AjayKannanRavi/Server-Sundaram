package com.serversundaram.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

@Component("tenantStartupInitializer")
@RequiredArgsConstructor
public class TenantStartupInitializer implements SmartInitializingSingleton {

    private static final Logger log = LoggerFactory.getLogger(TenantStartupInitializer.class);
    private final DatabaseProvisioner databaseProvisioner;

    @Value("${spring.datasource.url}")
    private String masterDbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPass;

    @Override
    public void afterSingletonsInstantiated() {
        log.info("TenantStartupInitializer: Starting single-database multi-tenant model initialization...");
        try {
            // Ensure master schema is up to date
            databaseProvisioner.ensureMasterSchema();
            log.info("TenantStartupInitializer: Master schema ensured successfully.");

            // NOTE: In single-database multi-tenant model, individual tenant databases are NOT created.
            // All tenants share the single servesmart database with row-level isolation via tenant_id.
            // Legacy per-tenant database provisioning has been disabled.
            log.info("TenantStartupInitializer: Single-database initialization completed (per-tenant DB creation disabled).");
        } catch (Exception e) {
            log.error("ERROR in TenantStartupInitializer: {}", e.getMessage(), e);
            e.printStackTrace();
        }
    }
}

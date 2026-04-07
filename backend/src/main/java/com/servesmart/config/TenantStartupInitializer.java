package com.servesmart.config;

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
        log.info("FINAL OTP FIX: Breaking Circular Dependency - Using Direct JDBC for Pre-Startup Sync...");
        try {
            // WE MUST NOT USE JPA REPOSITORIES HERE because it would cause a circular 
            // dependency with EntityManagerFactory (which @DependsOn this bean).
            List<String> restaurantIds = new ArrayList<>();
            
            Class.forName("com.mysql.cj.jdbc.Driver");
            try (Connection conn = DriverManager.getConnection(masterDbUrl, dbUser, dbPass);
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id FROM restaurant")) {
                
                while (rs.next()) {
                    restaurantIds.add(rs.getString("id"));
                }
            }

            log.info("FINAL OTP FIX: Found {} restaurants to sync.", restaurantIds.size());
            for (String id : restaurantIds) {
                log.info("FINAL OTP FIX: Syncing Schema and Data for Restaurant ID: {}", id);
                databaseProvisioner.createTenantDatabase(id);
                databaseProvisioner.syncTenantRestaurant(id);
            }
            log.info("FINAL OTP FIX: Pre-Startup Universal Schema Migration COMPLETED.");
        } catch (Exception e) {
            log.error("CRITICAL ERROR in early migration (circular dependency bypassed): {}", e.getMessage());
            e.printStackTrace();
        }
    }
}

package com.serversundaram;

import com.serversundaram.entity.Category;
import com.serversundaram.entity.MenuItem;
import com.serversundaram.entity.RestaurantTable;
import com.serversundaram.repository.CategoryRepository;
import com.serversundaram.repository.MenuItemRepository;
import com.serversundaram.repository.RestaurantTableRepository;
import com.serversundaram.repository.RawMaterialRepository;
import com.serversundaram.entity.RawMaterial;
import com.serversundaram.repository.RestaurantRepository;
import com.serversundaram.entity.Restaurant;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.util.Optional;
import com.serversundaram.config.AppWorkflowProperties;

@SpringBootApplication
public class ServersundaramBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServersundaramBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner dataSeeder(
            CategoryRepository categoryRepository,
            MenuItemRepository menuItemRepository,
            RestaurantTableRepository tableRepository,
            RawMaterialRepository rawMaterialRepository,
            RestaurantRepository restaurantRepository,
            com.serversundaram.repository.StaffRepository staffRepository,
            com.serversundaram.config.DatabaseProvisioner databaseProvisioner,
            AppWorkflowProperties appWorkflowProperties) {
        return args -> {
            System.out.println("DEBUG: DataSeeder starting...");
            System.out.println("DEBUG: Seed Enabled: " + appWorkflowProperties.getSeed().isEnabled());
            System.out.println("DEBUG: Default Tenant ID: " + appWorkflowProperties.getSeed().getDefaultTenantId());

            databaseProvisioner.ensureMasterSchema();

            if (!appWorkflowProperties.getSeed().isEnabled()) {
                System.out.println("DEBUG: Seeding is DISABLED. Skipping provisioning.");
                return;
            }

            String adminUsername = appWorkflowProperties.getSeed().getAdminUsername();
            String adminPassword = appWorkflowProperties.getSeed().getAdminPassword();

            for (String tid : new String[]{"1", "5"}) {
                System.out.println("DEBUG: Seeding data for Tenant ID: " + tid);
                // NOTE: In single-database multi-tenant model, individual tenant databases are NOT created.
                // All tenants share the single servesmart database.
                // databaseProvisioner.createTenantDatabase(tid);  // DISABLED for single-database model

                // SWITCH TO TENANT CONTEXT FOR OPERATIONAL DATA
                com.serversundaram.config.TenantContext.setCurrentTenant(tid);
                try {
                    // 1. Seed only if the tenant restaurant already exists.
                    Optional<Restaurant> resOpt = restaurantRepository.findById(Long.parseLong(tid));
                    if (resOpt.isEmpty()) {
                        System.out.println("DEBUG: Tenant " + tid + " restaurant not found. Skipping tenant seed.");
                        continue;
                    }
                    Restaurant res = resOpt.get();

                    // 2. Seed Tables
                    databaseProvisioner.seedTenantTables(tid);

                        // 3. Ensure Staff exist (without violating global username uniqueness in legacy schemas)
                        if (staffRepository.findByRestaurantId(res.getId()).isEmpty()
                            && staffRepository.findByUsernameIgnoreCase(adminUsername).isEmpty()) {
                        if (adminPassword == null || adminPassword.isBlank()) {
                             throw new IllegalStateException("Seed admin password is required.");
                        }

                        com.serversundaram.entity.Staff admin = new com.serversundaram.entity.Staff();
                        admin.setName("Admin User (" + tid + ")");
                        admin.setUsername(adminUsername);
                        admin.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(adminPassword, org.springframework.security.crypto.bcrypt.BCrypt.gensalt()));
                        admin.setRole(com.serversundaram.entity.StaffRole.ADMIN);
                        admin.setPhone("1234567890");
                        admin.setRestaurant(res);
                        admin.setTenantId(res.getTenantId() != null ? res.getTenantId() : res.getId());
                        staffRepository.save(admin);
                    }
                } finally {
                    com.serversundaram.config.TenantContext.clear();
                }
            }
        };
    }
}

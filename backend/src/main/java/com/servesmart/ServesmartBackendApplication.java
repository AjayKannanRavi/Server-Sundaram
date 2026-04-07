package com.servesmart;

import com.servesmart.entity.Category;
import com.servesmart.entity.MenuItem;
import com.servesmart.entity.RestaurantTable;
import com.servesmart.repository.CategoryRepository;
import com.servesmart.repository.MenuItemRepository;
import com.servesmart.repository.RestaurantTableRepository;
import com.servesmart.repository.RawMaterialRepository;
import com.servesmart.entity.RawMaterial;
import com.servesmart.repository.RestaurantRepository;
import com.servesmart.entity.Restaurant;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.util.Optional;
import com.servesmart.config.AppWorkflowProperties;

@SpringBootApplication
public class ServesmartBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServesmartBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner dataSeeder(
            CategoryRepository categoryRepository,
            MenuItemRepository menuItemRepository,
            RestaurantTableRepository tableRepository,
            RawMaterialRepository rawMaterialRepository,
            RestaurantRepository restaurantRepository,
            com.servesmart.repository.StaffRepository staffRepository,
            com.servesmart.config.DatabaseProvisioner databaseProvisioner,
            AppWorkflowProperties appWorkflowProperties) {
        return args -> {
            System.out.println("DEBUG: DataSeeder starting...");
            System.out.println("DEBUG: Seed Enabled: " + appWorkflowProperties.getSeed().isEnabled());
            System.out.println("DEBUG: Default Tenant ID: " + appWorkflowProperties.getSeed().getDefaultTenantId());

            if (!appWorkflowProperties.getSeed().isEnabled()) {
                System.out.println("DEBUG: Seeding is DISABLED. Skipping provisioning.");
                return;
            }

            String seedTenantId = appWorkflowProperties.getSeed().getDefaultTenantId();
            String adminUsername = appWorkflowProperties.getSeed().getAdminUsername();
            String adminPassword = appWorkflowProperties.getSeed().getAdminPassword();
            String ownerUsername = appWorkflowProperties.getSeed().getOwnerUsername();
            String ownerPassword = appWorkflowProperties.getSeed().getOwnerPassword();
            String kitchenUsername = appWorkflowProperties.getSeed().getKitchenUsername();
            String kitchenPassword = appWorkflowProperties.getSeed().getKitchenPassword();
            // Migration is now handled early by TenantStartupInitializer

            // 1. Ensure Restaurant 1 exists (Master DB)
            Optional<Restaurant> maniZOpt = restaurantRepository.findById(1L);
            Restaurant maniZ;
            if (maniZOpt.isEmpty()) {
                maniZ = new Restaurant();
                maniZ.setName("Mani'Z Kitchen");
                maniZ.setOwnerName("Ajay");
                maniZ.setOwnerEmail("ajay@servesmart.com");
                maniZ.setPlanType("PREMIUM");
                maniZ = restaurantRepository.save(maniZ);
            } else {
                maniZ = maniZOpt.get();
            }

            // 2. Ensure Tenant Database exists (Provisioning)
            System.out.println("DEBUG: Ensuring Tenant Database exists for ID: " + seedTenantId);
            databaseProvisioner.createTenantDatabase(seedTenantId);

            // SWITCH TO TENANT CONTEXT FOR OPERATIONAL DATA
            com.servesmart.config.TenantContext.setCurrentTenant(seedTenantId);
            try {
                // Ensure Restaurant exists in Tenant DB as well for integrity
                if (restaurantRepository.count() == 0) {
                    Restaurant tenantManiZ = new Restaurant();
                    tenantManiZ.setName("Mani'Z Kitchen");
                    tenantManiZ.setOwnerName("Ajay");
                    tenantManiZ.setOwnerEmail("ajay@servesmart.com");
                    tenantManiZ.setPlanType("PREMIUM");
                    tenantManiZ = restaurantRepository.save(tenantManiZ);
                    maniZ = tenantManiZ; // Update reference to use tenant restaurant
                }

                // 2. Ensure Staff exist
                if (staffRepository.count() == 0) {
                    if (adminPassword == null || adminPassword.isBlank()
                            || ownerPassword == null || ownerPassword.isBlank()
                            || kitchenPassword == null || kitchenPassword.isBlank()) {
                        throw new IllegalStateException("Seed staff passwords are required. Set APP_SEED_ADMIN_PASSWORD, APP_SEED_OWNER_PASSWORD, and APP_SEED_KITCHEN_PASSWORD in .env.");
                    }

                    com.servesmart.entity.Staff admin = new com.servesmart.entity.Staff();
                    admin.setName("Admin User");
                    admin.setUsername(adminUsername);
                    admin.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(adminPassword, org.springframework.security.crypto.bcrypt.BCrypt.gensalt()));
                    admin.setRole(com.servesmart.entity.StaffRole.ADMIN);
                    admin.setPhone("1234567890");
                    admin.setRestaurant(maniZ);
                    staffRepository.save(admin);

                    com.servesmart.entity.Staff owner = new com.servesmart.entity.Staff();
                    owner.setName("Ajay (Owner)");
                    owner.setUsername(ownerUsername);
                    owner.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(ownerPassword, org.springframework.security.crypto.bcrypt.BCrypt.gensalt()));
                    owner.setRole(com.servesmart.entity.StaffRole.OWNER);
                    owner.setPhone("1234567890");
                    owner.setRestaurant(maniZ);
                    staffRepository.save(owner);

                    com.servesmart.entity.Staff kitchen = new com.servesmart.entity.Staff();
                    kitchen.setName("Kitchen Staff");
                    kitchen.setUsername(kitchenUsername);
                    kitchen.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(kitchenPassword, org.springframework.security.crypto.bcrypt.BCrypt.gensalt()));
                    kitchen.setRole(com.servesmart.entity.StaffRole.KITCHEN);
                    kitchen.setPhone("0987654321");
                    kitchen.setRestaurant(maniZ);
                    staffRepository.save(kitchen);
                }

            } finally {
                com.servesmart.config.TenantContext.clear();
            }

        };
    }
}

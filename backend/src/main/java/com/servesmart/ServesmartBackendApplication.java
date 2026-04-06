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
            if (!appWorkflowProperties.getSeed().isEnabled()) {
                return;
            }

            String seedTenantId = appWorkflowProperties.getSeed().getDefaultTenantId();
            String adminUsername = appWorkflowProperties.getSeed().getAdminUsername();
            String adminPassword = appWorkflowProperties.getSeed().getAdminPassword();
            String ownerUsername = appWorkflowProperties.getSeed().getOwnerUsername();
            String ownerPassword = appWorkflowProperties.getSeed().getOwnerPassword();
            String kitchenUsername = appWorkflowProperties.getSeed().getKitchenUsername();
            String kitchenPassword = appWorkflowProperties.getSeed().getKitchenPassword();
            // 0. Ensure Tenant Database exists for Hotel 1
            try {
                databaseProvisioner.createTenantDatabase(seedTenantId);
            } catch (Exception e) {
                System.out.println("Tenant DB " + seedTenantId + " might already exist or master DB not ready yet: " + e.getMessage());
            }

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

                if (categoryRepository.count() == 0) {
                    Category c1 = new Category(); c1.setName("Starters"); c1.setRestaurant(maniZ);
                    Category c2 = new Category(); c2.setName("Main Course"); c2.setRestaurant(maniZ);
                    Category c3 = new Category(); c3.setName("Beverages"); c3.setRestaurant(maniZ);
                    Category c4 = new Category(); c4.setName("Desserts"); c4.setRestaurant(maniZ);
                    categoryRepository.save(c1);
                    categoryRepository.save(c2);
                    categoryRepository.save(c3);
                    categoryRepository.save(c4);

                    MenuItem m1 = new MenuItem();
                    m1.setName("Garlic Bread"); m1.setDescription("Crispy toasted garlic bread"); m1.setPrice(150.0); m1.setAvailable(true); m1.setCategory(c1); m1.setRestaurant(maniZ);
                    menuItemRepository.save(m1);

                    MenuItem m2 = new MenuItem();
                    m2.setName("Chicken Burger"); m2.setDescription("Crispy chicken patty with cheese"); m2.setPrice(350.0); m2.setAvailable(true); m2.setCategory(c2); m2.setRestaurant(maniZ);
                    menuItemRepository.save(m2);
                    
                    MenuItem m3 = new MenuItem();
                    m3.setName("Coca Cola"); m3.setDescription("Chilled 330ml can"); m3.setPrice(60.0); m3.setAvailable(true); m3.setCategory(c3); m3.setRestaurant(maniZ);
                    menuItemRepository.save(m3);
                }
                if (tableRepository.count() == 0) {
                    RestaurantTable t1 = new RestaurantTable(); 
                    t1.setTableNumber(1); 
                    t1.setRestaurant(maniZ);
                    t1.setQrCodeUrl("/" + seedTenantId + "/menu?tableId=1");
                    tableRepository.save(t1);
                    
                    RestaurantTable t2 = new RestaurantTable(); 
                    t2.setTableNumber(2); 
                    t2.setRestaurant(maniZ);
                    t2.setQrCodeUrl("/" + seedTenantId + "/menu?tableId=2");
                    tableRepository.save(t2);
                }
                if (rawMaterialRepository.count() == 0) {
                    RawMaterial r1 = new RawMaterial(); r1.setName("Flour"); r1.setQuantity(50.0); r1.setUnit("kg"); r1.setRestaurant(maniZ);
                    rawMaterialRepository.save(r1);
                    RawMaterial r2 = new RawMaterial(); r2.setName("Chicken"); r2.setQuantity(20.0); r2.setUnit("kg"); r2.setRestaurant(maniZ);
                    rawMaterialRepository.save(r2);
                    RawMaterial r3 = new RawMaterial(); r3.setName("Milk"); r3.setQuantity(10.5); r3.setUnit("liters"); r3.setRestaurant(maniZ);
                    rawMaterialRepository.save(r3);
                }
            } finally {
                com.servesmart.config.TenantContext.clear();
            }

        };
    }
}

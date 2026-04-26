package com.serversundaram.service;

import com.serversundaram.entity.Restaurant;
import com.serversundaram.entity.RestaurantTable;
import com.serversundaram.entity.Category;
import com.serversundaram.entity.MenuItem;
import com.serversundaram.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SaasService {

    private final RestaurantRepository restaurantRepository;
    private final com.serversundaram.repository.StaffRepository staffRepository;
    private final com.serversundaram.repository.OrderRepository orderRepository;
    private final com.serversundaram.repository.PaymentRepository paymentRepository;
    private final com.serversundaram.repository.RestaurantTableRepository restaurantTableRepository;
    private final com.serversundaram.repository.CategoryRepository categoryRepository;
    private final com.serversundaram.repository.MenuItemRepository menuItemRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.serversundaram.repository.SaasSettingsRepository saasSettingsRepository;

    public java.util.Map<String, Object> getPlatformStats() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        List<Restaurant> hotels = restaurantRepository.findAll();
        stats.put("totalHotels", (long) hotels.size());
        stats.put("activeHotels", hotels.stream().filter(Restaurant::getIsActive).count());
        
        long totalOrders = 0;
        double totalRevenue = 0.0;
        // Use a safe far-past date instead of LocalDateTime.MIN (which causes MySQL out-of-range errors)
        LocalDateTime farPast = LocalDateTime.of(2000, 1, 1, 0, 0);

        // Aggregate per tenant in the shared database.
        for (Restaurant hotel : hotels) {
            Long hotelId = hotel.getTenantId() != null ? hotel.getTenantId() : hotel.getId();
            try {
                Long hotelOrders = orderRepository.getTotalOrdersSince(farPast, hotelId);
                totalOrders += hotelOrders != null ? hotelOrders : 0L;
                Double revenue = orderRepository.getTotalRevenueSince(farPast, hotelId);
                totalRevenue += (revenue != null ? revenue : 0.0);
            } catch (Exception ignored) {
                // Skip hotel if its stats query fails
            }
        }

        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        stats.put("systemStatus", "OPERATIONAL");
        return stats;
    }

    public java.util.Map<String, Object> getSystemSettings() {
        com.serversundaram.entity.SaasSettings settings = saasSettingsRepository.findAll().stream().findFirst()
            .orElseGet(() -> {
                com.serversundaram.entity.SaasSettings s = new com.serversundaram.entity.SaasSettings();
                return saasSettingsRepository.save(s);
            });
            
        if (settings == null) {
            settings = new com.serversundaram.entity.SaasSettings();
        }
            
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("platformName", settings.getPlatformName());
        map.put("maintenanceMode", settings.getMaintenanceMode());
        map.put("freePlanLimit", settings.getFreePlanLimit());
        map.put("premiumMonthlyPrice", settings.getPremiumMonthlyPrice());
        return map;
    }

    @Transactional
    public void updateSystemSettings(java.util.Map<String, Object> updates) {
        com.serversundaram.entity.SaasSettings settings = saasSettingsRepository.findAll().stream().findFirst()
            .orElseGet(com.serversundaram.entity.SaasSettings::new);
        
        if (updates.containsKey("platformName")) settings.setPlatformName((String) updates.get("platformName"));
        if (updates.containsKey("premiumMonthlyPrice")) settings.setPremiumMonthlyPrice(Double.valueOf(updates.get("premiumMonthlyPrice").toString()));
        if (updates.containsKey("maintenanceMode")) settings.setMaintenanceMode((Boolean) updates.get("maintenanceMode"));
        if (updates.containsKey("freePlanLimit")) settings.setFreePlanLimit((Integer) updates.get("freePlanLimit"));
        
        saasSettingsRepository.save(Objects.requireNonNull(settings));
    }

    public java.util.Map<String, Object> getHotelDashboardStats(Long hotelId) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        Restaurant restaurant = getHotelById(hotelId);
        
        stats.put("hotelName", restaurant.getName());
        stats.put("planType", restaurant.getPlanType());
        stats.put("expiryDate", restaurant.getPlanExpiry());
        
        // Real-time usage phases
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.with(java.time.LocalTime.MIN);
        LocalDateTime thirtyDaysAgo = now.minusDays(30).with(java.time.LocalTime.MIN);
        LocalDateTime yearlyStart = now.withDayOfYear(1).with(java.time.LocalTime.MIN);
        
        // Today
        Long todayOrders = paymentRepository.getTotalOrdersSince(todayStart, hotelId);
        Double todayRevenue = paymentRepository.getTotalRevenueSince(todayStart, hotelId);
        
        // Monthly
        Long monthlyOrders = orderRepository.getTotalOrdersBetween(thirtyDaysAgo, now, hotelId);
        Double monthlyRevenue = orderRepository.getTotalRevenueBetween(thirtyDaysAgo, now, hotelId);
        
        // Yearly
        Long yearlyOrders = orderRepository.getTotalOrdersBetween(yearlyStart, now, hotelId);
        Double yearlyRevenue = orderRepository.getTotalRevenueBetween(yearlyStart, now, hotelId);

        java.util.Map<String, Object> metrics = new java.util.HashMap<>();
        metrics.put("today", java.util.Map.of("revenue", todayRevenue != null ? todayRevenue : 0.0, "orders", todayOrders != null ? todayOrders : 0L));
        metrics.put("monthly", java.util.Map.of("revenue", monthlyRevenue != null ? monthlyRevenue : 0.0, "orders", monthlyOrders != null ? monthlyOrders : 0L));
        metrics.put("yearly", java.util.Map.of("revenue", yearlyRevenue != null ? yearlyRevenue : 0.0, "orders", yearlyOrders != null ? yearlyOrders : 0L));
        stats.put("metrics", metrics);
        
        // Backward compatibility
        stats.put("todayOrders", todayOrders);
        stats.put("todayRevenue", todayRevenue != null ? todayRevenue : 0.0);
        
        // 30-day analytics summary
        Double avgOrderValue = orderRepository.getAverageOrderValueBetween(thirtyDaysAgo, now, hotelId);
        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("dailyRevenue", todayRevenue != null ? todayRevenue : 0.0);
        summary.put("monthlyRevenue", monthlyRevenue != null ? monthlyRevenue : 0.0);
        summary.put("totalOrders", monthlyOrders != null ? monthlyOrders : 0L);
        summary.put("avgOrderValue", avgOrderValue != null ? avgOrderValue : 0.0);
        
        List<Object[]> statusResults = orderRepository.getOrderStatusCountsBetween(thirtyDaysAgo, now, hotelId);
        java.util.Map<String, Long> statusBreakdown = new java.util.HashMap<>();
        for (Object[] res : statusResults) {
            statusBreakdown.put(res[0].toString(), (Long) res[1]);
        }
        summary.put("orderStatusBreakdown", statusBreakdown);
        stats.put("summary", summary);
        
        // Top dishes by quantity (30-day period)
        List<com.serversundaram.entity.RestaurantOrder> ordersInPeriod = orderRepository.findAllByRestaurantId(hotelId).stream()
            .filter(o -> o.getCreatedAt().isAfter(thirtyDaysAgo) && o.getCreatedAt().isBefore(now))
            .collect(java.util.stream.Collectors.toList());
        
        java.util.Map<String, Integer> dishQuantities = new java.util.HashMap<>();
        java.util.Map<String, Double> dishRevenues = new java.util.HashMap<>();
        
        for (com.serversundaram.entity.RestaurantOrder order : ordersInPeriod) {
            for (com.serversundaram.entity.OrderItem item : order.getItems()) {
                String dishName = item.getMenuItem() != null ? item.getMenuItem().getName() : "Unknown";
                dishQuantities.put(dishName, dishQuantities.getOrDefault(dishName, 0) + item.getQuantity());
                dishRevenues.put(dishName, dishRevenues.getOrDefault(dishName, 0.0) + (item.getPrice() * item.getQuantity()));
            }
        }
        
        List<java.util.Map<String, Object>> topDishes = dishQuantities.entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .limit(5)
            .map(e -> {
                java.util.Map<String, Object> dish = new java.util.HashMap<>();
                dish.put("name", e.getKey());
                dish.put("quantity", e.getValue());
                dish.put("revenue", dishRevenues.get(e.getKey()));
                return dish;
            })
            .collect(java.util.stream.Collectors.toList());
        
        stats.put("topDishes", topDishes);
        
        // Staff management (for owner visibility)
        List<com.serversundaram.entity.Staff> staffList = ensureCoreStaffAccounts(restaurant);
        List<java.util.Map<String, Object>> credentials = new ArrayList<>();

        if (restaurant.getOwnerEmail() != null && !restaurant.getOwnerEmail().isBlank()) {
            java.util.Map<String, Object> ownerCredential = new java.util.HashMap<>();
            ownerCredential.put("id", restaurant.getId());
            ownerCredential.put("role", com.serversundaram.entity.StaffRole.OWNER.toString());
            ownerCredential.put("username", restaurant.getOwnerEmail());
            ownerCredential.put("name", restaurant.getOwnerName() != null && !restaurant.getOwnerName().isBlank() ? restaurant.getOwnerName() : "Owner");
            credentials.add(ownerCredential);
        }

        credentials.addAll(staffList.stream().map(s -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", s.getId());
            m.put("role", s.getRole().toString());
            m.put("username", s.getUsername());
            m.put("name", s.getName());
            return m;
        }).collect(java.util.stream.Collectors.toList()));
        stats.put("staffCredentials", credentials);
        
        return stats;
    }

    private List<com.serversundaram.entity.Staff> ensureCoreStaffAccounts(Restaurant restaurant) {
        Long restaurantId = restaurant.getId();
        Long tenantId = restaurant.getTenantId() != null ? restaurant.getTenantId() : restaurantId;

        List<com.serversundaram.entity.Staff> staffList = new ArrayList<>(staffRepository.findByRestaurantId(restaurantId));
        Set<com.serversundaram.entity.StaffRole> rolesPresent = new HashSet<>();
        Set<String> usernamesPresent = new HashSet<>();
        for (com.serversundaram.entity.Staff staff : staffList) {
            rolesPresent.add(staff.getRole());
            if (staff.getUsername() != null) {
                usernamesPresent.add(staff.getUsername().toLowerCase(Locale.ROOT));
            }
        }

        // Recover accidentally deleted operational users so owner always sees all key credentials.
        ensureRole(rolesPresent, usernamesPresent, staffList, restaurant, tenantId, com.serversundaram.entity.StaffRole.ADMIN,
                "Restaurant Manager", "admin", "admin@123");
        ensureRole(rolesPresent, usernamesPresent, staffList, restaurant, tenantId, com.serversundaram.entity.StaffRole.KITCHEN,
                "Kitchen Staff", "kitchen", "kitchen@123");
        ensureRole(rolesPresent, usernamesPresent, staffList, restaurant, tenantId, com.serversundaram.entity.StaffRole.WAITER,
                "Captain", "captain", "captain@123");

        return staffList;
    }

    private void ensureRole(
            Set<com.serversundaram.entity.StaffRole> rolesPresent,
            Set<String> usernamesPresent,
            List<com.serversundaram.entity.Staff> staffList,
            Restaurant restaurant,
            Long tenantId,
            com.serversundaram.entity.StaffRole role,
            String displayName,
            String baseUsername,
            String defaultPassword
    ) {
        if (rolesPresent.contains(role)) {
            return;
        }

        String username = nextAvailableUsername(baseUsername, usernamesPresent);
        com.serversundaram.entity.Staff staff = new com.serversundaram.entity.Staff();
        staff.setName(displayName);
        staff.setRole(role);
        staff.setUsername(username);
        staff.setPassword(passwordEncoder.encode(defaultPassword));
        staff.setPhone(restaurant.getContactNumber() != null ? restaurant.getContactNumber() : "0000000000");
        staff.setRestaurant(restaurant);
        staff.setTenantId(tenantId);
        try {
            com.serversundaram.entity.Staff saved = staffRepository.save(staff);
            staffList.add(saved);
            rolesPresent.add(role);
            usernamesPresent.add(username.toLowerCase(Locale.ROOT));
        } catch (DataIntegrityViolationException ex) {
            // Ignore duplicate role creation attempts from concurrent requests.
        }
    }

    private String nextAvailableUsername(String base, Set<String> usernamesPresent) {
        String candidate = base;
        int suffix = 1;
        while (usernamesPresent.contains(candidate.toLowerCase(Locale.ROOT))) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    @Transactional
    public void deleteHotel(Long id) {
        if (id == null) return;
        Long safeId = Objects.requireNonNull(id);
        Restaurant hotel = getHotelById(safeId);
        if (hotel == null) return;
        // Single database model: only delete tenant rows, no per-tenant DB drops.
        staffRepository.deleteAllByRestaurantId(safeId);
        restaurantRepository.delete(hotel);
    }

    public List<Restaurant> getAllHotels() {
        return restaurantRepository.findAll();
    }

    public Restaurant getHotelById(Long id) {
        return restaurantRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Hotel not found with id: " + id));
    }

    public java.util.Map<String, Object> getOwnerHotelByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        List<Restaurant> matchingHotels = restaurantRepository.findAllByOwnerEmailIgnoreCaseOrderByIdDesc(normalizedEmail);
        if (matchingHotels.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No hotel found for this owner email");
        }

        Restaurant hotel = matchingHotels.stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                .findFirst()
                .orElse(matchingHotels.get(0));

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("hotelId", hotel.getId());
        result.put("hotelName", hotel.getName());
        return result;
    }

    @Transactional
    public com.serversundaram.dto.HotelRegistrationResponse createHotel(com.serversundaram.dto.HotelRegistrationRequest request) {
        Restaurant restaurant = request.getRestaurant();
        if (restaurant == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Restaurant details are required");
        }
        if (request.getAdminPassword() == null || request.getAdminPassword().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "adminPassword is required");
        }
        if (request.getAdminUsername() == null || request.getAdminUsername().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "adminUsername is required");
        }
        if (request.getKitchenPassword() == null || request.getKitchenPassword().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "kitchenPassword is required");
        }
        if (request.getKitchenUsername() == null || request.getKitchenUsername().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "kitchenUsername is required");
        }
        if (request.getCaptainPassword() == null || request.getCaptainPassword().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "captainPassword is required");
        }
        if (request.getCaptainUsername() == null || request.getCaptainUsername().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "captainUsername is required");
        }

        String ownerEmail = restaurant.getOwnerEmail() != null ? restaurant.getOwnerEmail().trim() : request.getOwnerEmail();
        if (ownerEmail != null && restaurantRepository.existsByOwnerEmailIgnoreCase(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A hotel already exists for this owner email");
        }

        String hotelName = restaurant.getName() != null ? restaurant.getName().trim() : null;
        if (hotelName != null && restaurantRepository.existsByNameIgnoreCase(hotelName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A hotel with this name already exists");
        }

        if (restaurant.getPlanType() == null) {
            restaurant.setPlanType("STARTER");
        }
        if (restaurant.getOwnerPassword() == null || restaurant.getOwnerPassword().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ownerPassword is required");
        }
        String ownerRawPassword = restaurant.getOwnerPassword().trim();
        restaurant.setOwnerPassword(ownerRawPassword);
        restaurant.setIsActive(true);
        if (restaurant.getTenantId() == null) {
            // Temporary non-null placeholder; replaced with generated restaurant id immediately after insert.
            restaurant.setTenantId(-1L);
        }
        Restaurant saved = restaurantRepository.save(restaurant);
        if (saved.getTenantId() == null) {
            saved.setTenantId(saved.getId());
            saved = restaurantRepository.save(saved);
        } else if (saved.getTenantId() < 0) {
            saved.setTenantId(saved.getId());
            saved = restaurantRepository.save(saved);
        }
        
        // NOTE: In single-database multi-tenant model, individual tenant databases are NOT created.
        // All tenants share the single servesmart database.
        // Database provisioning has been disabled for single-database model.
        // databaseProvisioner.createTenantDatabase(saved.getId().toString());
        // databaseProvisioner.seedTenantRestaurant(saved);

        String previousTenant = com.serversundaram.config.TenantContext.getCurrentTenant();
        com.serversundaram.config.TenantContext.setCurrentTenant(saved.getTenantId().toString());
        try {
            Restaurant tenantRestaurant = restaurantRepository.findById(saved.getId()).orElse(saved);

            // Prefer restaurant owner email, then top-level request email, else fallback to generated username
            ownerEmail = ownerEmail != null ? ownerEmail : request.getOwnerEmail();
            String ownerUsername = ownerEmail != null ? ownerEmail.toLowerCase().trim() : "owner_" + saved.getId();

            com.serversundaram.entity.Staff admin = new com.serversundaram.entity.Staff();
            admin.setName(tenantRestaurant.getOwnerName() != null ? tenantRestaurant.getOwnerName() : "Owner");
            admin.setUsername(ownerUsername);
            String resolvedOwnerRawPassword = tenantRestaurant.getOwnerPassword() != null && !tenantRestaurant.getOwnerPassword().trim().isEmpty()
                ? tenantRestaurant.getOwnerPassword()
                : ownerRawPassword;
            admin.setPassword(passwordEncoder.encode(resolvedOwnerRawPassword));
            admin.setRole(com.serversundaram.entity.StaffRole.OWNER);
            admin.setPhone(tenantRestaurant.getContactNumber() != null ? tenantRestaurant.getContactNumber() : "0000000000");
            admin.setRestaurant(tenantRestaurant);
            admin.setTenantId(tenantRestaurant.getTenantId());
            staffRepository.save(admin);

            // STAFF ACCOUNT 2: MANAGER (OPERATIONAL ADMIN) - Use provided username
            String managerUsername = request.getAdminUsername().trim();
            com.serversundaram.entity.Staff manager = new com.serversundaram.entity.Staff();
            manager.setName("Restaurant Manager");
            manager.setUsername(managerUsername);
            manager.setPassword(passwordEncoder.encode(request.getAdminPassword()));
            manager.setRole(com.serversundaram.entity.StaffRole.ADMIN);
            manager.setPhone(tenantRestaurant.getContactNumber() != null ? tenantRestaurant.getContactNumber() : "0000000000");
            manager.setRestaurant(tenantRestaurant);
            manager.setTenantId(tenantRestaurant.getTenantId());
            staffRepository.save(manager);

            // STAFF ACCOUNT 3: KITCHEN (CHEF) - Use provided username
            String kitchenUsername = request.getKitchenUsername().trim();
            com.serversundaram.entity.Staff kitchen = new com.serversundaram.entity.Staff();
            kitchen.setName("Kitchen Staff");
            kitchen.setUsername(kitchenUsername);
            kitchen.setPassword(passwordEncoder.encode(request.getKitchenPassword()));
            kitchen.setRole(com.serversundaram.entity.StaffRole.KITCHEN);
            kitchen.setPhone(tenantRestaurant.getContactNumber() != null ? tenantRestaurant.getContactNumber() : "0000000000");
            kitchen.setRestaurant(tenantRestaurant);
            kitchen.setTenantId(tenantRestaurant.getTenantId());
            staffRepository.save(kitchen);

            // STAFF ACCOUNT 4: CAPTAIN / WAITER
            String captainUsername = request.getCaptainUsername().trim();
            com.serversundaram.entity.Staff captain = new com.serversundaram.entity.Staff();
            captain.setName("Captain");
            captain.setUsername(captainUsername);
            captain.setPassword(passwordEncoder.encode(request.getCaptainPassword()));
            captain.setRole(com.serversundaram.entity.StaffRole.WAITER);
            captain.setPhone(tenantRestaurant.getContactNumber() != null ? tenantRestaurant.getContactNumber() : "0000000000");
            captain.setRestaurant(tenantRestaurant);
            captain.setTenantId(tenantRestaurant.getTenantId());
            staffRepository.save(captain);

            ensureDefaultOperationalData(tenantRestaurant);
            
            // Return response with generated credentials
            java.util.Map<String, String> credentials = new java.util.HashMap<>();
            credentials.put("hotelId", saved.getId().toString());
            credentials.put("ownerUsername", ownerUsername);
            credentials.put("ownerPassword", ownerRawPassword);
            credentials.put("managerUsername", managerUsername);
            credentials.put("managerPassword", request.getAdminPassword());
            credentials.put("kitchenUsername", kitchenUsername);
            credentials.put("kitchenPassword", request.getKitchenPassword());
            credentials.put("captainUsername", captainUsername);
            credentials.put("captainPassword", request.getCaptainPassword());
            
            return new com.serversundaram.dto.HotelRegistrationResponse(
                saved.getId(),
                saved.getName(),
                credentials
            );
        } finally {
            if (previousTenant != null) {
                com.serversundaram.config.TenantContext.setCurrentTenant(previousTenant);
            } else {
                com.serversundaram.config.TenantContext.clear();
            }
        }
    }

    @Transactional
    public Restaurant updateHotelPlan(Long id, String planType, Integer months) {
        Restaurant hotel = getHotelById(id);
        hotel.setPlanType(planType);
        if ("PREMIUM".equalsIgnoreCase(planType) && months != null) {
            LocalDateTime now = hotel.getPlanExpiry() != null && hotel.getPlanExpiry().isAfter(LocalDateTime.now()) 
                ? hotel.getPlanExpiry() : LocalDateTime.now();
            hotel.setPlanExpiry(now.plusMonths(months));
        } else if ("FREE".equalsIgnoreCase(planType)) {
            hotel.setPlanExpiry(null);
        }
        return restaurantRepository.save(hotel);
    }

    @Transactional
    public Restaurant toggleHotelStatus(Long id) {
        Restaurant hotel = getHotelById(id);
        hotel.setIsActive(!hotel.getIsActive());
        return restaurantRepository.save(hotel);
    }

    private void ensureDefaultOperationalData(Restaurant restaurant) {
        Long restaurantId = restaurant.getId();
        if (restaurantId == null) {
            return;
        }
        Long tenantId = restaurant.getTenantId() != null ? restaurant.getTenantId() : restaurantId;

        if (restaurantTableRepository.countByRestaurantId(restaurantId) == 0) {
            for (int tableNo = 1; tableNo <= 10; tableNo++) {
                RestaurantTable table = new RestaurantTable();
                table.setTableNumber(tableNo);
                table.setStatus("AVAILABLE");
                table.setQrGenerated(true);
                table.setQrCodeUrl("http://localhost:5173/" + restaurantId + "/login?tableId=" + tableNo);
                table.setRestaurant(restaurant);
                restaurantTableRepository.save(table);
            }
        }

        List<Category> existingCategories = categoryRepository.findByRestaurantId(restaurantId);
        java.util.Map<String, Category> categoryMap = new java.util.HashMap<>();
        for (Category category : existingCategories) {
            categoryMap.put(category.getName().toLowerCase(), category);
        }

        String[] defaultCategories = {"Starters", "Main Course", "Beverages"};
        for (String categoryName : defaultCategories) {
            if (!categoryMap.containsKey(categoryName.toLowerCase())) {
                Category category = new Category();
                category.setName(categoryName);
                category.setRestaurant(restaurant);
                category.setTenantId(tenantId);
                category = categoryRepository.save(category);
                categoryMap.put(categoryName.toLowerCase(), category);
            }
        }

        if (menuItemRepository.findByRestaurantId(restaurantId).isEmpty()) {
            addDefaultMenuItem(restaurant, categoryMap.get("starters"), "Welcome Soup", "House welcome soup", 99.0, true);
            addDefaultMenuItem(restaurant, categoryMap.get("main course"), "Chef Special Thali", "Signature balanced platter", 249.0, true);
            addDefaultMenuItem(restaurant, categoryMap.get("beverages"), "Fresh Lime Soda", "Classic welcome beverage", 79.0, true);
        }
    }

    private void addDefaultMenuItem(Restaurant restaurant, Category category, String name, String description, Double price, Boolean isVeg) {
        if (category == null) {
            return;
        }
        MenuItem item = new MenuItem();
        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setAvailable(true);
        item.setIsVeg(isVeg);
        item.setCategory(category);
        item.setRestaurant(restaurant);
        item.setTenantId(restaurant.getTenantId() != null ? restaurant.getTenantId() : restaurant.getId());
        menuItemRepository.save(item);
    }
}

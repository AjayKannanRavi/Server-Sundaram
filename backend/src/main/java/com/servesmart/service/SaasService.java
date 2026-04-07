package com.servesmart.service;

import com.servesmart.entity.Restaurant;
import com.servesmart.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SaasService {

    private final RestaurantRepository restaurantRepository;
    private final com.servesmart.repository.StaffRepository staffRepository;
    private final com.servesmart.repository.OrderRepository orderRepository;
    private final com.servesmart.repository.PaymentRepository paymentRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.servesmart.repository.SaasSettingsRepository saasSettingsRepository;
    private final com.servesmart.config.DatabaseProvisioner databaseProvisioner;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.username}")
    private String dbUser;

    @org.springframework.beans.factory.annotation.Value("${spring.datasource.password}")
    private String dbPass;

    @org.springframework.beans.factory.annotation.Value("${app.database.host:localhost}")
    private String dbHost;

    @org.springframework.beans.factory.annotation.Value("${app.database.port:3306}")
    private String dbPort;

    @org.springframework.beans.factory.annotation.Value("${app.database.params:useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}")
    private String dbParams;

    public java.util.Map<String, Object> getPlatformStats() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        List<Restaurant> hotels = restaurantRepository.findAll();
        stats.put("totalHotels", (long) hotels.size());
        stats.put("activeHotels", hotels.stream().filter(Restaurant::getIsActive).count());
        
        long totalOrders = 0;
        double totalRevenue = 0.0;
        
        // Aggregate from all tenant databases
        for (Restaurant hotel : hotels) {
            try {
                String dbName = "ss_hotel_" + hotel.getId();
                // We use a simple JDBC query here because Hibernate is scoped to one tenant
                totalOrders += fetchCountFromTenant(dbName, "restaurant_orders");
                Double rev = fetchSumFromTenant(dbName, "payments", "total_amount");
                totalRevenue += (rev != null ? rev : 0.0);
            } catch (Exception e) {
                System.err.println("Could not aggregate stats for hotel " + hotel.getId() + " on DB " + "ss_hotel_" + hotel.getId() + ": " + e.getMessage());
            }
        }

        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        stats.put("systemStatus", "OPERATIONAL");
        return stats;
    }

    private long fetchCountFromTenant(String dbName, String tableName) throws Exception {
        String url = "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName + "?" + dbParams;
        try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, dbUser, dbPass);
             java.sql.Statement stmt = conn.createStatement();
             java.sql.ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + tableName)) {
            return rs.next() ? rs.getLong(1) : 0;
        }
    }

    private Double fetchSumFromTenant(String dbName, String tableName, String colName) throws Exception {
        String url = "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName + "?" + dbParams;
        try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, dbUser, dbPass);
             java.sql.Statement stmt = conn.createStatement();
             java.sql.ResultSet rs = stmt.executeQuery("SELECT SUM(" + colName + ") FROM " + tableName)) {
            return rs.next() ? rs.getDouble(1) : 0.0;
        }
    }

    public java.util.Map<String, Object> getSystemSettings() {
        com.servesmart.entity.SaasSettings settings = saasSettingsRepository.findAll().stream().findFirst()
            .orElseGet(() -> {
                com.servesmart.entity.SaasSettings s = new com.servesmart.entity.SaasSettings();
                return saasSettingsRepository.save(s);
            });
            
        if (settings == null) {
            settings = new com.servesmart.entity.SaasSettings();
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
        com.servesmart.entity.SaasSettings settings = saasSettingsRepository.findAll().stream().findFirst()
            .orElseGet(com.servesmart.entity.SaasSettings::new);
        
        if (updates.containsKey("platformName")) settings.setPlatformName((String) updates.get("platformName"));
        if (updates.containsKey("premiumMonthlyPrice")) settings.setPremiumMonthlyPrice(Double.valueOf(updates.get("premiumMonthlyPrice").toString()));
        if (updates.containsKey("maintenanceMode")) settings.setMaintenanceMode((Boolean) updates.get("maintenanceMode"));
        if (updates.containsKey("freePlanLimit")) settings.setFreePlanLimit((Integer) updates.get("freePlanLimit"));
        
        saasSettingsRepository.save(settings);
    }

    public java.util.Map<String, Object> getHotelDashboardStats(Long hotelId) {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        Restaurant restaurant = getHotelById(hotelId);
        
        stats.put("hotelName", restaurant.getName());
        stats.put("planType", restaurant.getPlanType());
        stats.put("expiryDate", restaurant.getPlanExpiry());
        
        // Real-time usage
        LocalDateTime todayStart = LocalDateTime.now().with(java.time.LocalTime.MIN);
        stats.put("todayOrders", paymentRepository.getTotalOrdersSince(todayStart, hotelId));
        Double rev = paymentRepository.getTotalRevenueSince(todayStart, hotelId);
        stats.put("todayRevenue", rev != null ? rev : 0.0);
        
        // 30-day analytics
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30).with(java.time.LocalTime.MIN);
        LocalDateTime now = LocalDateTime.now();
        
        Double monthlyRevenue = orderRepository.getTotalRevenueBetween(thirtyDaysAgo, now, hotelId);
        Long monthlyOrders = orderRepository.getTotalOrdersBetween(thirtyDaysAgo, now, hotelId);
        Double avgOrderValue = orderRepository.getAverageOrderValueBetween(thirtyDaysAgo, now, hotelId);
        
        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("dailyRevenue", rev != null ? rev : 0.0);
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
        List<com.servesmart.entity.RestaurantOrder> ordersInPeriod = orderRepository.findAllByRestaurantId(hotelId).stream()
            .filter(o -> o.getCreatedAt().isAfter(thirtyDaysAgo) && o.getCreatedAt().isBefore(now))
            .collect(java.util.stream.Collectors.toList());
        
        java.util.Map<String, Integer> dishQuantities = new java.util.HashMap<>();
        java.util.Map<String, Double> dishRevenues = new java.util.HashMap<>();
        
        for (com.servesmart.entity.RestaurantOrder order : ordersInPeriod) {
            for (com.servesmart.entity.OrderItem item : order.getItems()) {
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
        List<com.servesmart.entity.Staff> staffList = staffRepository.findByRestaurantId(hotelId);
        List<java.util.Map<String, String>> credentials = staffList.stream().map(s -> {
            java.util.Map<String, String> m = new java.util.HashMap<>();
            m.put("role", s.getRole().toString());
            m.put("username", s.getUsername());
            m.put("name", s.getName());
            return m;
        }).collect(java.util.stream.Collectors.toList());
        stats.put("staffCredentials", credentials);
        
        return stats;
    }

    @Transactional
    public void deleteHotel(Long id) {
        if (id == null) return;
        Restaurant hotel = getHotelById(id);
        if (hotel == null) return;
        // Step 1: Drop the tenant database
        try {
            databaseProvisioner.dropTenantDatabase(id.toString());
        } catch (Exception e) {
            System.err.println("Warning: Could not drop database for hotel " + id + ": " + e.getMessage());
        }
        // Step 2: Delete the restaurant record and associated staff (due to cascade or manual delete)
        staffRepository.deleteAllByRestaurantId(id);
        restaurantRepository.delete(hotel);
    }

    public List<Restaurant> getAllHotels() {
        return restaurantRepository.findAll();
    }

    public Restaurant getHotelById(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel not found with id: " + id));
    }

    @Transactional
    public com.servesmart.dto.HotelRegistrationResponse createHotel(com.servesmart.dto.HotelRegistrationRequest request) {
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
        if (restaurant.getPlanType() == null) {
            restaurant.setPlanType("STARTER");
        }
        restaurant.setIsActive(true);
        Restaurant saved = restaurantRepository.save(restaurant);
        
        // DYNAMIC DATABASE PROVISIONING
        databaseProvisioner.createTenantDatabase(saved.getId().toString());
        databaseProvisioner.seedTenantRestaurant(saved);

        // Prefer restaurant owner email, then top-level request email, else fallback to generated username
        String ownerEmail = restaurant.getOwnerEmail() != null ? restaurant.getOwnerEmail() : request.getOwnerEmail();
        String ownerUsername = ownerEmail != null ? ownerEmail.toLowerCase().trim() : "owner_" + saved.getId();
        com.servesmart.entity.Staff admin = new com.servesmart.entity.Staff();
        admin.setName(saved.getOwnerName() != null ? saved.getOwnerName() : "Owner");
        admin.setUsername(ownerUsername);
        String ownerRawPassword = restaurant.getOwnerPassword() != null && !restaurant.getOwnerPassword().trim().isEmpty()
            ? restaurant.getOwnerPassword()
            : request.getAdminPassword();
        admin.setPassword(passwordEncoder.encode(ownerRawPassword));
        admin.setRole(com.servesmart.entity.StaffRole.OWNER);
        admin.setPhone(saved.getContactNumber() != null ? saved.getContactNumber() : "0000000000");
        admin.setRestaurant(saved);
        staffRepository.save(admin);

        // STAFF ACCOUNT 2: MANAGER (OPERATIONAL ADMIN) - Use provided username
        String managerUsername = request.getAdminUsername().trim();
        com.servesmart.entity.Staff manager = new com.servesmart.entity.Staff();
        manager.setName("Restaurant Manager");
        manager.setUsername(managerUsername);
        manager.setPassword(passwordEncoder.encode(request.getAdminPassword()));
        manager.setRole(com.servesmart.entity.StaffRole.ADMIN);
        manager.setPhone(saved.getContactNumber() != null ? saved.getContactNumber() : "0000000000");
        manager.setRestaurant(saved);
        staffRepository.save(manager);

        // STAFF ACCOUNT 3: KITCHEN (CHEF) - Use provided username
        String kitchenUsername = request.getKitchenUsername().trim();
        com.servesmart.entity.Staff kitchen = new com.servesmart.entity.Staff();
        kitchen.setName("Kitchen Staff");
        kitchen.setUsername(kitchenUsername);
        kitchen.setPassword(passwordEncoder.encode(request.getKitchenPassword()));
        kitchen.setRole(com.servesmart.entity.StaffRole.KITCHEN);
        kitchen.setPhone(saved.getContactNumber() != null ? saved.getContactNumber() : "0000000000");
        kitchen.setRestaurant(saved);
        staffRepository.save(kitchen);
        
        // Return response with generated credentials
        java.util.Map<String, String> credentials = new java.util.HashMap<>();
        credentials.put("hotelId", saved.getId().toString());
        credentials.put("ownerUsername", ownerUsername);
        credentials.put("ownerPassword", ownerRawPassword);
        credentials.put("managerUsername", managerUsername);
        credentials.put("managerPassword", request.getAdminPassword());
        credentials.put("kitchenUsername", kitchenUsername);
        credentials.put("kitchenPassword", request.getKitchenPassword());
        
        return new com.servesmart.dto.HotelRegistrationResponse(
            saved.getId(),
            saved.getName(),
            credentials
        );
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
}

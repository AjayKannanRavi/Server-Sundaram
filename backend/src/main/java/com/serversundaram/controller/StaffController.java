package com.serversundaram.controller;

import com.serversundaram.config.TenantContext;
import com.serversundaram.dto.LoginResponse;
import com.serversundaram.entity.Restaurant;
import com.serversundaram.entity.Staff;
import com.serversundaram.entity.StaffRole;
import com.serversundaram.repository.RestaurantRepository;
import com.serversundaram.repository.StaffRepository;
import com.serversundaram.util.JwtTokenUtil;
import com.serversundaram.util.GoogleIdTokenVerifierService;
import com.serversundaram.util.LoginAttemptService;
import com.serversundaram.util.PasswordValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private static final Pattern BCRYPT_HASH_PATTERN = Pattern.compile("^\\$2[aby]?\\$\\d{2}\\$[./A-Za-z0-9]{53}$");

    private final StaffRepository staffRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final GoogleIdTokenVerifierService googleIdTokenVerifierService;
    private final EntityManager entityManager;
    private final LoginAttemptService loginAttemptService;
    private final PasswordValidator passwordValidator;

    private boolean isBcryptHash(String storedPassword) {
        if (storedPassword == null) {
            return false;
        }
        return BCRYPT_HASH_PATTERN.matcher(storedPassword.trim()).matches();
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (rawPassword == null || rawPassword.isBlank() || storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        String candidate = storedPassword.trim();
        if (isBcryptHash(candidate)) {
            try {
                return passwordEncoder.matches(rawPassword, candidate);
            } catch (IllegalArgumentException ignored) {
                return false;
            }
        }

        // Legacy support: allow one-time plaintext match for old tenant records.
        return rawPassword.equals(candidate);
    }

    @GetMapping
    public ResponseEntity<List<Staff>> getAllStaff() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (restaurantId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Staff> responseStaff = ensureOperationalRoles(
                restaurantId,
                new ArrayList<>(staffRepository.findByRestaurantId(restaurantId))
        );

        boolean hasOwnerCredential = responseStaff.stream().anyMatch(s -> s.getRole() == StaffRole.OWNER);
        if (!hasOwnerCredential) {
            restaurantRepository.findById(restaurantId).ifPresent(restaurant -> {
                String ownerUsername = restaurant.getOwnerEmail() != null ? restaurant.getOwnerEmail().trim() : "";
                if (!ownerUsername.isBlank()) {
                    Staff ownerView = new Staff();
                    ownerView.setId(-restaurantId);
                    ownerView.setTenantId(restaurantId);
                    ownerView.setName(restaurant.getOwnerName() != null && !restaurant.getOwnerName().isBlank() ? restaurant.getOwnerName() : "Owner");
                    ownerView.setRole(StaffRole.OWNER);
                    ownerView.setUsername(ownerUsername);
                    ownerView.setPhone(restaurant.getContactNumber() != null ? restaurant.getContactNumber() : "");
                    ownerView.setPassword("");
                    ownerView.setPhotoUrl(restaurant.getOwnerPhotoUrl());
                    ownerView.setUiTheme(restaurant.getUiTheme());
                    responseStaff.add(0, ownerView);
                }
            });
        }

        return ResponseEntity.ok(responseStaff);
    }

    private List<Staff> ensureOperationalRoles(Long restaurantId, List<Staff> currentStaff) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        Restaurant restaurantRef = restaurantOpt.orElseGet(() -> entityManager.getReference(Restaurant.class, restaurantId));
        String contactNumber = restaurantOpt
                .map(Restaurant::getContactNumber)
                .filter(number -> number != null && !number.isBlank())
                .orElse("0000000000");
        Long tenantId = restaurantId;

        List<Staff> staff = new ArrayList<>(currentStaff);
        Set<StaffRole> rolesPresent = new HashSet<>();
        Set<String> usernamesPresent = new HashSet<>();
        for (Staff s : staff) {
            rolesPresent.add(s.getRole());
            if (s.getUsername() != null) {
                usernamesPresent.add(s.getUsername().toLowerCase(Locale.ROOT));
            }
        }

        ensureRole(staff, rolesPresent, usernamesPresent, restaurantRef, tenantId, contactNumber, StaffRole.ADMIN,
                "Restaurant Manager", "admin", "admin@123");
        ensureRole(staff, rolesPresent, usernamesPresent, restaurantRef, tenantId, contactNumber, StaffRole.KITCHEN,
                "Kitchen Staff", "kitchen", "kitchen@123");
        ensureRole(staff, rolesPresent, usernamesPresent, restaurantRef, tenantId, contactNumber, StaffRole.WAITER,
                "Captain", "captain", "captain@123");

        return staff;
    }

    private void ensureRole(
            List<Staff> staff,
            Set<StaffRole> rolesPresent,
            Set<String> usernamesPresent,
            Restaurant restaurant,
            Long tenantId,
            String contactNumber,
            StaffRole role,
            String name,
            String baseUsername,
            String defaultPassword
    ) {
        if (rolesPresent.contains(role)) {
            return;
        }

        String username = nextAvailableUsername(baseUsername, usernamesPresent);
        Staff account = new Staff();
        account.setName(name);
        account.setRole(role);
        account.setUsername(username);
        account.setPassword(passwordEncoder.encode(defaultPassword));
        account.setPhone(contactNumber);
        account.setRestaurant(restaurant);
        account.setTenantId(tenantId);

        try {
            Staff saved = staffRepository.save(account);
            staff.add(saved);
            rolesPresent.add(role);
            usernamesPresent.add(username.toLowerCase(Locale.ROOT));
        } catch (DataIntegrityViolationException ex) {
            // Another request may have recreated this role already; keep response flow stable.
        }
    }

    private String nextAvailableUsername(String baseUsername, Set<String> usernamesPresent) {
        String candidate = baseUsername;
        int suffix = 1;
        while (usernamesPresent.contains(candidate.toLowerCase(Locale.ROOT))) {
            candidate = baseUsername + suffix;
            suffix++;
        }
        return candidate;
    }

    @PostMapping
    public ResponseEntity<?> createStaff(@RequestBody Staff staff) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (restaurantId != null) {
            Optional<Restaurant> restaurant = restaurantRepository.findById(restaurantId);
            if (restaurant.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            staff.setRestaurant(restaurant.get());
        }
        if (staff.getUsername() != null) {
            staff.setUsername(staff.getUsername().trim());
        }
        if (staff.getPassword() != null) {
            String normalizedPassword = staff.getPassword().trim();
            if (normalizedPassword.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            // âœ… Validate password strength
            PasswordValidator.ValidationResult validation = passwordValidator.validate(normalizedPassword);
            if (!validation.isValid()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", validation.getMessage()));
            }
            
            staff.setPassword(passwordEncoder.encode(normalizedPassword));
        }
        return ResponseEntity.ok(staffRepository.save(staff));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStaff(
            @PathVariable("id") Long id,
            @RequestBody Staff updated) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        Optional<Staff> staffOpt = staffRepository.findById(id);
        if (staffOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Staff staff = staffOpt.get();
        if (restaurantId != null && staff.getRestaurant() != null
                && !restaurantId.equals(staff.getRestaurant().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        staff.setName(updated.getName());
        staff.setRole(updated.getRole());
        staff.setUsername(updated.getUsername() != null ? updated.getUsername().trim() : null);
        staff.setPhone(updated.getPhone());
        staff.setPhotoUrl(updated.getPhotoUrl());
        staff.setUiTheme(updated.getUiTheme());
        if (updated.getPassword() != null && !updated.getPassword().isEmpty()) {
            String normalizedPassword = updated.getPassword().trim();
            if (normalizedPassword.isBlank()) {
                return ResponseEntity.badRequest().build();
            }
            
            // âœ… Validate password strength
            PasswordValidator.ValidationResult validation = passwordValidator.validate(normalizedPassword);
            if (!validation.isValid()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", validation.getMessage()));
            }
            
            staff.setPassword(passwordEncoder.encode(normalizedPassword));
        }
        return ResponseEntity.ok(staffRepository.save(staff));
    }

    @PutMapping("/update-by-role/{role}")
    public ResponseEntity<?> updateStaffByRole(
            @PathVariable("role") String role,
            @RequestBody Map<String, String> payload) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        if (restaurantId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        final StaffRole staffRole;
        try {
            staffRole = StaffRole.valueOf(role.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Invalid role: " + role));
        }

        Long requestedStaffId = null;
        if (payload.containsKey("id") && payload.get("id") != null) {
            try {
                requestedStaffId = Long.parseLong(payload.get("id").trim());
            } catch (NumberFormatException ignored) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid staff id"));
            }
        }

        Optional<Staff> staffOpt = Optional.empty();
        if (requestedStaffId != null) {
            Optional<Staff> byId = staffRepository.findById(requestedStaffId);
            if (byId.isPresent()) {
                Staff candidate = byId.get();
                boolean sameHotel = candidate.getRestaurant() != null && restaurantId.equals(candidate.getRestaurant().getId());
                if (sameHotel && candidate.getRole() == staffRole) {
                    staffOpt = byId;
                }
            }
        }

        if (staffOpt.isEmpty()) {
            staffOpt = staffRepository.findByRestaurantId(restaurantId).stream()
                .filter(s -> s.getRole() == staffRole)
                .findFirst();
        }

        // Some older tenants may not have a role-indexable OWNER row in the current scope.
        // In that case, allow owner self-update using the logged-in username from payload.
        if (staffOpt.isEmpty() && staffRole == StaffRole.OWNER) {
            String requesterUsername = payload.get("requesterUsername");
            if (requesterUsername != null && !requesterUsername.isBlank()) {
                staffOpt = staffRepository.findByUsernameIgnoreCaseAndRestaurantId(requesterUsername, restaurantId);
            }
        }

        if (staffOpt.isPresent()) {
            Staff staff = staffOpt.get();

            boolean isOwnerUpdate = staffRole == StaffRole.OWNER;
            if (isOwnerUpdate) {
                String currentPassword = payload.get("currentPassword");
                String newPassword = payload.get("password");

                if (currentPassword == null || currentPassword.isBlank()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Current password is required"));
                }
                if (newPassword == null || newPassword.isBlank()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "New password is required"));
                }
                if (!passwordMatches(currentPassword, staff.getPassword())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Current password is incorrect"));
                }
            }

            if (payload.containsKey("username")) {
                String normalizedUsername = payload.get("username") != null ? payload.get("username").trim() : null;
                staff.setUsername(normalizedUsername);
            }
            if (payload.containsKey("photoUrl")) staff.setPhotoUrl(payload.get("photoUrl"));
            if (payload.containsKey("uiTheme")) staff.setUiTheme(payload.get("uiTheme"));
            if (payload.containsKey("password") && !payload.get("password").isEmpty()) {
                String normalizedPassword = payload.get("password").trim();
                if (normalizedPassword.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Password cannot be blank"));
                }
                String encodedPassword = passwordEncoder.encode(normalizedPassword);
                staff.setPassword(encodedPassword);
                if (staffRole == StaffRole.OWNER) {
                    restaurantRepository.findById(Objects.requireNonNull(restaurantId)).ifPresent(restaurant -> {
                        restaurant.setOwnerPassword(encodedPassword);
                        if (payload.get("username") != null && !payload.get("username").isBlank()) {
                            restaurant.setOwnerEmail(payload.get("username").trim());
                        }
                        restaurantRepository.save(restaurant);
                    });
                }
            }

            if (staffRole == StaffRole.OWNER) {
                restaurantRepository.findById(Objects.requireNonNull(restaurantId)).ifPresent(restaurant -> {
                    if (payload.get("username") != null && !payload.get("username").isBlank()) {
                        restaurant.setOwnerEmail(payload.get("username").trim());
                    }
                    if (payload.get("photoUrl") != null) {
                        restaurant.setOwnerPhotoUrl(payload.get("photoUrl"));
                    }
                    if (payload.get("uiTheme") != null) {
                        restaurant.setUiTheme(payload.get("uiTheme"));
                    }
                    restaurantRepository.save(restaurant);
                });
            }
            return ResponseEntity.ok(staffRepository.save(staff));
        }

        if (staffRole == StaffRole.OWNER) {
            String currentPassword = payload.get("currentPassword");
            String newPassword = payload.get("password");

            if (currentPassword == null || currentPassword.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Current password is required"));
            }
            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "New password is required"));
            }

            Optional<Restaurant> restaurantOpt = restaurantRepository.findById(Objects.requireNonNull(restaurantId));
            if (restaurantOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Restaurant not found for this tenant"));
            }

            Restaurant restaurant = restaurantOpt.get();
            String storedPassword = restaurant.getOwnerPassword();
            if (storedPassword == null || storedPassword.isBlank()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Owner account not configured for this hotel"));
            }

            boolean passwordValid = passwordMatches(currentPassword, storedPassword);
            if (!passwordValid) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Current password is incorrect"));
            }

            String normalizedUsername = payload.get("username") != null ? payload.get("username").trim() : null;
            String encodedNewPassword = passwordEncoder.encode(newPassword);

            restaurant.setOwnerPassword(encodedNewPassword);
            if (normalizedUsername != null && !normalizedUsername.isBlank()) {
                restaurant.setOwnerEmail(normalizedUsername);
            }
            if (payload.get("photoUrl") != null) {
                restaurant.setOwnerPhotoUrl(payload.get("photoUrl"));
            }
            if (payload.get("uiTheme") != null) {
                restaurant.setUiTheme(payload.get("uiTheme"));
            }
            restaurantRepository.save(restaurant);

            Staff ownerAccount = new Staff();
            ownerAccount.setName(restaurant.getOwnerName() != null && !restaurant.getOwnerName().isBlank() ? restaurant.getOwnerName() : "Owner");
            ownerAccount.setRole(StaffRole.OWNER);
            ownerAccount.setUsername(normalizedUsername != null && !normalizedUsername.isBlank() ? normalizedUsername : restaurant.getOwnerEmail());
            ownerAccount.setPhone(restaurant.getContactNumber() != null ? restaurant.getContactNumber() : "0000000000");
            ownerAccount.setPassword(encodedNewPassword);
            ownerAccount.setPhotoUrl(restaurant.getOwnerPhotoUrl());
            ownerAccount.setUiTheme(restaurant.getUiTheme());
            ownerAccount.setRestaurant(restaurant);
            ownerAccount.setTenantId(restaurantId);
            Staff savedOwnerAccount = staffRepository.save(ownerAccount);

            return ResponseEntity.ok(savedOwnerAccount);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", "Staff account not found for this role"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> credentials,
            @RequestHeader(value = "X-Hotel-Id", required = false) Long hotelId) {
        String usernameInput = credentials.get("username");
        String password = credentials.get("password");

        if (usernameInput == null || usernameInput.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Username and password are required"));
        }
        
        String username = usernameInput.trim();
        String normalizedPassword = password.trim();

        Long effectiveHotelId = hotelId;
        if (effectiveHotelId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "X-Hotel-Id header is required"));
        }

        // âœ… Check if account is locked due to brute-force attempts
        if (loginAttemptService.isBlocked(username, effectiveHotelId)) {
            long remainingSeconds = loginAttemptService.getRemainingLockTimeSeconds(username, effectiveHotelId);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of(
                        "error", "Account temporarily locked due to multiple failed login attempts",
                        "retryAfterSeconds", remainingSeconds
                    ));
        }

        Optional<Staff> staff = staffRepository.findByUsernameIgnoreCaseAndRestaurantId(username, effectiveHotelId);
        boolean staffFromRepository = staff.isPresent();

        if (staff.isEmpty() && effectiveHotelId != null) {
            Optional<Restaurant> restaurantOpt = restaurantRepository.findById(effectiveHotelId);
            if (restaurantOpt.isPresent()) {
                Restaurant restaurant = restaurantOpt.get();
                boolean usernameMatchesOwner = restaurant.getOwnerEmail() != null
                        && username.equalsIgnoreCase(restaurant.getOwnerEmail().trim());
                boolean passwordMatchesOwner = passwordMatches(normalizedPassword, restaurant.getOwnerPassword());
                if (usernameMatchesOwner && passwordMatchesOwner) {
                    Staff owner = new Staff();
                    owner.setId(restaurant.getId());
                    owner.setName(restaurant.getOwnerName() != null ? restaurant.getOwnerName() : "Owner");
                    owner.setRole(StaffRole.OWNER);
                    owner.setUsername(restaurant.getOwnerEmail());
                    owner.setPhone(restaurant.getContactNumber() != null ? restaurant.getContactNumber() : "0000000000");
                    owner.setPassword(restaurant.getOwnerPassword());
                    owner.setPhotoUrl(restaurant.getOwnerPhotoUrl());
                    owner.setUiTheme(restaurant.getUiTheme());
                    owner.setRestaurant(restaurant);
                    staff = Optional.of(owner);
                }
            }
        }

        if (staff.isPresent()) {
            boolean passwordMatch = passwordMatches(normalizedPassword, staff.get().getPassword());
            if (passwordMatch) {
                // Upgrade legacy plaintext passwords to BCrypt after successful login.
                if (staffFromRepository && !isBcryptHash(staff.get().getPassword())) {
                    staff.get().setPassword(passwordEncoder.encode(normalizedPassword));
                    staffRepository.save(staff.get());
                }

                // âœ… Record successful login (clears attempt counter)
                loginAttemptService.recordSuccessfulLogin(username, effectiveHotelId);
                
                Long tenantId = effectiveHotelId != null ? effectiveHotelId : staff.get().getRestaurant().getId();
                String token = jwtTokenUtil.generateToken(
                    staff.get().getId(),
                    tenantId,
                    staff.get().getUsername(),
                    List.of(staff.get().getRole().toString())
                );
                return ResponseEntity.ok(LoginResponse.fromStaff(staff.get(), token, tenantId));
            }

            if (effectiveHotelId != null && staff.get().getRole() == StaffRole.OWNER) {
                Optional<Restaurant> restaurantOpt = restaurantRepository.findById(effectiveHotelId);
                if (restaurantOpt.isPresent()) {
                    Restaurant restaurant = restaurantOpt.get();
                    boolean usernameMatchesOwner = restaurant.getOwnerEmail() != null
                            && username.equalsIgnoreCase(restaurant.getOwnerEmail().trim());
                    boolean passwordMatchesOwner = passwordMatches(normalizedPassword, restaurant.getOwnerPassword());
                    if (usernameMatchesOwner && passwordMatchesOwner) {
                        if (!isBcryptHash(restaurant.getOwnerPassword())) {
                            restaurant.setOwnerPassword(passwordEncoder.encode(normalizedPassword));
                            restaurantRepository.save(restaurant);
                        }

                        // âœ… Record successful login
                        loginAttemptService.recordSuccessfulLogin(username, effectiveHotelId);
                        
                        String token = jwtTokenUtil.generateToken(
                            staff.get().getId(),
                            effectiveHotelId,
                            staff.get().getUsername(),
                            List.of(StaffRole.OWNER.toString())
                        );
                        return ResponseEntity.ok(LoginResponse.fromStaff(staff.get(), token, effectiveHotelId));
                    }
                }
            }

            // âœ… Record failed login attempt
            loginAttemptService.recordFailedLogin(username, effectiveHotelId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        // Owner resilience path: if auto-detected hotel id is stale/wrong, resolve by owner email and password.
        List<Restaurant> ownerHotels = restaurantRepository.findAllByOwnerEmailIgnoreCaseOrderByIdDesc(username);
        if (!ownerHotels.isEmpty()) {
            for (Restaurant candidateHotel : ownerHotels) {
                Long candidateHotelId = candidateHotel.getId();
                if (candidateHotelId == null) {
                    continue;
                }
                if (effectiveHotelId.equals(candidateHotelId)) {
                    continue;
                }
                if (!passwordMatches(normalizedPassword, candidateHotel.getOwnerPassword())) {
                    continue;
                }

                if (!isBcryptHash(candidateHotel.getOwnerPassword())) {
                    candidateHotel.setOwnerPassword(passwordEncoder.encode(normalizedPassword));
                    restaurantRepository.save(candidateHotel);
                }

                Optional<Staff> ownerStaff = staffRepository
                        .findByUsernameIgnoreCaseAndRestaurantId(username, candidateHotelId)
                        .filter(s -> s.getRole() == StaffRole.OWNER);

                Staff ownerPrincipal = ownerStaff.orElseGet(() -> {
                    Staff owner = new Staff();
                    owner.setId(candidateHotel.getId());
                    owner.setName(candidateHotel.getOwnerName() != null ? candidateHotel.getOwnerName() : "Owner");
                    owner.setRole(StaffRole.OWNER);
                    owner.setUsername(candidateHotel.getOwnerEmail());
                    owner.setPhone(candidateHotel.getContactNumber() != null ? candidateHotel.getContactNumber() : "0000000000");
                    owner.setPassword(candidateHotel.getOwnerPassword());
                    owner.setPhotoUrl(candidateHotel.getOwnerPhotoUrl());
                    owner.setUiTheme(candidateHotel.getUiTheme());
                    owner.setRestaurant(candidateHotel);
                    return owner;
                });

                loginAttemptService.recordSuccessfulLogin(username, candidateHotelId);
                String token = jwtTokenUtil.generateToken(
                        ownerPrincipal.getId(),
                        candidateHotelId,
                        ownerPrincipal.getUsername(),
                        List.of(StaffRole.OWNER.toString())
                );
                return ResponseEntity.ok(LoginResponse.fromStaff(ownerPrincipal, token, candidateHotelId));
            }
        }

        // âœ… Record failed login attempt
        loginAttemptService.recordFailedLogin(username, effectiveHotelId);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid credentials"));
    }

    @PostMapping("/login/google")
    public ResponseEntity<?> loginWithGoogle(
            @RequestBody com.serversundaram.dto.GoogleLoginRequest request,
            @RequestHeader(value = "X-Hotel-Id", required = false) Long hotelId) {
        if (hotelId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "X-Hotel-Id header is required"));
        }

        final GoogleIdTokenVerifierService.GoogleUserInfo googleUser;
        try {
            googleUser = googleIdTokenVerifierService.verify(request.getIdToken());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", ex.getMessage()));
        }

        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(hotelId);
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Hotel not found"));
        }

        Restaurant restaurant = restaurantOpt.get();
        String ownerEmail = restaurant.getOwnerEmail() != null ? restaurant.getOwnerEmail().trim().toLowerCase(Locale.ROOT) : "";
        if (ownerEmail.isBlank() || !ownerEmail.equals(googleUser.email())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Google account is not authorized for this owner"));
        }

        Optional<Staff> ownerStaffOpt = staffRepository.findByUsernameIgnoreCaseAndRestaurantId(ownerEmail, hotelId)
                .filter(s -> s.getRole() == StaffRole.OWNER);

        Staff ownerStaff = ownerStaffOpt.orElseGet(() -> {
            Staff owner = new Staff();
            owner.setName(restaurant.getOwnerName() != null && !restaurant.getOwnerName().isBlank()
                    ? restaurant.getOwnerName()
                    : (googleUser.name() != null && !googleUser.name().isBlank() ? googleUser.name() : "Owner"));
            owner.setRole(StaffRole.OWNER);
            owner.setUsername(ownerEmail);
            owner.setPhone(restaurant.getContactNumber() != null ? restaurant.getContactNumber() : "0000000000");
            owner.setPassword(passwordEncoder.encode("GOOGLE_OAUTH_LOGIN"));
            owner.setPhotoUrl(restaurant.getOwnerPhotoUrl());
            owner.setUiTheme(restaurant.getUiTheme());
            owner.setRestaurant(restaurant);
            owner.setTenantId(restaurant.getTenantId() != null ? restaurant.getTenantId() : hotelId);
            return staffRepository.save(owner);
        });

        String token = jwtTokenUtil.generateToken(
                ownerStaff.getId(),
                hotelId,
                ownerStaff.getUsername(),
                List.of(StaffRole.OWNER.toString())
        );

        return ResponseEntity.ok(LoginResponse.fromStaff(ownerStaff, token, hotelId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable("id") @org.springframework.lang.NonNull Long id) {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        Optional<Staff> staffOpt = staffRepository.findById(id);
        if (staffOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Staff staff = staffOpt.get();
        if (restaurantId != null && staff.getRestaurant() != null
                && !restaurantId.equals(staff.getRestaurant().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        staffRepository.delete(staff);
        return ResponseEntity.noContent().build();
    }
}

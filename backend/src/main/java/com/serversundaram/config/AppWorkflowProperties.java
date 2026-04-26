package com.serversundaram.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "app")
public class AppWorkflowProperties {

    private final Tenant tenant = new Tenant();
    private final Seed seed = new Seed();
    private final Url url = new Url();
    private final Auth auth = new Auth();
    private final Twilio twilio = new Twilio();

    public Tenant getTenant() {
        return tenant;
    }

    public Seed getSeed() {
        return seed;
    }

    public Url getUrl() {
        return url;
    }

    public Auth getAuth() {
        return auth;
    }

    public Twilio getTwilio() {
        return twilio;
    }

    public static class Tenant {
        private boolean requireHeaderForOperationalApis = true;
        private List<String> masterPathPrefixes = new ArrayList<>(List.of("/api/saas", "/api/health"));

        public boolean isRequireHeaderForOperationalApis() {
            return requireHeaderForOperationalApis;
        }

        public void setRequireHeaderForOperationalApis(boolean requireHeaderForOperationalApis) {
            this.requireHeaderForOperationalApis = requireHeaderForOperationalApis;
        }

        public List<String> getMasterPathPrefixes() {
            return masterPathPrefixes;
        }

        public void setMasterPathPrefixes(List<String> masterPathPrefixes) {
            this.masterPathPrefixes = masterPathPrefixes;
        }
    }

    public static class Seed {
        private boolean enabled = true;
        private String defaultTenantId = "1";
        private String adminUsername = "admin";
        private String adminPassword = "";
        private String ownerUsername = "owner@serversundaram.local";
        private String ownerPassword = "";
        private String kitchenUsername = "kitchen";
        private String kitchenPassword = "";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getDefaultTenantId() {
            return defaultTenantId;
        }

        public void setDefaultTenantId(String defaultTenantId) {
            this.defaultTenantId = defaultTenantId;
        }

        public String getAdminUsername() {
            return adminUsername;
        }

        public void setAdminUsername(String adminUsername) {
            this.adminUsername = adminUsername;
        }

        public String getAdminPassword() {
            return adminPassword;
        }

        public void setAdminPassword(String adminPassword) {
            this.adminPassword = adminPassword;
        }

        public String getOwnerUsername() {
            return ownerUsername;
        }

        public void setOwnerUsername(String ownerUsername) {
            this.ownerUsername = ownerUsername;
        }

        public String getOwnerPassword() {
            return ownerPassword;
        }

        public void setOwnerPassword(String ownerPassword) {
            this.ownerPassword = ownerPassword;
        }

        public String getKitchenUsername() {
            return kitchenUsername;
        }

        public void setKitchenUsername(String kitchenUsername) {
            this.kitchenUsername = kitchenUsername;
        }

        public String getKitchenPassword() {
            return kitchenPassword;
        }

        public void setKitchenPassword(String kitchenPassword) {
            this.kitchenPassword = kitchenPassword;
        }
    }

    public static class Url {
        private String backendBase = "http://localhost:8085";

        public String getBackendBase() {
            return backendBase;
        }

        public void setBackendBase(String backendBase) {
            this.backendBase = backendBase;
        }
    }

    public static class Auth {
        private String mockOtp = "123456";
        private String googleClientId = "";

        public String getMockOtp() {
            return mockOtp;
        }

        public void setMockOtp(String mockOtp) {
            this.mockOtp = mockOtp;
        }

        public String getGoogleClientId() {
            return googleClientId;
        }

        public void setGoogleClientId(String googleClientId) {
            this.googleClientId = googleClientId;
        }
    }

    public static class Twilio {
        private String accountSid;
        private String authToken;
        private String verifyServiceSid;

        public String getAccountSid() {
            return accountSid;
        }

        public void setAccountSid(String accountSid) {
            this.accountSid = accountSid;
        }

        public String getAuthToken() {
            return authToken;
        }

        public void setAuthToken(String authToken) {
            this.authToken = authToken;
        }

        public String getVerifyServiceSid() {
            return verifyServiceSid;
        }

        public void setVerifyServiceSid(String verifyServiceSid) {
            this.verifyServiceSid = verifyServiceSid;
        }
    }
}
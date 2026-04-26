package com.serversundaram.controller;

import com.serversundaram.entity.Customer;
import com.serversundaram.service.CustomerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private static final Logger log = LoggerFactory.getLogger(CustomerController.class);

    @Autowired
    private CustomerService customerService;

    @PostMapping("/otp/send")
    public ResponseEntity<?> sendOtp(@RequestParam(required = false) Map<String, String> params, @RequestBody(required = false) Map<String, String> body) {
        try {
            String mobile = null;
            String name = null;

            if (body != null) {
                mobile = body.get("mobileNumber");
                name = body.get("name");
            }
            
            if ((mobile == null || mobile.isEmpty()) && params != null) {
                mobile = params.get("mobileNumber");
                name = params.get("name");
            }

            if (mobile == null || mobile.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mobile number is required"));
            }

            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
            }

            customerService.sendOtp(mobile.trim(), name.trim());
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
        } catch (RuntimeException e) {
            String message = e.getMessage() != null ? e.getMessage() : "Failed to send OTP.";
            if (message.contains("Restaurant not found with id")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid hotel link. Please use the latest QR/login URL."));
            }
            log.error("Failed to send OTP", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send OTP."));
        } catch (Exception e) {
            log.error("Failed to send OTP", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send OTP."));
        }
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String mobile = request.get("mobileNumber");
        String otp = request.get("otp");
        String tableId = request.get("tableId");
        try {
            Customer customer = customerService.verifyOtp(mobile, otp, tableId);
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            log.warn("OTP verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "OTP verification failed."));
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<List<Customer>> getAdminCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCustomers() throws Exception {
        byte[] excelContent = customerService.exportCustomersToExcel();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=serversundaram_Customers.xlsx")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .body(excelContent);
    }
}

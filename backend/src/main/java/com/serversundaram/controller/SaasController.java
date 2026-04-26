package com.serversundaram.controller;

import com.serversundaram.entity.Restaurant;
import com.serversundaram.service.SaasService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saas")
@RequiredArgsConstructor
public class SaasController {

    private final SaasService saasService;

    @GetMapping("/hotels")
    public List<Restaurant> getAllHotels() {
        return saasService.getAllHotels();
    }

    @GetMapping("/hotels/{id}")
    public Restaurant getHotelById(@PathVariable Long id) {
        return saasService.getHotelById(id);
    }

    @GetMapping("/owner-hotel")
    public Map<String, Object> getOwnerHotelByEmail(@RequestParam String email) {
        return saasService.getOwnerHotelByEmail(email);
    }

    @PostMapping("/hotels")
    public com.serversundaram.dto.HotelRegistrationResponse createHotel(@RequestBody com.serversundaram.dto.HotelRegistrationRequest request) {
        return saasService.createHotel(request);
    }

    @PutMapping("/hotels/{id}/plan")
    public Restaurant updatePlan(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String planType = (String) payload.get("planType");
        Integer months = (Integer) payload.get("months");
        return saasService.updateHotelPlan(id, planType, months);
    }

    @PutMapping("/hotels/{id}/toggle-status")
    public Restaurant toggleStatus(@PathVariable Long id) {
        return saasService.toggleHotelStatus(id);
    }

    @GetMapping("/stats")
    public java.util.Map<String, Object> getPlatformStats() {
        return saasService.getPlatformStats();
    }

    @GetMapping("/settings")
    public java.util.Map<String, Object> getSystemSettings() {
        return saasService.getSystemSettings();
    }

    @GetMapping("/hotel-stats/{id}")
    public java.util.Map<String, Object> getHotelDashboardStats(@PathVariable Long id) {
        return saasService.getHotelDashboardStats(id);
    }

    @DeleteMapping("/hotels/{id}")
    public void deleteHotel(@PathVariable Long id) {
        saasService.deleteHotel(id);
    }

    @PutMapping("/settings")
    public void updateSettings(@RequestBody java.util.Map<String, Object> settings) {
        saasService.updateSystemSettings(settings);
    }
}

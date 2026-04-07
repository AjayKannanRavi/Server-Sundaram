package com.servesmart.service;

import com.servesmart.config.AppWorkflowProperties;
import com.servesmart.config.TenantContext;
import com.servesmart.entity.Customer;
import com.servesmart.entity.Restaurant;
import com.servesmart.repository.CustomerRepository;
import com.servesmart.repository.RestaurantRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private AppWorkflowProperties appWorkflowProperties;

    @Autowired
    private SmsService smsService;

    public void sendOtp(String mobileNumber, String name) {
        try {
            Long restaurantId = TenantContext.requireCurrentTenantAsLong();
            Restaurant restaurant = ensureTenantRestaurant(restaurantId);
            String otp = appWorkflowProperties.getAuth().getMockOtp();

            Customer customer = customerRepository.findByMobileNumberAndRestaurantId(mobileNumber, restaurantId)
                    .orElse(new Customer());

            if (customer.getRestaurant() == null) {
                customer.setRestaurant(restaurant);
            }

            customer.setMobileNumber(mobileNumber);
            if (name != null) {
                customer.setName(name);
            }
            customer.setCurrentOtp(otp);
            customer.setOtpGeneratedAt(LocalDateTime.now());

            customerRepository.save(customer);
            
            // Standardized SMS/OTP Sending
            smsService.sendOtp(mobileNumber, otp);
            
        } catch (Exception e) {
            System.err.println("Error sending OTP: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send OTP: " + e.getMessage(), e);
        }
    }

    public Customer verifyOtp(String mobileNumber, String otp, String tableId) {
        Long restaurantId = TenantContext.requireCurrentTenantAsLong();
        ensureTenantRestaurant(restaurantId);

        Customer customer = customerRepository.findByMobileNumberAndRestaurantId(mobileNumber, restaurantId)
                .orElseThrow(() -> new RuntimeException("Customer not found for mobile: " + mobileNumber));

        if (customer.getCurrentOtp() != null && customer.getCurrentOtp().equals(otp)) {
            customer.setVisitCount(customer.getVisitCount() + 1);
            customer.setLastVisitedDate(LocalDateTime.now());
            customer.setLastTableUsed(tableId);
            customer.setCurrentOtp(null);
            return customerRepository.save(customer);
        }

        throw new RuntimeException("Invalid OTP");
    }

    public List<Customer> getAllCustomers() {
        Long restaurantId = TenantContext.getCurrentTenantAsLong();
        return restaurantId != null ? customerRepository.findByRestaurantId(restaurantId) : customerRepository.findAll();
    }

    public byte[] exportCustomersToExcel() throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Customers");
            Row header = sheet.createRow(0);
            String[] columns = {"Name", "Mobile Number", "Visit Count", "Last Visited", "Last Table Used", "Joined Date"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }
            Long restaurantId = TenantContext.getCurrentTenantAsLong();
            List<Customer> customers = restaurantId != null ? customerRepository.findByRestaurantId(restaurantId) : customerRepository.findAll();
            int rowIdx = 1;
            for (Customer customer : customers) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(customer.getName() != null ? customer.getName() : "Anonymous");
                row.createCell(1).setCellValue(customer.getMobileNumber());
                row.createCell(2).setCellValue(customer.getVisitCount());
                row.createCell(3).setCellValue(customer.getLastVisitedDate() != null ? customer.getLastVisitedDate().toString() : "Never");
                row.createCell(4).setCellValue(customer.getLastTableUsed() != null ? "Table " + customer.getLastTableUsed() : "N/A");
                row.createCell(5).setCellValue(customer.getCreatedAt() != null ? customer.getCreatedAt().toString() : "N/A");
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private Restaurant ensureTenantRestaurant(Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId).orElse(null);
        if (restaurant != null) {
            return restaurant;
        }

        Long previousTenant = TenantContext.getCurrentTenantAsLong();
        TenantContext.clear();
        try {
            Restaurant masterRestaurant = restaurantRepository.findById(restaurantId)
                    .orElseThrow(() -> new RuntimeException("Restaurant not found with id: " + restaurantId));

            TenantContext.setCurrentTenant(restaurantId.toString());
            Restaurant tenantRestaurant = restaurantRepository.findById(restaurantId).orElse(null);
            if (tenantRestaurant != null) {
                return tenantRestaurant;
            }

            tenantRestaurant = new Restaurant();
            tenantRestaurant.setId(masterRestaurant.getId());
            tenantRestaurant.setName(masterRestaurant.getName());
            tenantRestaurant.setOwnerName(masterRestaurant.getOwnerName());
            tenantRestaurant.setOwnerEmail(masterRestaurant.getOwnerEmail());
            tenantRestaurant.setOwnerPassword(masterRestaurant.getOwnerPassword());
            tenantRestaurant.setContactNumber(masterRestaurant.getContactNumber());
            tenantRestaurant.setLogoUrl(masterRestaurant.getLogoUrl());
            tenantRestaurant.setAddress(masterRestaurant.getAddress());
            tenantRestaurant.setGstNumber(masterRestaurant.getGstNumber());
            tenantRestaurant.setPlanType(masterRestaurant.getPlanType());
            tenantRestaurant.setPlanExpiry(masterRestaurant.getPlanExpiry());
            tenantRestaurant.setIsActive(masterRestaurant.getIsActive());
            tenantRestaurant.setTaxPercentage(masterRestaurant.getTaxPercentage());
            tenantRestaurant.setServiceCharge(masterRestaurant.getServiceCharge());
            return restaurantRepository.save(tenantRestaurant);
        } finally {
            TenantContext.clear();
            if (previousTenant != null) {
                TenantContext.setCurrentTenant(previousTenant.toString());
            }
        }
    }
}

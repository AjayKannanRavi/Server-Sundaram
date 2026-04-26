package com.serversundaram.service.impl;

import com.serversundaram.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MockSmsServiceImpl implements SmsService {

    @Override
    public boolean sendOtp(String mobileNumber, String otp) {
        log.info("==========================================");
        log.info("MOCK SMS SERVICE - OTP FOR: {}", mobileNumber);
        log.info("YOUR ONE-TIME PASSWORD IS: [{}]", otp);
        log.info("==========================================");
        
        // This is where you would call an external API like Twilio or Fast2SMS.
        // For example:
        // HttpEntity<String> entity = new HttpEntity<>(jsonParams, headers);
        // restTemplate.postForEntity(smsApiUrl, entity, String.class);
        
        return true;
    }

    @Override
    public boolean verifyOtp(String mobileNumber, String code) {
        log.info("MOCK SMS SERVICE - VERIFYING OTP FOR: {} WITH CODE: {}", mobileNumber, code);
        return true;
    }
}

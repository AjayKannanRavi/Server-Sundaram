package com.servesmart.service.impl;

import com.servesmart.config.AppWorkflowProperties;
import com.servesmart.service.SmsService;
import com.twilio.Twilio;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary
@Slf4j
public class TwilioVerifyServiceImpl implements SmsService {

    @Autowired
    private AppWorkflowProperties properties;

    @PostConstruct
    public void init() {
        String accountSid = properties.getTwilio().getAccountSid();
        String authToken = properties.getTwilio().getAuthToken();
        if (accountSid != null && !accountSid.isEmpty() && authToken != null && !authToken.isEmpty()) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio initialized with Account SID: {}", accountSid);
        } else {
            log.warn("Twilio credentials not found. Twilio SMS service will not work correctly.");
        }
    }

    @Override
    public boolean sendOtp(String mobileNumber, String otp) {
        try {
            String formattedNumber = formatMobileNumber(mobileNumber);
            String serviceSid = properties.getTwilio().getVerifyServiceSid();
            
            log.info("Sending Twilio Verify OTP to: {}", formattedNumber);
            
            Verification verification = Verification.creator(
                    serviceSid,
                    formattedNumber,
                    "sms"
            ).create();
            
            log.info("Verification status: {}", verification.getStatus());
            return "pending".equalsIgnoreCase(verification.getStatus());
        } catch (Exception e) {
            log.error("Failed to send Twilio Verify OTP", e);
            return false;
        }
    }

    @Override
    public boolean verifyOtp(String mobileNumber, String code) {
        try {
            String formattedNumber = formatMobileNumber(mobileNumber);
            String serviceSid = properties.getTwilio().getVerifyServiceSid();
            
            log.info("Checking Twilio Verify OTP for: {}", formattedNumber);
            
            VerificationCheck verificationCheck = VerificationCheck.creator(
                    serviceSid)
                    .setTo(formattedNumber)
                    .setCode(code)
                    .create();
            
            log.info("Verification check status: {}", verificationCheck.getStatus());
            return "approved".equalsIgnoreCase(verificationCheck.getStatus());
        } catch (Exception e) {
            log.error("Failed to verify Twilio Verify OTP", e);
            return false;
        }
    }

    private String formatMobileNumber(String mobileNumber) {
        if (mobileNumber == null) return null;
        String cleaned = mobileNumber.replaceAll("[^0-9]", "");
        if (cleaned.length() == 10) {
            return "+91" + cleaned; // Assuming India as default
        }
        if (!mobileNumber.startsWith("+")) {
            return "+" + cleaned;
        }
        return mobileNumber;
    }
}

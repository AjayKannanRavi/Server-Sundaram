package com.servesmart.service;

public interface SmsService {
    /**
     * Sends an OTP (One-Time Password) to the specified mobile number.
     * 
     * @param mobileNumber The phone number formatted as a string.
     * @param otp The 6-digit OTP code.
     * @return true if successfully sent, false otherwise.
     */
    boolean sendOtp(String mobileNumber, String otp);

    /**
     * Verifies the OTP (One-Time Password) for the specified mobile number.
     *
     * @param mobileNumber The phone number formatted as a string.
     * @param code The OTP code to verify.
     * @return true if successfully verified, false otherwise.
     */
    boolean verifyOtp(String mobileNumber, String code);
}

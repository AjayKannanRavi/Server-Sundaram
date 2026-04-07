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
}

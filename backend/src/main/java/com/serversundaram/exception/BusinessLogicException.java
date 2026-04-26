package com.serversundaram.exception;

/**
 * Thrown when business rule validation fails.
 */
public class BusinessLogicException extends ServiceException {
    public BusinessLogicException(String message) {
        super(message);
    }
}

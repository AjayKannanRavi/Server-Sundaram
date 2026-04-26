package com.serversundaram.config;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * AOP aspect that enables Hibernate tenant filters on every repository/service method call.
 * This ensures automatic row-level tenant isolation without modifying query logic.
 */
@Aspect
@Component
@RequiredArgsConstructor
public class TenantFilterAspect {

    private static final Logger log = LoggerFactory.getLogger(TenantFilterAspect.class);
    private final EntityManager entityManager;

    /**
     * Enable tenant filter before any repository method is invoked
     */
    @Before("execution(* com.serversundaram.repository..*.*(..)) || " +
            "execution(* com.serversundaram.service..*.*(..)) || " +
            "execution(* com.serversundaram.controller..*.*(..)) && " +
            "!execution(* com.serversundaram.controller.*.login(..))")
    public void enableTenantFilter(JoinPoint joinPoint) {
        Long tenantId = TenantContext.getCurrentTenantAsLong();
        
        if (tenantId == null) {
            // No tenant context set, skip filtering for public endpoints
            return;
        }

        try {
            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("tenantFilter");
            filter.setParameter("tenantId", tenantId);
            log.debug("Tenant filter enabled for tenantId: {}", tenantId);
        } catch (Exception e) {
            log.error("Failed to enable tenant filter for tenantId {}: {}", tenantId, e.getMessage());
            throw new IllegalStateException("Tenant filter could not be enabled", e);
        }
    }
}

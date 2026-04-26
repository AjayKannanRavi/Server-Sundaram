package com.serversundaram.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * Configuration to enable AspectJ auto-proxying for AOP components
 */
@Configuration
@EnableAspectJAutoProxy
public class AopConfig {
    // AspectJ auto-proxy is enabled for this configuration
}

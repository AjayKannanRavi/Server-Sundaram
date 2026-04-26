package com.serversundaram.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTenantFilter jwtTenantFilter;
    
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .contentSecurityPolicy("default-src 'self'").and()
                .xssProtection().and()
                .contentTypeOptions().and()
                .frameOptions().deny()
            )
            .cors(cors -> cors.configurationSource(request -> {
                var config = new CorsConfiguration();
                // Use patterns to support wildcards (e.g., *.trycloudflare.com for Cloudflare tunnels)
                List<String> patterns = new ArrayList<>(Arrays.asList(allowedOrigins.split(",")));
                patterns.add("http://localhost:*");
                patterns.add("http://127.0.0.1:*");
                patterns.add("https://*.trycloudflare.com");
                config.setAllowedOriginPatterns(patterns);
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                config.setAllowedHeaders(List.of("*"));
                config.setExposedHeaders(List.of("Authorization", "X-Tenant-ID", "X-Hotel-Id", "Content-Type"));
                config.setMaxAge(3600L);
                config.setAllowCredentials(true);
                return config;
            }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/saas/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/staff/login").permitAll()
                .requestMatchers("/api/staff/login/google").permitAll()
                // Customer-facing public endpoints (pre-login OTP flow)
                .requestMatchers("/api/customers/otp/send").permitAll()
                .requestMatchers("/api/customers/otp/verify").permitAll()
                // Customer-facing OTP session endpoints (guest mode with X-Hotel-Id)
                .requestMatchers("/api/menu/**").permitAll()
                .requestMatchers("/api/orders/session").permitAll()
                .requestMatchers("/api/orders/*").permitAll()
                .requestMatchers("/api/orders").permitAll()
                .requestMatchers("/api/orders/*/items").permitAll()
                .requestMatchers("/api/orders/*/status").permitAll()
                .requestMatchers("/api/reviews").permitAll()
                .requestMatchers("/api/reviews/session/*").permitAll()
                .requestMatchers("/api/restaurant/**").permitAll()
                .requestMatchers("/ws", "/ws/**").permitAll()
                .requestMatchers("/").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtTenantFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}

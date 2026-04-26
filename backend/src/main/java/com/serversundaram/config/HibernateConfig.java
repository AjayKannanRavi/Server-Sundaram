package com.serversundaram.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class HibernateConfig {

    @Autowired
    private JpaProperties jpaProperties;

    @Bean
    @org.springframework.context.annotation.DependsOn("tenantStartupInitializer")
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        Map<String, Object> properties = new HashMap<>(jpaProperties.getProperties());
        
        // Note: Removed multi-tenant connection provider setup for single-database model
        // All tenants now share single datasource with tenant_id column isolation
        
        // Explicitly set naming strategy since Spring Boot auto-config doesn't apply
        // it when a custom EntityManagerFactory bean is defined.
        properties.put("hibernate.physical_naming_strategy",
                "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy");
        
        // Enable Hibernate filters for automatic tenant scoping
        properties.put("hibernate.use_sql_comments", "true");

        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.serversundaram.entity", "com.serversundaram.config");
        em.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        em.setJpaPropertyMap(properties);
        return em;
    }
}

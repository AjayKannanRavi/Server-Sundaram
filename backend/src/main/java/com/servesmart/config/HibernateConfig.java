package com.servesmart.config;

import org.hibernate.cfg.Environment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateSettings;
import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class HibernateConfig {

    @Autowired
    private JpaProperties jpaProperties;

    @Autowired
    private MultiTenantConnectionProviderImpl multiTenantConnectionProvider;

    @Autowired
    private CurrentTenantIdentifierResolverImpl currentTenantIdentifierResolver;

    @Bean
    @org.springframework.context.annotation.DependsOn("tenantStartupInitializer")
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        Map<String, Object> properties = new HashMap<>(jpaProperties.getProperties());
        properties.put(Environment.MULTI_TENANT_CONNECTION_PROVIDER, multiTenantConnectionProvider);
        properties.put(Environment.MULTI_TENANT_IDENTIFIER_RESOLVER, currentTenantIdentifierResolver);

        // Explicitly set naming strategy since Spring Boot auto-config doesn't apply
        // it when a custom EntityManagerFactory bean is defined.
        properties.put("hibernate.physical_naming_strategy",
                "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy");

        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.servesmart.entity");
        em.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        em.setJpaPropertyMap(properties);
        return em;
    }
}

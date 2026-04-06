package com.servesmart.config;

import org.hibernate.engine.jdbc.connections.spi.AbstractMultiTenantConnectionProvider;
import org.hibernate.engine.jdbc.connections.spi.ConnectionProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@Component
public class MultiTenantConnectionProviderImpl extends AbstractMultiTenantConnectionProvider<String> {

    private final DataSource masterDataSource;
    private final Map<String, ConnectionProvider> tenantConnectionProviders = new HashMap<>();

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPass;

    @Value("${app.database.host:localhost}")
    private String dbHost;

    @Value("${app.database.port:3306}")
    private String dbPort;

    @Value("${app.database.params:useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}")
    private String dbParams;

    @Autowired
    public MultiTenantConnectionProviderImpl(DataSource masterDataSource) {
        this.masterDataSource = masterDataSource;
    }

    @Override
    protected ConnectionProvider getAnyConnectionProvider() {
        return fetchConnectionProvider("master");
    }

    @Override
    protected ConnectionProvider selectConnectionProvider(String tenantIdentifier) {
        return fetchConnectionProvider(tenantIdentifier);
    }

    private ConnectionProvider fetchConnectionProvider(String tenantId) {
        if ("master".equals(tenantId) || tenantId == null) {
            return new MasterConnectionProvider(masterDataSource);
        }

        return tenantConnectionProviders.computeIfAbsent(tenantId, id -> {
            String tenantDbUrl = "jdbc:mysql://" + dbHost + ":" + dbPort + "/ss_hotel_" + id + "?" + dbParams;
            HikariDataSource tenantDataSource = new HikariDataSource();
            tenantDataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
            tenantDataSource.setJdbcUrl(tenantDbUrl);
            tenantDataSource.setUsername(dbUser);
            tenantDataSource.setPassword(dbPass);
            tenantDataSource.setPoolName("tenant-" + id + "-pool");
            tenantDataSource.setMaximumPoolSize(2);
            tenantDataSource.setMinimumIdle(0);
            tenantDataSource.setIdleTimeout(30000);
            tenantDataSource.setConnectionTimeout(10000);
            tenantDataSource.setMaxLifetime(300000);
            return new MasterConnectionProvider(tenantDataSource);
        });
    }

    private static class MasterConnectionProvider implements ConnectionProvider {
        private final DataSource dataSource;

        public MasterConnectionProvider(DataSource dataSource) {
            this.dataSource = dataSource;
        }

        @Override
        public Connection getConnection() throws SQLException {
            return dataSource.getConnection();
        }

        @Override
        public void closeConnection(Connection conn) throws SQLException {
            conn.close();
        }

        @Override
        public boolean supportsAggressiveRelease() {
            return false;
        }

        @Override
        public boolean isUnwrappableAs(Class<?> unwrapType) {
            return false;
        }

        @Override
        public <T> T unwrap(Class<T> unwrapType) {
            return null;
        }
    }
}

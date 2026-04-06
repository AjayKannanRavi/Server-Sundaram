package com.servesmart;
import java.sql.*;

public class FixRoleColumn {
    public static void main(String[] args) {
        String url = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/servesmart_db");
        String user = System.getenv().getOrDefault("DB_USER", "");
        String pass = System.getenv().getOrDefault("DB_PASSWORD", "");
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("Altering 'staff' table 'role' column type...");
            try (Statement stmt = conn.createStatement()) {
                stmt.executeUpdate("ALTER TABLE staff MODIFY role VARCHAR(50)");
                System.out.println("Modified 'role' column to VARCHAR(50) successfully.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

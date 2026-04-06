package com.servesmart;
import java.sql.*;

public class GetHotelInfo {
    public static void main(String[] args) {
        String url = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/servesmart_db");
        String user = System.getenv().getOrDefault("DB_USER", "");
        String pass = System.getenv().getOrDefault("DB_PASSWORD", "");
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
             try (Statement stmt = conn.createStatement()) {
                ResultSet rs = stmt.executeQuery("SELECT s.username, s.password, s.role FROM staff s WHERE s.restaurant_id = 54");
                boolean found = false;
                while (rs.next()) {
                    found = true;
                    System.out.println("Role: " + rs.getString("role") + ", Username: " + rs.getString("username") + ", Password: " + rs.getString("password"));
                }
                if (!found) {
                    System.out.println("No staff found for Hotel ID 54");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

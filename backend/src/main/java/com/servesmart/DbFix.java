package com.servesmart;
import java.sql.*;

public class DbFix {
    public static void main(String[] args) {
        String url = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/servesmart_db");
        String user = System.getenv().getOrDefault("DB_USER", "");
        String pass = System.getenv().getOrDefault("DB_PASSWORD", "");
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("Updating Table 1 to belong to Restaurant 1...");
            try (Statement stmt = conn.createStatement()) {
                ResultSet rs = stmt.executeQuery("SELECT * FROM restaurant_tables WHERE table_number = 1");
                if (rs.next()) {
                    System.out.println("Found table 1. ID: " + rs.getLong("id") + ", Restaurant ID: " + rs.getObject("restaurant_id"));
                    stmt.executeUpdate("UPDATE restaurant_tables SET restaurant_id = 1, qr_code_url = 'http://localhost:5173/login?hotelId=1&tableId=1' WHERE table_number = 1");
                    System.out.println("Updated successfully.");
                } else {
                    System.out.println("Table 1 not found. Inserting new Table 1 for Restaurant 1...");
                    stmt.executeUpdate("INSERT INTO restaurant_tables (table_number, restaurant_id, status, qr_generated, qr_code_url) VALUES (1, 1, 'AVAILABLE', 0, 'http://localhost:5173/login?hotelId=1&tableId=1')");
                    System.out.println("Inserted successfully.");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

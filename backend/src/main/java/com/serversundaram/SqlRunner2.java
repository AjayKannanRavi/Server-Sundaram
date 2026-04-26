package com.serversundaram;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class SqlRunner2 {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/servesmart_db?allowPublicKeyRetrieval=true&useSSL=false";
        String user = "root";
        String pass = "Ajay@111";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery(
                "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA = 'servesmart_db' " +
                "AND (COLUMN_NAME = 'tenant_id' OR COLUMN_NAME = 'restaurant_id' OR COLUMN_NAME = 'hotel_id')"
            );
            while (rs.next()) {
                System.out.println("Col: " + rs.getString("TABLE_NAME") + "." + rs.getString("COLUMN_NAME"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

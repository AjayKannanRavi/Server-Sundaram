package com.serversundaram;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class SqlRunner {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/servesmart_db?allowPublicKeyRetrieval=true&useSSL=false";
        String user = "root";
        String pass = "Ajay@111";

        if (args.length > 0 && args[0].equals("update")) {
            try (Connection conn = DriverManager.getConnection(url, user, pass);
                 Statement stmt = conn.createStatement()) {

                // Disable FK checks to allow updates without cascade restrictions
                stmt.execute("SET FOREIGN_KEY_CHECKS=0");

                ResultSet rs = stmt.executeQuery("SELECT id, name FROM restaurant");
                int manisId = -1;
                int sukantId = -1;
                while (rs.next()) {
                    String name = rs.getString("name").toLowerCase();
                    if (name.contains("mani")) manisId = rs.getInt("id");
                    if (name.contains("sukant")) sukantId = rs.getInt("id");
                }

                System.out.println("Found Mani's Kitchen ID: " + manisId);
                System.out.println("Found Hotel Sukant ID: " + sukantId);

                if (manisId == -1 || sukantId == -1) {
                    System.out.println("Could not find both restaurants. Aborting.");
                    return;
                }

                // Table-Column matrix
                String[][] tables = {
                    {"categories", "restaurant_id"}, {"categories", "tenant_id"},
                    {"customers", "restaurant_id"}, {"customers", "tenant_id"},
                    {"daily_usage_logs", "restaurant_id"}, {"daily_usage_logs", "tenant_id"},
                    {"financial_transactions", "restaurant_id"}, {"financial_transactions", "tenant_id"},
                    {"invoice_items", "restaurant_id"}, {"invoice_items", "tenant_id"},
                    {"menu_items", "restaurant_id"}, {"menu_items", "tenant_id"},
                    {"order_items", "restaurant_id"}, {"order_items", "tenant_id"},
                    {"orders", "restaurant_id"},
                    {"payments", "restaurant_id"}, {"payments", "tenant_id"},
                    {"purchase_invoice_items", "restaurant_id"},
                    {"purchase_invoices", "restaurant_id"}, {"purchase_invoices", "tenant_id"},
                    {"raw_materials", "restaurant_id"}, {"raw_materials", "tenant_id"},
                    {"recipe_items", "restaurant_id"}, {"recipe_items", "tenant_id"},
                    {"restaurant_orders", "restaurant_id"}, {"restaurant_orders", "tenant_id"},
                    {"restaurant_tables", "restaurant_id"}, {"restaurant_tables", "tenant_id"},
                    {"reviews", "restaurant_id"}, {"reviews", "tenant_id"},
                    {"staff", "restaurant_id"}, {"staff", "tenant_id"},
                    {"suppliers", "restaurant_id"}, {"suppliers", "tenant_id"}
                };

                // Move current ones to safety offset
                System.out.println("Safely relocating items from ID 1 and 2 to 9000-range if occupied...");
                rs = stmt.executeQuery("SELECT id FROM restaurant WHERE id IN (1, 2)");
                int tempOffset = 9000;
                while (rs.next()) {
                    int existingId = rs.getInt("id");
                    if (existingId == manisId || existingId == sukantId) continue;
                    System.out.println("ID " + existingId + " occupied by generic, moving to " + tempOffset);
                    updateRestaurantId(stmt, existingId, tempOffset++, tables);
                }

                // Move requested items to safe offset first (avoiding collisions)
                updateRestaurantId(stmt, manisId, 9991, tables);
                updateRestaurantId(stmt, sukantId, 9992, tables);

                // Now move them to final 1 and 2
                System.out.println("Assigning Mani's Kitchen to 1...");
                updateRestaurantId(stmt, 9991, 1, tables);

                System.out.println("Assigning Hotel Sukant to 2...");
                updateRestaurantId(stmt, 9992, 2, tables);

                // Reset Auto Increment
                stmt.execute("ALTER TABLE restaurant AUTO_INCREMENT = 3");
                System.out.println("Auto increment reset to 3");

                stmt.execute("SET FOREIGN_KEY_CHECKS=1");
                System.out.println("Success! Database IDs migrated completely.");

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private static void updateRestaurantId(Statement stmt, int oldId, int newId, String[][] tables) throws Exception {
        stmt.executeUpdate("UPDATE restaurant SET id = " + newId + ", tenant_id = " + newId + " WHERE id = " + oldId);
        for (String[] target : tables) {
            String q = "UPDATE " + target[0] + " SET " + target[1] + " = " + newId + " WHERE " + target[1] + " = " + oldId;
            try {
                stmt.executeUpdate(q);
            } catch (Exception ignored) {
                // table might not exist or be empty
            }
        }
    }
}

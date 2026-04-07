import java.sql.*;

public class CheckTables {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/ss_hotel_9?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        String user = "root";
        String pass = "Ajay@111";

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("Checking tables for hotel 9...");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM restaurant_tables WHERE table_number = 1")) {
                if (rs.next()) {
                    System.out.println("Table 1 exists. ID: " + rs.getLong("id") + ", Status: " + rs.getString("status"));
                } else {
                    System.out.println("Table 1 DOES NOT exist for hotel 9.");
                }
            }

            System.out.println("\nAll tables in ss_hotel_9:");
            DatabaseMetaData meta = conn.getMetaData();
            try (ResultSet rs = meta.getTables(null, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    System.out.println("- " + rs.getString("TABLE_NAME"));
                }
            }
            
            System.out.println("\nChecking menu items for hotel 9...");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, name FROM menu_items")) {
                while (rs.next()) {
                    System.out.println("- Item ID: " + rs.getLong("id") + ", Name: " + rs.getString("name"));
                }
            }

        } catch (Exception e) {
            System.err.println("Database check failed: " + e.getMessage());
        }
    }
}

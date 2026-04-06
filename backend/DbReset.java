import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbReset {
    public static void main(String[] args) {
        String baseUrl = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/servesmart_db");
        String url = baseUrl.contains("?") ? baseUrl + "&allowMultiQueries=true" : baseUrl + "?allowMultiQueries=true";
        String user = System.getenv().getOrDefault("DB_USER", "");
        String pass = System.getenv().getOrDefault("DB_PASSWORD", "");
        
        String[] tables = {
            "order_items", "restaurant_orders", "payments", "reviews", "customers",
            "daily_usage_logs", "raw_materials", "menu_items", "categories",
            "staff", "restaurant_tables", "restaurant"
        };

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("Starting Database Reset...");
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
                for (String table : tables) {
                    System.out.println("Truncating table: " + table);
                    stmt.execute("TRUNCATE TABLE " + table);
                }
                stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
                System.out.println("Database Reset Successful.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

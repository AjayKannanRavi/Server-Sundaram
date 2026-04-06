import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbQuery {
    public static void main(String[] args) {
        String url = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/servesmart_db");
        String user = System.getenv().getOrDefault("DB_USER", "");
        String pass = System.getenv().getOrDefault("DB_PASSWORD", "");
        
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("Checking Restaurant ID 1...");
            try (Statement stmt = conn.createStatement()) {
                ResultSet rs = stmt.executeQuery("SELECT * FROM restaurant WHERE id=1");
                if (rs.next()) {
                    System.out.println("Hotel Found: " + rs.getString("name"));
                } else {
                    System.out.println("Hotel ID 1 NOT FOUND!");
                }

                System.out.println("\nChecking Tables for Hotel 1...");
                rs = stmt.executeQuery("SELECT * FROM restaurant_tables WHERE restaurant_id=1");
                while (rs.next()) {
                    System.out.println("Table No: " + rs.getInt("table_number") + ", Status: " + rs.getString("status"));
                }

                System.out.println("\nChecking Menu for Hotel 1...");
                rs = stmt.executeQuery("SELECT * FROM menu_items WHERE restaurant_id=1");
                int count = 0;
                while (rs.next() && count < 5) {
                    System.out.println("Item: " + rs.getString("name") + ", Price: " + rs.getDouble("price"));
                    count++;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) {
        String url = System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/servesmart_db");
        String user = System.getenv().getOrDefault("DB_USER", "");
        String pass = System.getenv().getOrDefault("DB_PASSWORD", "");
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("Tables in restaurant_tables:");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM restaurant_tables")) {
                ResultSetMetaData md = rs.getMetaData();
                int cols = md.getColumnCount();
                while (rs.next()) {
                    for (int i = 1; i <= cols; i++) {
                        System.out.print(md.getColumnName(i) + ": " + rs.getObject(i) + " | ");
                    }
                    System.out.println();
                }
            }
            System.out.println("\nStaff for Hotel 14:");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, username, role, hotel_id FROM staff WHERE hotel_id = 14")) {
                ResultSetMetaData md = rs.getMetaData();
                int cols = md.getColumnCount();
                while (rs.next()) {
                    for (int i = 1; i <= cols; i++) {
                        System.out.print(md.getColumnName(i) + ": " + rs.getObject(i) + " | ");
                    }
                    System.out.println();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

import java.sql.*;

public class VerifySeeding {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/ss_hotel_9?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        String user = "root";
        String pass = "Ajay@111";

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("Verifying Table Seeding for Hotel 9...");
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM restaurant_tables")) {
                if (rs.next()) {
                    int count = rs.getInt(1);
                    System.out.println("Found " + count + " tables in ss_hotel_9.");
                    if (count >= 10) {
                        System.out.println("SUCCESS: Tables 1-10 are seeded!");
                    } else {
                        System.out.println("FAILURE: Expected at least 10 tables, found " + count);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Verification failed: " + e.getMessage());
        }
    }
}

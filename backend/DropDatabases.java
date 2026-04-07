import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DropDatabases {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        String user = "root";
        String pass = "Ajay@111";
        
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Dropping ss_hotel_9...");
            stmt.executeUpdate("DROP DATABASE IF EXISTS ss_hotel_9");
            
            System.out.println("Dropping ss_hotel_12...");
            stmt.executeUpdate("DROP DATABASE IF EXISTS ss_hotel_12");
            
            System.out.println("Databases dropped successfully.");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

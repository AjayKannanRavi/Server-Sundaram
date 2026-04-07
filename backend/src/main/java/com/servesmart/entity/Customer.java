package com.servesmart.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"mobile_number", "restaurant_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "mobile_number", nullable = false)
    private String mobileNumber;

    @Column(name = "visit_count")
    private Integer visitCount = 0;

    @Column(name = "last_visited_date")
    private LocalDateTime lastVisitedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(name = "last_table_used")
    private String lastTableUsed;

    @Column(name = "current_otp")
    private String currentOtp;

    @Column(name = "otp_generated_at")
    private LocalDateTime otpGeneratedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (visitCount == null) visitCount = 0;
    }
}

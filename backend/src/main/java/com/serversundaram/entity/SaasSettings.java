package com.serversundaram.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "saas_settings")
@Data
public class SaasSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "platform_name")
    private String platformName = "Vitteno Technologies";

    @Column(name = "premium_monthly_price")
    private Double premiumMonthlyPrice = 49.99;

    @Column(name = "maintenance_mode")
    private Boolean maintenanceMode = false;

    @Column(name = "free_plan_limit")
    private Integer freePlanLimit = 10;
}

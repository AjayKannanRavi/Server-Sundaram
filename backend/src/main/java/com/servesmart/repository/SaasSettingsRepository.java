package com.servesmart.repository;

import com.servesmart.entity.SaasSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SaasSettingsRepository extends JpaRepository<SaasSettings, Long> {
}

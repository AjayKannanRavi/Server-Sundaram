package com.serversundaram.repository;

import com.serversundaram.entity.SaasSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SaasSettingsRepository extends JpaRepository<SaasSettings, Long> {
}

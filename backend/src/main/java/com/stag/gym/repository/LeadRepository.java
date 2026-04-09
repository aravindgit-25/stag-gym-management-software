package com.stag.gym.repository;

import com.stag.gym.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    
    List<Lead> findByStatus(Lead.LeadStatus status);
    
    List<Lead> findByNextFollowUpDate(LocalDate date);
    
    List<Lead> findByPhone(String phone);
}

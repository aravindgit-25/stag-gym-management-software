package com.stag.gym.repository;

import com.stag.gym.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    
    List<Lead> findByStatusAndBranchId(Lead.LeadStatus status, Long branchId);
    
    List<Lead> findByNextFollowUpDateAndBranchId(LocalDate date, Long branchId);
    
    List<Lead> findByPhoneAndBranchId(String phone, Long branchId);

    List<Lead> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);
}

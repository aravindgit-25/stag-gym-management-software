package com.stag.gym.repository;

import com.stag.gym.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findByTypeAndBranchId(Plan.PlanType type, Long branchId);
    List<Plan> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);
}

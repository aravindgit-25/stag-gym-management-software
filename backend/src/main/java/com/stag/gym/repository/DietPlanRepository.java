package com.stag.gym.repository;

import com.stag.gym.model.DietPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DietPlanRepository extends JpaRepository<DietPlan, Long> {
    Optional<DietPlan> findByMemberIdAndBranchId(Long memberId, Long branchId);
    List<DietPlan> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);
}

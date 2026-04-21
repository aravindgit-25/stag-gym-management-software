package com.stag.gym.repository;

import com.stag.gym.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByMemberIdAndBranchId(Long memberId, Long branchId);
    List<Subscription> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);

    boolean existsByPlanIdAndBranchId(Long planId, Long branchId);
    boolean existsByMemberIdAndBranchId(Long memberId, Long branchId);
}

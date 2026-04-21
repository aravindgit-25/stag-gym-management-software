package com.stag.gym.repository;

import com.stag.gym.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findBySubscriptionIdAndBranchId(Long subscriptionId, Long branchId);
    
    List<Payment> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.branch.id = :branchId")
    Double sumTotalRevenue(@Param("branchId") Long branchId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentDate = :today AND p.branch.id = :branchId")
    Double sumTodayRevenue(@Param("today") LocalDate today, @Param("branchId") Long branchId);
}

package com.stag.gym.repository;

import com.stag.gym.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findBySubscriptionId(Long subscriptionId);

    @Query("SELECT SUM(p.amount) FROM Payment p")
    Double sumTotalRevenue();

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentDate >= :startOfDay")
    Double sumTodayRevenue(@Param("startOfDay") LocalDateTime startOfDay);
}

package com.stag.gym.repository;

import com.stag.gym.model.PTSessionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PTSessionLogRepository extends JpaRepository<PTSessionLog, Long> {
    List<PTSessionLog> findByPtSubscriptionId(Long ptSubscriptionId);
    List<PTSessionLog> findByBranchId(Long branchId);
}

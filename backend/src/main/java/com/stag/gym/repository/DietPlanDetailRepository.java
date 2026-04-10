package com.stag.gym.repository;

import com.stag.gym.model.DietPlanDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DietPlanDetailRepository extends JpaRepository<DietPlanDetail, Long> {
}

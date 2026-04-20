package com.stag.gym.repository;

import com.stag.gym.model.EmployeeFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeFeedbackRepository extends JpaRepository<EmployeeFeedback, Long> {
    List<EmployeeFeedback> findByEmployeeId(Long employeeId);
}

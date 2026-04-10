package com.stag.gym.repository;

import com.stag.gym.model.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {
    Optional<Salary> findByEmployeeIdAndMonthYear(Long employeeId, String monthYear);
    List<Salary> findByEmployeeId(Long employeeId);
    List<Salary> findByMonthYear(String monthYear);
}

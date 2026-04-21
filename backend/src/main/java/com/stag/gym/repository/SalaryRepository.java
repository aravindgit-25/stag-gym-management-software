package com.stag.gym.repository;

import com.stag.gym.model.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {
    Optional<Salary> findByEmployeeIdAndMonthYearAndBranchId(Long employeeId, String monthYear, Long branchId);
    List<Salary> findByEmployeeIdAndBranchId(Long employeeId, Long branchId);
    List<Salary> findByMonthYearAndBranchId(String monthYear, Long branchId);
    List<Salary> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);
}

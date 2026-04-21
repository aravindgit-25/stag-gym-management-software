package com.stag.gym.repository;

import com.stag.gym.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    @Query("SELECT e.employeeId FROM Employee e WHERE e.branch.id = :branchId ORDER BY e.id DESC LIMIT 1")
    Optional<String> findLastEmployeeId(@Param("branchId") Long branchId);

    List<Employee> findByStatusAndBranchId(Employee.Status status, Long branchId);
    
    List<Employee> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);

    Optional<Employee> findByEmployeeIdAndBranchId(String employeeId, Long branchId);

    List<Employee> findByRoleAndBranchId(Employee.Role role, Long branchId);
}

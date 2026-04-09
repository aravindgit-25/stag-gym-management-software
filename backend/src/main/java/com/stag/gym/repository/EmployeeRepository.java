package com.stag.gym.repository;

import com.stag.gym.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    @Query("SELECT e.employeeId FROM Employee e ORDER BY e.id DESC LIMIT 1")
    Optional<String> findLastEmployeeId();

    List<Employee> findByStatus(Employee.Status status);

    Optional<Employee> findByEmployeeId(String employeeId);

    List<Employee> findByRole(Employee.Role role);
}

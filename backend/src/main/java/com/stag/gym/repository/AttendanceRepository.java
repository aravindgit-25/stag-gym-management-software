package com.stag.gym.repository;

import com.stag.gym.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByEmployeeIdAndBranchId(Long employeeId, Long branchId);

    List<Attendance> findByDateAndBranchId(LocalDate date, Long branchId);

    Optional<Attendance> findByEmployeeIdAndDateAndBranchId(Long employeeId, LocalDate date, Long branchId);

    List<Attendance> findByEmployeeIdAndDateBetweenAndBranchId(Long employeeId, LocalDate startDate, LocalDate endDate, Long branchId);
    
    List<Attendance> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);
}

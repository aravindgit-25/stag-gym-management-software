package com.stag.gym.service;

import com.stag.gym.dto.AttendanceResponseDTO;
import com.stag.gym.model.Attendance;
import com.stag.gym.model.Employee;
import com.stag.gym.repository.AttendanceRepository;
import com.stag.gym.repository.EmployeeRepository;
import com.stag.gym.security.BranchContext;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchService branchService;

    @Transactional
    public Attendance markAttendance(String employeeId, Attendance.AttendanceStatus status, String notes) {
        Employee employee = employeeRepository.findByEmployeeIdAndBranchId(employeeId, BranchContext.getCurrentBranchId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId + " in current branch"));

        if (employee.getStatus() == Employee.Status.TERMINATED) {
            throw new RuntimeException("Cannot mark attendance for terminated employee");
        }

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDateAndBranchId(employee.getId(), LocalDate.now(), BranchContext.getCurrentBranchId())
                .orElse(Attendance.builder()
                        .employee(employee)
                        .date(LocalDate.now())
                        .branch(branchService.getCurrentBranch())
                        .build());

        attendance.setStatus(status);
        attendance.setNotes(notes);
        if (status == Attendance.AttendanceStatus.PRESENT || status == Attendance.AttendanceStatus.LATE) {
            if (attendance.getCheckInTime() == null) {
                attendance.setCheckInTime(LocalTime.now());
            }
        }

        return attendanceRepository.save(attendance);
    }

    @Transactional
    public Attendance markCheckOut(String employeeId) {
        Employee employee = employeeRepository.findByEmployeeIdAndBranchId(employeeId, BranchContext.getCurrentBranchId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId + " in current branch"));

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDateAndBranchId(employee.getId(), LocalDate.now(), BranchContext.getCurrentBranchId())
                .orElseThrow(() -> new RuntimeException("No attendance record found for today. Mark check-in first."));

        attendance.setCheckOutTime(LocalTime.now());
        return attendanceRepository.save(attendance);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponseDTO> getEmployeeAttendance(Long employeeId, LocalDate start, LocalDate end) {
        return attendanceRepository.findByEmployeeIdAndDateBetweenAndBranchId(employeeId, start, end, BranchContext.getCurrentBranchId()).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponseDTO> getDailyAttendance(LocalDate date) {
        return attendanceRepository.findByDateAndBranchId(date, BranchContext.getCurrentBranchId()).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponseDTO> getMonthlyAttendance(Long employeeId, Integer month, Integer year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        
        if (employeeId != null) {
            return attendanceRepository.findByEmployeeIdAndDateBetweenAndBranchId(employeeId, start, end, BranchContext.getCurrentBranchId()).stream()
                    .map(this::mapToResponseDTO)
                    .toList();
        } else {
            return attendanceRepository.findByDateBetweenAndBranchId(start, end, BranchContext.getCurrentBranchId()).stream()
                    .map(this::mapToResponseDTO)
                    .toList();
        }
    }

    public AttendanceResponseDTO mapToResponseDTO(Attendance attendance) {
        return AttendanceResponseDTO.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeName(attendance.getEmployee().getName())
                .employeeCode(attendance.getEmployee().getEmployeeId())
                .date(attendance.getDate())
                .checkInTime(attendance.getCheckInTime())
                .checkOutTime(attendance.getCheckOutTime())
                .status(attendance.getStatus())
                .notes(attendance.getNotes())
                .build();
    }
}

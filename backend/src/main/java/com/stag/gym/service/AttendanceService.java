package com.stag.gym.service;

import com.stag.gym.dto.AttendanceResponseDTO;
import com.stag.gym.model.Attendance;
import com.stag.gym.model.Employee;
import com.stag.gym.repository.AttendanceRepository;
import com.stag.gym.repository.EmployeeRepository;
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

    @Transactional
    public Attendance markAttendance(String employeeId, Attendance.AttendanceStatus status, String notes) {
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        if (employee.getStatus() == Employee.Status.TERMINATED) {
            throw new RuntimeException("Cannot mark attendance for terminated employee");
        }

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), LocalDate.now())
                .orElse(Attendance.builder()
                        .employee(employee)
                        .date(LocalDate.now())
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
        Employee employee = employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), LocalDate.now())
                .orElseThrow(() -> new RuntimeException("No attendance record found for today. Mark check-in first."));

        attendance.setCheckOutTime(LocalTime.now());
        return attendanceRepository.save(attendance);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponseDTO> getEmployeeAttendance(Long employeeId, LocalDate start, LocalDate end) {
        return attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, start, end).stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponseDTO> getDailyAttendance(LocalDate date) {
        return attendanceRepository.findByDate(date).stream()
                .map(this::mapToResponseDTO)
                .toList();
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

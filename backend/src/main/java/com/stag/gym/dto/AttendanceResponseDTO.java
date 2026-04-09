package com.stag.gym.dto;

import com.stag.gym.model.Attendance;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponseDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCode; // The SG-EMP-001 ID
    private LocalDate date;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private Attendance.AttendanceStatus status;
    private String notes;
}

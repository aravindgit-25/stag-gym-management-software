package com.stag.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryDTO {
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String monthYear;
    private Integer daysPresent;
    private Integer daysAbsent;
    private Integer daysLate;
    private Integer totalDaysInMonth;
}

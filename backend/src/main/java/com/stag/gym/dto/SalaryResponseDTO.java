package com.stag.gym.dto;

import com.stag.gym.model.Salary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryResponseDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String monthYear;
    private Double baseSalary;
    private Integer daysPresent;
    private Integer daysAbsent;
    private Integer daysLate;
    private Double deductions;
    private Double bonus;
    private Double netSalary;
    private Salary.SalaryStatus status;
    private LocalDate paidDate;
    private String paymentMethod;
}

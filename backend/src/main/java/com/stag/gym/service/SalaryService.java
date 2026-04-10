package com.stag.gym.service;

import com.stag.gym.dto.AttendanceSummaryDTO;
import com.stag.gym.dto.SalaryPaymentRequestDTO;
import com.stag.gym.dto.SalaryResponseDTO;
import com.stag.gym.model.Attendance;
import com.stag.gym.model.Employee;
import com.stag.gym.model.Salary;
import com.stag.gym.repository.AttendanceRepository;
import com.stag.gym.repository.EmployeeRepository;
import com.stag.gym.repository.SalaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalaryService {

    private final SalaryRepository salaryRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public AttendanceSummaryDTO getMonthlyAttendanceSummary(Long employeeId, int month, int year) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        List<Attendance> attendances = attendanceRepository.findByEmployeeIdAndDateBetween(employeeId, start, end);

        int present = (int) attendances.stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT)
                .count();
        int late = (int) attendances.stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.LATE)
                .count();
        int absent = (int) attendances.stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.ABSENT)
                .count();

        return AttendanceSummaryDTO.builder()
                .employeeId(employeeId)
                .employeeName(employee.getName())
                .employeeCode(employee.getEmployeeId())
                .monthYear(String.format("%02d-%d", month, year))
                .daysPresent(present)
                .daysLate(late)
                .daysAbsent(absent)
                .totalDaysInMonth(start.lengthOfMonth())
                .build();
    }

    @Transactional
    public SalaryResponseDTO calculateAndGenerateSalary(Long employeeId, int month, int year) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        AttendanceSummaryDTO summary = getMonthlyAttendanceSummary(employeeId, month, year);

        double baseSalary = employee.getBaseSalary() != null ? employee.getBaseSalary() : 0.0;
        int daysInMonth = summary.getTotalDaysInMonth();
        int absentDays = summary.getDaysAbsent();

        double deductions = (baseSalary / daysInMonth) * absentDays;
        double netSalary = baseSalary - deductions;

        String monthYear = String.format("%02d-%d", month, year);

        Salary salary = salaryRepository.findByEmployeeIdAndMonthYear(employeeId, monthYear)
                .orElse(Salary.builder()
                        .employee(employee)
                        .monthYear(monthYear)
                        .build());

        salary.setBaseSalary(baseSalary);
        salary.setDaysPresent(summary.getDaysPresent());
        salary.setDaysAbsent(summary.getDaysAbsent());
        salary.setDaysLate(summary.getDaysLate());
        salary.setDeductions(deductions);
        salary.setBonus(0.0);
        salary.setNetSalary(netSalary);
        salary.setStatus(Salary.SalaryStatus.PENDING);

        return mapToResponseDTO(salaryRepository.save(salary));
    }

    @Transactional
    public SalaryResponseDTO markAsPaid(Long salaryId, SalaryPaymentRequestDTO request) {
        Salary salary = salaryRepository.findById(salaryId)
                .orElseThrow(() -> new RuntimeException("Salary record not found"));

        salary.setStatus(Salary.SalaryStatus.PAID);
        salary.setPaidDate(request.getPaidDate() != null ? request.getPaidDate() : LocalDate.now());
        salary.setPaymentMethod(request.getPaymentMethod());

        return mapToResponseDTO(salaryRepository.save(salary));
    }

    @Transactional(readOnly = true)
    public List<SalaryResponseDTO> getSalariesByMonth(String monthYear) {
        return salaryRepository.findByMonthYear(monthYear).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalaryResponseDTO> getEmployeeSalaries(Long employeeId) {
        return salaryRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public SalaryResponseDTO mapToResponseDTO(Salary salary) {
        return SalaryResponseDTO.builder()
                .id(salary.getId())
                .employeeId(salary.getEmployee().getId())
                .employeeName(salary.getEmployee().getName())
                .employeeCode(salary.getEmployee().getEmployeeId())
                .monthYear(salary.getMonthYear())
                .baseSalary(salary.getBaseSalary())
                .daysPresent(salary.getDaysPresent())
                .daysAbsent(salary.getDaysAbsent())
                .daysLate(salary.getDaysLate())
                .deductions(salary.getDeductions())
                .bonus(salary.getBonus())
                .netSalary(salary.getNetSalary())
                .status(salary.getStatus())
                .paidDate(salary.getPaidDate())
                .paymentMethod(salary.getPaymentMethod())
                .build();
    }
}

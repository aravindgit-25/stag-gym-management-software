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
import com.stag.gym.security.BranchContext;

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
    private final BranchService branchService;

    @Transactional(readOnly = true)
    public AttendanceSummaryDTO getMonthlyAttendanceSummary(Long employeeId, int month, int year) {
        Employee employee = employeeRepository.findById(employeeId)
                .filter(e -> e.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Employee not found in current branch"));

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        List<Attendance> attendances = attendanceRepository.findByEmployeeIdAndDateBetweenAndBranchId(employeeId, start, end, BranchContext.getCurrentBranchId());

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
                .filter(e -> e.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Employee not found in current branch"));

        AttendanceSummaryDTO summary = getMonthlyAttendanceSummary(employeeId, month, year);

        double baseSalary = employee.getBaseSalary() != null ? employee.getBaseSalary() : 0.0;
        int daysInMonth = summary.getTotalDaysInMonth();
        int absentDays = summary.getDaysAbsent();

        double deductions = (baseSalary / daysInMonth) * absentDays;
        double tillNowSalary = (baseSalary / daysInMonth) * summary.getDaysPresent();
        double netSalary = baseSalary - deductions;

        String monthYear = String.format("%02d-%d", month, year);

        Salary salary = salaryRepository.findByEmployeeIdAndMonthYearAndBranchId(employeeId, monthYear, BranchContext.getCurrentBranchId())
                .orElse(Salary.builder()
                        .employee(employee)
                        .monthYear(monthYear)
                        .branch(branchService.getCurrentBranch())
                        .build());

        salary.setBaseSalary(baseSalary);
        salary.setDaysPresent(summary.getDaysPresent());
        salary.setDaysAbsent(summary.getDaysAbsent());
        salary.setDaysLate(summary.getDaysLate());
        salary.setDeductions(deductions);
        salary.setBonus(0.0);
        salary.setTillNowSalary(tillNowSalary);
        salary.setNetSalary(netSalary);
        salary.setStatus(Salary.SalaryStatus.PENDING);

        return mapToResponseDTO(salaryRepository.save(salary));
    }

    @Transactional
    public SalaryResponseDTO markAsPaid(Long salaryId, SalaryPaymentRequestDTO request) {
        Salary salary = salaryRepository.findById(salaryId)
                .filter(s -> s.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Salary record not found in current branch"));

        salary.setStatus(Salary.SalaryStatus.PAID);
        salary.setPaidDate(request.getPaidDate() != null ? request.getPaidDate() : LocalDate.now());
        salary.setPaymentMethod(request.getPaymentMethod());

        return mapToResponseDTO(salaryRepository.save(salary));
    }

    @Transactional(readOnly = true)
    public List<SalaryResponseDTO> getSalariesByMonth(String monthYear) {
        return salaryRepository.findByMonthYearAndBranchId(monthYear, BranchContext.getCurrentBranchId()).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalaryResponseDTO> getEmployeeSalaries(Long employeeId) {
        return salaryRepository.findByEmployeeIdAndBranchId(employeeId, BranchContext.getCurrentBranchId()).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public SalaryResponseDTO mapToResponseDTO(Salary salary) {
        String[] parts = salary.getMonthYear().split("-");
        int month = Integer.parseInt(parts[0]);
        int year = Integer.parseInt(parts[1]);
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<LocalDate> absentDates = attendanceRepository.findByEmployeeIdAndDateBetweenAndBranchId(
                salary.getEmployee().getId(), start, end, BranchContext.getCurrentBranchId()).stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.ABSENT)
                .map(Attendance::getDate)
                .collect(Collectors.toList());

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
                .tillNowSalary(salary.getTillNowSalary())
                .netSalary(salary.getNetSalary())
                .absentDates(absentDates)
                .status(salary.getStatus())
                .paidDate(salary.getPaidDate())
                .paymentMethod(salary.getPaymentMethod())
                .build();
    }
}

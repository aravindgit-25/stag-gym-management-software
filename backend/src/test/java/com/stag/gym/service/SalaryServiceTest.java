package com.stag.gym.service;

import com.stag.gym.dto.AttendanceSummaryDTO;
import com.stag.gym.dto.SalaryPaymentRequestDTO;
import com.stag.gym.dto.SalaryResponseDTO;
import com.stag.gym.model.Attendance;
import com.stag.gym.model.Branch;
import com.stag.gym.model.Employee;
import com.stag.gym.model.Salary;
import com.stag.gym.repository.AttendanceRepository;
import com.stag.gym.repository.EmployeeRepository;
import com.stag.gym.repository.SalaryRepository;
import com.stag.gym.security.BranchContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SalaryServiceTest {

    @Mock
    private SalaryRepository salaryRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private BranchService branchService;

    @InjectMocks
    private SalaryService salaryService;

    private Employee employee;
    private Long employeeId = 1L;
    private Long branchId = 1L;

    @BeforeEach
    void setUp() {
        BranchContext.setCurrentBranchId(branchId);
        Branch branch = Branch.builder().id(branchId).branchName("Main Branch").build();
        employee = Employee.builder()
                .id(employeeId)
                .name("John Doe")
                .employeeId("SG-EMP-001")
                .baseSalary(30000.0)
                .branch(branch)
                .build();
    }

    @Test
    void testGetMonthlyAttendanceSummary() {
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(attendanceRepository.findByEmployeeIdAndDateBetweenAndBranchId(anyLong(), any(), any(), anyLong()))
                .thenReturn(Collections.singletonList(Attendance.builder()
                        .employee(employee)
                        .date(LocalDate.of(2024, 4, 1))
                        .status(Attendance.AttendanceStatus.ABSENT)
                        .build()));

        AttendanceSummaryDTO summary = salaryService.getMonthlyAttendanceSummary(employeeId, 4, 2024);

        assertEquals(1, summary.getDaysAbsent());
        assertEquals(0, summary.getDaysPresent());
        assertEquals(30, summary.getTotalDaysInMonth());
    }

    @Test
    void testCalculateAndGenerateSalary() {
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(attendanceRepository.findByEmployeeIdAndDateBetweenAndBranchId(anyLong(), any(), any(), anyLong()))
                .thenReturn(java.util.Arrays.asList(
                        Attendance.builder()
                                .employee(employee)
                                .date(LocalDate.of(2024, 4, 1))
                                .status(Attendance.AttendanceStatus.ABSENT)
                                .build(),
                        Attendance.builder()
                                .employee(employee)
                                .date(LocalDate.of(2024, 4, 2))
                                .status(Attendance.AttendanceStatus.PRESENT)
                                .build()
                ));

        when(salaryRepository.findByEmployeeIdAndMonthYearAndBranchId(anyLong(), anyString(), anyLong())).thenReturn(Optional.empty());
        when(salaryRepository.save(any(Salary.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SalaryResponseDTO response = salaryService.calculateAndGenerateSalary(employeeId, 4, 2024);

        // baseSalary = 30000, daysInMonth = 30, absentDays = 1, presentDays = 1
        // deductions = (30000 / 30) * 1 = 1000
        // tillNowSalary = (30000 / 30) * 1 = 1000
        // netSalary = 30000 - 1000 = 29000
        assertEquals(30000.0, response.getBaseSalary());
        assertEquals(1000.0, response.getDeductions());
        assertEquals(1000.0, response.getTillNowSalary());
        assertEquals(29000.0, response.getNetSalary());
        assertEquals(Salary.SalaryStatus.PENDING, response.getStatus());
        assertNotNull(response.getAbsentDates());
        assertEquals(1, response.getAbsentDates().size());
    }

    @Test
    void testMarkAsPaid() {
        Salary salary = Salary.builder()
                .id(1L)
                .employee(employee)
                .branch(employee.getBranch())
                .monthYear("04-2024")
                .status(Salary.SalaryStatus.PENDING)
                .build();

        when(salaryRepository.findById(1L)).thenReturn(Optional.of(salary));
        when(salaryRepository.save(any(Salary.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SalaryPaymentRequestDTO request = SalaryPaymentRequestDTO.builder()
                .paidDate(LocalDate.now())
                .paymentMethod("UPI")
                .build();

        SalaryResponseDTO response = salaryService.markAsPaid(1L, request);

        assertEquals(Salary.SalaryStatus.PAID, response.getStatus());
        assertEquals("UPI", response.getPaymentMethod());
        assertNotNull(response.getPaidDate());
    }
}

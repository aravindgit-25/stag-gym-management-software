package com.stag.gym.controller;

import com.stag.gym.dto.AttendanceSummaryDTO;
import com.stag.gym.dto.SalaryPaymentRequestDTO;
import com.stag.gym.dto.SalaryResponseDTO;
import com.stag.gym.service.SalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/salary")
@RequiredArgsConstructor
public class SalaryController {

    private final SalaryService salaryService;

    @GetMapping("/attendance-summary/{employeeId}")
    public ResponseEntity<AttendanceSummaryDTO> getAttendanceSummary(
            @PathVariable Long employeeId,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(salaryService.getMonthlyAttendanceSummary(employeeId, month, year));
    }

    @PostMapping("/calculate/{employeeId}")
    public ResponseEntity<SalaryResponseDTO> calculateSalary(
            @PathVariable Long employeeId,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(salaryService.calculateAndGenerateSalary(employeeId, month, year));
    }

    @PutMapping("/{salaryId}/pay")
    public ResponseEntity<SalaryResponseDTO> markAsPaid(
            @PathVariable Long salaryId,
            @RequestBody SalaryPaymentRequestDTO request) {
        return ResponseEntity.ok(salaryService.markAsPaid(salaryId, request));
    }

    @GetMapping("/month/{monthYear}")
    public ResponseEntity<List<SalaryResponseDTO>> getSalariesByMonth(@PathVariable String monthYear) {
        return ResponseEntity.ok(salaryService.getSalariesByMonth(monthYear));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<SalaryResponseDTO>> getEmployeeSalaries(@PathVariable Long employeeId) {
        return ResponseEntity.ok(salaryService.getEmployeeSalaries(employeeId));
    }
}

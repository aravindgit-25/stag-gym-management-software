package com.stag.gym.controller;

import com.stag.gym.model.Attendance;
import com.stag.gym.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/{employeeId}/mark")
    public ResponseEntity<Attendance> markAttendance(
            @PathVariable Long employeeId,
            @RequestParam Attendance.AttendanceStatus status,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(attendanceService.markAttendance(employeeId, status, notes));
    }

    @PostMapping("/{employeeId}/checkout")
    public ResponseEntity<Attendance> markCheckOut(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.markCheckOut(employeeId));
    }

    @GetMapping("/daily")
    public ResponseEntity<List<Attendance>> getDailyAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getDailyAttendance(date));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Attendance>> getEmployeeAttendance(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(attendanceService.getEmployeeAttendance(employeeId, start, end));
    }
}

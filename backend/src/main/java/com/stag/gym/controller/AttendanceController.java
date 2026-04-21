package com.stag.gym.controller;

import com.stag.gym.dto.AttendanceResponseDTO;
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

    @PostMapping
    public ResponseEntity<AttendanceResponseDTO> saveAttendance(@RequestBody java.util.Map<String, Object> payload) {
        String employeeCode = (String) payload.get("employeeCode");
        String statusStr = (String) payload.get("status");
        String notes = (String) payload.get("notes");
        
        Attendance.AttendanceStatus status = Attendance.AttendanceStatus.valueOf(statusStr);
        Attendance attendance = attendanceService.markAttendance(employeeCode, status, notes);
        return ResponseEntity.ok(attendanceService.mapToResponseDTO(attendance));
    }

    @PostMapping("/{employeeId}/mark")
    public ResponseEntity<AttendanceResponseDTO> markAttendance(
            @PathVariable String employeeId,
            @RequestParam Attendance.AttendanceStatus status,
            @RequestParam(required = false) String notes) {
        Attendance attendance = attendanceService.markAttendance(employeeId, status, notes);
        return ResponseEntity.ok(attendanceService.mapToResponseDTO(attendance));
    }

    @PostMapping("/{employeeId}/checkout")
    public ResponseEntity<AttendanceResponseDTO> markCheckOut(@PathVariable String employeeId) {
        Attendance attendance = attendanceService.markCheckOut(employeeId);
        return ResponseEntity.ok(attendanceService.mapToResponseDTO(attendance));
    }

    @GetMapping
    public ResponseEntity<List<AttendanceResponseDTO>> getAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate searchDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(attendanceService.getDailyAttendance(searchDate));
    }

    @GetMapping("/daily")
    public ResponseEntity<List<AttendanceResponseDTO>> getDailyAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getDailyAttendance(date));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AttendanceResponseDTO>> getEmployeeAttendance(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(attendanceService.getEmployeeAttendance(employeeId, start, end));
    }
}

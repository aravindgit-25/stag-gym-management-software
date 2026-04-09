package com.stag.gym.controller;

import com.stag.gym.dto.LeadRequestDTO;
import com.stag.gym.dto.LeadResponseDTO;
import com.stag.gym.model.Lead;
import com.stag.gym.model.Member;
import com.stag.gym.service.LeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    @PostMapping
    public ResponseEntity<LeadResponseDTO> createLead(@RequestBody LeadRequestDTO request) {
        return new ResponseEntity<>(leadService.createLead(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<LeadResponseDTO>> getAllLeads() {
        return ResponseEntity.ok(leadService.getAllLeads());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadResponseDTO> getLeadById(@PathVariable Long id) {
        return ResponseEntity.ok(leadService.getLeadById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeadResponseDTO> updateLead(@PathVariable Long id, @RequestBody LeadRequestDTO request) {
        return ResponseEntity.ok(leadService.updateLead(id, request));
    }

    @PostMapping("/{id}/follow-up")
    public ResponseEntity<LeadResponseDTO> addFollowUp(
            @PathVariable Long id,
            @RequestParam String notes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate nextFollowUpDate,
            @RequestParam(required = false) Lead.LeadStatus status) {
        return ResponseEntity.ok(leadService.addFollowUp(id, notes, nextFollowUpDate, status));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<Member> convertToMember(@PathVariable Long id) {
        return ResponseEntity.ok(leadService.convertToMember(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLead(@PathVariable Long id) {
        leadService.deleteLead(id);
        return ResponseEntity.noContent().build();
    }
}

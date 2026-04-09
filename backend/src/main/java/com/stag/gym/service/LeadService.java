package com.stag.gym.service;

import com.stag.gym.dto.LeadRequestDTO;
import com.stag.gym.dto.LeadResponseDTO;
import com.stag.gym.model.Lead;
import com.stag.gym.model.Member;
import com.stag.gym.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final MemberService memberService;

    @Transactional
    public LeadResponseDTO createLead(LeadRequestDTO request) {
        Lead lead = Lead.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .location(request.getLocation())
                .goal(request.getGoal())
                .planToJoinDate(request.getPlanToJoinDate())
                .status(request.getStatus() != null ? request.getStatus() : Lead.LeadStatus.NEW)
                .notes(request.getNotes())
                .nextFollowUpDate(request.getNextFollowUpDate())
                .build();

        Lead savedLead = leadRepository.save(lead);
        return mapToResponseDTO(savedLead);
    }

    @Transactional(readOnly = true)
    public List<LeadResponseDTO> getAllLeads() {
        return leadRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeadResponseDTO getLeadById(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
        return mapToResponseDTO(lead);
    }

    @Transactional
    public LeadResponseDTO updateLead(Long id, LeadRequestDTO request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));

        lead.setName(request.getName());
        lead.setPhone(request.getPhone());
        lead.setLocation(request.getLocation());
        lead.setGoal(request.getGoal());
        lead.setPlanToJoinDate(request.getPlanToJoinDate());
        if (request.getStatus() != null) {
            lead.setStatus(request.getStatus());
        }
        lead.setNotes(request.getNotes());
        lead.setNextFollowUpDate(request.getNextFollowUpDate());

        Lead updatedLead = leadRepository.save(lead);
        return mapToResponseDTO(updatedLead);
    }

    @Transactional
    public LeadResponseDTO addFollowUp(Long id, String notes, LocalDate nextFollowUpDate, Lead.LeadStatus status) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));

        String newNotes = lead.getNotes() != null ? lead.getNotes() + "\n---\n" : "";
        newNotes += LocalDate.now() + ": " + notes;
        
        lead.setNotes(newNotes);
        lead.setLastFollowUpDate(LocalDate.now());
        lead.setNextFollowUpDate(nextFollowUpDate);
        if (status != null) {
            lead.setStatus(status);
        } else {
            lead.setStatus(Lead.LeadStatus.FOLLOW_UP);
        }

        Lead updatedLead = leadRepository.save(lead);
        return mapToResponseDTO(updatedLead);
    }

    @Transactional
    public Member convertToMember(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));

        if (lead.getStatus() == Lead.LeadStatus.JOINED) {
            throw new RuntimeException("Lead has already joined.");
        }

        // Check if a member already exists with this phone number
        if (memberService.existsByPhone(lead.getPhone())) {
            throw new RuntimeException("A member with phone " + lead.getPhone() + " is already registered.");
        }

        // Create Member entity
        Member member = Member.builder()
                .name(lead.getName())
                .phone(lead.getPhone())
                .joinDate(LocalDate.now())
                .status(Member.Status.ACTIVE)
                .build();

        // Register as member
        Member savedMember = memberService.registerMember(member);

        // Update Lead status
        lead.setStatus(Lead.LeadStatus.JOINED);
        String history = lead.getNotes() != null ? lead.getNotes() + "\n---\n" : "";
        history += LocalDate.now() + ": Converted to Member. Registration ID: " + savedMember.getRegistrationId();
        lead.setNotes(history);
        lead.setNextFollowUpDate(null);
        leadRepository.save(lead);

        return savedMember;
    }

    @Transactional
    public void deleteLead(Long id) {
        leadRepository.deleteById(id);
    }

    private LeadResponseDTO mapToResponseDTO(Lead lead) {
        return LeadResponseDTO.builder()
                .id(lead.getId())
                .name(lead.getName())
                .phone(lead.getPhone())
                .location(lead.getLocation())
                .goal(lead.getGoal())
                .planToJoinDate(lead.getPlanToJoinDate())
                .status(lead.getStatus())
                .notes(lead.getNotes())
                .lastFollowUpDate(lead.getLastFollowUpDate())
                .nextFollowUpDate(lead.getNextFollowUpDate())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .build();
    }
}

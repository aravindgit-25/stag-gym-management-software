package com.stag.gym.service;

import com.stag.gym.dto.PTSubscriptionRequestDTO;
import com.stag.gym.dto.PTSubscriptionResponseDTO;
import com.stag.gym.dto.PTSessionLogRequestDTO;
import com.stag.gym.model.*;
import com.stag.gym.repository.*;
import com.stag.gym.security.BranchContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PersonalTrainerService {

    private final PersonalTrainerMemberRepository ptRepository;
    private final PTSessionLogRepository sessionLogRepository;
    private final MemberRepository memberRepository;
    private final EmployeeRepository employeeRepository;
    private final PlanRepository planRepository;
    private final BranchService branchService;

    @Transactional
    public PTSubscriptionResponseDTO createPTSubscription(PTSubscriptionRequestDTO request) {
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        Employee trainer = null;
        if (request.getTrainerId() != null) {
            trainer = employeeRepository.findById(request.getTrainerId())
                    .filter(e -> e.getRole() == Employee.Role.TRAINER)
                    .orElseThrow(() -> new RuntimeException("Trainer not found"));
        }

        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        // Calculate expiry date: Start date + Plan duration (days)
        LocalDate expiryDate = request.getStartDate().plusDays(plan.getDuration());

        PersonalTrainerMember ptMember = PersonalTrainerMember.builder()
                .member(member)
                .trainer(trainer)
                .plan(plan)
                .startDate(request.getStartDate())
                .expiryDate(expiryDate)
                .totalSessions(plan.getTotalSessions() != null ? plan.getTotalSessions() : 0)
                .sessionsRemaining(plan.getTotalSessions() != null ? plan.getTotalSessions() : 0)
                .goal(request.getGoal())
                .status(PersonalTrainerMember.Status.ACTIVE)
                .isPaid(false) // Payment will be handled via PaymentController
                .branch(branchService.getCurrentBranch())
                .build();

        PersonalTrainerMember saved = ptRepository.save(ptMember);
        return mapToResponseDTO(saved);
    }

    @Transactional
    public void logSession(PTSessionLogRequestDTO request) {
        PersonalTrainerMember ptSubscription = ptRepository.findById(request.getPtSubscriptionId())
                .filter(s -> s.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("PT Subscription not found"));

        if (ptSubscription.getStatus() != PersonalTrainerMember.Status.ACTIVE) {
            throw new RuntimeException("PT Subscription is not active");
        }

        if (ptSubscription.getSessionsRemaining() <= 0) {
            throw new RuntimeException("No sessions remaining in this plan");
        }

        if (ptSubscription.getExpiryDate().isBefore(LocalDate.now())) {
            ptSubscription.setStatus(PersonalTrainerMember.Status.EXPIRED);
            ptRepository.save(ptSubscription);
            throw new RuntimeException("PT Plan has expired");
        }

        PTSessionLog log = PTSessionLog.builder()
                .ptSubscription(ptSubscription)
                .sessionDate(request.getSessionDate())
                .trainerVerified(request.getTrainerVerified() != null ? request.getTrainerVerified() : false)
                .clientVerified(request.getClientVerified() != null ? request.getClientVerified() : false)
                .notes(request.getNotes())
                .branch(branchService.getCurrentBranch())
                .build();

        sessionLogRepository.save(log);

        // Update remaining sessions
        ptSubscription.setSessionsRemaining(ptSubscription.getSessionsRemaining() - 1);
        if (ptSubscription.getSessionsRemaining() == 0) {
            ptSubscription.setStatus(PersonalTrainerMember.Status.COMPLETED);
        }
        ptRepository.save(ptSubscription);

        // TODO: Send SMS/WhatsApp notification
        sendSessionNotification(ptSubscription, log);
    }

    private void sendSessionNotification(PersonalTrainerMember ptSubscription, PTSessionLog log) {
        // Mock notification logic
        String message = String.format("Hi %s, your PT session on %s has been recorded. Sessions remaining: %d.",
                ptSubscription.getMember().getName(), log.getSessionDate(), ptSubscription.getSessionsRemaining());
        System.out.println("Sending notification: " + message);
        // Implementation for WhatsApp/SMS would go here
    }

    public List<PTSubscriptionResponseDTO> getActivePTSubscriptions() {
        Long branchId = BranchContext.getCurrentBranchId();
        return ptRepository.findByStatusAndBranchId(PersonalTrainerMember.Status.ACTIVE, branchId)
                .stream()
                .filter(pt -> Boolean.TRUE.equals(pt.getIsPaid())) // Safely check for true, handles nulls
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PTSubscriptionResponseDTO> getAllPTSubscriptions() {
        Long branchId = BranchContext.getCurrentBranchId();
        return ptRepository.findByBranchId(branchId)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private PTSubscriptionResponseDTO mapToResponseDTO(PersonalTrainerMember model) {
        return PTSubscriptionResponseDTO.builder()
                .id(model.getId())
                .memberName(model.getMember().getName())
                .memberPhone(model.getMember().getPhone())
                .trainerName(model.getTrainer() != null ? model.getTrainer().getName() : "Not Assigned")
                .planName(model.getPlan() != null ? model.getPlan().getName() : "Custom Plan")
                .totalSessions(model.getTotalSessions())
                .sessionsRemaining(model.getSessionsRemaining())
                .startDate(model.getStartDate())
                .expiryDate(model.getExpiryDate())
                .status(model.getStatus())
                .isPaid(model.getIsPaid())
                .goal(model.getGoal())
                .build();
    }
}

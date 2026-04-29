package com.stag.gym.service;

import com.stag.gym.dto.SubscriptionRequestDTO;
import com.stag.gym.dto.SubscriptionResponseDTO;
import com.stag.gym.model.Member;
import com.stag.gym.model.Plan;
import com.stag.gym.model.Subscription;
import com.stag.gym.model.PersonalTrainerMember;
import com.stag.gym.model.Employee;
import com.stag.gym.repository.MemberRepository;
import com.stag.gym.repository.PlanRepository;
import com.stag.gym.repository.SubscriptionRepository;
import com.stag.gym.repository.PersonalTrainerMemberRepository;
import com.stag.gym.repository.EmployeeRepository;
import com.stag.gym.security.BranchContext;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final MemberRepository memberRepository;
    private final PlanRepository planRepository;
    private final PersonalTrainerMemberRepository ptRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchService branchService;

    @Transactional
    public SubscriptionResponseDTO createSubscription(SubscriptionRequestDTO requestDTO) {
        Member member = memberRepository.findById(requestDTO.getMemberId())
                .filter(m -> m.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Member not found in current branch"));
        
        Plan plan = planRepository.findById(requestDTO.getPlanId())
                .filter(p -> p.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Plan not found in current branch"));

        // Calculate end date
        // Membership plans use Months, PT Add-ons use Days
        LocalDate endDate;
        if (plan.getType() == Plan.PlanType.ADD_ON) {
            endDate = requestDTO.getStartDate().plusDays(plan.getDuration());
        } else {
            endDate = requestDTO.getStartDate().plusMonths(plan.getDuration());
        }

        Subscription subscription = Subscription.builder()
                .member(member)
                .plan(plan)
                .startDate(requestDTO.getStartDate())
                .endDate(endDate)
                .discountAmount(requestDTO.getDiscountAmount())
                .discountReason(requestDTO.getDiscountReason())
                .status(requestDTO.getStatus() != null ? requestDTO.getStatus() : Subscription.Status.ACTIVE)
                .branch(branchService.getCurrentBranch())
                .build();

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        // AUTO-CREATE PT RECORD IF PLAN IS ADD_ON
        if (plan.getType() == Plan.PlanType.ADD_ON) {
            createPTRecord(requestDTO, member, plan, savedSubscription);
        }

        return mapToResponseDTO(savedSubscription);
    }

    private void createPTRecord(SubscriptionRequestDTO request, Member member, Plan plan, Subscription sub) {
        Employee trainer = null;
        if (request.getTrainerId() != null) {
            trainer = employeeRepository.findById(request.getTrainerId()).orElse(null);
        }

        PersonalTrainerMember ptMember = PersonalTrainerMember.builder()
                .member(member)
                .trainer(trainer)
                .plan(plan)
                .startDate(request.getStartDate())
                .expiryDate(sub.getEndDate())
                .totalSessions(plan.getTotalSessions() != null ? plan.getTotalSessions() : 0)
                .sessionsRemaining(plan.getTotalSessions() != null ? plan.getTotalSessions() : 0)
                .status(PersonalTrainerMember.Status.ACTIVE)
                .isPaid(false) // Will be updated when payment is processed
                .branch(branchService.getCurrentBranch())
                .build();
        
        ptRepository.save(ptMember);
    }

    public List<SubscriptionResponseDTO> getAllSubscriptions() {
        return subscriptionRepository.findByBranchId(BranchContext.getCurrentBranchId()).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<SubscriptionResponseDTO> getSubscriptionsByMemberId(Long memberId) {
        return subscriptionRepository.findByMemberIdAndBranchId(memberId, BranchContext.getCurrentBranchId()).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private SubscriptionResponseDTO mapToResponseDTO(Subscription subscription) {
        return SubscriptionResponseDTO.builder()
                .id(subscription.getId())
                .memberId(subscription.getMember().getId())
                .memberName(subscription.getMember().getName())
                .planId(subscription.getPlan().getId())
                .planName(subscription.getPlan().getName())
                .planType(subscription.getPlan().getType())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .discountAmount(subscription.getDiscountAmount())
                .discountReason(subscription.getDiscountReason())
                .status(subscription.getStatus())
                .createdAt(subscription.getCreatedAt())
                .build();
    }
}

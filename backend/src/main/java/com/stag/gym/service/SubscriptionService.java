package com.stag.gym.service;

import com.stag.gym.dto.SubscriptionRequestDTO;
import com.stag.gym.dto.SubscriptionResponseDTO;
import com.stag.gym.model.Member;
import com.stag.gym.model.Plan;
import com.stag.gym.model.Subscription;
import com.stag.gym.repository.MemberRepository;
import com.stag.gym.repository.PlanRepository;
import com.stag.gym.repository.SubscriptionRepository;
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
    private final BranchService branchService;

    @Transactional
    public SubscriptionResponseDTO createSubscription(SubscriptionRequestDTO requestDTO) {
        Member member = memberRepository.findById(requestDTO.getMemberId())
                .filter(m -> m.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Member not found in current branch"));
        
        Plan plan = planRepository.findById(requestDTO.getPlanId())
                .filter(p -> p.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Plan not found in current branch"));

        // Calculate end date based on plan duration (months)
        LocalDate endDate = requestDTO.getStartDate().plusMonths(plan.getDuration());

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
        return mapToResponseDTO(savedSubscription);
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

package com.stag.gym.service;

import com.stag.gym.dto.SubscriptionRequestDTO;
import com.stag.gym.dto.SubscriptionResponseDTO;
import com.stag.gym.model.Member;
import com.stag.gym.model.Plan;
import com.stag.gym.model.Subscription;
import com.stag.gym.repository.MemberRepository;
import com.stag.gym.repository.PlanRepository;
import com.stag.gym.repository.SubscriptionRepository;
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

    @Transactional
    public SubscriptionResponseDTO createSubscription(SubscriptionRequestDTO requestDTO) {
        Member member = memberRepository.findById(requestDTO.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        Plan plan = planRepository.findById(requestDTO.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        // Calculate end date based on plan duration (months)
        LocalDate endDate = requestDTO.getStartDate().plusMonths(plan.getDuration());

        Subscription subscription = Subscription.builder()
                .member(member)
                .plan(plan)
                .startDate(requestDTO.getStartDate())
                .endDate(endDate)
                .status(requestDTO.getStatus() != null ? requestDTO.getStatus() : Subscription.Status.ACTIVE)
                .build();

        Subscription savedSubscription = subscriptionRepository.save(subscription);
        return mapToResponseDTO(savedSubscription);
    }

    public List<SubscriptionResponseDTO> getAllSubscriptions() {
        return subscriptionRepository.findAll().stream()
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
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .status(subscription.getStatus())
                .createdAt(subscription.getCreatedAt())
                .build();
    }
}

package com.stag.gym.service;

import com.stag.gym.dto.PlanRequestDTO;
import com.stag.gym.dto.PlanResponseDTO;
import com.stag.gym.model.Plan;
import com.stag.gym.repository.PlanRepository;
import com.stag.gym.repository.SubscriptionRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Transactional
    public PlanResponseDTO createPlan(PlanRequestDTO requestDTO) {
        Plan plan = Plan.builder()
                .name(requestDTO.getName())
                .duration(requestDTO.getDuration())
                .price(requestDTO.getPrice())
                .build();
        
        Plan savedPlan = planRepository.save(plan);
        return mapToResponseDTO(savedPlan);
    }

    public List<PlanResponseDTO> getAllPlans() {
        return planRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public PlanResponseDTO getPlanById(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + id));
        return mapToResponseDTO(plan);
    }

    @Transactional
    public PlanResponseDTO updatePlan(Long id, PlanRequestDTO requestDTO) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + id));
        
        plan.setName(requestDTO.getName());
        plan.setDuration(requestDTO.getDuration());
        plan.setPrice(requestDTO.getPrice());
        
        Plan updatedPlan = planRepository.save(plan);
        return mapToResponseDTO(updatedPlan);
    }

    @Transactional
    public void deletePlan(Long id) {
        if (!planRepository.existsById(id)) {
            throw new RuntimeException("Plan not found with id: " + id);
        }

        if (subscriptionRepository.existsByPlanId(id)) {
            throw new RuntimeException("Cannot delete plan: active subscriptions exist.");
        }

        planRepository.deleteById(id);
    }

    private PlanResponseDTO mapToResponseDTO(Plan plan) {
        return PlanResponseDTO.builder()
                .id(plan.getId())
                .name(plan.getName())
                .duration(plan.getDuration())
                .price(plan.getPrice())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }
}

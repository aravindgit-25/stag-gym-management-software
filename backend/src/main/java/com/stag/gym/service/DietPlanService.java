package com.stag.gym.service;

import com.stag.gym.dto.DietPlanDetailDTO;
import com.stag.gym.dto.DietPlanFoodRequestDTO;
import com.stag.gym.dto.DietPlanResponseDTO;
import com.stag.gym.model.*;
import com.stag.gym.repository.DietPlanDetailRepository;
import com.stag.gym.repository.DietPlanRepository;
import com.stag.gym.repository.FoodItemRepository;
import com.stag.gym.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DietPlanService {

    private final DietPlanRepository dietPlanRepository;
    private final MemberRepository memberRepository;
    private final FoodItemRepository foodItemRepository;
    private final DietPlanDetailRepository dietPlanDetailRepository;

    public Double calculateBMI(Double weight, Double heightInCm) {
        if (weight == null || heightInCm == null || heightInCm == 0) return 0.0;
        double heightInMeters = heightInCm / 100;
        return weight / (heightInMeters * heightInMeters);
    }

    // Mifflin-St Jeor Equation
    public Double calculateBMR(Double weight, Double height, Integer age, String gender) {
        if (weight == null || height == null || age == null || gender == null) return 0.0;
        if (gender.equalsIgnoreCase("MALE")) {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
    }

    public Double calculateTDEE(Double bmr, Double activityMultiplier) {
        return bmr * activityMultiplier;
    }

    @Transactional
    public DietPlanResponseDTO createOrUpdateDietPlan(Long memberId, DietPlan.PlanType type, DietPlan.DietCategory category) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        DietPlan dietPlan = dietPlanRepository.findByMemberId(memberId)
                .orElse(DietPlan.builder()
                        .member(member)
                        .details(new ArrayList<>())
                        .modificationCount(0)
                        .build());

        // Standard Plan Modification Limit
        if (dietPlan.getType() == DietPlan.PlanType.STANDARD && dietPlan.getModificationCount() >= 2) {
            if (dietPlan.getLastModifiedDate() != null && 
                dietPlan.getLastModifiedDate().getMonth() == LocalDate.now().getMonth()) {
                throw new RuntimeException("Standard plan modification limit reached for this month");
            } else {
                dietPlan.setModificationCount(0); // Reset for new month
            }
        }

        dietPlan.setType(type);
        dietPlan.setCategory(category);
        dietPlan.setLastModifiedDate(LocalDate.now());
        dietPlan.setModificationCount(dietPlan.getModificationCount() + 1);

        // Update calculations if data is available
        if (member.getWeight() != null && member.getHeight() != null && member.getDob() != null) {
            int age = Period.between(member.getDob(), LocalDate.now()).getYears();
            dietPlan.setBmi(calculateBMI(member.getWeight(), member.getHeight()));
            dietPlan.setBmr(calculateBMR(member.getWeight(), member.getHeight(), age, member.getGender()));
            dietPlan.setTdee(calculateTDEE(dietPlan.getBmr(), 1.55)); // Default to Moderately Active (1.55)
            
            // Basic Macro Targets (40/30/30 Split)
            dietPlan.setTargetCalories(dietPlan.getTdee());
            dietPlan.setTargetProtein((dietPlan.getTargetCalories() * 0.3) / 4);
            dietPlan.setTargetCarbs((dietPlan.getTargetCalories() * 0.4) / 4);
            dietPlan.setTargetFats((dietPlan.getTargetCalories() * 0.3) / 9);
        }

        return mapToResponseDTO(dietPlanRepository.save(dietPlan));
    }

    @Transactional
    public DietPlanResponseDTO addFoodToPlan(Long memberId, DietPlanFoodRequestDTO request) {
        DietPlan dietPlan = dietPlanRepository.findByMemberId(memberId)
                .orElseThrow(() -> new RuntimeException("Diet Plan not found. Please create one first."));

        if (dietPlan.getType() == DietPlan.PlanType.BASIC) {
            throw new RuntimeException("Basic plans cannot be modified. Upgrade to Standard or Premium.");
        }

        FoodItem foodItem = foodItemRepository.findById(request.getFoodItemId())
                .orElseThrow(() -> new RuntimeException("Food Item not found"));

        double multiplier = request.getQuantity() / 100.0; // Assuming food DB stores per 100g unit defaults

        DietPlanDetail detail = DietPlanDetail.builder()
                .dietPlan(dietPlan)
                .foodItem(foodItem)
                .mealTime(request.getMealTime())
                .quantity(request.getQuantity())
                .totalCalories(foodItem.getCalories() * multiplier)
                .totalProtein(foodItem.getProtein() * multiplier)
                .totalCarbs(foodItem.getCarbs() * multiplier)
                .totalFats(foodItem.getFats() * multiplier)
                .build();

        dietPlan.getDetails().add(detail);
        dietPlanDetailRepository.save(detail);

        return mapToResponseDTO(dietPlan);
    }

    @Transactional
    public DietPlanResponseDTO removeFoodFromPlan(Long memberId, Long detailId) {
        DietPlan dietPlan = dietPlanRepository.findByMemberId(memberId)
                .orElseThrow(() -> new RuntimeException("Diet Plan not found"));

        if (dietPlan.getType() == DietPlan.PlanType.BASIC) {
            throw new RuntimeException("Basic plans cannot be modified.");
        }

        DietPlanDetail detail = dietPlanDetailRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Detail not found"));

        if (!detail.getDietPlan().getId().equals(dietPlan.getId())) {
            throw new RuntimeException("Detail does not belong to this member's plan");
        }

        dietPlan.getDetails().remove(detail);
        dietPlanDetailRepository.delete(detail);

        return mapToResponseDTO(dietPlan);
    }

    @Transactional(readOnly = true)
    public DietPlanResponseDTO getDietPlanByMember(Long memberId) {
        return dietPlanRepository.findByMemberId(memberId)
                .map(this::mapToResponseDTO)
                .orElseThrow(() -> new RuntimeException("Diet Plan not found for this member"));
    }

    private DietPlanResponseDTO mapToResponseDTO(DietPlan plan) {
        double currentCals = 0.0, currentProtein = 0.0, currentCarbs = 0.0, currentFats = 0.0;

        List<DietPlanDetailDTO> detailDTOs = new ArrayList<>();
        if (plan.getDetails() != null) {
            for (DietPlanDetail d : plan.getDetails()) {
                currentCals += d.getTotalCalories() != null ? d.getTotalCalories() : 0.0;
                currentProtein += d.getTotalProtein() != null ? d.getTotalProtein() : 0.0;
                currentCarbs += d.getTotalCarbs() != null ? d.getTotalCarbs() : 0.0;
                currentFats += d.getTotalFats() != null ? d.getTotalFats() : 0.0;

                detailDTOs.add(DietPlanDetailDTO.builder()
                        .id(d.getId())
                        .foodItemId(d.getFoodItem().getId())
                        .foodName(d.getFoodItem().getName())
                        .mealTime(d.getMealTime())
                        .quantity(d.getQuantity())
                        .servingUnit(d.getFoodItem().getServingUnit())
                        .totalCalories(d.getTotalCalories())
                        .totalProtein(d.getTotalProtein())
                        .totalCarbs(d.getTotalCarbs())
                        .totalFats(d.getTotalFats())
                        .build());
            }
        }

        return DietPlanResponseDTO.builder()
                .id(plan.getId())
                .memberId(plan.getMember().getId())
                .type(plan.getType())
                .category(plan.getCategory())
                .bmi(plan.getBmi())
                .bmr(plan.getBmr())
                .tdee(plan.getTdee())
                .targetCalories(plan.getTargetCalories())
                .targetProtein(plan.getTargetProtein())
                .targetCarbs(plan.getTargetCarbs())
                .targetFats(plan.getTargetFats())
                .currentTotalCalories(currentCals)
                .currentTotalProtein(currentProtein)
                .currentTotalCarbs(currentCarbs)
                .currentTotalFats(currentFats)
                .modificationCount(plan.getModificationCount())
                .lastModifiedDate(plan.getLastModifiedDate())
                .details(detailDTOs)
                .build();
    }
}

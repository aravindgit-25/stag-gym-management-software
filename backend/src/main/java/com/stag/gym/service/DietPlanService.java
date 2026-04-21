package com.stag.gym.service;

import com.stag.gym.dto.DietPlanDetailDTO;
import com.stag.gym.dto.DietPlanFoodRequestDTO;
import com.stag.gym.dto.DietPlanResponseDTO;
import com.stag.gym.model.*;
import com.stag.gym.repository.DietPlanDetailRepository;
import com.stag.gym.repository.DietPlanRepository;
import com.stag.gym.repository.FoodItemRepository;
import com.stag.gym.repository.MemberRepository;
import com.stag.gym.security.BranchContext;

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
    private final BranchService branchService;

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
                .filter(m -> m.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Member not found in current branch"));

        DietPlan dietPlan = dietPlanRepository.findByMemberIdAndBranchId(memberId, BranchContext.getCurrentBranchId())
                .orElse(DietPlan.builder()
                        .member(member)
                        .branch(branchService.getCurrentBranch())
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

        updatePlanCalculations(dietPlan, member);

        return mapToResponseDTO(dietPlanRepository.save(dietPlan));
    }

    private void updatePlanCalculations(DietPlan dietPlan, Member member) {
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
    }

    @Transactional
    public DietPlanResponseDTO addFoodToPlan(Long memberId, DietPlanFoodRequestDTO request) {
        if (request.getFoodItemId() == null) {
            throw new RuntimeException("foodItemId is required in the request body");
        }

        Member member = memberRepository.findById(memberId)
                .filter(m -> m.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Member not found in current branch"));

        DietPlan dietPlan = dietPlanRepository.findByMemberIdAndBranchId(memberId, BranchContext.getCurrentBranchId())
                .orElseGet(() -> {
                    DietPlan newPlan = DietPlan.builder()
                            .member(member)
                            .branch(branchService.getCurrentBranch())
                            .type(DietPlan.PlanType.STANDARD)
                            .category(DietPlan.DietCategory.VEG)
                            .details(new ArrayList<>())
                            .modificationCount(0)
                            .build();
                    updatePlanCalculations(newPlan, member);
                    return dietPlanRepository.save(newPlan);
                });

        if (dietPlan.getType() == DietPlan.PlanType.BASIC) {
            throw new RuntimeException("Basic plans cannot be modified. Upgrade to Standard or Premium.");
        }

        FoodItem foodItem = foodItemRepository.findById(request.getFoodItemId())
                .orElseThrow(() -> new RuntimeException("Food Item not found with ID: " + request.getFoodItemId()));

        if (dietPlan.getDetails() == null) {
            dietPlan.setDetails(new ArrayList<>());
        }

        double multiplier = (request.getQuantity() != null ? request.getQuantity() : 100.0) / 100.0;

        DietPlanDetail detail = DietPlanDetail.builder()
                .dietPlan(dietPlan)
                .foodItem(foodItem)
                .mealTime(request.getMealTime() != null ? request.getMealTime() : "Unscheduled")
                .quantity(request.getQuantity() != null ? request.getQuantity() : 100.0)
                .totalCalories(safeMultiply(foodItem.getCalories(), multiplier))
                .totalProtein(safeMultiply(foodItem.getProtein(), multiplier))
                .totalCarbs(safeMultiply(foodItem.getCarbs(), multiplier))
                .totalFats(safeMultiply(foodItem.getFats(), multiplier))
                .build();

        dietPlan.getDetails().add(detail);
        dietPlanDetailRepository.save(detail);

        return mapToResponseDTO(dietPlan);
    }

    private Double safeMultiply(Double val, Double mult) {
        return (val != null) ? val * mult : 0.0;
    }

    @Transactional
    public DietPlanResponseDTO removeFoodFromPlan(Long memberId, Long detailId) {
        DietPlan dietPlan = dietPlanRepository.findByMemberIdAndBranchId(memberId, BranchContext.getCurrentBranchId())
                .orElseThrow(() -> new RuntimeException("Diet Plan not found in current branch"));

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
        return dietPlanRepository.findByMemberIdAndBranchId(memberId, BranchContext.getCurrentBranchId())
                .map(this::mapToResponseDTO)
                .orElseThrow(() -> new RuntimeException("Diet Plan not found for this member in current branch"));
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

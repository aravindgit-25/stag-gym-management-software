package com.stag.gym.dto;

import com.stag.gym.model.DietPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DietPlanResponseDTO {
    private Long id;
    private Long memberId;
    private DietPlan.PlanType type;
    private DietPlan.DietCategory category;
    
    private Double bmi;
    private Double bmr;
    private Double tdee;
    
    private Double targetCalories;
    private Double targetProtein;
    private Double targetCarbs;
    private Double targetFats;
    
    private Double currentTotalCalories;
    private Double currentTotalProtein;
    private Double currentTotalCarbs;
    private Double currentTotalFats;
    
    private Integer modificationCount;
    private LocalDate lastModifiedDate;
    
    private List<DietPlanDetailDTO> details;
}

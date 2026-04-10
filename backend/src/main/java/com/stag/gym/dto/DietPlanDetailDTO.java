package com.stag.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DietPlanDetailDTO {
    private Long id;
    private Long foodItemId;
    private String foodName;
    private String mealTime;
    private Double quantity;
    private String servingUnit;
    private Double totalCalories;
    private Double totalProtein;
    private Double totalCarbs;
    private Double totalFats;
}

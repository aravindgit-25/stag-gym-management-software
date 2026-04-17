package com.stag.gym.dto;

import com.stag.gym.model.DietPlan;
import lombok.Data;

@Data
public class DietPlanCreateRequestDTO {
    private Long memberId;
    private DietPlan.PlanType type;
    private DietPlan.DietCategory category;
}

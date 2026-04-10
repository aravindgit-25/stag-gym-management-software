package com.stag.gym.dto;

import lombok.Data;

@Data
public class DietPlanFoodRequestDTO {
    private Long foodItemId;
    private String mealTime; // Breakfast, Lunch, Snack, Dinner
    private Double quantity;
}

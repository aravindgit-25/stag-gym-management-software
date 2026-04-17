package com.stag.gym.config;

import com.stag.gym.model.FoodItem;
import com.stag.gym.repository.FoodItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final FoodItemRepository foodItemRepository;

    @Override
    public void run(String... args) throws Exception {
        if (foodItemRepository.count() == 0) {
            List<FoodItem> defaultFoods = Arrays.asList(
                // Breakfast
                createFood("Oats (Cooked)", "VEG", 68.0, 2.4, 12.0, 1.4, "grams", "Rich in fiber and complex carbs"),
                createFood("Whole Egg (Boiled)", "NON_VEG", 155.0, 13.0, 1.1, 11.0, "pieces", "Excellent source of high-quality protein"),
                createFood("Idli (2 pieces)", "VEG", 120.0, 4.0, 24.0, 0.5, "pieces", "Light and easy to digest"),
                createFood("Bread (Whole Wheat)", "VEG", 265.0, 9.0, 43.0, 3.2, "slices", "Good source of whole grains"),
                createFood("Greek Yogurt", "VEG", 59.0, 10.0, 3.6, 0.4, "grams", "High in protein and probiotics"),

                // Lunch/Dinner
                createFood("Chicken Breast (Grilled)", "NON_VEG", 165.0, 31.0, 0.0, 3.6, "grams", "Lean protein source"),
                createFood("Brown Rice (Cooked)", "VEG", 111.0, 2.6, 23.0, 0.9, "grams", "Complex carbs for sustained energy"),
                createFood("Paneer (Cottage Cheese)", "VEG", 265.0, 18.0, 1.2, 20.0, "grams", "Vegetarian protein source"),
                createFood("Dal (Lentils)", "VEG", 116.0, 9.0, 20.0, 0.4, "grams", "Plant-based protein and fiber"),
                createFood("Salad (Mixed Greens)", "VEG", 15.0, 1.0, 3.0, 0.0, "bowl", "Essential vitamins and minerals"),
                createFood("Fish (Grilled Salmon)", "NON_VEG", 208.0, 20.0, 0.0, 13.0, "grams", "Omega-3 fatty acids"),

                // Snacks
                createFood("Almonds", "VEG", 579.0, 21.0, 22.0, 50.0, "grams", "Healthy fats and Vitamin E"),
                createFood("Apple", "VEG", 52.0, 0.3, 14.0, 0.2, "pieces", "Fiber-rich fruit"),
                createFood("Peanut Butter", "VEG", 588.0, 25.0, 20.0, 50.0, "grams", "Protein and healthy fats")
            );
            foodItemRepository.saveAll(defaultFoods);
        }
    }

    private FoodItem createFood(String name, String category, Double cals, Double protein, Double carbs, Double fats, String unit, String benefits) {
        return FoodItem.builder()
                .name(name)
                .category(category)
                .calories(cals)
                .protein(protein)
                .carbs(carbs)
                .fats(fats)
                .servingUnit(unit)
                .nutritionalBenefits(benefits)
                .build();
    }
}

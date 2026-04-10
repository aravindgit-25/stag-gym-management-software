package com.stag.gym.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "food_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String category; // e.g., VEG, NON_VEG, VEGAN
    private Double calories; // per 100g
    private Double protein;
    private Double carbs;
    private Double fats;
    private Double fiber;
    
    private String imageUrl;
    private String nutritionalBenefits;
    private String servingUnit; // e.g., grams, pieces, bowl
}

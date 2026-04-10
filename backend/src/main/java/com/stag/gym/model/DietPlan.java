package com.stag.gym.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "diet_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DietPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanType type; // BASIC, STANDARD, PREMIUM

    @Enumerated(EnumType.STRING)
    private DietCategory category; // VEG, NON_VEG

    // Calculated metrics
    private Double bmi;
    private Double bmr;
    private Double tdee;
    private Double targetCalories;
    private Double targetProtein;
    private Double targetCarbs;
    private Double targetFats;

    private Integer modificationCount; // Max 2 for Standard
    private LocalDate lastModifiedDate;
    
    @OneToMany(mappedBy = "dietPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DietPlanDetail> details;

    public enum PlanType {
        BASIC, STANDARD, PREMIUM
    }

    public enum DietCategory {
        VEG, NON_VEG
    }
}

package com.stag.gym.dto;

import com.stag.gym.model.Plan;
import com.stag.gym.model.Subscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponseDTO {
    private Long id;
    private Long memberId;
    private String memberName;
    private Long planId;
    private String planName;
    private Plan.PlanType planType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double discountAmount;
    private String discountReason;
    private Subscription.Status status;
    private LocalDateTime createdAt;
}

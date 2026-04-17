package com.stag.gym.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.stag.gym.model.Subscription;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequestDTO {

    @NotNull(message = "Member ID is required")
    private Long memberId;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @JsonAlias("discount_amount")
    private Double discountAmount;

    @JsonAlias("discount_reason")
    private String discountReason;

    private Subscription.Status status;
}

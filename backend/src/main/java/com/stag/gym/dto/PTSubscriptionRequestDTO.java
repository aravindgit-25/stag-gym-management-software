package com.stag.gym.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class PTSubscriptionRequestDTO {

    @NotNull(message = "Member ID is required")
    @JsonProperty("memberId")
    @JsonAlias("member_id")
    private Long memberId;

    @NotNull(message = "Trainer ID is required")
    @JsonProperty("trainerId")
    @JsonAlias("trainer_id")
    private Long trainerId;

    @NotNull(message = "Plan ID is required")
    @JsonProperty("planId")
    @JsonAlias("plan_id")
    private Long planId;

    @NotNull(message = "Start date is required")
    @JsonProperty("startDate")
    @JsonAlias("start_date")
    private LocalDate startDate;

    private String goal;
}

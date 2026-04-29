package com.stag.gym.dto;

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
public class PTSessionLogRequestDTO {

    @NotNull(message = "PT Subscription ID is required")
    private Long ptSubscriptionId;

    @NotNull(message = "Session date is required")
    private LocalDate sessionDate;

    private Boolean trainerVerified;
    private Boolean clientVerified;
    private String notes;
}

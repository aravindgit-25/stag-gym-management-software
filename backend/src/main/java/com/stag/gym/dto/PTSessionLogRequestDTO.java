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
public class PTSessionLogRequestDTO {

    @NotNull(message = "PT Subscription ID is required")
    @JsonProperty("ptSubscriptionId")
    @JsonAlias({"ptMemberId", "pt_subscription_id"})
    private Long ptSubscriptionId;

    @NotNull(message = "Session date is required")
    @JsonProperty("sessionDate")
    @JsonAlias({"date", "session_date"})
    private LocalDate sessionDate;

    @JsonProperty("trainerVerified")
    @JsonAlias({"trainerVerification", "trainer_verified"})
    private Boolean trainerVerified;

    @JsonProperty("clientVerified")
    @JsonAlias({"clientVerification", "client_verified"})
    private Boolean clientVerified;

    @JsonProperty("trainerId")
    @JsonAlias("trainer_id")
    private Long trainerId;

    private String notes;
}

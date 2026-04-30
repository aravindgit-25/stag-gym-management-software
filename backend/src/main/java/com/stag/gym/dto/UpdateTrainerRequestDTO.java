package com.stag.gym.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTrainerRequestDTO {

    @NotNull(message = "Trainer ID is required")
    @JsonProperty("trainerId")
    @JsonAlias("trainer_id")
    private Long trainerId;

    @JsonProperty("branchId")
    @JsonAlias("branch_id")
    private Long branchId;
}

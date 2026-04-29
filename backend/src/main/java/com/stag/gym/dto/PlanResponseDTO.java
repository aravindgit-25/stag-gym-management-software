package com.stag.gym.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.stag.gym.model.Plan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponseDTO {
    private Long id;
    private String name;
    private Integer duration;
    private Double price;
    @JsonProperty("type")
    private Plan.PlanType type;
    private Integer totalSessions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

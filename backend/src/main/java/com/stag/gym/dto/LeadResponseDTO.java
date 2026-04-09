package com.stag.gym.dto;

import com.stag.gym.model.Lead;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadResponseDTO {
    private Long id;
    private String name;
    private String phone;
    private String location;
    private String goal;
    private LocalDate planToJoinDate;
    private Lead.LeadStatus status;
    private String notes;
    private LocalDate lastFollowUpDate;
    private LocalDate nextFollowUpDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package com.stag.gym.dto;

import com.stag.gym.model.Lead;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadRequestDTO {
    private String name;
    private String phone;
    private String location;
    private String goal;
    private LocalDate planToJoinDate;
    private Lead.LeadStatus status;
    private String notes;
    private LocalDate nextFollowUpDate;
}

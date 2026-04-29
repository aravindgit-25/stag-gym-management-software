package com.stag.gym.dto;

import com.stag.gym.model.PersonalTrainerMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PTSubscriptionResponseDTO {
    private Long id;
    private String memberName;
    private String memberPhone;
    private String trainerName;
    private String planName;
    private Integer totalSessions;
    private Integer sessionsRemaining;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private PersonalTrainerMember.Status status;
    private Boolean isPaid;
    private String goal;
}

package com.stag.gym.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Phone number is required")
    @Column(nullable = false)
    private String phone;

    private String location;

    private String goal; // e.g., fat loss, muscle building, strength

    @Column(name = "plan_to_join_date")
    private LocalDate planToJoinDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private LeadStatus status = LeadStatus.NEW;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "next_follow_up_date")
    private LocalDate nextFollowUpDate;

    @Column(name = "last_follow_up_date")
    private LocalDate lastFollowUpDate;

    public enum LeadStatus {
        NEW,
        FOLLOW_UP,
        JOINED,
        NOT_INTERESTED,
        JOINED_ELSEWHERE
    }
}

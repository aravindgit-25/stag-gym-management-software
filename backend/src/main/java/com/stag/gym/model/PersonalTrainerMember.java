package com.stag.gym.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "personal_trainers_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalTrainerMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id") // Removed nullable = false
    private Employee trainer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    private String goal;
    private Integer totalSessions;
    private Integer sessionsRemaining;
    private LocalDate expiryDate;
    
    @Builder.Default
    private Boolean isPaid = false;

    private LocalDate startDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Branch branch;

    public enum Status {
        ACTIVE, COMPLETED, EXPIRED
    }
}

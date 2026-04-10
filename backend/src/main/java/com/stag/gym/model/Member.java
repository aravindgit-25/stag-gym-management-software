package com.stag.gym.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "registration_id", unique = true)
    private String registrationId;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Phone is required")
    @Column(unique = true, nullable = false)
    private String phone;

    private String email;
    private LocalDate dob;
    private String address;
    private String bloodGroup;
    private Double weight;
    private Double height;
    private String fitnessGoal;

    // Emergency Contact
    private String emergencyContactName;
    private String emergencyContactPhone;

    private String gender;

    @Column(name = "join_date")
    private LocalDate joinDate;

    private LocalDate joiningDate; // Explicit joining date field as requested

    // ID Proof
    private String idProofType;
    private String idProofNumber;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    public enum Status {
        ACTIVE, INACTIVE, EXPIRED
    }
}

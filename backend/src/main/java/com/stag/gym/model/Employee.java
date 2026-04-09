package com.stag.gym.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", unique = true, nullable = false)
    private String employeeId; // e.g., SG-EMP-001

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    @Column(unique = true)
    private String phone;

    @Email
    private String email;

    private String address;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String education;
    private String experience;

    // Proof Details
    private String aadharNumber;
    private String panNumber;
    private String idProofType; // e.g., Voter ID, DL
    private String idProofNumber;

    // Emergency Contact
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelation;

    // Salary Details
    private Double baseSalary;
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    private LocalDate dateOfJoining;
    private LocalDate dateOfTermination;

    public enum Role {
        TRAINER, ADMIN, CLEANER, SERVICE_STAFF, MANAGER, OWNER
    }

    public enum Status {
        ACTIVE, INACTIVE, TERMINATED, ON_LEAVE
    }
}

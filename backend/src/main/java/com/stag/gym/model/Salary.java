package com.stag.gym.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "salaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Salary extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String monthYear; // Format: "MM-YYYY"

    private Double baseSalary;
    private Integer daysPresent;
    private Integer daysAbsent;
    private Integer daysLate;
    private Double deductions;
    private Double bonus;
    private Double netSalary;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SalaryStatus status = SalaryStatus.PENDING;

    private LocalDate paidDate;
    private String paymentMethod;

    public enum SalaryStatus {
        PENDING, PAID
    }
}

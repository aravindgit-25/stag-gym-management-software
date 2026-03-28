package com.stag.gym.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    @NotNull(message = "Subscription is required")
    private Subscription subscription;

    @NotNull(message = "Amount is required")
    @Min(value = 0, message = "Amount must be at least 0")
    private Double amount;

    @Column(name = "paid_amount")
    private Double paidAmount;

    @Column(name = "balance_amount")
    private Double balanceAmount;

    @Column(name = "balance_due_date")
    private LocalDateTime balanceDueDate;

    @Column(name = "payment_date", nullable = false)
    @NotNull(message = "Payment date is required")
    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false)
    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;

    public enum PaymentMode {
        CASH, UPI, CARD;

        @com.fasterxml.jackson.annotation.JsonCreator
        public static PaymentMode fromString(String value) {
            return value == null ? null : PaymentMode.valueOf(value.toUpperCase());
        }
    }
}

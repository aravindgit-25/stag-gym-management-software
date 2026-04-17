package com.stag.gym.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.stag.gym.model.Payment;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {

    @NotNull(message = "Subscription ID is required")
    private Long subscriptionId;

    @NotNull(message = "Amount is required")
    @Min(value = 0, message = "Amount must be at least 0")
    private Double amount;

    private Double paidAmount;

    private Double balanceAmount;

    private LocalDate balanceDueDate;

    @JsonAlias("discount_amount")
    private Double discountAmount;

    @JsonAlias("discount_reason")
    private String discountReason;

    @NotNull(message = "Payment mode is required")
    private Payment.PaymentMode paymentMode;

    private LocalDate paymentDate;
}

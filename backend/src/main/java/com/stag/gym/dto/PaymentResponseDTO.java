package com.stag.gym.dto;

import com.stag.gym.model.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {
    private Long id;
    private Long subscriptionId;
    private String memberName;
    private String planName;
    private Double amount;
    private LocalDateTime paymentDate;
    private Payment.PaymentMode paymentMode;
    private LocalDateTime createdAt;
}

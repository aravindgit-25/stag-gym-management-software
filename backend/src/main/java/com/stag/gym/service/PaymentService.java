package com.stag.gym.service;

import com.stag.gym.dto.PaymentRequestDTO;
import com.stag.gym.dto.PaymentResponseDTO;
import com.stag.gym.model.Payment;
import com.stag.gym.model.Subscription;
import com.stag.gym.repository.PaymentRepository;
import com.stag.gym.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Transactional
    public PaymentResponseDTO processPayment(PaymentRequestDTO requestDTO) {
        Subscription subscription = subscriptionRepository.findById(requestDTO.getSubscriptionId())
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        Payment payment = Payment.builder()
                .subscription(subscription)
                .amount(requestDTO.getAmount())
                .paidAmount(requestDTO.getPaidAmount())
                .balanceAmount(requestDTO.getBalanceAmount())
                .balanceDueDate(requestDTO.getBalanceDueDate())
                .paymentMode(requestDTO.getPaymentMode())
                .paymentDate(requestDTO.getPaymentDate() != null ? requestDTO.getPaymentDate() : LocalDate.now())
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        return mapToResponseDTO(savedPayment);
    }

    public List<PaymentResponseDTO> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentResponseDTO> getPaymentsBySubscriptionId(Long subscriptionId) {
        return paymentRepository.findBySubscriptionId(subscriptionId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public Double sumTotal() {
        Double total = paymentRepository.sumTotalRevenue();
        return total != null ? total : 0.0;
    }

    public Double sumToday() {
        LocalDate today = LocalDate.now();
        Double todayTotal = paymentRepository.sumTodayRevenue(today);
        return todayTotal != null ? todayTotal : 0.0;
    }

    private PaymentResponseDTO mapToResponseDTO(Payment payment) {
        return PaymentResponseDTO.builder()
                .id(payment.getId())
                .subscriptionId(payment.getSubscription().getId())
                .memberName(payment.getSubscription().getMember().getName())
                .planName(payment.getSubscription().getPlan().getName())
                .amount(payment.getAmount())
                .paidAmount(payment.getPaidAmount())
                .balanceAmount(payment.getBalanceAmount())
                .balanceDueDate(payment.getBalanceDueDate())
                .paymentDate(payment.getPaymentDate())
                .paymentMode(payment.getPaymentMode())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}

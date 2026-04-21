package com.stag.gym.service;

import com.stag.gym.dto.PaymentRequestDTO;
import com.stag.gym.dto.PaymentResponseDTO;
import com.stag.gym.model.Payment;
import com.stag.gym.model.Subscription;
import com.stag.gym.repository.PaymentRepository;
import com.stag.gym.repository.SubscriptionRepository;
import com.stag.gym.security.BranchContext;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BranchService branchService;

    @Transactional
    public PaymentResponseDTO processPayment(PaymentRequestDTO requestDTO) {
        Subscription subscription = subscriptionRepository.findById(requestDTO.getSubscriptionId())
                .filter(s -> s.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                .orElseThrow(() -> new RuntimeException("Subscription not found in current branch"));

        Payment payment = Payment.builder()
                .subscription(subscription)
                .amount(requestDTO.getAmount())
                .paidAmount(requestDTO.getPaidAmount())
                .balanceAmount(requestDTO.getBalanceAmount())
                .balanceDueDate(requestDTO.getBalanceDueDate())
                .discountAmount(requestDTO.getDiscountAmount())
                .discountReason(requestDTO.getDiscountReason())
                .paymentMode(requestDTO.getPaymentMode())
                .paymentDate(requestDTO.getPaymentDate() != null ? requestDTO.getPaymentDate() : LocalDate.now())
                .branch(branchService.getCurrentBranch())
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        return mapToResponseDTO(savedPayment);
    }

    public List<PaymentResponseDTO> getAllPayments() {
        return paymentRepository.findByBranchId(BranchContext.getCurrentBranchId()).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentResponseDTO> getPaymentsBySubscriptionId(Long subscriptionId) {
        return paymentRepository.findBySubscriptionIdAndBranchId(subscriptionId, BranchContext.getCurrentBranchId()).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public Double sumTotal() {
        Double total = paymentRepository.sumTotalRevenue(BranchContext.getCurrentBranchId());
        return total != null ? total : 0.0;
    }

    public Double sumToday() {
        LocalDate today = LocalDate.now();
        Double todayTotal = paymentRepository.sumTodayRevenue(today, BranchContext.getCurrentBranchId());
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
                .discountAmount(payment.getDiscountAmount())
                .discountReason(payment.getDiscountReason())
                .balanceDueDate(payment.getBalanceDueDate())
                .paymentDate(payment.getPaymentDate())
                .paymentMode(payment.getPaymentMode())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}

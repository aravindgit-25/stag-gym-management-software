package com.stag.gym.service;

import com.stag.gym.dto.PaymentRequestDTO;
import com.stag.gym.dto.PaymentResponseDTO;
import com.stag.gym.model.Payment;
import com.stag.gym.model.Subscription;
import com.stag.gym.model.PersonalTrainerMember;
import com.stag.gym.model.Plan;
import com.stag.gym.repository.PaymentRepository;
import com.stag.gym.repository.SubscriptionRepository;
import com.stag.gym.repository.PersonalTrainerMemberRepository;
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
    private final PersonalTrainerMemberRepository ptRepository;
    private final BranchService branchService;

    @Transactional
    public PaymentResponseDTO processPayment(PaymentRequestDTO requestDTO) {
        Payment.PaymentBuilder paymentBuilder = Payment.builder()
                .amount(requestDTO.getAmount())
                .paidAmount(requestDTO.getPaidAmount())
                .balanceAmount(requestDTO.getBalanceAmount())
                .balanceDueDate(requestDTO.getBalanceDueDate())
                .discountAmount(requestDTO.getDiscountAmount())
                .discountReason(requestDTO.getDiscountReason())
                .paymentMode(requestDTO.getPaymentMode())
                .paymentDate(requestDTO.getPaymentDate() != null ? requestDTO.getPaymentDate() : LocalDate.now())
                .branch(branchService.getCurrentBranch());

        // Prioritize PT Subscription if ptSubscriptionId is provided
        if (requestDTO.getPtSubscriptionId() != null && requestDTO.getPtSubscriptionId() > 0) {
            PersonalTrainerMember ptSubscription = ptRepository.findById(requestDTO.getPtSubscriptionId())
                    .filter(s -> s.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                    .orElseThrow(() -> new RuntimeException("PT Subscription not found in current branch"));
            
            ptSubscription.setIsPaid(true); // Mark PT as paid
            ptRepository.save(ptSubscription);
            paymentBuilder.ptSubscription(ptSubscription);
        } else if (requestDTO.getSubscriptionId() != null && requestDTO.getSubscriptionId() > 0) {
            Subscription subscription = subscriptionRepository.findById(requestDTO.getSubscriptionId())
                    .filter(s -> s.getBranch().getId().equals(BranchContext.getCurrentBranchId()))
                    .orElseThrow(() -> new RuntimeException("Subscription not found in current branch"));
            paymentBuilder.subscription(subscription);

            // AUTO-LINK: If this is an ADD_ON plan, find and mark the PT record as paid
            if (subscription.getPlan().getType() == Plan.PlanType.ADD_ON) {
                ptRepository.findByMemberId(subscription.getMember().getId()).stream()
                    .filter(pt -> pt.getPlan().getId().equals(subscription.getPlan().getId()))
                    .filter(pt -> !Boolean.TRUE.equals(pt.getIsPaid())) // Find the unpaid one
                    .findFirst()
                    .ifPresent(pt -> {
                        pt.setIsPaid(true);
                        ptRepository.save(pt);
                        paymentBuilder.ptSubscription(pt); // Link this payment to PT as well
                    });
            }
        } else {
            throw new RuntimeException("Either a valid Subscription ID or PT Subscription ID is required");
        }

        Payment savedPayment = paymentRepository.save(paymentBuilder.build());
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
        PaymentResponseDTO.PaymentResponseDTOBuilder builder = PaymentResponseDTO.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .paidAmount(payment.getPaidAmount())
                .balanceAmount(payment.getBalanceAmount())
                .discountAmount(payment.getDiscountAmount())
                .discountReason(payment.getDiscountReason())
                .balanceDueDate(payment.getBalanceDueDate())
                .paymentDate(payment.getPaymentDate())
                .paymentMode(payment.getPaymentMode())
                .createdAt(payment.getCreatedAt());

        if (payment.getSubscription() != null) {
            builder.subscriptionId(payment.getSubscription().getId())
                    .memberName(payment.getSubscription().getMember().getName())
                    .planName(payment.getSubscription().getPlan().getName());
        } else if (payment.getPtSubscription() != null) {
            builder.ptSubscriptionId(payment.getPtSubscription().getId())
                    .memberName(payment.getPtSubscription().getMember().getName())
                    .planName(payment.getPtSubscription().getPlan() != null ? 
                              payment.getPtSubscription().getPlan().getName() : "Personal Training");
        }

        return builder.build();
    }
}

package com.stag.gym.service;

import com.stag.gym.dto.PaymentRequestDTO;
import com.stag.gym.dto.PaymentResponseDTO;
import com.stag.gym.model.Branch;
import com.stag.gym.model.Member;
import com.stag.gym.model.Payment;
import com.stag.gym.model.Plan;
import com.stag.gym.model.Subscription;
import com.stag.gym.repository.PaymentRepository;
import com.stag.gym.repository.SubscriptionRepository;
import com.stag.gym.security.BranchContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private BranchService branchService;

    @InjectMocks
    private PaymentService paymentService;

    private Subscription subscription;
    private Long branchId = 1L;

    @BeforeEach
    void setUp() {
        BranchContext.setCurrentBranchId(branchId);
        Branch branch = Branch.builder().id(branchId).branchName("Main Branch").build();

        Member member = Member.builder()
                .id(1L)
                .name("John Doe")
                .branch(branch)
                .build();
        
        Plan plan = Plan.builder()
                .id(1L)
                .name("Monthly")
                .branch(branch)
                .build();

        subscription = Subscription.builder()
                .id(1L)
                .member(member)
                .plan(plan)
                .branch(branch)
                .build();
    }

    @Test
    void testProcessPaymentWithDiscount() {
        PaymentRequestDTO requestDTO = PaymentRequestDTO.builder()
                .subscriptionId(1L)
                .amount(900.0)
                .paidAmount(900.0)
                .discountAmount(100.0)
                .discountReason("Promo Code")
                .paymentMode(Payment.PaymentMode.CASH)
                .build();

        when(subscriptionRepository.findById(1L)).thenReturn(Optional.of(subscription));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment pay = invocation.getArgument(0);
            pay.setId(1L);
            return pay;
        });

        PaymentResponseDTO responseDTO = paymentService.processPayment(requestDTO);

        assertNotNull(responseDTO);
        assertEquals(100.0, responseDTO.getDiscountAmount());
        assertEquals("Promo Code", responseDTO.getDiscountReason());
    }
}

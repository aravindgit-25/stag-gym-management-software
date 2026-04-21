package com.stag.gym.service;

import com.stag.gym.dto.SubscriptionRequestDTO;
import com.stag.gym.dto.SubscriptionResponseDTO;
import com.stag.gym.model.Branch;
import com.stag.gym.model.Member;
import com.stag.gym.model.Plan;
import com.stag.gym.model.Subscription;
import com.stag.gym.repository.MemberRepository;
import com.stag.gym.repository.PlanRepository;
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
public class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private BranchService branchService;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private Member member;
    private Plan plan;
    private Long branchId = 1L;

    @BeforeEach
    void setUp() {
        BranchContext.setCurrentBranchId(branchId);
        Branch branch = Branch.builder().id(branchId).branchName("Main Branch").build();

        member = Member.builder()
                .id(1L)
                .name("John Doe")
                .branch(branch)
                .build();
        
        plan = Plan.builder()
                .id(1L)
                .name("Monthly")
                .duration(1)
                .price(1000.0)
                .branch(branch)
                .build();
    }

    @Test
    void testCreateSubscriptionWithDiscount() {
        SubscriptionRequestDTO requestDTO = SubscriptionRequestDTO.builder()
                .memberId(1L)
                .planId(1L)
                .startDate(LocalDate.now())
                .discountAmount(100.0)
                .discountReason("Promo Code")
                .build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> {
            Subscription sub = invocation.getArgument(0);
            sub.setId(1L);
            return sub;
        });

        SubscriptionResponseDTO responseDTO = subscriptionService.createSubscription(requestDTO);

        assertNotNull(responseDTO);
        assertEquals(100.0, responseDTO.getDiscountAmount());
        assertEquals("Promo Code", responseDTO.getDiscountReason());
    }
}

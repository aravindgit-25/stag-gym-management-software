package com.stag.gym.controller;

import com.stag.gym.dto.PaymentRequestDTO;
import com.stag.gym.dto.PaymentResponseDTO;
import com.stag.gym.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponseDTO> processPayment(@Valid @RequestBody PaymentRequestDTO requestDTO) {
        return new ResponseEntity<>(paymentService.processPayment(requestDTO), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponseDTO>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/subscription/{subscriptionId}")
    public ResponseEntity<List<PaymentResponseDTO>> getPaymentsBySubscriptionId(@PathVariable Long subscriptionId) {
        return ResponseEntity.ok(paymentService.getPaymentsBySubscriptionId(subscriptionId));
    }
}

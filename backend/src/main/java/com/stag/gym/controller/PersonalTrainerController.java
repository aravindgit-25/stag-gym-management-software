package com.stag.gym.controller;

import com.stag.gym.dto.PTSubscriptionRequestDTO;
import com.stag.gym.dto.PTSubscriptionResponseDTO;
import com.stag.gym.dto.PTSessionLogRequestDTO;
import com.stag.gym.service.PersonalTrainerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/personal-training")
@RequiredArgsConstructor
public class PersonalTrainerController {

    private final PersonalTrainerService ptService;

    @PostMapping("/subscribe")
    public ResponseEntity<PTSubscriptionResponseDTO> subscribe(@Valid @RequestBody PTSubscriptionRequestDTO request) {
        return ResponseEntity.ok(ptService.createPTSubscription(request));
    }

    @PostMapping("/log-session")
    public ResponseEntity<String> logSession(@Valid @RequestBody PTSessionLogRequestDTO request) {
        ptService.logSession(request);
        return ResponseEntity.ok("Session logged successfully");
    }

    @GetMapping({"/active", "/active-participants"})
    public ResponseEntity<List<PTSubscriptionResponseDTO>> getActiveSubscriptions() {
        return ResponseEntity.ok(ptService.getActivePTSubscriptions());
    }

    @GetMapping("/all")
    public ResponseEntity<List<PTSubscriptionResponseDTO>> getAllSubscriptions() {
        return ResponseEntity.ok(ptService.getAllPTSubscriptions());
    }
}

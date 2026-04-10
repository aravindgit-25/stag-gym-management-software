package com.stag.gym.controller;

import com.stag.gym.dto.DietPlanFoodRequestDTO;
import com.stag.gym.dto.DietPlanResponseDTO;
import com.stag.gym.model.DietPlan;
import com.stag.gym.service.DietPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/diet-plans")
@RequiredArgsConstructor
public class DietPlanController {

    private final DietPlanService dietPlanService;

    @PostMapping("/member/{memberId}/generate")
    public ResponseEntity<DietPlanResponseDTO> createOrUpdateDietPlan(
            @PathVariable Long memberId,
            @RequestParam DietPlan.PlanType type,
            @RequestParam DietPlan.DietCategory category) {
        return ResponseEntity.ok(dietPlanService.createOrUpdateDietPlan(memberId, type, category));
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<DietPlanResponseDTO> getDietPlanByMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(dietPlanService.getDietPlanByMember(memberId));
    }

    @PostMapping("/member/{memberId}/food")
    public ResponseEntity<DietPlanResponseDTO> addFoodToPlan(
            @PathVariable Long memberId,
            @RequestBody DietPlanFoodRequestDTO request) {
        return ResponseEntity.ok(dietPlanService.addFoodToPlan(memberId, request));
    }

    @DeleteMapping("/member/{memberId}/food/{detailId}")
    public ResponseEntity<DietPlanResponseDTO> removeFoodFromPlan(
            @PathVariable Long memberId,
            @PathVariable Long detailId) {
        return ResponseEntity.ok(dietPlanService.removeFoodFromPlan(memberId, detailId));
    }
}

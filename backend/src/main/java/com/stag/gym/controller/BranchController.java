package com.stag.gym.controller;

import com.stag.gym.dto.BranchCreateRequestDTO;
import com.stag.gym.model.Branch;
import com.stag.gym.repository.BranchRepository;
import com.stag.gym.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchRepository branchRepository;
    private final BranchService branchService;
    private final com.stag.gym.repository.UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        return ResponseEntity.ok(branchRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Branch> createBranch(@RequestBody BranchCreateRequestDTO request) {
        return new ResponseEntity<>(branchService.createBranchWithOwner(request), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {
        branchRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/credentials/{branchId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<java.util.Map<String, String>> getBranchCredentials(@PathVariable Long branchId) {
        return userRepository.findAll().stream()
                .filter(u -> u.getBranch() != null && u.getBranch().getId().equals(branchId) && u.getRole() == com.stag.gym.model.User.Role.OWNER)
                .findFirst()
                .map(u -> {
                    java.util.Map<String, String> creds = new java.util.HashMap<>();
                    creds.put("email", u.getEmail());
                    creds.put("role", u.getRole().name());
                    return ResponseEntity.ok(creds);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

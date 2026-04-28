package com.stag.gym.service;

import com.stag.gym.dto.BranchCreateRequestDTO;
import com.stag.gym.model.Branch;
import com.stag.gym.model.User;
import com.stag.gym.repository.BranchRepository;
import com.stag.gym.repository.UserRepository;
import com.stag.gym.security.BranchContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Branch getCurrentBranch() {
        Long branchId = BranchContext.getCurrentBranchId();
        if (branchId == null) {
            throw new RuntimeException("No branch selected in context");
        }
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + branchId));
    }

    @Transactional
    public Branch createBranchWithOwner(BranchCreateRequestDTO request) {
        // 1. Create the Branch
        Branch branch = Branch.builder()
                .branchName(request.getBranchName())
                .location(request.getLocation())
                .build();
        Branch savedBranch = branchRepository.save(branch);

        // 2. Create the Owner User for this branch
        User owner = User.builder()
                .name(request.getBranchName() + " Admin")
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.OWNER)
                .branch(savedBranch)
                .build();
        userRepository.save(owner);

        return savedBranch;
    }
}

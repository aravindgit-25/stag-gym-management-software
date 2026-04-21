package com.stag.gym.service;

import com.stag.gym.model.Branch;
import com.stag.gym.repository.BranchRepository;
import com.stag.gym.security.BranchContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;

    public Branch getCurrentBranch() {
        Long branchId = BranchContext.getCurrentBranchId();
        if (branchId == null) {
            throw new RuntimeException("No branch selected in context");
        }
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found with id: " + branchId));
    }
}

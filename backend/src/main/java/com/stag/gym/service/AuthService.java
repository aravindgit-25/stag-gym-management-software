package com.stag.gym.service;

import com.stag.gym.dto.LoginRequestDTO;
import com.stag.gym.dto.LoginResponseDTO;
import com.stag.gym.model.Branch;
import com.stag.gym.model.User;
import com.stag.gym.repository.BranchRepository;
import com.stag.gym.repository.UserRepository;
import com.stag.gym.security.JwtUtils;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        if (branchRepository.count() == 0) {
            Branch defaultBranch = Branch.builder()
                    .branchName("Main Branch")
                    .location("Downtown")
                    .build();
            branchRepository.save(defaultBranch);
            
            Branch branch2 = Branch.builder()
                    .branchName("North Branch")
                    .location("North Side")
                    .build();
            branchRepository.save(branch2);
        }

        // Ensure we have a branch with ID 1 if possible, otherwise use the first one
        Branch mainBranch = branchRepository.findById(1L).orElse(branchRepository.findAll().get(0));

        if (userRepository.findByEmail("owner@gym.com").isEmpty()) {
            User owner = User.builder()
                    .name("Owner")
                    .email("owner@gym.com")
                    .password(passwordEncoder.encode("owner123"))
                    .role(User.Role.OWNER)
                    .branch(mainBranch)
                    .build();
            userRepository.save(owner);
        }
        
        if (userRepository.findByEmail("trainer@gym.com").isEmpty()) {
            User trainer = User.builder()
                    .name("Trainer")
                    .email("trainer@gym.com")
                    .password(passwordEncoder.encode("trainer123"))
                    .role(User.Role.TRAINER)
                    .branch(mainBranch)
                    .build();
            userRepository.save(trainer);
        }
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtils.generateToken(user);

        return LoginResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .branchId(user.getBranch() != null ? user.getBranch().getId() : null)
                .token(token)
                .build();
    }

    public User createUser(User user) {
        if (user.getBranch() == null) {
            throw new RuntimeException("Branch is required for user creation");
        }

        long userCount = userRepository.countByBranchId(user.getBranch().getId());
        if (userCount >= 5) {
            throw new RuntimeException("User limit reached for this branch (Max 5 users)");
        }

        return userRepository.save(user);
    }
}

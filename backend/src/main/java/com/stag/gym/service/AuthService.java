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
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        try {
            Branch mainBranch;
            Branch northBranch;
            if (branchRepository.count() == 0) {
                log.info("Initializing default branches...");
                mainBranch = Branch.builder()
                        .branchName("Main Branch")
                        .location("Downtown")
                        .build();
                mainBranch = branchRepository.save(mainBranch);
                
                northBranch = Branch.builder()
                        .branchName("North Branch")
                        .location("North Side")
                        .build();
                northBranch = branchRepository.save(northBranch);
            } else {
                java.util.List<Branch> branches = branchRepository.findAll();
                mainBranch = branches.get(0);
                northBranch = branches.size() > 1 ? branches.get(1) : mainBranch;
            }

            createOrUpdateDefaultUser("owner@gym.com", "owner123", User.Role.OWNER, mainBranch);
            createOrUpdateDefaultUser("trainer@gym.com", "trainer123", User.Role.TRAINER, northBranch);
            
            log.info("Registered users in DB: {}", userRepository.findAll().stream().map(User::getEmail).toList());
        } catch (Exception e) {
            log.error("Error during AuthService initialization", e);
        }
    }

    private void createOrUpdateDefaultUser(String email, String password, User.Role role, Branch branch) {
        userRepository.findByEmail(email).ifPresentOrElse(
            user -> {
                user.setPassword(passwordEncoder.encode(password));
                user.setRole(role);
                user.setBranch(branch);
                userRepository.save(user);
                log.info("User {} synchronized.", email);
            },
            () -> {
                User user = User.builder()
                        .name(role.name())
                        .email(email)
                        .password(passwordEncoder.encode(password))
                        .role(role)
                        .branch(branch)
                        .build();
                userRepository.save(user);
                log.info("User {} created.", email);
            }
        );
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        String email = request.getEmail().toLowerCase().trim();
        log.info("Login attempt for email: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found - {}", email);
                    return new RuntimeException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed: Password mismatch for user - {}", email);
            throw new RuntimeException("Invalid email or password");
        }

        log.info("User logged in successfully: {}", email);
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

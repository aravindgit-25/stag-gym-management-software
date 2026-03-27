package com.stag.gym.service;

import com.stag.gym.dto.LoginRequestDTO;
import com.stag.gym.dto.LoginResponseDTO;
import com.stag.gym.model.User;
import com.stag.gym.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    @PostConstruct
    public void init() {
        if (!userRepository.existsByRole(User.Role.ADMIN)) {
            User admin = User.builder()
                    .name("Admin")
                    .email("admin@gym.com")
                    .password("admin123") // Should be hashed in real scenario
                    .role(User.Role.ADMIN)
                    .build();
            userRepository.save(admin);
        }
        
        if (userRepository.findByEmail("staff@gym.com").isEmpty()) {
            User staff = User.builder()
                    .name("Staff")
                    .email("staff@gym.com")
                    .password("staff123") // Should be hashed in real scenario
                    .role(User.Role.STAFF)
                    .build();
            userRepository.save(staff);
        }
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // Match password (plaintext comparison for now as requested)
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return LoginResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}

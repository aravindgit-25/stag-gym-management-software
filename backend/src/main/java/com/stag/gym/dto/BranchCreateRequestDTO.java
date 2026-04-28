package com.stag.gym.dto;

import lombok.Data;

@Data
public class BranchCreateRequestDTO {
    private String branchName;
    private String location;
    private String email;
    private String password;
}

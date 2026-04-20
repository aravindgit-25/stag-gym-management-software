package com.stag.gym.dto;

import com.stag.gym.model.Employee;
import com.stag.gym.model.EmployeeFeedback;
import com.stag.gym.model.PersonalTrainerMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeProfileResponseDTO {
    private Employee employee;
    private List<EmployeeFeedback> feedbacks;
    private List<PersonalTrainerMember> trainingSessions;
}

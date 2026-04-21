package com.stag.gym.service;

import com.stag.gym.dto.EmployeeProfileResponseDTO;
import com.stag.gym.model.Employee;
import com.stag.gym.repository.EmployeeFeedbackRepository;
import com.stag.gym.repository.EmployeeRepository;
import com.stag.gym.repository.PersonalTrainerMemberRepository;
import com.stag.gym.security.BranchContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeFeedbackRepository feedbackRepository;
    private final PersonalTrainerMemberRepository trainingRepository;
    private final BranchService branchService;

    @Transactional
    public Employee createEmployee(Employee employee) {
        if (employee.getDateOfJoining() == null) {
            employee.setDateOfJoining(LocalDate.now());
        }
        employee.setEmployeeId(generateEmployeeId());
        employee.setStatus(Employee.Status.ACTIVE);
        employee.setBranch(branchService.getCurrentBranch());
        return employeeRepository.save(employee);
    }

    private String generateEmployeeId() {
        Long branchId = BranchContext.getCurrentBranchId();
        Optional<String> lastId = employeeRepository.findLastEmployeeId(branchId);
        int nextNumber = 1;
        if (lastId.isPresent() && lastId.get().startsWith("SG-EMP-")) {
            try {
                String numericPart = lastId.get().substring(7);
                nextNumber = Integer.parseInt(numericPart) + 1;
            } catch (NumberFormatException e) {
                // fallback
            }
        }
        return String.format("SG-EMP-%03d", nextNumber);
    }

    public List<Employee> getAllEmployees() {
        Long branchId = BranchContext.getCurrentBranchId();
        return employeeRepository.findByBranchId(branchId);
    }

    public Optional<Employee> getEmployeeById(Long id) {
        Long branchId = BranchContext.getCurrentBranchId();
        return employeeRepository.findById(id)
                .filter(e -> e.getBranch().getId().equals(branchId));
    }

    @Transactional
    public Employee updateEmployee(Long id, Employee details) {
        Long branchId = BranchContext.getCurrentBranchId();
        Employee employee = employeeRepository.findById(id)
                .filter(e -> e.getBranch().getId().equals(branchId))
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        employee.setName(details.getName());
        employee.setPhone(details.getPhone());
        employee.setEmail(details.getEmail());
        employee.setAddress(details.getAddress());
        employee.setRole(details.getRole());
        employee.setEducation(details.getEducation());
        employee.setExperience(details.getExperience());
        
        // Proofs
        employee.setAadharNumber(details.getAadharNumber());
        employee.setPanNumber(details.getPanNumber());
        employee.setIdProofType(details.getIdProofType());
        employee.setIdProofNumber(details.getIdProofNumber());

        // Emergency
        employee.setEmergencyContactName(details.getEmergencyContactName());
        employee.setEmergencyContactPhone(details.getEmergencyContactPhone());
        employee.setEmergencyContactRelation(details.getEmergencyContactRelation());

        // Salary
        employee.setBaseSalary(details.getBaseSalary());
        employee.setBankName(details.getBankName());
        employee.setBankAccountNumber(details.getBankAccountNumber());
        employee.setIfscCode(details.getIfscCode());

        return employeeRepository.save(employee);
    }

    @Transactional
    public void terminateEmployee(Long id) {
        Long branchId = BranchContext.getCurrentBranchId();
        Employee employee = employeeRepository.findById(id)
                .filter(e -> e.getBranch().getId().equals(branchId))
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        employee.setStatus(Employee.Status.TERMINATED);
        employee.setDateOfTermination(LocalDate.now());
        employeeRepository.save(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeProfileResponseDTO getEmployeeProfile(Long id) {
        Long branchId = BranchContext.getCurrentBranchId();
        Employee employee = employeeRepository.findById(id)
                .filter(e -> e.getBranch().getId().equals(branchId))
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return EmployeeProfileResponseDTO.builder()
                .employee(employee)
                .feedbacks(feedbackRepository.findByEmployeeId(id))
                .trainingSessions(trainingRepository.findByTrainerId(id))
                .build();
    }

    public List<Employee> getActiveEmployees() {
        Long branchId = BranchContext.getCurrentBranchId();
        return employeeRepository.findByStatusAndBranchId(Employee.Status.ACTIVE, branchId);
    }
}

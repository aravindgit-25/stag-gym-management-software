package com.stag.gym.service;

import com.stag.gym.model.Employee;
import com.stag.gym.repository.EmployeeRepository;
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

    @Transactional
    public Employee createEmployee(Employee employee) {
        if (employee.getDateOfJoining() == null) {
            employee.setDateOfJoining(LocalDate.now());
        }
        employee.setEmployeeId(generateEmployeeId());
        employee.setStatus(Employee.Status.ACTIVE);
        return employeeRepository.save(employee);
    }

    private String generateEmployeeId() {
        Optional<String> lastId = employeeRepository.findLastEmployeeId();
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
        return employeeRepository.findAll();
    }

    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    @Transactional
    public Employee updateEmployee(Long id, Employee details) {
        Employee employee = employeeRepository.findById(id)
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
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        employee.setStatus(Employee.Status.TERMINATED);
        employee.setDateOfTermination(LocalDate.now());
        employeeRepository.save(employee);
    }

    public List<Employee> getActiveEmployees() {
        return employeeRepository.findByStatus(Employee.Status.ACTIVE);
    }
}

package com.stag.gym.service;

import com.stag.gym.model.Member;
import com.stag.gym.repository.MemberRepository;
import com.stag.gym.repository.SubscriptionRepository;
import com.stag.gym.security.BranchContext;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BranchService branchService;

    @Transactional
    public Member registerMember(Member member) {
        if (member.getJoinDate() == null) {
            member.setJoinDate(LocalDate.now());
        }
        if (member.getJoiningDate() == null) {
            member.setJoiningDate(LocalDate.now());
        }
        member.setRegistrationId(generateRegistrationId());
        member.setBranch(branchService.getCurrentBranch());
        return memberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public String getNextRegistrationId() {
        return generateRegistrationId();
    }

    private String generateRegistrationId() {
        Optional<String> lastId = memberRepository.findLastRegistrationId();
        int nextNumber = 1;
        if (lastId.isPresent() && lastId.get().startsWith("SG-")) {
            try {
                String numericPart = lastId.get().substring(3);
                nextNumber = Integer.parseInt(numericPart) + 1;
            } catch (NumberFormatException e) {
                // fallback to 1 if something's wrong
            }
        }
        return String.format("SG-%03d", nextNumber);
    }

    @Transactional(readOnly = true)
    public List<Member> getAllMembers() {
        return memberRepository.findByBranchId(BranchContext.getCurrentBranchId());
    }

    @Transactional(readOnly = true)
    public List<Member> getActiveMembers() {
        return memberRepository.findActiveMembers(LocalDate.now(), BranchContext.getCurrentBranchId());
    }

    @Transactional(readOnly = true)
    public List<Member> getExpiredMembers() {
        return memberRepository.findExpiredMembers(LocalDate.now(), BranchContext.getCurrentBranchId());
    }

    @Transactional(readOnly = true)
    public Optional<Member> getMemberById(Long id) {
        return memberRepository.findById(id).filter(m -> m.getBranch().getId().equals(BranchContext.getCurrentBranchId()));
    }

    @Transactional
    public Member updateMember(Long id, Member memberDetails) {
        Member member = getMemberById(id)
                .orElseThrow(() -> new RuntimeException("Member not found with id: " + id));
        
        member.setName(memberDetails.getName());
        member.setPhone(memberDetails.getPhone());
        member.setEmail(memberDetails.getEmail());
        member.setDob(memberDetails.getDob());
        member.setAddress(memberDetails.getAddress());
        member.setBloodGroup(memberDetails.getBloodGroup());
        member.setWeight(memberDetails.getWeight());
        member.setHeight(memberDetails.getHeight());
        member.setFitnessGoal(memberDetails.getFitnessGoal());
        member.setEmergencyContactName(memberDetails.getEmergencyContactName());
        member.setEmergencyContactPhone(memberDetails.getEmergencyContactPhone());
        member.setGender(memberDetails.getGender());
        member.setJoinDate(memberDetails.getJoinDate());
        member.setJoiningDate(memberDetails.getJoiningDate());
        member.setIdProofType(memberDetails.getIdProofType());
        member.setIdProofNumber(memberDetails.getIdProofNumber());
        member.setStatus(memberDetails.getStatus());
        
        return memberRepository.save(member);
    }

    @Transactional
    public void softDeleteMember(Long id) {
        Member member = getMemberById(id)
                .orElseThrow(() -> new RuntimeException("Member not found with id: " + id));
        
        if (subscriptionRepository.existsByMemberIdAndBranchId(id, BranchContext.getCurrentBranchId())) {
            throw new RuntimeException("Cannot deactivate member: active subscriptions exist.");
        }

        member.setStatus(Member.Status.INACTIVE);
        memberRepository.save(member);
    }

    public long countAll() {
        return memberRepository.countByBranchId(BranchContext.getCurrentBranchId()); // Simple count
    }

    public long getActiveCount() {
        return memberRepository.countByStatusAndBranchId(Member.Status.ACTIVE, BranchContext.getCurrentBranchId());
    }

    public boolean existsByPhone(String phone) {
        return memberRepository.findByPhoneAndBranchId(phone, BranchContext.getCurrentBranchId()).isPresent();
    }
}

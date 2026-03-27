package com.stag.gym.service;

import com.stag.gym.model.Member;
import com.stag.gym.repository.MemberRepository;
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

    @Transactional
    public Member registerMember(Member member) {
        if (member.getJoinDate() == null) {
            member.setJoinDate(LocalDate.now());
        }
        return memberRepository.save(member);
    }

    public List<Member> getAllMembers() {
        return memberRepository.findAll();
    }

    public List<Member> getActiveMembers() {
        return memberRepository.findActiveMembers(LocalDate.now());
    }

    public List<Member> getExpiredMembers() {
        return memberRepository.findExpiredMembers(LocalDate.now());
    }

    public Optional<Member> getMemberById(Long id) {
        return memberRepository.findById(id);
    }

    @Transactional
    public Member updateMember(Long id, Member memberDetails) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found with id: " + id));
        
        member.setName(memberDetails.getName());
        member.setPhone(memberDetails.getPhone());
        member.setGender(memberDetails.getGender());
        member.setStatus(memberDetails.getStatus());
        member.setBranch(memberDetails.getBranch());
        
        return memberRepository.save(member);
    }

    @Transactional
    public void softDeleteMember(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found with id: " + id));
        member.setStatus(Member.Status.INACTIVE);
        memberRepository.save(member);
    }

    public long countAll() {
        return memberRepository.count();
    }

    public long getActiveCount() {
        return memberRepository.countByStatus(Member.Status.ACTIVE);
    }
}

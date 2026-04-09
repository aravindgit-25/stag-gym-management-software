package com.stag.gym.service;

import com.stag.gym.model.Member;
import com.stag.gym.repository.MemberRepository;
import com.stag.gym.repository.SubscriptionRepository;

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

    @Transactional
    public Member registerMember(Member member) {
        if (member.getJoinDate() == null) {
            member.setJoinDate(LocalDate.now());
        }
        member.setRegistrationId(generateRegistrationId());
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

    @Transactional
    public List<Member> getAllMembers() {
        List<Member> members = memberRepository.findAll();
        backfillRegistrationIds(members);
        return members;
    }

    @Transactional
    public List<Member> getActiveMembers() {
        List<Member> members = memberRepository.findActiveMembers(LocalDate.now());
        backfillRegistrationIds(members);
        return members;
    }

    @Transactional
    public List<Member> getExpiredMembers() {
        List<Member> members = memberRepository.findExpiredMembers(LocalDate.now());
        backfillRegistrationIds(members);
        return members;
    }

    private void backfillRegistrationIds(List<Member> members) {
        boolean needsSave = false;
        String lastIdStr = memberRepository.findLastRegistrationId().orElse("SG-000");
        int nextNumber = 1;
        if (lastIdStr.startsWith("SG-")) {
            try {
                nextNumber = Integer.parseInt(lastIdStr.substring(3)) + 1;
            } catch (NumberFormatException e) {
                nextNumber = 1;
            }
        }

        for (Member member : members) {
            if (member.getRegistrationId() == null) {
                member.setRegistrationId(String.format("SG-%03d", nextNumber++));
                memberRepository.save(member);
                needsSave = true;
            }
        }
        if (needsSave) {
            memberRepository.flush();
        }
    }

    @Transactional
    public Optional<Member> getMemberById(Long id) {
        return memberRepository.findById(id).map(member -> {
            if (member.getRegistrationId() == null) {
                member.setRegistrationId(generateRegistrationId());
                return memberRepository.saveAndFlush(member);
            }
            return member;
        });
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
        
        if (subscriptionRepository.existsByMemberId(id)) {
            throw new RuntimeException("Cannot deactivate member: active subscriptions exist.");
        }

        member.setStatus(Member.Status.INACTIVE);
        memberRepository.save(member);
    }

    public long countAll() {
        return memberRepository.count();
    }

    public long getActiveCount() {
        return memberRepository.countByStatus(Member.Status.ACTIVE);
    }

    public boolean existsByPhone(String phone) {
        return memberRepository.findByPhone(phone).isPresent();
    }
}

package com.stag.gym.repository;

import com.stag.gym.model.PersonalTrainerMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonalTrainerMemberRepository extends JpaRepository<PersonalTrainerMember, Long> {
    List<PersonalTrainerMember> findByTrainerId(Long trainerId);
    List<PersonalTrainerMember> findByMemberId(Long memberId);
}

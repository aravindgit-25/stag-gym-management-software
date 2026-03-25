package com.stag.gym.repository;

import com.stag.gym.model.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByPhone(String phone);

    @Query("SELECT DISTINCT m FROM Member m JOIN Subscription s ON s.member.id = m.id WHERE s.status = 'ACTIVE' AND s.endDate >= :today")
    List<Member> findActiveMembers(@Param("today") LocalDate today);

    @Query("SELECT DISTINCT m FROM Member m JOIN Subscription s ON s.member.id = m.id WHERE s.endDate < :today")
    List<Member> findExpiredMembers(@Param("today") LocalDate today);
}

package org.example.soundwavebackend.authentication.repository;

import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUserId(Long userId);
    boolean existsByUsername(String username);
    boolean existsByUsernameIgnoreCaseAndUserIdNot(String username, Long userId);

    @EntityGraph(attributePaths = {"user", "user.role"})
    Optional<UserProfile> findByUser_EmailIgnoreCase(String email);
}

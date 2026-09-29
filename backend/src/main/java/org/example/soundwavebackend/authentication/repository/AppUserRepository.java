package org.example.soundwavebackend.authentication.repository;

import org.example.soundwavebackend.authentication.entity.AppUser;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    boolean existsByEmailIgnoreCase(String email);
    @EntityGraph(attributePaths = "role")
    Optional<AppUser> findByEmailIgnoreCase(String email);
}

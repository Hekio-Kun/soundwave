package org.example.soundwavebackend.security;

import lombok.RequiredArgsConstructor;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SoundWaveUserDetailsService implements UserDetailsService {
    private final AppUserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("User was not found"));
        return User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getCode())))
                .disabled(user.getDeletedAt() != null)
                .accountLocked(user.getStatus().name().equals("BANNED"))
                .build();
    }
}

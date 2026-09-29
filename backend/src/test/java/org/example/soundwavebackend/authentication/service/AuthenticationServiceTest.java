package org.example.soundwavebackend.authentication.service;

import org.example.soundwavebackend.authentication.dto.request.RegisterRequest;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.Role;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.authentication.exception.EmailAlreadyExistsException;
import org.example.soundwavebackend.authentication.mapper.AuthenticationMapper;
import org.example.soundwavebackend.authentication.repository.*;
import org.example.soundwavebackend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {
    @Mock private AppUserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserProfileRepository profileRepository;
    @Mock private EmailVerificationTokenRepository verificationTokenRepository;
    @Mock private PasswordResetTokenRepository resetTokenRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private OtpGenerator otpGenerator;
    @Mock private TokenHashService tokenHashService;
    @Mock private AuthenticationMailService mailService;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationMapper mapper;

    private AuthenticationService service;

    @BeforeEach
    void setUp() {
        service = new AuthenticationService(userRepository, roleRepository, profileRepository,
                verificationTokenRepository, resetTokenRepository, refreshTokenRepository,
                passwordEncoder, otpGenerator, tokenHashService, mailService, jwtService, mapper);
        ReflectionTestUtils.setField(service, "otpExpirationMinutes", 10L);
        ReflectionTestUtils.setField(service, "otpResendSeconds", 60L);
        ReflectionTestUtils.setField(service, "refreshTokenDays", 7L);
        ReflectionTestUtils.setField(service, "rememberRefreshTokenDays", 30L);
    }

    @Test
    void registerCreatesPendingAccountAndSendsOtp() {
        RegisterRequest request = new RegisterRequest("Le Hai", "User@Example.com", "Password1", "Password1");
        Role role = mock(Role.class);
        when(userRepository.existsByEmailIgnoreCase("user@example.com")).thenReturn(false);
        when(roleRepository.findByCode("LISTENER")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("Password1")).thenReturn("password-hash");
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(profileRepository.existsByUsername("user")).thenReturn(false);
        when(otpGenerator.generate()).thenReturn("123456");
        when(passwordEncoder.encode("123456")).thenReturn("otp-hash");

        service.register(request);

        verify(profileRepository).save(any(UserProfile.class));
        verify(verificationTokenRepository).save(any());
        verify(mailService).sendVerificationOtp("user@example.com", "Le Hai", "123456", 10L);
    }

    @Test
    void registerRejectsAnExistingEmailBeforeSendingOtp() {
        RegisterRequest request = new RegisterRequest("Le Hai", "user@example.com", "Password1", "Password1");
        when(userRepository.existsByEmailIgnoreCase("user@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> service.register(request));

        verifyNoInteractions(mailService);
        verify(userRepository, never()).save(any());
    }
}

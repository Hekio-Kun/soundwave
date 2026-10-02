package org.example.soundwavebackend.authentication.service;

import org.example.soundwavebackend.authentication.dto.request.RegisterRequest;
import org.example.soundwavebackend.authentication.dto.request.LoginRequest;
import org.example.soundwavebackend.authentication.dto.request.ResetPasswordRequest;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.PasswordResetToken;
import org.example.soundwavebackend.authentication.entity.RefreshToken;
import org.example.soundwavebackend.authentication.entity.Role;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.authentication.entity.UserStatus;
import org.example.soundwavebackend.authentication.exception.AccountBannedException;
import org.example.soundwavebackend.authentication.exception.EmailNotVerifiedException;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
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

    @Test
    void loginRejectsAccountWithUnverifiedEmailUsingSpecificCode() {
        AppUser user = mock(AppUser.class);
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(user.getPasswordHash()).thenReturn("password-hash");
        when(passwordEncoder.matches("Password1", "password-hash")).thenReturn(true);
        when(user.getStatus()).thenReturn(UserStatus.PENDING);

        EmailNotVerifiedException exception = assertThrows(EmailNotVerifiedException.class,
                () -> service.login(new LoginRequest("user@example.com", "Password1", false)));

        assertEquals("EMAIL_NOT_VERIFIED", exception.getCode());
        verifyNoInteractions(jwtService);
    }

    @Test
    void loginRejectsBannedAccountUsingSpecificCode() {
        AppUser user = mock(AppUser.class);
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(user.getPasswordHash()).thenReturn("password-hash");
        when(passwordEncoder.matches("Password1", "password-hash")).thenReturn(true);
        when(user.getStatus()).thenReturn(UserStatus.BANNED);

        AccountBannedException exception = assertThrows(AccountBannedException.class,
                () -> service.login(new LoginRequest("user@example.com", "Password1", false)));

        assertEquals("ACCOUNT_BANNED", exception.getCode());
        verifyNoInteractions(jwtService);
    }

    @Test
    void resetPasswordRevokesAllActiveRefreshTokens() {
        AppUser user = mock(AppUser.class);
        PasswordResetToken resetToken = mock(PasswordResetToken.class);
        ResetPasswordRequest request = new ResetPasswordRequest(
                "user@example.com", "123456", "NewPassword1", "NewPassword1");

        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(user.getId()).thenReturn(42L);
        when(resetTokenRepository.findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(42L))
                .thenReturn(Optional.of(resetToken));
        when(resetToken.getTokenHash()).thenReturn("otp-hash");
        when(resetToken.isExpired(any())).thenReturn(false);
        when(passwordEncoder.matches("123456", "otp-hash")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword1")).thenReturn("new-password-hash");

        service.resetPassword(request);

        verify(resetToken).markUsed(any());
        verify(user).changePassword(eq("new-password-hash"), any());
        verify(refreshTokenRepository).revokeAllActiveByUserId(eq(42L), any());
    }

    @Test
    void logoutRevokesTheCurrentSession() {
        RefreshToken session = mock(RefreshToken.class);
        when(tokenHashService.hash("raw-refresh-token")).thenReturn("refresh-token-hash");
        when(refreshTokenRepository.findByTokenHash("refresh-token-hash")).thenReturn(Optional.of(session));

        service.logout("raw-refresh-token");

        verify(session).revoke(any());
    }
}

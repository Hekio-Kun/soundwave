package org.example.soundwavebackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.Role;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.example.soundwavebackend.authentication.repository.RoleRepository;
import org.example.soundwavebackend.authentication.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Locale;

/**
 * Tự động khởi tạo vai trò và tài khoản hệ thống mặc định khi hệ thống khởi động.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements ApplicationRunner {
    private final RoleRepository roleRepository;
    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.auto-create:true}")
    private boolean adminAutoCreate;

    @Value("${app.admin.email:admin@soundwave.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123456}")
    private String adminPassword;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.display-name:System Administrator}")
    private String adminDisplayName;

    @Value("${app.staff.auto-create:true}")
    private boolean staffAutoCreate;

    @Value("${app.staff.email:staff@soundwave.com}")
    private String staffEmail;

    @Value("${app.staff.password:Staff@123456}")
    private String staffPassword;

    @Value("${app.staff.username:staff}")
    private String staffUsername;

    @Value("${app.staff.display-name:Content Moderator}")
    private String staffDisplayName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initRoles();
        if (adminAutoCreate) {
            initSystemAccount("ADMIN", adminEmail, adminPassword, adminUsername, adminDisplayName);
        }
        if (staffAutoCreate) {
            initSystemAccount("STAFF", staffEmail, staffPassword, staffUsername, staffDisplayName);
        }
    }

    private void initRoles() {
        createRoleIfAbsent("LISTENER", "Listener", "Standard SoundWave listener account");
        createRoleIfAbsent("STAFF", "Staff", "Content moderation account");
        createRoleIfAbsent("ADMIN", "Administrator", "System administration account");
    }

    private void createRoleIfAbsent(String code, String name, String description) {
        if (roleRepository.findByCode(code).isEmpty()) {
            roleRepository.save(new Role(code, name, description));
            log.info("Initialized default system role: {}", code);
        }
    }

    private void initSystemAccount(
            String roleCode,
            String email,
            String password,
            String configuredUsername,
            String displayName) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.info("{} account already exists with email: {}", roleCode, normalizedEmail);
            return;
        }

        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new IllegalStateException(roleCode + " role could not be found"));

        AppUser systemUser = new AppUser(role, normalizedEmail, passwordEncoder.encode(password));
        systemUser.verifyEmail(LocalDateTime.now(ZoneOffset.UTC));
        AppUser savedUser = userRepository.save(systemUser);

        String username = configuredUsername.trim().toLowerCase(Locale.ROOT);
        if (profileRepository.existsByUsername(username)) {
            username = username + "_" + savedUser.getId();
        }

        UserProfile profile = new UserProfile(savedUser, username, displayName.trim());
        profileRepository.save(profile);

        log.info("Successfully created default {} account (Email: {}, Username: {})",
                roleCode, normalizedEmail, username);
    }
}

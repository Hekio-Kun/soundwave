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

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements ApplicationRunner {
    private final RoleRepository roleRepository;
    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.auto-create:true}")
    private boolean autoCreate;

    @Value("${app.admin.email:admin@soundwave.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123456}")
    private String adminPassword;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.display-name:System Administrator}")
    private String adminDisplayName;

    @Value("${app.staff.email:staff@soundwave.com}")
    private String staffEmail;

    @Value("${app.staff.password:Admin@123456}")
    private String staffPassword;

    @Value("${app.staff.username:staff}")
    private String staffUsername;

    @Value("${app.staff.display-name:Moderation Staff}")
    private String staffDisplayName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initRoles();
        if (autoCreate) {
            initAdminAccount();
            initStaffAccount();
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

    private void initAdminAccount() {
        String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.info("Admin account already exists with email: {}", normalizedEmail);
            return;
        }

        Role adminRole = roleRepository.findByCode("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role could not be found"));

        AppUser adminUser = new AppUser(adminRole, normalizedEmail, passwordEncoder.encode(adminPassword));
        adminUser.verifyEmail(LocalDateTime.now(ZoneOffset.UTC));
        AppUser savedUser = userRepository.save(adminUser);

        String username = adminUsername.trim().toLowerCase(Locale.ROOT);
        if (profileRepository.existsByUsername(username)) {
            username = username + "_" + savedUser.getId();
        }

        UserProfile profile = new UserProfile(savedUser, username, adminDisplayName.trim());
        profileRepository.save(profile);

        log.info("Successfully created default admin account (Email: {}, Username: {})", normalizedEmail, username);
    }

    private void initStaffAccount() {
        String normalizedEmail = staffEmail.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.info("Staff account already exists with email: {}", normalizedEmail);
            return;
        }

        Role staffRole = roleRepository.findByCode("STAFF")
                .orElseThrow(() -> new IllegalStateException("STAFF role could not be found"));

        AppUser staffUser = new AppUser(staffRole, normalizedEmail, passwordEncoder.encode(staffPassword));
        staffUser.verifyEmail(LocalDateTime.now(ZoneOffset.UTC));
        AppUser savedUser = userRepository.save(staffUser);

        String username = staffUsername.trim().toLowerCase(Locale.ROOT);
        if (profileRepository.existsByUsername(username)) {
            username = username + "_" + savedUser.getId();
        }

        UserProfile profile = new UserProfile(savedUser, username, staffDisplayName.trim());
        profileRepository.save(profile);

        log.info("Successfully created default staff account (Email: {}, Username: {})", normalizedEmail, username);
    }
}

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
 * Tự động khởi tạo vai trò mặc định và tài khoản quản trị viên (Admin) khi hệ thống khởi động.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements ApplicationRunner {
    private final RoleRepository roleRepository;
    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.example.soundwavebackend.catalog.repository.GenreRepository genreRepository;

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

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initRoles();
        initGenres();
        if (autoCreate) {
            initAdminAccount();
        }
    }

    private void initRoles() {
        createRoleIfAbsent("LISTENER", "Listener", "Standard SoundWave listener account");
        createRoleIfAbsent("STAFF", "Staff", "Content moderation account");
        createRoleIfAbsent("ADMIN", "Administrator", "System administration account");
    }

    private void initGenres() {
        createGenreIfAbsent("Pop", "pop", "Popular mainstream music with catchy melodies.");
        createGenreIfAbsent("Ballad", "ballad", "Emotional, melodic narrative songs.");
        createGenreIfAbsent("Rap / Hip-hop", "rap-hip-hop", "Rhythmic and rhyming speech chant.");
        createGenreIfAbsent("R&B", "rnb", "Soulful rhythm and blues.");
        createGenreIfAbsent("Acoustic", "acoustic", "Pure, organic unplugged instruments.");
        createGenreIfAbsent("EDM", "edm", "Electronic dance music for energy and clubs.");
        createGenreIfAbsent("Indie", "indie", "Independent, experimental artistic sounds.");
        createGenreIfAbsent("Lofi", "lofi", "Relaxing low-fidelity chill study beats.");
    }

    private void createGenreIfAbsent(String name, String slug, String description) {
        if (genreRepository.findBySlug(slug).isEmpty()) {
            genreRepository.save(new org.example.soundwavebackend.catalog.entity.Genre(name, slug, description, null));
            log.info("Initialized default genre: {}", name);
        }
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
}

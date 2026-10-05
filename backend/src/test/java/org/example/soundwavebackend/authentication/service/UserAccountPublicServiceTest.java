package org.example.soundwavebackend.authentication.service;

import org.example.soundwavebackend.authentication.dto.response.UserProfileSummary;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.example.soundwavebackend.authentication.entity.Role;
import org.example.soundwavebackend.authentication.entity.UserProfile;
import org.example.soundwavebackend.authentication.repository.AppUserRepository;
import org.example.soundwavebackend.authentication.repository.UserProfileRepository;
import org.example.soundwavebackend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAccountPublicServiceTest {

    @Mock
    private AppUserRepository userRepository;
    @Mock
    private UserProfileRepository userProfileRepository;

    private UserAccountPublicService userAccountPublicService;

    @BeforeEach
    void setUp() {
        userAccountPublicService = new UserAccountPublicService(userRepository, userProfileRepository);
    }

    @Test
    void getUserIdByEmail_WhenUserExists_ShouldReturnId() {
        Role role = new Role("LISTENER", "Listener", "Standard listener");
        AppUser user = new AppUser(role, "user@soundwave.com", "hash");
        ReflectionTestUtils.setField(user, "id", 42L);

        when(userRepository.findByEmailIgnoreCase("user@soundwave.com")).thenReturn(Optional.of(user));

        Long id = userAccountPublicService.getUserIdByEmail("user@soundwave.com");
        assertEquals(42L, id);
    }

    @Test
    void getUserIdByEmail_WhenNotFound_ShouldThrowException() {
        when(userRepository.findByEmailIgnoreCase("unknown@soundwave.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                userAccountPublicService.getUserIdByEmail("unknown@soundwave.com"));
    }

    @Test
    void getUserSummaryById_ShouldReturnProfileInfo() {
        Role role = new Role("LISTENER", "Listener", "Standard listener");
        AppUser user = new AppUser(role, "artist@soundwave.com", "hash");
        ReflectionTestUtils.setField(user, "id", 10L);

        UserProfile profile = new UserProfile(user, "artist_handle", "Artist Display");
        ReflectionTestUtils.setField(profile, "userId", 10L);

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(userProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));

        UserProfileSummary summary = userAccountPublicService.getUserSummaryById(10L);

        assertNotNull(summary);
        assertEquals(10L, summary.userId());
        assertEquals("artist@soundwave.com", summary.email());
        assertEquals("Artist Display", summary.displayName());
        assertEquals("LISTENER", summary.role());
    }

    @Test
    void getUserSummariesByIds_ShouldBatchFetchProfilesWithoutNPlusOne() {
        Role role = new Role("LISTENER", "Listener", "Standard");
        AppUser user1 = new AppUser(role, "u1@soundwave.com", "h1");
        ReflectionTestUtils.setField(user1, "id", 1L);

        AppUser user2 = new AppUser(role, "u2@soundwave.com", "h2");
        ReflectionTestUtils.setField(user2, "id", 2L);

        UserProfile profile1 = new UserProfile(user1, "u1_handle", "User One");
        ReflectionTestUtils.setField(profile1, "userId", 1L);

        UserProfile profile2 = new UserProfile(user2, "u2_handle", "User Two");
        ReflectionTestUtils.setField(profile2, "userId", 2L);

        when(userRepository.findAllById(Set.of(1L, 2L))).thenReturn(List.of(user1, user2));
        when(userProfileRepository.findAllById(Set.of(1L, 2L))).thenReturn(List.of(profile1, profile2));

        Map<Long, UserProfileSummary> summaries = userAccountPublicService.getUserSummariesByIds(Set.of(1L, 2L));

        assertEquals(2, summaries.size());
        assertEquals("User One", summaries.get(1L).displayName());
        assertEquals("User Two", summaries.get(2L).displayName());
    }
}

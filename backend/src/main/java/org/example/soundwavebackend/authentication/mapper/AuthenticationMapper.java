package org.example.soundwavebackend.authentication.mapper;

import org.example.soundwavebackend.authentication.dto.response.UserResponse;
import org.example.soundwavebackend.authentication.entity.AppUser;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationMapper {
    public UserResponse toUserResponse(AppUser user, String displayName) {
        return new UserResponse(user.getId(), user.getEmail(), displayName, user.getRole().getCode());
    }
}

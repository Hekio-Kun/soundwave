package org.example.soundwavebackend.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.cloudinary")
public record CloudinaryProperties(
        @NotBlank String cloudName,
        @NotBlank String apiKey,
        @NotBlank String apiSecret
) {
    public boolean isConfigured() {
        return hasText(cloudName) && hasText(apiKey) && hasText(apiSecret);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}

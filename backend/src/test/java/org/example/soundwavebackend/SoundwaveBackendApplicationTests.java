package org.example.soundwavebackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "app.security.jwt-secret=SoundWave-test-secret-only-for-automated-tests-2026")
class SoundwaveBackendApplicationTests {

    @Test
    void contextLoads() {
    }

}

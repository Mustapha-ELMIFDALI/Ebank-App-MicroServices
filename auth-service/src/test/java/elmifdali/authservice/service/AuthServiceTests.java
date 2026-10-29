package elmifdali.authservice.service;

import elmifdali.authservice.dtos.*;
import elmifdali.authservice.repository.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:auth-test",
        "auth.jwt.secret=test-only-key-test-only-key-test-only-key"})
class AuthServiceTests {
    @Autowired
    AuthService service;
    @Autowired
    AppUserRepository users;

    private final String email = UUID.randomUUID() + "@example.com";
    private final String password = UUID.randomUUID().toString();

    @Test
    void storesAHashAndSignsTheUserIn() {
        service.signUp(new SignUpRequest("Test", email, password));
        assertThat(users.findByEmail(email).orElseThrow().getPasswordHash()).startsWith("$2").isNotEqualTo(password);
        assertThat(service.login(new LoginRequest(email.toUpperCase(), password)).token()).isNotBlank();
    }

    @Test
    void refusesADuplicateEmail() {
        service.signUp(new SignUpRequest("Test", email, password));
        assertThatThrownBy(() -> service.signUp(new SignUpRequest("Other", email, password)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("409");
    }

    @Test
    void locksAfterFiveFailures() {
        for (int i = 0; i < LoginAttempts.MAX_FAILURES; i++) {
            assertThatThrownBy(() -> service.login(new LoginRequest(email, "wrong-password"))).hasMessageContaining("401");
        }
        assertThatThrownBy(() -> service.login(new LoginRequest(email, "wrong-password"))).hasMessageContaining("429");
    }
}

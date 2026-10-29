package elmifdali.authservice.service;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Five failures lock an email for five minutes
@Component
public class LoginAttempts {
    static final int MAX_FAILURES = 5;
    private static final int MAX_TRACKED = 10_000;
    private static final Duration WINDOW = Duration.ofMinutes(5);

    private record Failures(int count, Instant last) {
    }

    private final Map<String, Failures> failures = new ConcurrentHashMap<>();

    boolean isLocked(String email) {
        Failures found = failures.get(email);
        return found != null && found.count() >= MAX_FAILURES && !expired(found);
    }

    void failed(String email) {
        if (failures.size() >= MAX_TRACKED) failures.values().removeIf(this::expired);
        failures.compute(email, (key, found) ->
                new Failures(found == null || expired(found) ? 1 : found.count() + 1, Instant.now()));
    }

    void succeeded(String email) {
        failures.remove(email);
    }

    private boolean expired(Failures value) {
        return value.last().plus(WINDOW).isBefore(Instant.now());
    }
}

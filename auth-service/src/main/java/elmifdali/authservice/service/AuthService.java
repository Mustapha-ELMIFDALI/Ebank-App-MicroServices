package elmifdali.authservice.service;

import elmifdali.authservice.config.SecurityConfig;
import elmifdali.authservice.dtos.*;
import elmifdali.authservice.entities.AppUser;
import elmifdali.authservice.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final AppUserRepository users;
    private final PasswordEncoder passwords;
    private final JwtEncoder tokens;
    private final LoginAttempts attempts;
    private final Duration validity;
    private final String unknownUserHash;

    public AuthService(AppUserRepository users, PasswordEncoder passwords, JwtEncoder tokens, LoginAttempts attempts,
                       @Value("${auth.jwt.validity}") Duration validity) {
        this.users = users;
        this.passwords = passwords;
        this.tokens = tokens;
        this.attempts = attempts;
        this.validity = validity;
        this.unknownUserHash = passwords.encode(UUID.randomUUID().toString());
    }

    public SessionResponse signUp(SignUpRequest request) {
        // BCrypt reads 72 bytes, not 72 characters
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The password is too long");
        }
        String email = normalize(request.email());
        if (users.existsByEmail(email)) throw taken();
        try {
            return sessionFor(users.save(AppUser.builder()
                    .name(request.name().trim())
                    .email(email)
                    .passwordHash(passwords.encode(request.password()))
                    .createdAt(Instant.now())
                    .build()));
        } catch (DataIntegrityViolationException e) {
            throw taken(); // two sign ups at the same moment
        }
    }

    public SessionResponse login(LoginRequest request) {
        String email = normalize(request.email());
        if (attempts.isLocked(email)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again in five minutes");
        }
        AppUser user = users.findByEmail(email).orElse(null);
        boolean tooLong = request.password().getBytes(StandardCharsets.UTF_8).length > 72;
        // an unknown email costs the same time as a wrong password
        boolean matches = !tooLong && passwords.matches(request.password(), user == null ? unknownUserHash : user.getPasswordHash());
        if (user == null || !matches) {
            attempts.failed(email);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
        }
        attempts.succeeded(email);
        return sessionFor(user);
    }

    public UserResponse userById(long id) {
        return users.findById(id).map(UserResponse::of)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "This user no longer exists"));
    }

    private SessionResponse sessionFor(AppUser user) {
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        Instant expiresAt = now.plus(validity);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(SecurityConfig.ISSUER).issuedAt(now).expiresAt(expiresAt)
                .subject(String.valueOf(user.getId()))
                .build();
        String token = tokens.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new SessionResponse(token, expiresAt, UserResponse.of(user));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static ResponseStatusException taken() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "An account already uses this email. Sign in instead");
    }
}

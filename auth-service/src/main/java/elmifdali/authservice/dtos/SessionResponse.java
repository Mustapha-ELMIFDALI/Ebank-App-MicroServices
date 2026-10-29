package elmifdali.authservice.dtos;

import java.time.Instant;

public record SessionResponse(String token, Instant expiresAt, UserResponse user) {
}

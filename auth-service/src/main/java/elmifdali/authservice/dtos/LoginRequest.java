package elmifdali.authservice.dtos;

import jakarta.validation.constraints.*;

public record LoginRequest(
        @NotBlank @Size(max = 160) String email,
        @NotBlank @Size(max = 72) String password) {

    // never print a password
    @Override
    public String toString() {
        return "LoginRequest[email=" + email + "]";
    }
}

package elmifdali.authservice.dtos;

import jakarta.validation.constraints.*;

public record SignUpRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 10, max = 72) String password) {

    // never print a password
    @Override
    public String toString() {
        return "SignUpRequest[email=" + email + "]";
    }
}

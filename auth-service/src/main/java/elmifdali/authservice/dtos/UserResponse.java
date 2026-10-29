package elmifdali.authservice.dtos;

import elmifdali.authservice.entities.AppUser;

public record UserResponse(Long id, String name, String email) {

    public static UserResponse of(AppUser user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}

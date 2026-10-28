package elmifdali.authservice.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity @Table(name = "app_user")
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String passwordHash;
    private Instant createdAt;
}

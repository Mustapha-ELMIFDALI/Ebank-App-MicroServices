package elmifdali.customerservice.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity @Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class Customer {
    @Id @GeneratedValue
    private Long id;
    @NotBlank
    private String name;
    @NotBlank @Email
    private String email;
}

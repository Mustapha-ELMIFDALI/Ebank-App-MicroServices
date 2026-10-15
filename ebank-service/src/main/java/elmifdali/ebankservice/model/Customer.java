package elmifdali.ebankservice.model;

import lombok.*;

// Not a JPA entity: the data belongs to customer-service
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class Customer {
    private Long id;
    private String name;
    private String email;
    // false only for the circuit breaker fallback. customer-service does not send it, hence the wrapper type
    @Getter(AccessLevel.NONE)
    private Boolean available;

    public boolean isAvailable() {
        return available == null || available;
    }
}

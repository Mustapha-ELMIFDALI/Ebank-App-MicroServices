package elmifdali.ebankservice.model;

import lombok.*;

// Not a JPA entity: the data belongs to customer-service
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class Customer {
    private Long id;
    private String name;
    private String email;
    // false when the value comes from the circuit breaker fallback
    @Builder.Default
    private boolean available = true;
}

package elmifdali.ebankservice.dtos;

import elmifdali.ebankservice.entities.AccountType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record NewAccountRequest(
        @NotNull @DecimalMin("0.00") @Digits(integer = 12, fraction = 2) BigDecimal balance,
        @NotNull AccountType type,
        @NotNull @Positive Long customerId) {
}

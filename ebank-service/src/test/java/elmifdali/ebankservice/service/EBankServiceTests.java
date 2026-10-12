package elmifdali.ebankservice.service;

import elmifdali.ebankservice.dtos.NewAccountRequest;
import elmifdali.ebankservice.entities.*;
import elmifdali.ebankservice.feign.CustomerRestClient;
import elmifdali.ebankservice.model.Customer;
import elmifdali.ebankservice.repository.BankAccountRepository;
import feign.FeignException;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class EBankServiceTests {
    private final BankAccountRepository repository = mock(BankAccountRepository.class);
    private final CustomerRestClient customers = mock(CustomerRestClient.class);
    private final EBankService service = new EBankService(repository, customers);
    private final NewAccountRequest request = new NewAccountRequest(BigDecimal.TEN, AccountType.SAVING_ACCOUNT, 7L);

    @Test
    void createsAnAccountForAnExistingCustomer() {
        when(customers.getCustomerById(7L)).thenReturn(Customer.builder().id(7L).build());
        when(repository.save(any())).thenAnswer(call -> call.getArgument(0));
        BankAccount account = service.saveBankAccount(request);
        assertThat(account.getId()).isNotBlank();
        assertThat(account.getCustomerId()).isEqualTo(7L);
    }

    @Test
    void refusesAnUnknownCustomer() {
        when(customers.getCustomerById(7L)).thenThrow(mock(FeignException.NotFound.class));
        assertThatThrownBy(() -> service.saveBankAccount(request)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("422");
        verifyNoInteractions(repository);
    }

    @Test
    void refusesToCreateFromTheFallbackCustomer() {
        when(customers.getCustomerById(7L)).thenReturn(Customer.builder().id(7L).available(false).build());
        assertThatThrownBy(() -> service.saveBankAccount(request)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("503");
        verifyNoInteractions(repository);
    }
}

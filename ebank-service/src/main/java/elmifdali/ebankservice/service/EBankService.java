package elmifdali.ebankservice.service;

import elmifdali.ebankservice.dtos.NewAccountRequest;
import elmifdali.ebankservice.entities.BankAccount;
import elmifdali.ebankservice.feign.CustomerRestClient;
import elmifdali.ebankservice.model.Customer;
import elmifdali.ebankservice.repository.BankAccountRepository;
import feign.FeignException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Validated
public class EBankService {
    private final BankAccountRepository accountRepository;
    private final CustomerRestClient customerRestClient;

    public EBankService(BankAccountRepository accountRepository, CustomerRestClient customerRestClient) {
        this.accountRepository = accountRepository;
        this.customerRestClient = customerRestClient;
    }

    public List<BankAccount> getAllBankAccounts() {
        return accountRepository.findAll();
    }

    public List<BankAccount> getAccountsByCustomer(Long customerId) {
        return accountRepository.findByCustomerId(customerId);
    }

    public BankAccount getBankAccountById(String id) {
        BankAccount account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        try {
            account.setCustomer(customerRestClient.getCustomerById(account.getCustomerId()));
        } catch (FeignException.NotFound e) {
            account.setCustomer(null);
        }
        return account;
    }

    public BankAccount saveBankAccount(@Valid NewAccountRequest request) {
        Customer owner;
        try {
            owner = customerRestClient.getCustomerById(request.customerId());
        } catch (FeignException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Customer " + request.customerId() + " does not exist");
        }
        // The fallback is good enough to display an account, never to create one
        if (!owner.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The customer cannot be verified right now, try again shortly");
        }
        return accountRepository.save(BankAccount.builder()
                .id(UUID.randomUUID().toString())
                .createdAt(Instant.now())
                .balance(request.balance())
                .type(request.type())
                .customerId(request.customerId())
                .build());
    }
}

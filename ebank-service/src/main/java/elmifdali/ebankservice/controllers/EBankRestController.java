package elmifdali.ebankservice.controllers;

import elmifdali.ebankservice.dtos.NewAccountRequest;
import elmifdali.ebankservice.entities.BankAccount;
import elmifdali.ebankservice.service.EBankService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class EBankRestController {
    private final EBankService eBankService;

    public EBankRestController(EBankService eBankService) {
        this.eBankService = eBankService;
    }

    @GetMapping("/accounts")
    public List<BankAccount> getAllBankAccounts(@RequestParam(required = false) Long customerId) {
        return customerId == null ? eBankService.getAllBankAccounts() : eBankService.getAccountsByCustomer(customerId);
    }

    @GetMapping("/accounts/{id}")
    public BankAccount getBankAccountById(@PathVariable String id) {
        return eBankService.getBankAccountById(id);
    }

    @PostMapping("/accounts")
    public BankAccount saveBankAccount(@RequestBody NewAccountRequest request) {
        return eBankService.saveBankAccount(request);
    }
}

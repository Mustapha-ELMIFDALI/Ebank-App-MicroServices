package elmifdali.ebankservice.mcp;

import elmifdali.ebankservice.dtos.NewAccountRequest;
import elmifdali.ebankservice.entities.AccountType;
import elmifdali.ebankservice.entities.BankAccount;
import elmifdali.ebankservice.service.EBankService;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class EBankMcpTools {
    private final EBankService eBankService;

    public EBankMcpTools(EBankService eBankService) {
        this.eBankService = eBankService;
    }

    @McpTool(name = "getAllBankAccounts", description = "Get all bank accounts with balance in MAD, type, creation date and customerId. The customer field is not filled by this tool")
    public List<BankAccount> getAllBankAccounts() {
        return eBankService.getAllBankAccounts();
    }

    @McpTool(name = "getAccountsByCustomer", description = "Get all the bank accounts of one customer")
    public List<BankAccount> getAccountsByCustomer(@McpToolParam(description = "The numeric customer id") Long customerId) {
        return eBankService.getAccountsByCustomer(customerId);
    }

    @McpTool(name = "getBankAccountById", description = "Get one bank account by id, including its owner")
    public BankAccount getBankAccountById(@McpToolParam(description = "The bank account id (UUID)") String id) {
        return eBankService.getBankAccountById(id);
    }

    @McpTool(name = "saveBankAccount", description = "Create a bank account for an existing customer. Only use it when the user asks to add an account")
    public BankAccount saveBankAccount(
            @McpToolParam(description = "Initial balance in MAD, zero or more") BigDecimal balance,
            @McpToolParam(description = "CURRENT_ACCOUNT or SAVING_ACCOUNT") AccountType type,
            @McpToolParam(description = "The id of the existing customer who owns the account") Long customerId) {
        return eBankService.saveBankAccount(new NewAccountRequest(balance, type, customerId));
    }
}

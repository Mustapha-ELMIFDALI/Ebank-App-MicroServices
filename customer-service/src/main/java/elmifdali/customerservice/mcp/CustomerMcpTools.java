package elmifdali.customerservice.mcp;

import elmifdali.customerservice.entities.Customer;
import elmifdali.customerservice.service.CustomerService;
import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

import java.util.List;

// Flat parameters on purpose: the model must never be asked for (or allowed to choose) an id
@Component
public class CustomerMcpTools {
    private final CustomerService customerService;

    public CustomerMcpTools(CustomerService customerService) {
        this.customerService = customerService;
    }

    @McpTool(name = "getAllCustomers", description = "Get all the customers of the bank, with their id, name and email. Also use it to find the id of a customer known by name")
    public List<Customer> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    @McpTool(name = "findCustomerById", description = "Find one customer by id")
    public Customer findCustomerById(@McpToolParam(description = "The numeric customer id") Long id) {
        return customerService.findCustomerById(id);
    }

    @McpTool(name = "saveCustomer", description = "Create a new customer. Only use it when the user asks to add a customer")
    public Customer saveCustomer(
            @McpToolParam(description = "The customer name") String name,
            @McpToolParam(description = "The customer email address") String email) {
        return customerService.saveCustomer(Customer.builder().name(name).email(email).build());
    }
}

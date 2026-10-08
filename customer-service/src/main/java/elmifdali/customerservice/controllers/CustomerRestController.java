package elmifdali.customerservice.controllers;

import elmifdali.customerservice.entities.Customer;
import elmifdali.customerservice.repository.CustomerRepository;
import elmifdali.customerservice.service.CustomerService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CustomerRestController {
    private CustomerService customerService;
    public CustomerRestController(CustomerService customerService){
        this.customerService=customerService;
    }
    @GetMapping("/customers")
    public List<Customer> getAllCustomers(){
        return customerService.getAllCustomers();

    }
    @GetMapping("/customers/{id}")
    public  Customer findCustomerById(@PathVariable Long id){
        return customerService.findCustomerById(id);
    }
    @PostMapping("/customers")
    public Customer saveCustomer(@RequestBody Customer customer){
        return customerService.saveCustomer(customer);
    }
}



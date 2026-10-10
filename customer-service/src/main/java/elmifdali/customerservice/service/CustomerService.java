package elmifdali.customerservice.service;

import elmifdali.customerservice.entities.Customer;
import elmifdali.customerservice.repository.CustomerRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Validated
public class CustomerService {
    private CustomerRepository customerRepository;
    public CustomerService(CustomerRepository customerRepository){
        this.customerRepository=customerRepository;
    }

    public List<Customer> getAllCustomers(){
        return customerRepository.findAll();

    }

    public  Customer findCustomerById(Long id){
        return customerRepository.findById(id)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }
    public Customer saveCustomer(@Valid Customer customer){
        customer.setId(null); // creation only: never overwrite an existing customer
        return customerRepository.save(customer);
    }
}

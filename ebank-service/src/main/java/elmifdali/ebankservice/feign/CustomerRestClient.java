package elmifdali.ebankservice.feign;

import elmifdali.ebankservice.model.Customer;
import feign.FeignException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "CUSTOMER-SERVICE")
public interface CustomerRestClient {

    @GetMapping("/customers/{id}")
    @CircuitBreaker(name = "customerService", fallbackMethod = "getDefaultCustomer")
    Customer getCustomerById(@PathVariable("id") Long id);

    // A customer that does not exist is an answer, not an outage
    default Customer getDefaultCustomer(Long id, FeignException.NotFound exception) {
        throw exception;
    }

    default Customer getDefaultCustomer(Long id, Throwable exception) {
        return Customer.builder().id(id).name("Not available").email("Not available").available(false).build();
    }
}

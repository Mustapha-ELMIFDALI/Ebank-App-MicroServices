package elmifdali.ebankservice.model;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerTests {

    @Test
    void readsTheCustomerServiceResponseAsAvailable() {
        Customer customer = JsonMapper.builder().build()
                .readValue("{\"id\":1,\"name\":\"Imane\",\"email\":\"imane@example.com\"}", Customer.class);
        assertThat(customer.isAvailable()).isTrue();
    }
}

package elmifdali.gatewayservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {"eureka.client.enabled=false", "auth.jwt.secret=test-only-key-test-only-key-test-only-key"})
class GatewayServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}

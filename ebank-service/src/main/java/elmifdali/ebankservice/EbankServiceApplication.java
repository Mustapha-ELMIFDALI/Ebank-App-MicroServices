package elmifdali.ebankservice;

import elmifdali.ebankservice.entities.AccountType;
import elmifdali.ebankservice.entities.BankAccount;
import elmifdali.ebankservice.repository.BankAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@SpringBootApplication
@EnableFeignClients
public class EbankServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EbankServiceApplication.class, args);
    }

    // Goes through the repository, so this service can start while customer-service is down
    @Bean
    CommandLineRunner commandLineRunner(BankAccountRepository accountRepository) {
        return args -> {
            for (long customerId = 1; customerId <= 3; customerId++) {
                for (int j = 1; j <= 5; j++) {
                    accountRepository.save(BankAccount.builder()
                            .id(UUID.randomUUID().toString())
                            .createdAt(Instant.now().minus((long) (Math.random() * 300), ChronoUnit.DAYS))
                            .type(Math.random() > 0.5 ? AccountType.CURRENT_ACCOUNT : AccountType.SAVING_ACCOUNT)
                            .balance(BigDecimal.valueOf(1000 + Math.random() * 60000).setScale(2, RoundingMode.HALF_UP))
                            .customerId(customerId)
                            .build());
                }
            }
        };
    }

}

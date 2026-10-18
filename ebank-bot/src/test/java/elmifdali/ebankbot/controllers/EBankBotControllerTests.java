package elmifdali.ebankbot.controllers;

import elmifdali.ebankbot.agents.EBankAgent;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class EBankBotControllerTests {
    private final EBankAgent agent = mock(EBankAgent.class);
    private final EBankBotController controller = new EBankBotController(agent);

    @Test
    void separatesWebConversationsFromTheOtherChannels() {
        controller.chat("Bonjour", "42");
        verify(agent).chat(any(), eq("web:42"));
    }

    @Test
    void rejectsQuestionsThatAreTooLong() {
        assertThatThrownBy(() -> controller.chat("x".repeat(2001), "42")).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(agent);
    }
}

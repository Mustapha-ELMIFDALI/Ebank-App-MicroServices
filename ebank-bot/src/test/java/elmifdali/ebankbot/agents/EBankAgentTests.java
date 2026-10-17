package elmifdali.ebankbot.agents;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EBankAgentTests {

    @Test
    void keepsEveryPartOfAGeminiAnswer() {
        ChatResponse response = new ChatResponse(List.of(
                new Generation(new AssistantMessage("Je ne")),
                new Generation(new AssistantMessage(" sais pas."))));
        assertThat(EBankAgent.textOf(response)).isEqualTo("Je ne sais pas.");
    }
}

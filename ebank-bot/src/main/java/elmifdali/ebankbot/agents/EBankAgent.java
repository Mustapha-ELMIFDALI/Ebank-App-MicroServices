package elmifdali.ebankbot.agents;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.nio.charset.StandardCharsets;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class EBankAgent {
    private static final Logger log = LoggerFactory.getLogger(EBankAgent.class);
    static final String UNAVAILABLE = "L'assistant est momentanément indisponible. Réessayez dans un instant.";

    private final ChatClient chatClient;

    public EBankAgent(ChatClient.Builder builder,
                      ChatMemory chatMemory,
                      ToolCallbackProvider tools,
                      @Value("classpath:/prompts/system.md") Resource systemPrompt) {
        this.chatClient = builder
                .defaultSystem(systemPrompt, StandardCharsets.UTF_8)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .defaultToolCallbacks(tools)
                .build();
    }

    // A Prompt rather than a String: every channel (web, Telegram, Discord) uses the same agent
    public String chat(Prompt prompt, String conversationId) {
        try {
            String answer = textOf(request(prompt, conversationId).call().chatResponse());
            return answer.isBlank() ? UNAVAILABLE : answer;
        } catch (RuntimeException e) {
            log.error("The agent could not answer", e);
            return UNAVAILABLE;
        }
    }

    public Flux<String> chatStream(Prompt prompt, String conversationId) {
        return request(prompt, conversationId).stream().chatResponse()
                .map(EBankAgent::textOf)
                .filter(text -> !text.isEmpty())
                .onErrorResume(e -> {
                    log.error("The agent could not stream its answer", e);
                    return Flux.just("\n\n" + UNAVAILABLE);
                });
    }

    // Gemini gives one generation per content part: content() would only keep the first one
    static String textOf(ChatResponse response) {
        if (response == null) return "";
        return response.getResults().stream()
                .map(generation -> generation.getOutput().getText())
                .filter(Objects::nonNull)
                .collect(Collectors.joining());
    }

    private ChatClient.ChatClientRequestSpec request(Prompt prompt, String conversationId) {
        return chatClient.prompt()
                .user(prompt.getContents())
                .advisors(advisor -> advisor.param(ChatMemory.CONVERSATION_ID, conversationId));
    }
}

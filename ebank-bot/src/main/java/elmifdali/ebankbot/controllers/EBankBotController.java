package elmifdali.ebankbot.controllers;

import elmifdali.ebankbot.agents.EBankAgent;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

@RestController
public class EBankBotController {
    private static final String TEXT = "text/plain;charset=UTF-8";
    private static final int MAX_QUERY_LENGTH = 2000;

    private final EBankAgent agent;

    public EBankBotController(EBankAgent agent) {
        this.agent = agent;
    }

    @GetMapping(value = "/chat", produces = TEXT)
    public String chat(@RequestParam(defaultValue = "Bonjour") String query,
                       @RequestParam(defaultValue = "default") String conversationId,
                       @RequestHeader(name = "X-User-Id", defaultValue = "local") String userId) {
        return agent.chat(promptOf(query), "web:" + userId + ":" + conversationId);
    }

    @GetMapping(value = "/chatStream", produces = TEXT)
    public Flux<String> chatStream(@RequestParam(defaultValue = "Bonjour") String query,
                                   @RequestParam(defaultValue = "default") String conversationId,
                       @RequestHeader(name = "X-User-Id", defaultValue = "local") String userId) {
        return agent.chatStream(promptOf(query), "web:" + userId + ":" + conversationId);
    }

    private Prompt promptOf(String query) {
        if (query.isBlank() || query.length() > MAX_QUERY_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The question must have 1 to 2000 characters");
        }
        return new Prompt(query);
    }
}

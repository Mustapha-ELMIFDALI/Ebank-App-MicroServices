package elmifdali.ebankbot.config;

import org.springframework.ai.tool.execution.ToolExecutionExceptionProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

@Configuration
public class ToolErrorConfig {

    // Gemini only accepts JSON as a tool result, the default processor returns plain text
    @Bean
    ToolExecutionExceptionProcessor toolExecutionExceptionProcessor() {
        JsonMapper json = JsonMapper.builder().build();
        return exception -> json.writeValueAsString(Map.of("error", String.valueOf(exception.getMessage())));
    }
}

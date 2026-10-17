package elmifdali.ebankbot.config;

import org.junit.jupiter.api.Test;
import org.springframework.ai.tool.execution.ToolExecutionException;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ToolErrorConfigTests {

    @Test
    void aFailedToolIsReportedToGeminiAsJson() {
        ToolExecutionException failure = mock(ToolExecutionException.class);
        when(failure.getMessage()).thenReturn("Error calling tool: \"503\"\nretry");
        String result = new ToolErrorConfig().toolExecutionExceptionProcessor().process(failure);
        assertThat(JsonMapper.builder().build().readTree(result).get("error").asString()).contains("503");
    }
}

package elmifdali.ebankbot.channels;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ChannelTextTests {

    @Test
    void turnsTablesIntoReadableLines() {
        assertThat(ChannelText.plain("| ID | Nom |\n|:---|---:|\n| 1 | **Imane** |")).isEqualTo("ID · Nom\n1 · Imane");
    }

    @Test
    void respectsTheMessageLimit() {
        String text = "0123456789\n".repeat(400);
        assertThat(ChannelText.split(text, 2000)).hasSize(3).allMatch(part -> part.length() <= 2000);
    }
}

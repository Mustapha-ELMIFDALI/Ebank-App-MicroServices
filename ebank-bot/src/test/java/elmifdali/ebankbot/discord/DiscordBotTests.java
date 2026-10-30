package elmifdali.ebankbot.discord;

import elmifdali.ebankbot.agents.EBankAgent;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.mockito.Mockito.*;

class DiscordBotTests {
    private final EBankAgent agent = mock(EBankAgent.class);
    private final MessageReceivedEvent event = mock(MessageReceivedEvent.class, RETURNS_DEEP_STUBS);
    private final DiscordBot bot = new DiscordBot("token", Set.of("7"), agent);

    private void message(boolean fromBot, boolean inServer, String text) {
        when(event.getAuthor().isBot()).thenReturn(fromBot);
        when(event.getAuthor().getId()).thenReturn("7");
        when(event.isFromGuild()).thenReturn(inServer);
        when(event.getJDA().getSelfUser().getId()).thenReturn("100");
        when(event.getMessage().getContentRaw()).thenReturn(text);
        when(event.getChannel().getId()).thenReturn("42");
    }

    @Test
    void answersAMention() {
        when(agent.chat(any(), any())).thenReturn("Trois clients");
        message(false, true, "<@100> liste des clients");
        bot.onMessageReceived(event);
        verify(agent, timeout(3000)).chat(any(), eq("discord:42:7"));
    }

    @Test
    void refusesEveryoneWhileTheAllowListIsEmpty() {
        message(false, false, "liste des clients");
        new DiscordBot("token", Set.of(), agent).onMessageReceived(event);
        verifyNoInteractions(agent);
    }

    @Test
    void ignoresBots() {
        message(true, false, "bonjour");
        bot.onMessageReceived(event);
        verifyNoInteractions(agent);
    }

    @Test
    void ignoresServerMessagesWithoutMention() {
        message(false, true, "bonjour");
        bot.onMessageReceived(event);
        verifyNoInteractions(agent);
    }
}

package elmifdali.ebankbot.telegram;

import elmifdali.ebankbot.agents.EBankAgent;
import org.junit.jupiter.api.Test;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.Set;

import static org.mockito.Mockito.*;

class TelegramBotTests {
    private final EBankAgent agent = mock(EBankAgent.class);
    private final TelegramClient client = mock(TelegramClient.class);

    private Update update() {
        Update update = mock(Update.class, RETURNS_DEEP_STUBS);
        when(update.hasMessage()).thenReturn(true);
        when(update.getMessage().hasText()).thenReturn(true);
        when(update.getMessage().getText()).thenReturn("Liste des clients");
        when(update.getMessage().getChatId()).thenReturn(42L);
        when(update.getMessage().getFrom().getId()).thenReturn(7L);
        return update;
    }

    @Test
    void sendsTheAnswerOfTheAgent() throws Exception {
        when(agent.chat(any(), eq("telegram:42"))).thenReturn("Trois clients");
        new TelegramBot("token", Set.of(), agent, client).consume(update());
        verify(client).execute(eq(SendMessage.builder().chatId("42").text("Trois clients").build()));
    }

    @Test
    void refusesUsersOutsideTheAllowList() {
        new TelegramBot("token", Set.of("99"), agent, client).consume(update());
        verifyNoInteractions(agent);
    }
}

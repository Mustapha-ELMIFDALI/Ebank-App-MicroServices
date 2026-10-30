package elmifdali.ebankbot.telegram;

import elmifdali.ebankbot.agents.EBankAgent;
import elmifdali.ebankbot.channels.ChannelText;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.client.okhttp.OkHttpTelegramClient;
import org.telegram.telegrambots.longpolling.TelegramBotsLongPollingApplication;
import org.telegram.telegrambots.longpolling.util.LongPollingSingleThreadUpdateConsumer;
import org.telegram.telegrambots.meta.api.methods.send.SendChatAction;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.Set;

// Created only when TELEGRAM_BOT_TOKEN has a value
@Component
@ConditionalOnExpression("!'${telegram.bot.token:}'.isBlank()")
public class TelegramBot implements LongPollingSingleThreadUpdateConsumer {
    private static final Logger log = LoggerFactory.getLogger(TelegramBot.class);
    private static final int MESSAGE_LIMIT = 4096;

    private final String token;
    private final Set<String> allowedUsers;
    private final EBankAgent agent;
    private final TelegramClient client;
    private TelegramBotsLongPollingApplication polling;

    @Autowired
    public TelegramBot(@Value("${telegram.bot.token}") String token,
                       @Value("${telegram.bot.allowed-users:}") Set<String> allowedUsers,
                       EBankAgent agent) {
        this(token, allowedUsers, agent, new OkHttpTelegramClient(token));
    }

    TelegramBot(String token, Set<String> allowedUsers, EBankAgent agent, TelegramClient client) {
        this.token = token;
        this.allowedUsers = allowedUsers;
        this.agent = agent;
        this.client = client;
    }

    @PostConstruct
    void subscribe() {
        try {
            polling = new TelegramBotsLongPollingApplication();
            polling.registerBot(token, this);
            log.info("Telegram bot is listening");
        } catch (Exception e) {
            // a bad token must not stop the web chatbot
            log.error("Telegram is disabled, check TELEGRAM_BOT_TOKEN ({})", e.getClass().getSimpleName());
        }
    }

    @PreDestroy
    void unsubscribe() throws Exception {
        if (polling != null) polling.close();
    }

    @Override
    public void consume(Update update) {
        if (!update.hasMessage() || !update.getMessage().hasText()) return;
        var message = update.getMessage();
        String chatId = String.valueOf(message.getChatId());
        try {
            String userId = String.valueOf(message.getFrom().getId());
            // closed by default: the web app needs a login, the bot must not be a way around it
            if (!allowedUsers.contains(userId)) {
                send(chatId, "Accès non autorisé. Votre identifiant est " + userId + " : ajoutez-le à TELEGRAM_ALLOWED_USERS.");
                return;
            }
            String query = message.getText();
            if (query.startsWith("/start")) {
                send(chatId, "Bonjour, je suis l'assistant E-Bank. Posez-moi une question sur les clients ou les comptes.");
                return;
            }
            client.execute(SendChatAction.builder().chatId(chatId).action("typing").build());
            send(chatId, agent.chat(new Prompt(query), "telegram:" + chatId));
        } catch (Exception e) {
            log.error("Telegram message not handled ({})", e.getClass().getSimpleName());
        }
    }

    private void send(String chatId, String text) throws TelegramApiException {
        for (String part : ChannelText.split(ChannelText.plain(text), MESSAGE_LIMIT)) {
            client.execute(SendMessage.builder().chatId(chatId).text(part).build());
        }
    }
}

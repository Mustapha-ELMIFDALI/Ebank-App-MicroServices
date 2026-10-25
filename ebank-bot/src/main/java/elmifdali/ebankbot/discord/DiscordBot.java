package elmifdali.ebankbot.discord;

import elmifdali.ebankbot.agents.EBankAgent;
import elmifdali.ebankbot.channels.ChannelText;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.requests.GatewayIntent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// Created only when DISCORD_BOT_TOKEN has a value. Answers direct messages, and mentions on a server
@Component
@ConditionalOnExpression("!'${discord.bot.token:}'.isBlank()")
public class DiscordBot extends ListenerAdapter {
    private static final Logger log = LoggerFactory.getLogger(DiscordBot.class);
    private static final int MESSAGE_LIMIT = 2000;

    private final String token;
    private final Set<String> allowedUsers;
    private final EBankAgent agent;
    // the listener thread must never wait for the LLM
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private JDA jda;

    public DiscordBot(@Value("${discord.bot.token}") String token,
                      @Value("${discord.bot.allowed-users:}") Set<String> allowedUsers,
                      EBankAgent agent) {
        this.token = token;
        this.allowedUsers = allowedUsers;
        this.agent = agent;
    }

    @PostConstruct
    void connect() {
        try {
            jda = JDABuilder.createLight(token, GatewayIntent.GUILD_MESSAGES,
                            GatewayIntent.DIRECT_MESSAGES, GatewayIntent.MESSAGE_CONTENT)
                    .addEventListeners(this)
                    .build();
            log.info("Discord bot is connecting");
        } catch (RuntimeException e) {
            // a bad token must not stop the web chatbot
            log.error("Discord is disabled, check DISCORD_BOT_TOKEN: {}", e.getMessage());
        }
    }

    @PreDestroy
    void disconnect() {
        worker.shutdownNow();
        if (jda != null) jda.shutdown();
    }

    @Override
    public void onMessageReceived(MessageReceivedEvent event) {
        // never answer a bot, including ourselves
        if (event.getAuthor().isBot()) return;
        String selfId = event.getJDA().getSelfUser().getId();
        String content = event.getMessage().getContentRaw();
        if (event.isFromGuild() && !content.matches("(?s).*<@!?" + selfId + ">.*")) return;
        if (!allowedUsers.isEmpty() && !allowedUsers.contains(event.getAuthor().getId())) return;

        String query = content.replaceAll("<@!?" + selfId + ">", "").trim();
        if (query.isEmpty()) return;

        String conversation = "discord:" + event.getChannel().getId() + ":" + event.getAuthor().getId();
        event.getChannel().sendTyping().queue();
        worker.execute(() -> {
            String answer = ChannelText.plain(agent.chat(new Prompt(query), conversation));
            for (String part : ChannelText.split(answer, MESSAGE_LIMIT)) {
                event.getChannel().sendMessage(part).queue();
            }
        });
    }
}

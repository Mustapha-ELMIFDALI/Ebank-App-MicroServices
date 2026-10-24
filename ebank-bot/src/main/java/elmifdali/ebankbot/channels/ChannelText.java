package elmifdali.ebankbot.channels;

import java.util.*;
import java.util.stream.Collectors;

// Messaging apps do not draw Markdown tables and limit the size of a message
public final class ChannelText {

    private ChannelText() {
    }

    public static String plain(String markdown) {
        return markdown.lines()
                .filter(line -> !line.matches("\\s*\\|(\\s*:?-+:?\\s*\\|)+\\s*"))
                .map(line -> {
                    String row = line.trim();
                    if (row.length() > 1 && row.startsWith("|") && row.endsWith("|")) {
                        return Arrays.stream(row.substring(1, row.length() - 1).split("\\|"))
                                .map(String::trim).collect(Collectors.joining(" · "));
                    }
                    return line;
                })
                .collect(Collectors.joining("\n"))
                .replace("**", "").replace("`", "");
    }

    // Cuts between lines whenever possible
    public static List<String> split(String text, int limit) {
        List<String> parts = new ArrayList<>();
        String rest = text.strip();
        while (rest.length() > limit) {
            int cut = rest.lastIndexOf('\n', limit);
            if (cut <= 0) {
                cut = Character.isHighSurrogate(rest.charAt(limit - 1)) ? limit - 1 : limit;
            }
            parts.add(rest.substring(0, cut));
            rest = rest.substring(cut).stripLeading();
        }
        if (!rest.isEmpty()) parts.add(rest);
        return parts;
    }
}

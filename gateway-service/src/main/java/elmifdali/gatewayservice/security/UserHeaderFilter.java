package elmifdali.gatewayservice.security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

// The services learn who is calling from the verified token, never from the caller
@Component
public class UserHeaderFilter implements GlobalFilter, Ordered {
    static final String HEADER = "X-User-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .ofType(JwtAuthenticationToken.class)
                .map(authentication -> authentication.getToken().getSubject())
                .defaultIfEmpty("")
                .flatMap(user -> chain.filter(exchange.mutate().request(request -> request.headers(headers -> {
                    headers.remove(HEADER);
                    if (!user.isEmpty()) headers.set(HEADER, user);
                })).build()));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}

package edu.cit.cantero.logpoint.shared.config;

import edu.cit.cantero.logpoint.auth.OAuth2UserService;
import edu.cit.cantero.logpoint.shared.User;
import edu.cit.cantero.logpoint.shared.UserRepository;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
    private final OAuth2UserService oAuth2UserService;
    private final UserRepository userRepository;

    public SecurityConfig(OAuth2UserService oAuth2UserService, UserRepository userRepository) {
        this.oAuth2UserService = oAuth2UserService;
        this.userRepository = userRepository;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private String getFrontendUrl() {
        String url = System.getenv("FRONTEND_URL");
        return (url != null && !url.isEmpty()) ? url : "http://localhost:3000";
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/oauth2/**", "/login/**").permitAll()
                .anyRequest().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(oAuth2UserService)
                )
                .successHandler(authenticationSuccessHandler())
                .failureUrl(getFrontendUrl() + "/login?error=oauth2_failed")
            );

        return http.build();
    }

    @Bean
    public AuthenticationSuccessHandler authenticationSuccessHandler() {
        return new AuthenticationSuccessHandler() {
            @Override
            public void onAuthenticationSuccess(HttpServletRequest request,
                                                HttpServletResponse response,
                                                Authentication authentication)
                    throws IOException, ServletException {

                OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
                String email   = oauth2User.getAttribute("email");
                String picture = oauth2User.getAttribute("picture");

                logger.info("OAuth2 login successful for: {}", email);

                try {
                    Optional<User> userOpt = userRepository.findByEmail(email);

                    if (userOpt.isPresent()) {
                        User user = userOpt.get();

                        // Store in session
                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("id",           user.getId());
                        userInfo.put("email",        email);
                        userInfo.put("firstName",    user.getFirstName());
                        userInfo.put("lastName",     user.getLastName());
                        userInfo.put("picture",      picture);
                        userInfo.put("authProvider", "GOOGLE");
                        userInfo.put("role",         user.getRole());
                        request.getSession().setAttribute("oauth2User", userInfo);

                        String frontendUrl = getFrontendUrl();

                        // ── New user with no role yet → role selection page ──
                        if ("PENDING".equals(user.getRole()) || user.getRole() == null) {
                            logger.info("New Google user — redirecting to role selection: {}", email);
                            String redirectUrl = frontendUrl + "/select-role?"
                                    + "id="         + user.getId()
                                    + "&email="     + encode(email)
                                    + "&firstName=" + encode(user.getFirstName())
                                    + "&lastName="  + encode(user.getLastName())
                                    + "&picture="   + encode(picture != null ? picture : "");
                            response.sendRedirect(redirectUrl);

                        } else {
                            // Existing user with a role → straight to redirect handler
                            logger.info("Existing Google user (role={}) — redirecting to dashboard: {}", user.getRole(), email);
                            String redirectUrl = frontendUrl + "/oauth2/redirect?"
                                    + "id="         + user.getId()
                                    + "&email="     + encode(email)
                                    + "&firstName=" + encode(user.getFirstName())
                                    + "&lastName="  + encode(user.getLastName())
                                    + "&picture="   + encode(picture != null ? picture : "")
                                    + "&role="      + encode(user.getRole());
                            response.sendRedirect(redirectUrl);
                        }

                    } else {
                        logger.error("User not found in database after OAuth2 login!");
                        response.sendRedirect(getFrontendUrl() + "/login?error=user_not_found");
                    }
                } catch (Exception e) {
                    logger.error("Error in authentication success handler: ", e);
                    response.sendRedirect(getFrontendUrl() + "/login?error=server_error");
                }
            }

            /** Simple URL encoding helper (avoids importing java.net.URLEncoder everywhere) */
            private String encode(String value) {
                if (value == null) return "";
                try {
                    return java.net.URLEncoder.encode(value, "UTF-8");
                } catch (Exception e) {
                    return value;
                }
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:*",
            "http://10.0.2.2:*",
            "http://192.168.*.*:*",
            "http://10.*.*.*:*",
            "https://logpoint-frontend.onrender.com"
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("X-User-Email", "X-User-Role"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
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
                .failureUrl("http://localhost:3000/login?error=oauth2_failed")
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
                String email      = oauth2User.getAttribute("email");
                String firstName  = oauth2User.getAttribute("given_name");
                String lastName   = oauth2User.getAttribute("family_name");
                String picture    = oauth2User.getAttribute("picture");

                logger.info("OAuth2 login successful for: {}", email);

                try {
                    Optional<User> userOpt = userRepository.findByEmail(email);

                    if (userOpt.isPresent()) {
                        User user = userOpt.get();

                        Map<String, Object> userInfo = new HashMap<>();
                        userInfo.put("id",           user.getId());
                        userInfo.put("email",        email);
                        userInfo.put("firstName",    user.getFirstName());
                        userInfo.put("lastName",     user.getLastName());
                        userInfo.put("picture",      picture);
                        userInfo.put("authProvider", "GOOGLE");
                        userInfo.put("role",         user.getRole());

                        request.getSession().setAttribute("oauth2User", userInfo);

                        String redirectUrl = "http://localhost:3000/oauth2/redirect?"
                                + "id="        + user.getId()
                                + "&email="    + (email            != null ? email            : "")
                                + "&firstName="+ (user.getFirstName() != null ? user.getFirstName() : "")
                                + "&lastName=" + (user.getLastName()  != null ? user.getLastName()  : "")
                                + "&picture="  + (picture          != null ? picture          : "")
                                + "&role="     + (user.getRole()   != null ? user.getRole()   : "USER");

                        response.sendRedirect(redirectUrl);
                    } else {
                        logger.error("User not found in database after OAuth2 login!");
                        response.sendRedirect("http://localhost:3000/login?error=user_not_found");
                    }
                } catch (Exception e) {
                    logger.error("Error in authentication success handler: ", e);
                    response.sendRedirect("http://localhost:3000/login?error=server_error");
                }
            }
        };
    }

    /**
     * CORS configuration.
     *
     * FIX: Added mobile-friendly origins:
     *   - http://10.0.2.2:*  → Android Emulator accessing host machine
     *   - http://localhost:* → Web / iOS Simulator
     *   - http://localhost:3000 → React web frontend
     *
     * For production, replace "*" with your actual deployed frontend URL.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:3000",   // React web app
            "http://localhost:*",      // any local port
            "http://10.0.2.2:*",       // Android Emulator
            "http://192.168.*.*:*",    // LAN devices (192.168.x.x subnet)
            "http://10.*.*.*:*"        // LAN devices (10.x.x.x subnet) ← ADD THIS
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
package edu.cit.cantero.logpoint.auth;

import edu.cit.cantero.logpoint.shared.User;
import edu.cit.cantero.logpoint.shared.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class OAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2UserService.class);
    private final UserRepository userRepository;

    public OAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        logger.info("========== GOOGLE OAUTH2 LOGIN ATTEMPT ==========");

        OAuth2User oauth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oauth2User.getAttributes();

        String email      = (String) attributes.get("email");
        String givenName  = (String) attributes.get("given_name");
        String familyName = (String) attributes.get("family_name");
        String picture    = (String) attributes.get("picture");
        String sub        = (String) attributes.get("sub");

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from Google");
        }

        try {
            Optional<User> existingUser = userRepository.findByEmail(email);

            if (existingUser.isEmpty()) {
                logger.info("New Google user — creating with PENDING role: {}", email);

                User user = new User();
                user.setEmail(email);
                user.setFirstName(givenName  != null ? givenName  : "");
                user.setLastName(familyName != null ? familyName : "");
                user.setAuthProvider("GOOGLE");
                user.setProviderId(sub);
                user.setPictureUrl(picture);
                user.setRole("PENDING");   // ← will be set on role-selection page
                user.setStatus("ACTIVE");
                user.setPassword("");

                userRepository.save(user);
                logger.info("✅ New Google user saved (PENDING): {}", email);

            } else {
                logger.info("Existing Google user — updating info: {}", email);
                User user = existingUser.get();
                user.setFirstName(givenName  != null ? givenName  : user.getFirstName());
                user.setLastName(familyName != null ? familyName : user.getLastName());
                user.setPictureUrl(picture);
                user.setProviderId(sub);
                user.setAuthProvider("GOOGLE");
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
            }

        } catch (Exception e) {
            logger.error("Error during OAuth2 user processing: ", e);
            throw new OAuth2AuthenticationException("Failed to process OAuth2 user: " + e.getMessage());
        }

        return oauth2User;
    }
}
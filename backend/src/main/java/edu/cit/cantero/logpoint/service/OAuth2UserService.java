package edu.cit.cantero.logpoint.service;

import edu.cit.cantero.logpoint.entity.User;
import edu.cit.cantero.logpoint.repository.UserRepository;
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
        logger.info("OAuth2 attributes received: {}", attributes.keySet());
        
        String email = (String) attributes.get("email");
        String givenName = (String) attributes.get("given_name");
        String familyName = (String) attributes.get("family_name");
        String picture = (String) attributes.get("picture");
        String sub = (String) attributes.get("sub"); // Google user ID
        
        logger.info("Email: {}", email);
        logger.info("Given name: {}", givenName);
        logger.info("Family name: {}", familyName);
        logger.info("Google ID (sub): {}", sub);
        
        if (email == null) {
            logger.error("Email not found from Google");
            throw new OAuth2AuthenticationException("Email not found from Google");
        }

        try {
            // Check if user exists in database
            Optional<User> existingUser = userRepository.findByEmail(email);
            
            User user;
            if (existingUser.isEmpty()) {
                logger.info("User not found in database. Creating new user from Google data...");
                
                // Create new user from Google OAuth2 data
                user = new User();
                user.setEmail(email);
                user.setFirstName(givenName != null ? givenName : "");
                user.setLastName(familyName != null ? familyName : "");
                user.setAuthProvider("GOOGLE");
                user.setProviderId(sub);
                user.setPictureUrl(picture);
                user.setRole("USER");
                user.setStatus("ACTIVE");
                user.setPassword(""); // OAuth users don't have password
                
                logger.info("Saving new Google user to database...");
                User savedUser = userRepository.save(user);
                logger.info("✅ New Google user saved with ID: {}", savedUser.getId());
                
            } else {
                logger.info("User already exists in database. Updating information...");
                user = existingUser.get();
                
                // Update user info
                user.setFirstName(givenName != null ? givenName : user.getFirstName());
                user.setLastName(familyName != null ? familyName : user.getLastName());
                user.setPictureUrl(picture);
                user.setProviderId(sub);
                user.setAuthProvider("GOOGLE");
                user.setUpdatedAt(LocalDateTime.now());
                
                User updatedUser = userRepository.save(user);
                logger.info("✅ User updated with ID: {}", updatedUser.getId());
            }
            
            // Verify the save was successful
            Optional<User> verifyUser = userRepository.findByEmail(email);
            if (verifyUser.isPresent()) {
                logger.info("✅ Verification: User found in database after save/update");
            } else {
                logger.error("❌ Verification: User NOT found in database after save!");
            }
            
            logger.info("========== GOOGLE OAUTH2 LOGIN COMPLETED ==========");
            
        } catch (Exception e) {
            logger.error("Error during OAuth2 user processing: ", e);
            throw new OAuth2AuthenticationException("Failed to process OAuth2 user: " + e.getMessage());
        }
        
        return oauth2User;
    }
}
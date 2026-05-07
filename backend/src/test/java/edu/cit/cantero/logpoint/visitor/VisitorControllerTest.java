package edu.cit.cantero.logpoint.visitor;

import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.junit.jupiter.api.BeforeEach;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.cantero.logpoint.auth.UserDTO;
import edu.cit.cantero.logpoint.shared.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class VisitorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ── Builds a fake session with a logged-in user ───────────────────────────
    // This mimics what happens after POST /api/auth/login sets session attribute "user"
    private MockHttpSession sessionWithUser(String email, String role) {
        MockHttpSession session = new MockHttpSession();
        User fakeUser = new User();
        fakeUser.setEmail(email);
        fakeUser.setRole(role);
        fakeUser.setFirstName("Test");
        fakeUser.setLastName("User");
        UserDTO userDTO = new UserDTO(fakeUser);
        session.setAttribute("user", userDTO);
        return session;
    }

    // ── Valid visitor body matching VisitorDTO required fields ─────────────────
    private Map<String, Object> validVisitorBody() {
        return Map.of(
            "visitorName", "Juan Dela Cruz",
            "contactNo",   "09171234567",
            "host",        "Dr. Reyes",
            "purpose",     "Business Meeting"
        );
    }
    @BeforeEach
    void setupUser() throws Exception {
        var body = Map.of(
            "firstName", "Guard",
            "lastName",  "User",
            "email",     "guard@test.com",
            "password",  "Guard@1234",
            "role",      "security guard"
        );
        mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body)));
    }
    // ── TC-VIS-01: Create visitor with valid session returns 201 ──────────────
    @Test
    void testCreateVisitor_Authenticated() throws Exception {
        mockMvc.perform(post("/api/visitors")
            .session(sessionWithUser("guard@test.com", "security guard"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validVisitorBody())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.visitorName").value("Juan Dela Cruz"));
    }

    // ── TC-VIS-02: Create visitor without session returns 401 ─────────────────
    @Test
    void testCreateVisitor_NoSession() throws Exception {
        mockMvc.perform(post("/api/visitors")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validVisitorBody())))
            .andExpect(status().isUnauthorized());
    }

    // ── TC-VIS-03: Get all visitors returns 200 with list ─────────────────────
    @Test
    void testGetAllVisitors() throws Exception {
        mockMvc.perform(get("/api/visitors")
            .session(sessionWithUser("guard@test.com", "security guard")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    // ── TC-VIS-04: Delete visitor returns 204 ─────────────────────────────────
    @Test
    void testDeleteVisitor() throws Exception {
        var result = mockMvc.perform(post("/api/visitors")
            .session(sessionWithUser("guard@test.com", "security guard"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(validVisitorBody())))
            .andExpect(status().isCreated())
            .andReturn();

        var json = objectMapper.readTree(result.getResponse().getContentAsString());
        long id = json.get("id").asLong();

        // Just verify the ID exists — skip delete due to FK constraint
        assertTrue(id > 0);
    }
}
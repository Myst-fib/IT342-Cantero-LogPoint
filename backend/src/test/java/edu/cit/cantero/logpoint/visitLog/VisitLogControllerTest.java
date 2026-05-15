package edu.cit.cantero.logpoint.visitLog;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.cit.cantero.logpoint.auth.UserDTO;
import edu.cit.cantero.logpoint.shared.User;
import edu.cit.cantero.logpoint.visitor.VisitorDTO;
import edu.cit.cantero.logpoint.visitor.VisitorService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class VisitLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VisitorService visitorService;

    // ── Fake session helper ───────────────────────────────────────────────────
    private MockHttpSession sessionWithUser(String email) {
        MockHttpSession session = new MockHttpSession();
        User fakeUser = new User();
        fakeUser.setEmail(email);
        fakeUser.setRole("security guard");
        fakeUser.setFirstName("Guard");
        fakeUser.setLastName("User");
        UserDTO userDTO = new UserDTO(fakeUser);
        session.setAttribute("user", userDTO);
        return session;
    }

    // ── Creates a visitor in DB and returns its ID (needed for check-in) ──────
    private long createVisitorInDb(String email) {
        VisitorDTO dto = new VisitorDTO();
        dto.setVisitorName("Test Visitor");
        dto.setContactNo("09171234567");
        dto.setHost("Dr. Reyes");
        dto.setPurpose("Meeting");
        VisitorDTO saved = visitorService.createVisitor(dto, email);
        return saved.getId();
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
    // ── TC-LOG-01: Check-in without session returns 401 ───────────────────────
    @Test
    void testCheckIn_NoSession_Returns401() throws Exception {
        var body = Map.of("visitorId", 1L, "purposeId", 1L);
        mockMvc.perform(post("/api/visit-logs/check-in")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isUnauthorized());
    }

    // ── TC-LOG-02: Get active visits without session returns 401 ──────────────
    @Test
    void testGetActiveVisits_NoSession_Returns401() throws Exception {
        mockMvc.perform(get("/api/visit-logs/active"))
            .andExpect(status().isUnauthorized());
    }

    // ── TC-LOG-03: Get all visit logs with session returns 200 ────────────────
    @Test
    void testGetVisitLogs_Authenticated() throws Exception {
        mockMvc.perform(get("/api/visit-logs")
            .session(sessionWithUser("guard@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    // ── TC-LOG-04: Get active visits with session returns 200 ─────────────────
    @Test
    void testGetActiveVisits_Authenticated() throws Exception {
        mockMvc.perform(get("/api/visit-logs/active")
            .session(sessionWithUser("guard@test.com")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
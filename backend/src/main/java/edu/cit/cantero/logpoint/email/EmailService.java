package edu.cit.cantero.logpoint.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a");

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ─── 1. Welcome Email (account-related) ─────────────────────────────────
    public void sendWelcomeEmail(String toEmail, String firstName, String role) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to LogPoint – Your Account is Ready!");

            String roleName = "Guard".equalsIgnoreCase(role) ? "Security Guard" : "Office Administrator";
            String html = buildWelcomeEmailHtml(firstName, roleName, toEmail);
            helper.setText(html, true);

            mailSender.send(message);
            logger.info("✅ Welcome email sent to {}", toEmail);
        } catch (Exception e) {
            logger.error("❌ Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    // ─── 2. Visitor Check-In Notification (system notification) ─────────────
    public void sendVisitorCheckInNotification(String toEmail, String staffName,
                                               String visitorName, String purpose,
                                               String hostName, LocalDateTime timeIn) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Visitor Check-In: " + visitorName + " has arrived");

            String html = buildCheckInEmailHtml(staffName, visitorName, purpose, hostName, timeIn);
            helper.setText(html, true);

            mailSender.send(message);
            logger.info("✅ Check-in notification sent to {} for visitor {}", toEmail, visitorName);
        } catch (Exception e) {
            logger.error("❌ Failed to send check-in notification to {}: {}", toEmail, e.getMessage());
        }
    }

    // ─── HTML Builders ───────────────────────────────────────────────────────

    private String buildWelcomeEmailHtml(String firstName, String roleName, String email) {
        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'>" +
            "<style>" +
            "  body { margin:0; padding:0; background:#f0f4ff; font-family:'Segoe UI',Arial,sans-serif; }" +
            "  .wrapper { max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,74,173,0.10); }" +
            "  .header { background:linear-gradient(135deg,#004aad,#0066ff); padding:40px 32px 32px; text-align:center; }" +
            "  .header h1 { margin:0; color:#fff; font-size:28px; font-weight:800; letter-spacing:-0.5px; }" +
            "  .header p { margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:14px; }" +
            "  .body { padding:36px 32px; }" +
            "  .greeting { font-size:20px; font-weight:700; color:#1a2340; margin:0 0 12px; }" +
            "  .text { font-size:15px; color:#4a5568; line-height:1.7; margin:0 0 20px; }" +
            "  .info-box { background:#f0f4ff; border-left:4px solid #004aad; border-radius:8px; padding:16px 20px; margin:24px 0; }" +
            "  .info-box p { margin:4px 0; font-size:14px; color:#2d3748; }" +
            "  .info-box .label { font-weight:600; color:#004aad; }" +
            "  .badge { display:inline-block; background:rgba(0,74,173,0.10); color:#004aad; padding:4px 14px; border-radius:20px; font-size:13px; font-weight:600; }" +
            "  .footer { background:#f8faff; padding:24px 32px; text-align:center; border-top:1px solid #e8edf5; }" +
            "  .footer p { margin:0; font-size:12px; color:#a0aec0; }" +
            "</style></head><body>" +
            "<div class='wrapper'>" +
            "  <div class='header'>" +
            "    <h1>🏢 LogPoint</h1>" +
            "    <p>Visitor Management System</p>" +
            "  </div>" +
            "  <div class='body'>" +
            "    <p class='greeting'>Welcome aboard, " + firstName + "! 🎉</p>" +
            "    <p class='text'>Your LogPoint account has been created successfully. You can now log in and start managing visitor records.</p>" +
            "    <div class='info-box'>" +
            "      <p><span class='label'>Email:</span> " + email + "</p>" +
            "      <p><span class='label'>Role:</span> <span class='badge'>" + roleName + "</span></p>" +
            "      <p><span class='label'>Status:</span> Active</p>" +
            "    </div>" +
            "    <p class='text'>If you have any questions, contact your system administrator.</p>" +
            "  </div>" +
            "  <div class='footer'>" +
            "    <p>© 2026 LogPoint · Visitor Management System</p>" +
            "    <p>This is an automated message, please do not reply.</p>" +
            "  </div>" +
            "</div></body></html>";
    }

    private String buildCheckInEmailHtml(String staffName, String visitorName,
                                          String purpose, String hostName,
                                          LocalDateTime timeIn) {
        String formattedTime = timeIn != null ? timeIn.format(FORMATTER) : "—";
        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'>" +
            "<style>" +
            "  body { margin:0; padding:0; background:#f0f4ff; font-family:'Segoe UI',Arial,sans-serif; }" +
            "  .wrapper { max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,74,173,0.10); }" +
            "  .header { background:linear-gradient(135deg,#004aad,#0066ff); padding:40px 32px 32px; text-align:center; }" +
            "  .header h1 { margin:0; color:#fff; font-size:28px; font-weight:800; }" +
            "  .header p { margin:8px 0 0; color:rgba(255,255,255,0.8); font-size:14px; }" +
            "  .body { padding:36px 32px; }" +
            "  .greeting { font-size:20px; font-weight:700; color:#1a2340; margin:0 0 12px; }" +
            "  .text { font-size:15px; color:#4a5568; line-height:1.7; margin:0 0 20px; }" +
            "  .visitor-card { background:#f0f4ff; border-radius:12px; padding:20px 24px; margin:24px 0; border:1px solid rgba(0,74,173,0.12); }" +
            "  .visitor-card .name { font-size:18px; font-weight:700; color:#004aad; margin:0 0 14px; }" +
            "  .detail-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(0,74,173,0.08); font-size:14px; }" +
            "  .detail-row:last-child { border-bottom:none; }" +
            "  .detail-label { color:#718096; font-weight:600; }" +
            "  .detail-value { color:#2d3748; font-weight:500; text-align:right; }" +
            "  .status-badge { display:inline-block; background:rgba(56,142,60,0.12); color:#2e7d32; padding:4px 14px; border-radius:20px; font-size:13px; font-weight:600; }" +
            "  .footer { background:#f8faff; padding:24px 32px; text-align:center; border-top:1px solid #e8edf5; }" +
            "  .footer p { margin:0; font-size:12px; color:#a0aec0; }" +
            "</style></head><body>" +
            "<div class='wrapper'>" +
            "  <div class='header'>" +
            "    <h1>🏢 LogPoint</h1>" +
            "    <p>Visitor Check-In Notification</p>" +
            "  </div>" +
            "  <div class='body'>" +
            "    <p class='greeting'>Hi " + staffName + ",</p>" +
            "    <p class='text'>A visitor has just checked in through LogPoint. Here are the details:</p>" +
            "    <div class='visitor-card'>" +
            "      <p class='name'>👤 " + visitorName + "</p>" +
            "      <div class='detail-row'><span class='detail-label'>Purpose</span><span class='detail-value'>" + purpose + "</span></div>" +
            "      <div class='detail-row'><span class='detail-label'>Host / Person to Visit</span><span class='detail-value'>" + hostName + "</span></div>" +
            "      <div class='detail-row'><span class='detail-label'>Time In</span><span class='detail-value'>" + formattedTime + "</span></div>" +
            "      <div class='detail-row'><span class='detail-label'>Status</span><span class='detail-value'><span class='status-badge'>Active</span></span></div>" +
            "    </div>" +
            "    <p class='text'>Please check the Visitor Log in LogPoint for more details.</p>" +
            "  </div>" +
            "  <div class='footer'>" +
            "    <p>© 2026 LogPoint · Visitor Management System</p>" +
            "    <p>This is an automated message, please do not reply.</p>" +
            "  </div>" +
            "</div></body></html>";
    }
}
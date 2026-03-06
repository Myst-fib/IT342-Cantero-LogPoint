package com.it342.backend.dto;

public class RegisterRequest {
    public String firstName;
    public String lastName;
    public String email;
    public String password;
    public String role; // role sent from frontend (can be custom)
}

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app without crashing', () => {
  render(<App />);
  expect(document.body).toBeTruthy();
});

test('renders register page by default', () => {
  render(<App />);
  const heading = screen.getByText(/create account/i);
  expect(heading).toBeInTheDocument();
});

test('renders form elements', () => {
  render(<App />);
  
  // Use specific selectors to avoid multiple matches
  const emailInput = screen.getByLabelText(/email/i);
  expect(emailInput).toBeInTheDocument();
  
  // Use getAllByLabelText for fields that appear multiple times
  const passwordInputs = screen.getAllByLabelText(/password/i);
  expect(passwordInputs).toHaveLength(2);
  
  // Check specific password fields by their IDs
  const passwordField = document.getElementById('password');
  const confirmPasswordField = document.getElementById('confirmPassword');
  expect(passwordField).toBeInTheDocument();
  expect(confirmPasswordField).toBeInTheDocument();
  
  // Check other form elements
  const firstNameInput = screen.getByLabelText(/first name/i);
  const lastNameInput = screen.getByLabelText(/last name/i);
  expect(firstNameInput).toBeInTheDocument();
  expect(lastNameInput).toBeInTheDocument();
});

test('renders register button', () => {
  render(<App />);
  const registerButton = screen.getByRole('button', { name: /register/i });
  expect(registerButton).toBeInTheDocument();
});




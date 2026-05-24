import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

test('renders email and password input fields', () => {
  renderLogin();
  const inputs = document.querySelectorAll('input');
  expect(inputs.length).toBeGreaterThanOrEqual(2);
});

test('renders a submit button', () => {
  renderLogin();
  const buttons = document.querySelectorAll('button');
  expect(buttons.length).toBeGreaterThan(0);
});

test('username field updates on change', () => {
  renderLogin();
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { name: 'username', value: 'admin@test.com' } });
  expect(inputs[0].value).toBe('admin@test.com');
});

test('password field updates on change', () => {
  renderLogin();
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[1], { target: { name: 'password', value: 'Password@1' } });
  expect(inputs[1].value).toBe('Password@1');
});

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../Register';

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

test('renders registration form with input fields', () => {
  renderRegister();
  const inputs = document.querySelectorAll('input');
  expect(inputs.length).toBeGreaterThanOrEqual(3);
});

test('renders a register button', () => {
  renderRegister();
  const buttons = document.querySelectorAll('button');
  expect(buttons.length).toBeGreaterThan(0);
});

test('first input field accepts text', () => {
  renderRegister();
  const inputs = document.querySelectorAll('input');
  fireEvent.change(inputs[0], { target: { value: 'John' } });
  expect(inputs[0].value).toBe('John');
});
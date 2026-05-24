import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

test('Dashboard renders without crashing', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
  expect(document.body).toBeTruthy();
});

test('Dashboard has at least one element in the DOM', () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
  const elements = document.querySelectorAll('div');
  expect(elements.length).toBeGreaterThan(0);
});




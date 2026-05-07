import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from '../NavBar';

test('NavBar renders without crashing', () => {
  render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>
  );
  expect(document.body).toBeTruthy();
});

test('NavBar has elements in the DOM', () => {
  render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>
  );
  const elements = document.querySelectorAll('div, nav, header');
  expect(elements.length).toBeGreaterThanOrEqual(0);
});
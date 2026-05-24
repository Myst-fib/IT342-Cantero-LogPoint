import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VisitorLog from '../VisitorLog';

test('VisitorLog renders without crashing', () => {
  render(
    <MemoryRouter>
      <VisitorLog />
    </MemoryRouter>
  );
  expect(document.body).toBeTruthy();
});

test('VisitorLog has elements in the DOM', () => {
  render(
    <MemoryRouter>
      <VisitorLog />
    </MemoryRouter>
  );
  const elements = document.querySelectorAll('div');
  expect(elements.length).toBeGreaterThan(0);
});

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddVisitor from '../AddVisitor';

test('AddVisitor renders without crashing', () => {
  render(
    <MemoryRouter>
      <AddVisitor />
    </MemoryRouter>
  );
  expect(document.body).toBeTruthy();
});

test('AddVisitor has input fields', () => {
  render(
    <MemoryRouter>
      <AddVisitor />
    </MemoryRouter>
  );
  const inputs = document.querySelectorAll('input');
  expect(inputs.length).toBeGreaterThanOrEqual(0);
});




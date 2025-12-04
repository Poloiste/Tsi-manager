import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './AuthContext';

test('renders without crashing', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  // Just check that it renders without crashing
  expect(true).toBe(true);
});

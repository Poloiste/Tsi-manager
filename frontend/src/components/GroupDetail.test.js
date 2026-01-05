import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GroupDetail } from './GroupDetail';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  X: () => <div data-testid="x-icon">X</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Crown: () => <div data-testid="crown-icon">Crown</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  RefreshCw: () => <div data-testid="refresh-icon">Refresh</div>,
}));

// Mock GroupLeaderboard
jest.mock('./GroupLeaderboard', () => ({
  GroupLeaderboard: () => <div data-testid="group-leaderboard">Leaderboard</div>
}));

describe('GroupDetail Component - Copy Button Functionality', () => {
  const mockGroup = {
    id: 'test-group-1',
    name: 'Test Private Group',
    description: 'A test private group',
    is_public: false,
    invite_code: 'ABC123XYZ',
    memberCount: 5,
    created_at: '2024-01-01T00:00:00Z'
  };

  const defaultProps = {
    group: mockGroup,
    onClose: jest.fn(),
    onLeave: jest.fn(),
    onDelete: jest.fn(),
    onGenerateCode: jest.fn(),
    onShareDecks: jest.fn(),
    leaderboard: [],
    availableDecks: [],
    isDark: true,
    currentUserId: 'user-1',
    isCreator: true
  };

  // Mock clipboard API
  const mockClipboard = {
    writeText: jest.fn()
  };

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: mockClipboard
    });
    mockClipboard.writeText.mockClear();
    defaultProps.onClose.mockClear();
    defaultProps.onGenerateCode.mockClear();
  });

  test('renders private group invitation section for creator', () => {
    render(<GroupDetail {...defaultProps} />);
    
    expect(screen.getByText('Invitation au groupe privé')).toBeInTheDocument();
    expect(screen.getByText('Code d\'invitation')).toBeInTheDocument();
    expect(screen.getByText(mockGroup.invite_code)).toBeInTheDocument();
  });

  test('displays full invitation link', () => {
    render(<GroupDetail {...defaultProps} />);
    
    const expectedLink = `${window.location.origin}/join-group/${mockGroup.invite_code}`;
    expect(screen.getByText(expectedLink)).toBeInTheDocument();
  });

  test('copy button for invite code works', async () => {
    mockClipboard.writeText.mockResolvedValueOnce();
    
    render(<GroupDetail {...defaultProps} />);
    
    // Verify both copy buttons are present initially
    expect(screen.getByText('Copier')).toBeInTheDocument();
    expect(screen.getByText('Copier le lien')).toBeInTheDocument();
    
    // Find the copy code button by its exact text
    const copyCodeButton = screen.getByRole('button', { name: /copier le code/i });
    
    // Click the copy button for the code
    fireEvent.click(copyCodeButton);
    
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(mockGroup.invite_code);
    });
    
    // After clicking code button, should show one "Copié !" and one "Copier le lien"
    await waitFor(() => {
      expect(screen.getByText('Copié !')).toBeInTheDocument(); // Code button shows "Copié !"
      expect(screen.getByText('Copier le lien')).toBeInTheDocument(); // Link button still shows "Copier le lien"
    });
  });

  test('copy button for full link works', async () => {
    mockClipboard.writeText.mockResolvedValueOnce();
    
    render(<GroupDetail {...defaultProps} />);
    
    const expectedLink = `${window.location.origin}/join-group/${mockGroup.invite_code}`;
    const copyButtons = screen.getAllByRole('button', { name: /copier/i });
    const copyLinkButton = copyButtons[1];
    
    // Click the copy button for the full link
    fireEvent.click(copyLinkButton);
    
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(expectedLink);
    });
  });

  test('handles copy error gracefully', async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
    
    render(<GroupDetail {...defaultProps} />);
    
    const copyButtons = screen.getAllByRole('button', { name: /copier/i });
    fireEvent.click(copyButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/impossible de copier/i)).toBeInTheDocument();
    });
  });

  test('fallback copy method when clipboard API is not available', async () => {
    // Remove clipboard API
    const originalClipboard = navigator.clipboard;
    delete navigator.clipboard;
    
    // Mock document.execCommand
    document.execCommand = jest.fn(() => true);
    
    render(<GroupDetail {...defaultProps} />);
    
    const copyButtons = screen.getAllByRole('button', { name: /copier/i });
    fireEvent.click(copyButtons[0]);
    
    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
    
    // Restore clipboard
    Object.assign(navigator, { clipboard: originalClipboard });
  });

  test('generate code button calls onGenerateCode', () => {
    render(<GroupDetail {...defaultProps} />);
    
    const generateButton = screen.getByRole('button', { name: /générer un nouveau code/i });
    fireEvent.click(generateButton);
    
    expect(defaultProps.onGenerateCode).toHaveBeenCalledWith(mockGroup.id);
  });

  test('does not show invitation section for non-creator', () => {
    render(<GroupDetail {...defaultProps} isCreator={false} />);
    
    expect(screen.queryByText('Invitation au groupe privé')).not.toBeInTheDocument();
  });

  test('does not show invitation section for public group', () => {
    const publicGroup = { ...mockGroup, is_public: true };
    render(<GroupDetail {...defaultProps} group={publicGroup} />);
    
    expect(screen.queryByText('Invitation au groupe privé')).not.toBeInTheDocument();
  });

  test('copy button has proper accessibility attributes', () => {
    render(<GroupDetail {...defaultProps} />);
    
    const copyButtons = screen.getAllByRole('button', { name: /copier/i });
    copyButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });
  });

  test('close button works', () => {
    render(<GroupDetail {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Fermer');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('displays group information correctly', () => {
    render(<GroupDetail {...defaultProps} />);
    
    expect(screen.getByText(mockGroup.name)).toBeInTheDocument();
    expect(screen.getByText(mockGroup.description)).toBeInTheDocument();
    expect(screen.getByText('🔒 Privé')).toBeInTheDocument();
    expect(screen.getByText(/créateur/i)).toBeInTheDocument();
  });
});

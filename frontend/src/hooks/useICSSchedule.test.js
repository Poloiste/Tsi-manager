import { renderHook, waitFor } from '@testing-library/react';
import { useICSSchedule } from './useICSSchedule';

jest.mock('../utils/icsParser', () => ({
  parseICS: jest.fn(() => [])
}));

describe('useICSSchedule', () => {
  const originalApiUrl = process.env.REACT_APP_API_URL;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('BEGIN:VCALENDAR\nEND:VCALENDAR')
    });
  });

  afterEach(() => {
    jest.clearAllMocks();

    if (originalApiUrl === undefined) {
      delete process.env.REACT_APP_API_URL;
    } else {
      process.env.REACT_APP_API_URL = originalApiUrl;
    }
  });

  it('uses the ICS proxy path once when REACT_APP_API_URL already ends with /api', async () => {
    process.env.REACT_APP_API_URL = 'https://example.com/api';

    const { result } = renderHook(() => useICSSchedule());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/api/ics-proxy');
  });

  it('adds the /api prefix when REACT_APP_API_URL does not include it', async () => {
    process.env.REACT_APP_API_URL = 'https://example.com';

    const { result } = renderHook(() => useICSSchedule());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/api/ics-proxy');
  });

  it('passes user_id query param when a user id is provided', async () => {
    process.env.REACT_APP_API_URL = 'https://example.com';

    const { result } = renderHook(() => useICSSchedule('user-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/api/ics-proxy?user_id=user-123');
  });
});

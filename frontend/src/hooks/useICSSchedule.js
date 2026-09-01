import { useState, useEffect, useCallback } from 'react';
import { parseICS } from '../utils/icsParser';

export function getICSProxyUrl() {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  const normalizedApiUrl = apiUrl.replace(/\/api\/?$/, '');

  return `${normalizedApiUrl}/api/ics-proxy`;
}

/**
 * Hook that fetches and parses the university ICS calendar from the backend proxy.
 *
 * Returns:
 *  - getBaseSchedule(isoYear, isoWeek, dayName) → Array of course objects for that day/week
 *  - isLoading: boolean
 *  - error: string | null
 *  - refresh(): re-fetch the ICS
 */
export function useICSSchedule() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchICS = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(getICSProxyUrl());
      if (!response.ok) {
        const text = await response.text();
        let msg;
        try {
          msg = JSON.parse(text).error;
        } catch {
          msg = `HTTP ${response.status}`;
        }
        throw new Error(msg || `HTTP ${response.status}`);
      }
      const icsText = await response.text();
      const parsed = parseICS(icsText);
      setEvents(parsed);
    } catch (err) {
      console.error('[useICSSchedule] Failed to load ICS:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchICS();
  }, [fetchICS]);

  /**
   * Returns the list of courses for a specific ISO week and day.
   * @param {number} isoYear
   * @param {number} isoWeek
   * @param {string} dayName - French day name, e.g. "Lundi"
   * @returns {Array<Object>}
   */
  const getBaseSchedule = useCallback((isoYear, isoWeek, dayName) => {
    return events.filter(
      (e) => e.isoYear === isoYear && e.isoWeek === isoWeek && e.dayName === dayName
    );
  }, [events]);

  return { getBaseSchedule, isLoading, error, refresh: fetchICS };
}

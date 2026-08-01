import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useProgressSync(currentPage) {
  const { user } = useAuth();
  const lastSavedRef = useRef(null);

  const saveProgress = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const payload = { currentPage };
    const key = `${currentPage}`;
    if (lastSavedRef.current === key) return;
    try {
      const res = await fetch('/api/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) { lastSavedRef.current = key; }
    } catch {}
  }, [user, currentPage]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => saveProgress(), 800);
    return () => clearTimeout(t);
  }, [currentPage, user, saveProgress]);

  const loadProgress = useCallback(async () => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/get-progress', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, [user]);

  const resetProgress = useCallback(async () => {
    if (!user) return;
    const token = await user.getIdToken();
    try {
      await fetch('/api/reset-progress', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      lastSavedRef.current = null;
    } catch {}
  }, [user]);

  return { saveProgress, loadProgress, resetProgress };
}
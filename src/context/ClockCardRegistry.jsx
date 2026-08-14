import { createContext, useContext, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ClockCardRegistry — global registry untuk memastikan hanya SATU card clock
// yang aktif pada satu waktu. Mencegah bug "multiple auto clocks running in
// background → ngelag" (Bagian 30/31 memory.md / design.md).
//
// Cara kerja:
//   1. Setiap card clock mendaftarkan diri via `registerActive(cardId, resetFn)`
//      saat clock-nya menjadi aktif (clk=1 atau autoActive=true).
//   2. Saat card baru mendaftar, registry OTOMATIS memanggil resetFn card
//      sebelumnya (yang berbeda cardId) → card sebelumnya di-force-clear
//      (pristine state, seolah user belum menyentuh).
//   3. Card yang clock-nya menjadi inactive (clk=0) wajib unregister diri
//      supaya tidak di-reset secara tidak perlu saat card lain mendaftar.
//
// Hook useClockMode (src/hooks/useClockMode.js) sudah otomatis menggunakan
// registry ini — card component cukup pass `cardId` ke useClockMode, tidak
// perlu manual panggil register/unregister.
//
// ATURAN MUTLAK: semua card clock (sekarang & masa depan) WAJIB berada di
// dalam ClockCardProvider. Lihat design.md Bagian 30/31 untuk spec lengkap.
// ─────────────────────────────────────────────────────────────────────────────

const ClockCardRegistryContext = createContext(null);

export function ClockCardProvider({ children }) {
    // { cardId, resetFn } | null
    const activeCardRef = useRef(null);

    const registerActive = useCallback((cardId, resetFn) => {
        const prev = activeCardRef.current;
        if (prev && prev.cardId !== cardId) {
            // Force-reset card sebelumnya → pristine state
            try { prev.resetFn(); } catch (e) { /* swallow */ }
        }
        activeCardRef.current = { cardId, resetFn };
    }, []);

    const unregister = useCallback((cardId) => {
        if (activeCardRef.current && activeCardRef.current.cardId === cardId) {
            activeCardRef.current = null;
        }
    }, []);

    return (
        <ClockCardRegistryContext.Provider value={{ registerActive, unregister }}>
            {children}
        </ClockCardRegistryContext.Provider>
    );
}

// Defensive: kembalikan no-op functions jika dipakai di luar provider,
// supaya useClockMode tetap berfungsi tanpa crash.
export function useClockCardRegistry() {
    const ctx = useContext(ClockCardRegistryContext);
    if (!ctx) {
        return {
            registerActive: () => {},
            unregister: () => {},
        };
    }
    return ctx;
}

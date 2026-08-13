import { useState, useRef, useCallback, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useClockMode — Hook reusable untuk manajemen tombol CLK dengan 2 mode:
//   'manual' — user klik tombol CLK sendiri untuk toggle 1/0.
//   'auto'   — user klik 1x untuk memulai pulsasi 1→0→1→0… secara continue;
//              klik lagi untuk STOP dan reset ke 0 (BUKAN melanjutkan pulsasi).
//
// Aturan ketat (Bagian 29 memory.md / design.md):
//   1. Saat auto aktif (autoActive=true), user TIDAK boleh switch mode.
//      → Jika user paksa tekan mode lain → toast "matikan clock dahulu sebelum
//        beralih mode clock" + mulai rate-limit 5 detik.
//   2. Selama rate-limit aktif, upaya switch mode apapun akan ditolak paksa
//      → toast "warning! pencegahan rate limit mohon tunggu 5 detik".
//
// Hook ini bersifat GENERIC — dipakai oleh Card 16, Card 17, dan card manapun
// di masa depan yang memiliki tombol CLK. Lihat design.md Bagian 29 untuk
// spec lengkap (aturan ini WAJIB untuk semua clock, sekarang & mendatang).
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_INTERVAL_MS = 600; // 1→0→1→0 setiap 600ms = ~0.83Hz (cukup cepat utk visual)
const RATE_LIMIT_MS = 5000;   // 5 detik cooldown setelah upaya blocked
const TOAST_DURATION_MS = 3000; // toast auto-dismiss setelah 3 detik

export function useClockMode() {
    // ── State ──
    const [clk, setClk] = useState(false);
    const [clockMode, setClockModeState] = useState('manual'); // 'manual' | 'auto'
    const [autoActive, setAutoActive] = useState(false);
    const [toast, setToast] = useState(null); // { text, type, id } | null

    // ── Refs (tidak trigger re-render) ──
    const intervalRef = useRef(null);
    const rateLimitedUntilRef = useRef(0); // timestamp sampai mana rate-limit aktif
    const toastIdRef = useRef(0);
    const toastTimeoutRef = useRef(null);
    const autoActiveRef = useRef(false); // mirror autoActive untuk dipakai di callback stabil

    // Sync ref dengan state autoActive
    useEffect(() => { autoActiveRef.current = autoActive; }, [autoActive]);

    // ── Toast helper ──
    const showToast = useCallback((text, type) => {
        const id = ++toastIdRef.current;
        setToast({ text, type, id });
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
            setToast(prev => (prev && prev.id === id ? null : prev));
        }, TOAST_DURATION_MS);
    }, []);

    // ── Stop auto pulsation ──
    // Dipanggil baik oleh toggleClk (user klik clock button saat autoActive)
    // maupun oleh cleanup unmount.
    const stopAuto = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setAutoActive(false);
        setClk(false); // RESET ke 0 saat stop (spec user: "kembali jadi 0, bukan 1 0 1 0 lagi")
    }, []);

    // ── Start auto pulsation ──
    // Pulsa dimulai dari 1 (spec user: "tekan 1 kali → clock memancarkan 1 0 1 0 1 0").
    const startAuto = useCallback(() => {
        setAutoActive(true);
        setClk(true); // mulai dari 1
        let next = true;
        intervalRef.current = setInterval(() => {
            next = !next;
            setClk(next);
        }, AUTO_INTERVAL_MS);
    }, []);

    // ── Toggle clock (dipanggil saat user klik tombol CLK) ──
    const toggleClk = useCallback(() => {
        if (autoActiveRef.current) {
            // Auto sedang aktif → klik = STOP
            stopAuto();
            return;
        }
        if (clockMode === 'manual') {
            // Manual: toggle 1/0
            setClk(v => !v);
        } else {
            // Auto mode tapi belum aktif → klik = START pulsasi
            startAuto();
        }
    }, [clockMode, stopAuto, startAuto]);

    // ── Switch clock mode (dipanggil saat user klik switch MANUAL/AUTO) ──
    const setClockMode = useCallback((newMode) => {
        // No-op jika mode tidak berubah
        if (newMode === clockMode) return;

        const now = Date.now();

        // Cek rate-limit: jika masih dalam cooldown, tolak paksa
        if (now < rateLimitedUntilRef.current) {
            showToast('warning! pencegahan rate limit mohon tunggu 5 detik', 'rate-limit');
            return;
        }

        // Cek auto-active lock: jika auto sedang pulsasi, BLOCK switch
        if (autoActiveRef.current) {
            showToast('matikan clock dahulu sebelum beralih mode clock', 'block');
            // Mulai rate-limit 5 detik untuk anti-spam
            rateLimitedUntilRef.current = now + RATE_LIMIT_MS;
            return;
        }

        // OK, switch mode diizinkan
        setClockModeState(newMode);
    }, [clockMode, showToast]);

    // ── Cleanup saat unmount ──
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, []);

    return {
        // State
        clk,
        clockMode,     // 'manual' | 'auto'
        autoActive,    // bool — true saat auto pulsasi sedang berjalan
        // Actions
        toggleClk,
        setClockMode,
        // Toast (untuk di-render oleh ClockToast)
        toast,
    };
}

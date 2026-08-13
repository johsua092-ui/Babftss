import { useState, useRef, useCallback, useEffect } from 'react';
import { useClockCardRegistry } from '../context/ClockCardRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// useClockMode — Hook reusable untuk manajemen tombol CLK dengan 2 mode:
//   'manual' — user klik tombol CLK sendiri untuk toggle 1/0.
//   'auto'   — user klik 1x untuk memulai pulsasi 1→0→1→0… secara continue;
//              klik lagi untuk STOP dan reset ke 0 (BUKAN melanjutkan pulsasi).
//
// Aturan ketat (Bagian 29–31 memory.md / design.md):
//
//   1. [BUG 1 FIX — Bagian 30] Saat clock AKTIF (clk=1, baik manual maupun
//      auto), user TIDAK boleh switch mode. Sebelumnya lock hanya cek
//      `autoActive`, sehingga manual mode + clk=1 masih bisa switch → BUG
//      KRITIS. Sekarang lock cek `clk || autoActive` → switch diblok
//      kapanpun clk=1.
//      → Jika user paksa tekan mode lain → toast "matikan clock dahulu
//        sebelum beralih mode clock" + mulai rate-limit 5 detik.
//
//   2. Selama rate-limit aktif, upaya switch mode apapun akan ditolak paksa
//      → toast "warning! pencegahan rate limit mohon tunggu 5 detik".
//
//   3. [BUG 2 FIX — Bagian 31] Hanya SATU card clock boleh aktif pada satu
//      waktu. Saat card ini clock-nya aktif, ia mendaftar ke global registry
//      (ClockCardRegistry). Saat card lain clock-nya aktif, registry
//      memanggil `reset()` card ini → pristine state (seolah user belum
//      menyentuh card).
//      Selain itu, IntersectionObserver men-trigger `reset()` jika card
//      scroll-out dari viewport DAN auto mode sedang berjalan (mencegah
//      background pulsasi → ngelag).
//
// Hook ini bersifat GENERIC — dipakai oleh Card 16, Card 17, dan card manapun
// di masa depan yang memiliki tombol CLK. Lihat design.md Bagian 29–31 untuk
// spec lengkap (aturan ini WAJIB untuk semua clock, sekarang & mendatang).
//
// Opsi:
//   cardId  — string unik untuk card ini (wajib untuk fitur registry &
//             IntersectionObserver). Contoh: 'card-16', 'card-17'.
//   onReset — callback opsional yang dipanggil saat `reset()` trigger,
//             supaya card bisa reset state lokal (input, Q, dll) ke 0.
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_INTERVAL_MS = 600; // 1→0→1→0 setiap 600ms = ~0.83Hz (cukup cepat utk visual)
const RATE_LIMIT_MS = 5000;   // 5 detik cooldown setelah upaya blocked
const TOAST_DURATION_MS = 3000; // toast auto-dismiss setelah 3 detik

export function useClockMode(options = {}) {
    const { cardId, onReset } = options;

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
    const autoActiveRef = useRef(false); // mirror autoActive untuk callback stabil
    const clkRef = useRef(false);         // mirror clk untuk lock check stabil
    const onResetRef = useRef(onReset);   // stable ref onReset (terima perubahan tanpa re-create reset)
    const cardIdRef = useRef(cardId);     // stable ref cardId
    const cardRef = useRef(null);         // DOM ref untuk IntersectionObserver
    const resetRef = useRef(null);        // mirror reset (untuk IntersectionObserver callback)

    // Sync refs dengan state
    useEffect(() => { autoActiveRef.current = autoActive; }, [autoActive]);
    useEffect(() => { clkRef.current = clk; }, [clk]);
    useEffect(() => { onResetRef.current = onReset; }, [onReset]);
    useEffect(() => { cardIdRef.current = cardId; }, [cardId]);

    // ── Global registry (ClockCardRegistry) ──
    const { registerActive, unregister } = useClockCardRegistry();

    // ── Toast helper ──
    const showToast = useCallback((text, type) => {
        const id = ++toastIdRef.current;
        setToast({ text, type, id });
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
            setToast(prev => (prev && prev.id === id ? null : prev));
        }, TOAST_DURATION_MS);
    }, []);

    // ── Stop auto pulsation (user-initiated via toggleClk) ──
    // TIDAK memanggil onReset — user mungkin ingin re-start pulsasi nanti.
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
    // [BUG 1 FIX] Lock kapanpun clk=1 — baik manual on maupun auto running.
    const setClockMode = useCallback((newMode) => {
        // No-op jika mode tidak berubah
        if (newMode === clockMode) return;

        const now = Date.now();

        // Cek rate-limit: jika masih dalam cooldown, tolak paksa
        if (now < rateLimitedUntilRef.current) {
            showToast('warning! pencegahan rate limit mohon tunggu 5 detik', 'rate-limit');
            return;
        }

        // LOCK: block switch jika clock AKTIF (clk=1).
        // Sebelumnya hanya cek `autoActive`, sehingga manual mode + clk=1
        // masih bisa switch — itu BUG KRITIS (Bagian 30).
        if (clkRef.current || autoActiveRef.current) {
            showToast('matikan clock dahulu sebelum beralih mode clock', 'block');
            // Mulai rate-limit 5 detik untuk anti-spam
            rateLimitedUntilRef.current = now + RATE_LIMIT_MS;
            return;
        }

        // OK, switch mode diizinkan
        setClockModeState(newMode);
    }, [clockMode, showToast]);

    // ── Force reset (dipanggil oleh registry atau IntersectionObserver) ──
    // [BUG 2 FIX] Full pristine reset — stop auto, clk=0, clockMode='manual',
    // clear rate-limit, clear toast, AND call onReset untuk reset card-local
    // state (input, Q) supaya card kembali "seolah user belum menyentuh".
    const reset = useCallback(() => {
        // Stop auto pulsation
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setAutoActive(false);
        setClk(false);
        setClockModeState('manual');
        // Clear rate-limit supaya user bisa langsung interact lagi kalau kembali
        rateLimitedUntilRef.current = 0;
        // Clear toast yang masih pending
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = null;
        }
        setToast(null);
        // Panggil card's onReset untuk reset state lokal (input, Q, dll)
        if (onResetRef.current) {
            try { onResetRef.current(); } catch (e) { /* swallow */ }
        }
    }, []);

    // Keep resetRef in sync (untuk IntersectionObserver callback yang stabil)
    useEffect(() => { resetRef.current = reset; }, [reset]);

    // ── Register/unregister dengan global registry ──
    // Saat clock aktif (clk=1 atau autoActive) → register diri.
    // Saat clock inactive → unregister diri supaya tidak di-reset percuma
    // saat card lain mendaftar.
    useEffect(() => {
        if (!cardIdRef.current) return; // no-op jika tidak ada cardId
        if (clk || autoActive) {
            registerActive(cardIdRef.current, reset);
        } else {
            unregister(cardIdRef.current);
        }
    }, [clk, autoActive, registerActive, unregister, reset]);

    // ── IntersectionObserver: reset saat card scroll-out + auto running ──
    // [BUG 2 FIX] Mencegah background pulsasi yang menyebabkan lag.
    // Hanya trigger jika auto running (manual clk=1 TIDAK trigger — preserve
    // state user). Saat card fully out of viewport (threshold=0), reset.
    useEffect(() => {
        if (!cardIdRef.current) return; // no-op jika tidak ada cardId
        const node = cardRef.current;
        if (!node) return;

        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                // Hanya reset saat scroll-out DAN auto sedang running
                if (!entry.isIntersecting && autoActiveRef.current && resetRef.current) {
                    resetRef.current();
                }
            }
        }, { threshold: 0 });

        observer.observe(node);
        return () => observer.disconnect();
        // Intentionally empty deps — observer set up once on mount, gunakan refs.
    }, []);

    // ── Cleanup saat unmount ──
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            // Unregister dari registry kalau ini card aktif (defensive)
            if (cardIdRef.current) unregister(cardIdRef.current);
        };
    }, [unregister]);

    return {
        // State
        clk,
        clockMode,     // 'manual' | 'auto'
        autoActive,    // bool — true saat auto pulsasi sedang berjalan
        // Actions
        toggleClk,
        setClockMode,
        reset,         // exposed untuk manual trigger (jika diperlukan di masa depan)
        // Toast (untuk di-render oleh ClockToast)
        toast,
        // DOM ref — attach ke container div card (wajib untuk IntersectionObserver)
        cardRef,
    };
}

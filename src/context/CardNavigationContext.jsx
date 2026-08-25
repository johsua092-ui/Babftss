import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const CardNavigationContext = createContext(null);

export function CardNavigationProvider({ children }) {
    const [highlightedCard, setHighlightedCard] = useState(null);
    const isNavigatingRef = useRef(false);
    const clearFiltersRef = useRef(null);

    // Dipanggil oleh CircuitList untuk mendaftarkan fungsi clear filter
    const registerClearFilters = useCallback((fn) => {
        clearFiltersRef.current = fn;
    }, []);

    const navigateToCard = useCallback((targetNum) => {
        // Set flag supaya document listener gak langsung clear
        isNavigatingRef.current = true;

        // Clear semua filter dulu supaya card target pasti tampil
        if (clearFiltersRef.current) {
            clearFiltersRef.current();
        }

        setHighlightedCard(targetNum);

        // Scroll ke elemen card setelah filter clear & render selesai
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const el = document.getElementById(`card-${targetNum}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                isNavigatingRef.current = false;
            });
        });
    }, []);

    const clearHighlight = useCallback(() => {
        if (isNavigatingRef.current) return;
        setHighlightedCard(null);
    }, []);

    // Document-level listener: klik di mana saja = clear highlight
    useEffect(() => {
        function handleDocClick() {
            clearHighlight();
        }
        document.addEventListener('click', handleDocClick);
        return () => document.removeEventListener('click', handleDocClick);
    }, [clearHighlight]);

    return (
        <CardNavigationContext.Provider value={{ highlightedCard, navigateToCard, clearHighlight, registerClearFilters }}>
            {children}
        </CardNavigationContext.Provider>
    );
}

export function useCardNavigation() {
    const ctx = useContext(CardNavigationContext);
    if (!ctx) throw new Error('useCardNavigation must be used within CardNavigationProvider');
    return ctx;
}

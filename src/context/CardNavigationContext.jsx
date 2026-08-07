import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const CardNavigationContext = createContext(null);

export function CardNavigationProvider({ children }) {
    const [highlightedCard, setHighlightedCard] = useState(null);
    const isNavigatingRef = useRef(false);

    const navigateToCard = useCallback((targetNum) => {
        // Set flag supaya document listener gak langsung clear
        isNavigatingRef.current = true;
        setHighlightedCard(targetNum);

        // Scroll ke elemen card
        const el = document.getElementById(`card-${targetNum}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Reset flag setelah event cycle selesai (supaya klik ICBlock
        // yang stopPropagation gak ikut ke-clear oleh document listener)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
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
        <CardNavigationContext.Provider value={{ highlightedCard, navigateToCard, clearHighlight }}>
            {children}
        </CardNavigationContext.Provider>
    );
}

export function useCardNavigation() {
    const ctx = useContext(CardNavigationContext);
    if (!ctx) throw new Error('useCardNavigation must be used within CardNavigationProvider');
    return ctx;
}

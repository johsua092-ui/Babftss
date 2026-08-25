import { createContext, useContext } from 'react';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ itemId, itemType, children }) {
    const value = { itemId, itemType };
    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavoritesContext() {
    return useContext(FavoritesContext);
}

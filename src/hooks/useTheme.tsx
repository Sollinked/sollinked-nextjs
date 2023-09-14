import { useContext, createContext, useState, useCallback, useEffect } from 'react';

type AvailableThemes = "dark" | "light";

type ThemeContextState = {
    theme: AvailableThemes;
    setTheme: (theme: AvailableThemes) => void;
    toggleTheme: () => void;
}

type ProviderProps = {
    theme?: AvailableThemes;
    children?: React.ReactNode;
}

const ThemeContext = createContext<ThemeContextState>({
    theme: "dark",
    setTheme: () => {},
    toggleTheme: () => {},
});

export const useTheme = () => (useContext(ThemeContext));
export const ThemeProvider = ({theme, children}: ProviderProps) => {
    const [ currentTheme, setCurrentTheme ] = useState<AvailableThemes>(theme ?? "dark");
    const setTheme = useCallback((theme: AvailableThemes) => {
        setCurrentTheme(theme);
    }, []);

    const toggleTheme = useCallback(() => {
        if(currentTheme === "dark") {
            setTheme("light");
            return;
        }

        setTheme("dark");
    }, [currentTheme]);

    useEffect(() => {
        if(currentTheme !== "dark") {
            document.querySelector('html')?.classList.remove("dark");
        }

        else {
            document.querySelector('html')?.classList.add("dark");
        }
    }, [currentTheme]);

    return (
        <ThemeContext.Provider
            value={{
                theme: currentTheme,
                setTheme,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}
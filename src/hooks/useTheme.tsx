import { ConfigProvider } from 'antd';
import { useContext, createContext, useState, useCallback, useEffect } from 'react';
import React from 'react';

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
        localStorage.setItem('theme', theme);
    }, []);

    const toggleTheme = useCallback(() => {
        if(currentTheme === "dark") {
            setTheme("light");
            return;
        }

        setTheme("dark");
    }, [currentTheme, setTheme]);

    useEffect(() => {
        let storageTheme = (localStorage.getItem('theme') ?? "dark") as AvailableThemes;
        setCurrentTheme(theme ?? storageTheme);
    }, [theme]);

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
            <ConfigProvider
                theme={{
                    components: {
                        Tabs: {
                            inkBarColor: currentTheme === "light"? '#1677ff' : 'rgb(99,102,241)',
                            itemSelectedColor: currentTheme === "light"? "#1677ff" : 'rgb(255,255,255)',
                            itemColor: currentTheme === "light"? "	rgba(0, 0, 0, 0.88)" : 'rgb(100,116,139)',
                        },
                        Table: {
                            fontSize: 10,
                            headerBg: currentTheme === "light"? "#fafafa" : 'rgb(51,65,85)',
                            headerColor: currentTheme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
                            headerSortActiveBg: currentTheme === "light"? "#f0f0f0" : 'rgb(30,41,59)',
                            headerSortHoverBg: currentTheme === "light"? "#f0f0f0" : 'rgb(30,41,59)',
                            colorBgContainer: currentTheme === "light"? "#ffffff" : 'rgb(71,85,105)',
                            headerSplitColor: currentTheme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
                            borderColor: currentTheme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
                        },
                        Empty: {
                            colorText: currentTheme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
                            colorTextDisabled: currentTheme === "light"? "rgba(0, 0, 0, 0.25)" : 'white',
                        },
                        Modal: {
                            contentBg: currentTheme === "light"? "#ffffff" : 'rgb(30,41,59)',
                            headerBg: currentTheme === "light"? "#ffffff" : 'rgb(30,41,59)',
                            titleColor: currentTheme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
                            colorIcon: currentTheme === "light"? "rgba(0, 0, 0, 0.45)" : 'white',
                        },
                        Select: {
                            colorBgContainer: currentTheme === "light"? "#ffffff" : 'rgb(71,85,105)',
                            colorBorder: currentTheme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
                            multipleItemBg: currentTheme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
                            colorText: currentTheme === "light"? "rgba(0, 0, 0, 0.88)" : 'white',
                            selectorBg: currentTheme === "light"? "#ffffff" : 'rgb(30,41,59)',
                            colorBgElevated: currentTheme === "light"? "#ffffff" : 'rgb(71,85,105)',
                            clearBg: currentTheme === 'light'? 'black' : 'white',
                            colorIcon: currentTheme === "light"? "rgba(0, 0, 0, 0.45)" : 'white',
                            optionSelectedBg: currentTheme === "light"? "#f0f0f0" : 'rgb(100,116,139)',
                            colorTextQuaternary: currentTheme === 'light'? 'rgba(0, 0, 0, 0.25)' : 'white',
                            colorPrimary: currentTheme === 'light'? '#1677ff' : 'white',
                        }
                    }
                }}
            >
                {children}
            </ConfigProvider>
        </ThemeContext.Provider>
    )
}
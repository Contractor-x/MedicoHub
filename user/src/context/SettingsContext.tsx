
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface Settings {
    maintenanceMode: boolean;
    allowSignups: boolean;
    announcement: string;
    mcampLive: boolean;
    mcampEnrollment: boolean;
    proDiscountEnabled: boolean;
    proDiscountPercentage: number;
}

const defaultSettings: Settings = {
    maintenanceMode: false,
    allowSignups: true,
    announcement: '',
    mcampLive: false,
    mcampEnrollment: true,
    proDiscountEnabled: true,
    proDiscountPercentage: 10
};

const SettingsContext = createContext<Settings>(defaultSettings);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.settings.get();
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error("Failed to fetch settings from MongoDB:", error);
            }
        };

        fetchSettings();
        const interval = setInterval(fetchSettings, 300000); // Check every 5 mins
        return () => clearInterval(interval);
    }, []);

    return (
        <SettingsContext.Provider value={settings}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);

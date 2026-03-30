
import React, { useEffect, useRef } from 'react';
import { api } from '../services/api';
import { auth } from '../services/firebase';

interface ActivityTrackerProps {
    resourceId: string;
    resourceType: string;
    children: React.ReactNode;
    onInteraction?: (type: string, data: any) => void;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ resourceId, resourceType, children }) => {
    const startTime = useRef(Date.now());

    // Ref to store latest interaction stats if we add that later (scroll depth etc)
    const interactions = useRef({});

    useEffect(() => {
        startTime.current = Date.now();

        return () => {
            const endTime = Date.now();
            const durationSeconds = Math.floor((endTime - startTime.current) / 1000);

            if (durationSeconds > 5 && auth.currentUser) { // Only log meaningful sessions (>5s)
                const sessionData = {
                    userId: auth.currentUser.uid,
                    resourceId,
                    resourceType,
                    startTime: new Date(startTime.current).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                    durationSeconds,
                    interactions: interactions.current
                };

                // Send to backend (fire and forget)
                api.analytics.logSession(sessionData).catch(err => {
                    console.error("Failed to save activity log:", err);
                    // In a pro app, you might cache this in localStorage to retry later
                });
            }
        };
    }, [resourceId, resourceType]);

    return <>{children}</>;
};

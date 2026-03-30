
import dotenv from 'dotenv';
import path from 'path';

// Construct path to backend .env
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import { db } from '../config/firebase';

const dummies = [
    { title: 'Cardiology: Valve Disorders', type: 'Video', subject: 'Cardiology', tags: ['Cardiology', 'Year 2'], isPro: true, isMcampExclusive: false, url: 'https://www.youtube.com/watch?v=dummy1', isYoutube: true },
    { title: 'Krebs Cycle Mnemonics', type: 'PDF', subject: 'Biochemistry', tags: ['Biochemistry', 'Year 1'], isPro: false, isMcampExclusive: false, url: 'https://example.com/dummy.pdf', isYoutube: false },
    { title: 'Upper Limb Anatomy Quiz', type: 'Quiz', subject: 'Anatomy', tags: ['Anatomy', 'Year 1'], isPro: true, isMcampExclusive: false, url: '#', isYoutube: false },
    { title: 'Anatomy Deep Dive: Upper Limb', type: 'Video', subject: 'Anatomy', tags: ['Anatomy', 'MCAMP'], isPro: true, isMcampExclusive: true, url: 'https://www.youtube.com/watch?v=dummy2', isYoutube: true },
];

async function seed() {
    console.log("Seeding Resources...");
    try {
        const collection = db.collection('resources');

        for (const data of dummies) {
            const docRef = collection.doc();
            await docRef.set({
                ...data,
                id: docRef.id,
                courseId: 'general',
                moduleId: 'general',
                createdAt: new Date().toISOString()
            });
            console.log(`Added: ${data.title}`);
        }
        console.log("Seeding Complete.");
    } catch (error) {
        console.error("Seeding Failed:", error);
    }
    process.exit();
}

seed();

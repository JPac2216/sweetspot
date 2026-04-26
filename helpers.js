import { ObjectId } from 'mongodb';
import { dates, spots, users } from 'config/mongoCollections.js';

// HARDCODE ALL THE BOROUGHS HERE
const boroughs = [];

export const isValidEventList = async (events) => {
    const spotsCollection = await spots();
    const fields = ["order", "spotId", "spotName", "notes"];

    for (let i = 0; i < events.length; i++) {
        const hasAllFields = fields.every(field => Object.hasOwn(events[i], field));
        if (!(hasAllFields && Object.keys(events[i]))) return false;
        const currentEvent = events[i];
        if (currentEvent["order"] !== (i + 1)) return false;
        if (!ObjectId.isValid(currentEvent["spotId"].trim())) return false;
        const exists = await spotsCollection.findOne({ _id: new ObjectId(currentEvent["spotId"].trim()) });
        if (!exists) return false;
    }

    return true;
};

// The following 3 functions were pulled from Sameer's Lab 10 implementation
export const getCurrentDate = () => {
    const options = { month: '2-digit', day: '2-digit', year: 'numeric' };
    const todayFormatted = new Date().toLocaleDateString('en-US', options);
    return todayFormatted;
};

export const getDateTime = () => {
    const d = new Date();

    const pad = (num) => String(num).padStart(2, '0');

    const month = pad(d.getMonth() + 1); 
    const day = pad(d.getDate());
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;
    const formattedHours = pad(hours);

    return `${month}/${day}/${year} ${formattedHours}:${minutes}${ampm}`;
};

export const getCurrentTime = () => {
    const d = new Date();
    const pad = (num) => String(num).padStart(2, '0');

    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;
    const formattedHours = pad(hours);

    return `${formattedHours}:${minutes}${ampm}`;
};
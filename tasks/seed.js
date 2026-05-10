// Seeds the SweetSpot database with sample users, real NYC restaurants, dates, and appeals.
// Run with: npm run seed
//
// Spots come from the NYC DOHMH Restaurant Inspection Results dataset:
//   https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j

import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { users, spots, dates, appeals } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import * as helpers from '../helpers.js';

const SALT_ROUNDS = 16;
const NYC_API_URL = 'https://data.cityofnewyork.us/resource/43nn-pn8j.json';
const RAW_FETCH_LIMIT = 5000;
const TARGET_SPOT_COUNT = 50;
const MIN_SPOT_COUNT = 10;

const BOROUGH_MAP = {
    'manhattan': 'manhattan',
    'brooklyn': 'brooklyn',
    'queens': 'queens',
    'bronx': 'the bronx',
    'staten island': 'staten island'
};

const NAME_REGEX = /^[a-zA-Z0-9 ,#]{2,25}$/;
const STREET_REGEX = /^[a-zA-Z0-9 ,#]{2,25}$/;
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

const cleanForRegex = (raw, maxLen = 25) => {
    if (!raw || typeof raw !== 'string') return null;
    // Strip everything except letters, digits, spaces, commas, hashtags
    let cleaned = raw.replace(/[^a-zA-Z0-9 ,#]/g, '').trim();
    // Collapse multiple whitespace runs into single spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    if (cleaned.length === 0) return null;
    // Truncate (don't pad)
    if (cleaned.length > maxLen) cleaned = cleaned.slice(0, maxLen).trim();
    if (cleaned.length < 2) return null;
    return cleaned;
};

// Map a raw inspection record into a SweetSpot-shaped spot doc, or null if it can't be cleaned
const transformRecord = (raw) => {
    const name = cleanForRegex(raw.dba, 25);
    if (!name || !NAME_REGEX.test(name)) return null;

    const borough = BOROUGH_MAP[(raw.boro || '').toLowerCase()];
    if (!borough) return null;

    const zip = (raw.zipcode || '').trim();
    if (!ZIP_REGEX.test(zip)) return null;

    const rawStreet = `${raw.building || ''} ${raw.street || ''}`.trim();
    const street = cleanForRegex(rawStreet, 25);
    if (!street || !STREET_REGEX.test(street)) return null;

    const cuisine = (raw.cuisine_description || 'Restaurant').trim();
    const grade = raw.grade ? `Grade ${raw.grade}.` : '';
    const score = (raw.score && !isNaN(Number(raw.score))) ? `Inspection score: ${raw.score}.` : '';
    const description =
        `${cuisine} restaurant in ${borough}. ${grade} ${score} Sourced from NYC DOHMH Restaurant Inspection Results.`
            .replace(/\s+/g, ' ')
            .trim();

    return {
        _id: new ObjectId(),
        name,
        description,
        address: { street, borough, zip },
        sweetspotRating: { average: null, count: 0 },
        reviews: []
    };
};

const fetchNYCRestaurants = async () => {
    console.log(`  Fetching up to ${RAW_FETCH_LIMIT} inspection records from NYC Open Data...`);
    const url = `${NYC_API_URL}?$limit=${RAW_FETCH_LIMIT}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`NYC API returned ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log(`  Received ${data.length} raw rows`);
    return data;
};

const buildSpotDocs = (rawRows) => {
    const seenCamis = new Set();
    const out = [];
    for (const row of rawRows) {
        if (out.length >= TARGET_SPOT_COUNT) break;
        if (!row.camis || seenCamis.has(row.camis)) continue;

        const doc = transformRecord(row);
        if (!doc) {
            seenCamis.add(row.camis); // memoize the bad rows so that we don't have to encounter them again
            continue;
        }

        seenCamis.add(row.camis);
        out.push(doc);
    }
    return out;
};

const main = async () => {
    console.log('SweetSpot seed starting...');

    const db = await dbConnection();
    await db.dropDatabase();
    console.log('  Dropped existing sweetspot database');

    const now = helpers.getDateTime();
    const today = helpers.getCurrentDate();

    // Seeding the users collection using some fabricated user data.
    const usersCollection = await users();
    const adminId = new ObjectId();
    const aliceId = new ObjectId();
    const bobId = new ObjectId();
    const carlosId = new ObjectId();

    const userDocs = [
        {
            _id: adminId,
            firstName: 'Admin', lastName: 'User',
            email: 'admin@sweetspot.com', username: 'admin',
            hashedPassword: await bcrypt.hash('Admin123!', SALT_ROUNDS),
            gender: 'other', primaryLocation: 'manhattan', secondaryLocation: '',
            datepoints: 1000, savedSchedules: [], favoriteDates: [],
            membershipLevel: 'admin'
        },
        {
            _id: aliceId,
            firstName: 'Alice', lastName: 'Anderson',
            email: 'alice@example.com', username: 'alice',
            hashedPassword: await bcrypt.hash('Password1!', SALT_ROUNDS),
            gender: 'female', primaryLocation: 'brooklyn', secondaryLocation: 'manhattan',
            datepoints: 50, savedSchedules: [], favoriteDates: [],
            membershipLevel: 'member'
        },
        {
            _id: bobId,
            firstName: 'Bob', lastName: 'Brown',
            email: 'bob@example.com', username: 'bob',
            hashedPassword: await bcrypt.hash('Password1!', SALT_ROUNDS),
            gender: 'male', primaryLocation: 'queens', secondaryLocation: '',
            datepoints: 25, savedSchedules: [], favoriteDates: [],
            membershipLevel: 'member'
        },
        {
            _id: carlosId,
            firstName: 'Carlos', lastName: 'Cruz',
            email: 'carlos@example.com', username: 'carlos',
            hashedPassword: await bcrypt.hash('Password1!', SALT_ROUNDS),
            gender: 'non-binary', primaryLocation: 'the bronx', secondaryLocation: 'manhattan',
            datepoints: 75, savedSchedules: [], favoriteDates: [],
            membershipLevel: 'member'
        }
    ];
    await usersCollection.insertMany(userDocs);
    console.log(`  Inserted ${userDocs.length} users (1 admin, 3 members)`);

    // Seeding the spots collection using the data from the NYC Restaurant Inspection Dataset.
    const spotsCollection = await spots();
    let spotDocs;
    try {
        const rawRows = await fetchNYCRestaurants();
        spotDocs = buildSpotDocs(rawRows);
    } catch (e) {
        console.error('  ERROR: failed to fetch from NYC API:', e.message);
        console.error('  Aborting seed — check internet connection and try again.');
        await closeConnection();
        process.exit(1);
    }

    if (spotDocs.length < MIN_SPOT_COUNT) {
        console.error(`  ERROR: only ${spotDocs.length} valid spots survived filtering (minimum ${MIN_SPOT_COUNT}).`);
        console.error('  The regex constraints in validateSpotFields are very strict — most real restaurant names get filtered.');
        console.error('  Consider relaxing the name/street regex in data/spots.js to allow more characters (apostrophes, periods, etc.) and longer lengths.');
        await closeConnection();
        process.exit(1);
    }

    await spotsCollection.insertMany(spotDocs);
    console.log(`  Inserted ${spotDocs.length} spots from NYC restaurant inspection data`);

    // Fabricate some reviews so that we have that in the seeded collections.
    const reviewsByUser = [
        { user: aliceId, username: 'alice', rating: 5, comment: 'Great spot for a casual date' },
        { user: bobId, username: 'bob', rating: 4, comment: 'Solid food, decent atmosphere' },
        { user: carlosId, username: 'carlos', rating: 5, comment: 'Loved it, will be back' }
    ];

    if (spotDocs.length >= 1) {
        const r = reviewsByUser[0];
        await spotsCollection.updateOne(
            { _id: spotDocs[0]._id },
            {
                $push: {
                    reviews: {
                        _id: new ObjectId(),
                        userId: r.user, username: r.username, rating: r.rating,
                        comment: r.comment, createdAt: today
                    }
                },
                $set: {
                    'sweetspotRating.count': 1,
                    'sweetspotRating.sum': r.rating,
                    'sweetspotRating.average': r.rating
                }
            }
        );
    }
    if (spotDocs.length >= 2) {
        const reviewsToPush = reviewsByUser.slice(1).map(r => ({
            _id: new ObjectId(),
            userId: r.user, username: r.username, rating: r.rating,
            comment: r.comment, createdAt: today
        }));
        const sum = reviewsToPush.reduce((a, r) => a + r.rating, 0);
        await spotsCollection.updateOne(
            { _id: spotDocs[1]._id },
            {
                $push: { reviews: { $each: reviewsToPush } },
                $set: {
                    'sweetspotRating.count': reviewsToPush.length,
                    'sweetspotRating.sum': sum,
                    'sweetspotRating.average': sum / reviewsToPush.length
                }
            }
        );
    }
    console.log('  Added sample reviews on the first two spots');


    // Seeding the dates collection
    const datesCollection = await dates();

    const spotsByBorough = {};
    for (const s of spotDocs) {
        if (!spotsByBorough[s.address.borough]) spotsByBorough[s.address.borough] = [];
        spotsByBorough[s.address.borough].push(s);
    }

    const buildDate = ({ title, description, createdBy, borough, estimatedCost, tags, datepointCost, visibility = 'public', votes = [], comments = [] }) => {
        const candidateSpots = spotsByBorough[borough] || [];
        if (candidateSpots.length === 0) return null;
        const eventCount = Math.min(2, candidateSpots.length);
        const events = candidateSpots.slice(0, eventCount).map((s, i) => ({
            order: i + 1,
            spotId: s._id,
            spotName: s.name,
            notes: `Stop ${i + 1} on this date.`
        }));

        const voteCount = votes.reduce((sum, v) => sum + v.value, 0);

        return {
            _id: new ObjectId(),
            title, description, createdBy,
            visibility, borough, estimatedCost,
            events, tags, votes, voteCount, comments,
            photos: [], datepointCost,
            createdAt: now, updatedAt: now
        };
    };

    const dateDocs = [
        buildDate({
            title: 'Brooklyn Food Crawl',
            description: 'A casual food-hopping date across two great Brooklyn restaurants.',
            createdBy: aliceId,
            borough: 'brooklyn',
            estimatedCost: 50,
            tags: ['Food', 'Casual'],
            datepointCost: 10,
            votes: [{ userId: bobId, value: 1 }, { userId: carlosId, value: 1 }],
            comments: [{
                _id: new ObjectId(),
                userId: bobId, username: 'bob',
                comment: 'Did this last weekend, solid time.',
                createdAt: now, editedAt: null
            }]
        }),
        buildDate({
            title: 'Manhattan Lunch Date',
            description: 'Quick midtown spots for an easy weekday lunch.',
            createdBy: bobId,
            borough: 'manhattan',
            estimatedCost: 40,
            tags: ['Food', 'Quick'],
            datepointCost: 5,
            votes: [{ userId: aliceId, value: 1 }]
        }),
        buildDate({
            title: 'Queens Tasting Tour',
            description: 'Explore two underrated Queens spots back-to-back.',
            createdBy: carlosId,
            borough: 'queens',
            estimatedCost: 35,
            tags: ['Food', 'Adventure'],
            datepointCost: 8
        }),
        buildDate({
            title: 'Bronx Hidden Gems',
            description: 'Two stops in the Bronx, off the tourist track.',
            createdBy: aliceId,
            borough: 'the bronx',
            estimatedCost: 30,
            tags: ['Food', 'Local'],
            datepointCost: 7,
            votes: [{ userId: bobId, value: -1 }]
        }),
        buildDate({
            title: 'Private Idea',
            description: 'Working on this one, not ready to share.',
            createdBy: aliceId,
            borough: 'manhattan',
            estimatedCost: 0,
            tags: ['Draft'],
            datepointCost: 0,
            visibility: 'private'
        })
    ].filter(Boolean);

    if (dateDocs.length > 0) {
        await datesCollection.insertMany(dateDocs);
    }
    console.log(`  Inserted ${dateDocs.length} sample dates referencing seeded NYC spots`);

    if (dateDocs.length >= 1) {
        await usersCollection.updateOne(
            { _id: bobId },
            { $push: { favoriteDates: dateDocs[0]._id } }
        );
    }
    if (dateDocs.length >= 2) {
        await usersCollection.updateOne(
            { _id: carlosId },
            { $push: { favoriteDates: { $each: [dateDocs[0]._id, dateDocs[1]._id] } } }
        );
    }
    console.log('  Seeded favoriteDates on two members');


    // Seeding the appeals collection
    const appealsCollection = await appeals();
    const appealDocs = [
        {
            _id: new ObjectId(),
            submittedBy: bobId, status: 'pending', submittedAt: now,
            spotData: {
                name: 'Domino Park',
                description: 'New waterfront park in Williamsburg with skyline views.',
                address: { street: '15 River St', borough: 'brooklyn', zip: '11249' }
            }
        },
        {
            _id: new ObjectId(),
            submittedBy: carlosId, status: 'pending', submittedAt: now,
            spotData: {
                name: 'Pelham Bay Park',
                description: 'The largest park in NYC. Trails, beach, golf course.',
                address: { street: 'Bruckner Blvd', borough: 'the bronx', zip: '10464' }
            }
        }
    ];
    await appealsCollection.insertMany(appealDocs);
    console.log(`  Inserted ${appealDocs.length} pending appeals`);

    console.log('\nSeed complete.\n');
    console.log('Sample logins:');
    console.log('  Admin:   admin@sweetspot.com / Admin123!');
    console.log('  Member:  alice@example.com   / Password1!');
    console.log('  Member:  bob@example.com     / Password1!');
    console.log('  Member:  carlos@example.com  / Password1!');
    console.log(`\nSpots data sourced from NYC DOHMH Restaurant Inspection Results (43nn-pn8j).`);

    await closeConnection();
};

main().catch(err => {
    console.error('Seed failed:', err);
    closeConnection().finally(() => process.exit(1));
});
import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { users, spots, dates, appeals } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import * as helpers from '../helpers.js';

const SALT_ROUNDS = 16;

const main = async () => {
    console.log('SweetSpot seed starting...');

    const db = await dbConnection();
    await db.dropDatabase();
    console.log('  Dropped existing sweetspot database');

    const now = helpers.getDateTime();
    const today = helpers.getCurrentDate();

    const usersCollection = await users();

    const adminId = new ObjectId();
    const aliceId = new ObjectId();
    const bobId = new ObjectId();
    const carlosId = new ObjectId();

    const userDocs = [
        {
            _id: adminId,
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@sweetspot.com',
            username: 'admin',
            hashedPassword: await bcrypt.hash('Admin123!', SALT_ROUNDS),
            gender: 'other',
            primaryLocation: 'manhattan',
            secondaryLocation: '',
            datepoints: 1000,
            savedSchedules: [],
            favoriteDates: [],
            membershipLevel: 'admin'
        },
        {
            _id: aliceId,
            firstName: 'Alice',
            lastName: 'Anderson',
            email: 'alice@example.com',
            username: 'alice',
            hashedPassword: await bcrypt.hash('Password1!', SALT_ROUNDS),
            gender: 'female',
            primaryLocation: 'brooklyn',
            secondaryLocation: 'manhattan',
            datepoints: 50,
            savedSchedules: [],
            favoriteDates: [],
            membershipLevel: 'member'
        },
        {
            _id: bobId,
            firstName: 'Bob',
            lastName: 'Brown',
            email: 'bob@example.com',
            username: 'bob',
            hashedPassword: await bcrypt.hash('Password1!', SALT_ROUNDS),
            gender: 'male',
            primaryLocation: 'queens',
            secondaryLocation: '',
            datepoints: 25,
            savedSchedules: [],
            favoriteDates: [],
            membershipLevel: 'member'
        },
        {
            _id: carlosId,
            firstName: 'Carlos',
            lastName: 'Cruz',
            email: 'carlos@example.com',
            username: 'carlos',
            hashedPassword: await bcrypt.hash('Password1!', SALT_ROUNDS),
            gender: 'non-binary',
            primaryLocation: 'the bronx',
            secondaryLocation: 'manhattan',
            datepoints: 75,
            savedSchedules: [],
            favoriteDates: [],
            membershipLevel: 'member'
        }
    ];
    await usersCollection.insertMany(userDocs);
    console.log(`  Inserted ${userDocs.length} users (1 admin, 3 members)`);

    const spotsCollection = await spots();

    const prospectId = new ObjectId();
    const metId = new ObjectId();
    const smorgId = new ObjectId();
    const astoriaId = new ObjectId();
    const zooId = new ObjectId();
    const ferryId = new ObjectId();

    const spotDocs = [
        {
            _id: prospectId,
            name: 'Prospect Park',
            description: 'A massive park in Brooklyn with rolling hills, a lake, and quiet picnic spots. Easy for low-key afternoon dates.',
            address: { street: '95 Prospect Park West', borough: 'brooklyn', zip: 11215 },
            sweetspotRating: { average: 5, count: 1, sum: 5 },
            reviews: [
                {
                    _id: new ObjectId(),
                    userId: aliceId,
                    username: 'alice',
                    rating: 5,
                    comment: 'Loved the picnic spot near the boathouse. Great for a casual first date.',
                    createdAt: today
                }
            ]
        },
        {
            _id: metId,
            name: 'The Met',
            description: 'World-class art museum on the Upper East Side. Wander together for hours; suggested donation makes it accessible.',
            address: { street: '1000 5th Ave', borough: 'manhattan', zip: 10028 },
            sweetspotRating: { average: 4.5, count: 2, sum: 9 },
            reviews: [
                {
                    _id: new ObjectId(),
                    userId: bobId,
                    username: 'bob',
                    rating: 4,
                    comment: 'The Egyptian wing always delivers. Pay-what-you-want for NY residents.',
                    createdAt: today
                },
                {
                    _id: new ObjectId(),
                    userId: carlosId,
                    username: 'carlos',
                    rating: 5,
                    comment: 'Endless rooms, perfect for a rainy day.',
                    createdAt: today
                }
            ]
        },
        {
            _id: smorgId,
            name: 'Smorgasburg',
            description: 'Outdoor food market with dozens of vendors. Brooklyn on Saturdays, Manhattan on Sundays.',
            address: { street: '90 Kent Ave', borough: 'brooklyn', zip: 11211 },
            sweetspotRating: { average: null, count: 0 },
            reviews: []
        },
        {
            _id: astoriaId,
            name: 'Astoria Park',
            description: 'Riverside park in Queens with skyline views and the public Astoria Pool.',
            address: { street: '19 19th St', borough: 'queens', zip: 11105 },
            sweetspotRating: { average: null, count: 0 },
            reviews: []
        },
        {
            _id: zooId,
            name: 'Bronx Zoo',
            description: 'Largest metropolitan zoo in the country. A full-day adventure if the weather holds.',
            address: { street: '2300 Southern Blvd', borough: 'the bronx', zip: 10460 },
            sweetspotRating: { average: null, count: 0 },
            reviews: []
        },
        {
            _id: ferryId,
            name: 'Staten Island Ferry',
            description: 'Free 25-minute ride past the Statue of Liberty. Sunset trip is the move.',
            address: { street: '4 Whitehall St', borough: 'manhattan', zip: 10004 },
            sweetspotRating: { average: null, count: 0 },
            reviews: []
        }
    ];
    await spotsCollection.insertMany(spotDocs);
    console.log(`  Inserted ${spotDocs.length} spots across boroughs`);

    const datesCollection = await dates();

    const date1Id = new ObjectId();
    const date2Id = new ObjectId();

    const dateDocs = [
        {
            _id: date1Id,
            title: 'Brooklyn Brunch and Stroll',
            description: 'Smorgasburg for late breakfast, then a slow walk through Prospect Park. Easy first date energy.',
            createdBy: aliceId,
            visibility: 'public',
            borough: 'brooklyn',
            estimatedCost: 30,
            events: [
                { order: 1, spotId: smorgId, spotName: 'Smorgasburg', notes: 'Try the ramen burger if it is still around.' },
                { order: 2, spotId: prospectId, spotName: 'Prospect Park', notes: 'Loop the lake counter clockwise.' }
            ],
            tags: ['Outdoor', 'Food', 'Casual'],
            votes: [
                { userId: bobId, value: 1 },
                { userId: carlosId, value: 1 }
            ],
            voteCount: 2,
            comments: [
                {
                    _id: new ObjectId(),
                    userId: bobId,
                    username: 'bob',
                    comment: 'Did this last weekend, ten out of ten.',
                    createdAt: now,
                    editedAt: null
                }
            ],
            photos: [],
            datepointCost: 10,
            createdAt: now,
            updatedAt: now
        },
        {
            _id: date2Id,
            title: 'Museum Mile Afternoon',
            description: 'Slow afternoon at the Met followed by the ferry at sunset. Indoors then out.',
            createdBy: bobId,
            visibility: 'public',
            borough: 'manhattan',
            estimatedCost: 15,
            events: [
                { order: 1, spotId: metId, spotName: 'The Met', notes: 'Pay-what-you-want; bring an ID with NY address.' },
                { order: 2, spotId: ferryId, spotName: 'Staten Island Ferry', notes: 'Catch the 6:30 boat for the best light.' }
            ],
            tags: ['Indoor', 'Romantic', 'Free'],
            votes: [
                { userId: aliceId, value: 1 }
            ],
            voteCount: 1,
            comments: [],
            photos: [],
            datepointCost: 15,
            createdAt: now,
            updatedAt: now
        },
        {
            _id: new ObjectId(),
            title: 'Queens Day Out',
            description: 'Astoria Park then a slow dinner walk through Astoria. Quiet and uncrowded.',
            createdBy: carlosId,
            visibility: 'public',
            borough: 'queens',
            estimatedCost: 25,
            events: [
                { order: 1, spotId: astoriaId, spotName: 'Astoria Park', notes: 'Walk along the river edge.' }
            ],
            tags: ['Outdoor', 'Quiet'],
            votes: [],
            voteCount: 0,
            comments: [],
            photos: [],
            datepointCost: 5,
            createdAt: now,
            updatedAt: now
        },
        {
            _id: new ObjectId(),
            title: 'Bronx Zoo Adventure',
            description: 'Full day at the Bronx Zoo. Pack water and comfortable shoes.',
            createdBy: aliceId,
            visibility: 'public',
            borough: 'the bronx',
            estimatedCost: 50,
            events: [
                { order: 1, spotId: zooId, spotName: 'Bronx Zoo', notes: 'Enter at the Asia gate to skip the main crowd.' }
            ],
            tags: ['Outdoor', 'Adventure'],
            votes: [
                { userId: bobId, value: -1 }
            ],
            voteCount: -1,
            comments: [
                {
                    _id: new ObjectId(),
                    userId: carlosId,
                    username: 'carlos',
                    comment: 'Spent six hours and still did not see everything.',
                    createdAt: now,
                    editedAt: null
                }
            ],
            photos: [],
            datepointCost: 25,
            createdAt: now,
            updatedAt: now
        },
        {
            _id: new ObjectId(),
            title: 'Private Idea Im Cooking Up',
            description: 'Working draft. Not ready to share yet.',
            createdBy: aliceId,
            visibility: 'private',
            borough: 'manhattan',
            estimatedCost: 0,
            events: [
                { order: 1, spotId: ferryId, spotName: 'Staten Island Ferry', notes: '' }
            ],
            tags: ['Draft'],
            votes: [],
            voteCount: 0,
            comments: [],
            photos: [],
            datepointCost: 0,
            createdAt: now,
            updatedAt: now
        }
    ];
    await datesCollection.insertMany(dateDocs);
    console.log(`  Inserted ${dateDocs.length} dates (4 public, 1 private) with comments and votes`);

    await usersCollection.updateOne(
        { _id: bobId },
        { $push: { favoriteDates: date1Id } }
    );
    await usersCollection.updateOne(
        { _id: carlosId },
        { $push: { favoriteDates: { $each: [date1Id, date2Id] } } }
    );
    console.log('  Seeded favoriteDates on two members');

    const appealsCollection = await appeals();
    const appealDocs = [
        {
            _id: new ObjectId(),
            submittedBy: bobId,
            status: 'pending',
            submittedAt: now,
            spotData: {
                name: 'Domino Park',
                description: 'New waterfront park in Williamsburg with skyline views and food kiosks.',
                address: { street: '15 River St', borough: 'brooklyn', zip: 11249 }
            }
        },
        {
            _id: new ObjectId(),
            submittedBy: carlosId,
            status: 'pending',
            submittedAt: now,
            spotData: {
                name: 'Pelham Bay Park',
                description: 'The largest park in NYC. Trails, beach, and a golf course. Good for a long walk and pretending you are not in the city.',
                address: { street: 'Bruckner Blvd', borough: 'the bronx', zip: 10464 }
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

    await closeConnection();
};

main().catch(err => {
    console.error('Seed failed:', err);
    closeConnection().finally(() => process.exit(1));
});

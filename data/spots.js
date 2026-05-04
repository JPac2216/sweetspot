import { spots, appeals } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as helper from '../helpers.js';

const validateSpotFields = (name, description, address) => {
    if (!name || !description || !address) throw "all parameters must be supplied.";
    const basic_regex = /^[a-zA-Z0-9 ,#]{2,25}$/;
    if (typeof name !== "string" || !basic_regex.test(name.trim())) throw "name must be a valid name consisting of letters, numbers, or spaces.";
    if (typeof description !== "string" || !description.trim()) throw "description must be a non-empty string.";
    const address_fields = ["street", "borough", "zip"];
    if (!address_fields.every(field => Object.hasOwn(address, field)) || Object.keys(address).length !== address_fields.length) throw "address must contain only street, borough, and zip.";
    if (!basic_regex.test(address.street)) throw "address.street must contain only letters, numbers, commas, spaces, or hashtags.";
    if (!helper.boroughs.includes(address.borough.toLowerCase())) throw "address.borough must be a recognized borough in our system.";
    if (typeof address.zip !== "number" || Number.isNaN(address.zip) || !Number.isFinite(address.zip)) throw "address.zip must be a valid zip code.";
};

export const createSpot = async (name, description, address) => {
    try {
        validateSpotFields(name, description, address);
    } catch (e) {
        throw `createSpot: ${e}`;
    }

    const spotObj = {
        _id: new ObjectId(),
        name: name.trim(),
        description: description.trim(),
        address,
        sweetspotRating: { average: null, count: 0 },
        reviews: []
    };

    const spotsCollection = await spots();
    const success = await spotsCollection.insertOne(spotObj);
    if (!success) throw "createSpot: couldn't insert the spot into the database.";

    return { spotCreated: true };
};

export const appealSpot = async (userId, name, description, address) => {
    if (!userId) throw "appealSpot: userId must be supplied.";
    if (!ObjectId.isValid(userId)) throw "appealSpot: userId is not a valid ObjectId.";

    try {
        validateSpotFields(name, description, address);
    } catch (e) {
        throw `appealSpot: ${e}`;
    }

    const appealObj = {
        _id: new ObjectId(),
        submittedBy: new ObjectId(userId),
        status: "pending",
        submittedAt: helper.getDateTime(),
        spotData: {
            name: name.trim(),
            description: description.trim(),
            address
        }
    };

    const appealsCollection = await appeals();
    const success = await appealsCollection.insertOne(appealObj);
    if (!success) throw "appealSpot: couldn't insert the appeal into the database.";

    return { appealSubmitted: true };
};

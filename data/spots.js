import { dates, spots, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as helper from 'helpers.js'
import bcrypt from 'bcrypt';
const saltRounds = 16;

export const createSpot = async (
    name,
    description,
    address
) => {
    if (!name || !description || !address) throw "createSpot: all parameters must be supplied to create a spot.";
    const basic_regex = /^[a-zA-Z0-9 ,#]{2,25}$/;
    if (typeof name !== "string" || !basic_regex.test(name.trim())) throw "createSpot: name parameter must be a valid name that consists of letters, numbers, or spaces.";
    if (typeof description !== "string" || !description.trim()) throw "createSpot: description parameter must contain a description that is a string.";
    const address_fields = ["street", "borough", "zip"];
    if (address_fields.every(field => Object.hasOwn(address, field)) || Object.keys(address).length !== address_fields.length) throw "createSpot: address parameter must contain only the street address, borough, and zip code of the spot.";
    if (!basic_regex.test(address.street)) throw "createSpot: address.street must contain only letters, numbers, commas, spaces, or hashtags.";
    if (!helper.boroughs.includes(address.borough.toLowerCase())) throw "createSpot: address.borough must be a recognized borough in our system.";
    if (typeof address.zip !== "number" || Number.isNaN(address.zip) || !Number.isFinite(address.zip)) throw "createSpot: address.zip must be a valid zip code.";
    
    const spotObj = {
        _id: new ObjectId(),
        name,
        description,
        address,
        "sweetspotRating": {
            "average": null,
            "count": 0
        },
        "reviews": []
    };

    const spotsCollection = await spots();
    const success = await spotsCollection.insertOne(spotObj);
    if (!success) throw "createSpot: couldn't insert the spot into the database.";

    return { "spotCreated": true };
};
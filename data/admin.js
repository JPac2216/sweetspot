import { dates, spots, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as helper from '../helpers.js'
import bcrypt from 'bcrypt';
import xss from 'xss';
const saltRounds = 16;

// NOTE: Admin will not be able to delete or change comments using editSpot. They will only be able
// to change the data that is displayed about the spot. They cannot change the rating either, and will
// only have the power to change the Spot's name, description, or address.
export const editSpot = async (
    spotId,
    name,
    description,
    address
) => {
    if (!spotId) throw "editSpot: spotId must be supplied in order to use this function.";
    if (typeof spotId !== "string") throw "editSpot: spotId must be a string.";
    spotId = spotId.trim();
    if (!ObjectId.isValid(spotId)) throw "editSpot: spotId must be a valid ObjectId.";
    let updateObj = {};
    const basic_regex = /^[a-zA-Z0-9 ,#]{2,25}$/;
    if (name) {
        if (typeof name !== "string") throw "editSpot: if supplied, the name parameter must be a string.";
        if (!basic_regex.test(name.trim())) throw "editSpot: if supplied, the name must be a valid name that consists of letters, numbers, spaces, commas, or hashtags.";
        name = xss(name.trim());
        updateObj["name"] = name;
    }
    if (description) {
        if (typeof description !== "string" || !description.trim()) throw "editSpot: description parameter must contain a description that is a string.";
        description = xss(description.trim());
        updateObj["description"] = description;
    }
    if (address) {
        const address_fields = ["street", "borough", "zip"];
        if (!address_fields.every(field => Object.hasOwn(address, field)) || Object.keys(address).length !== address_fields.length) throw "editSpot: address parameter must contain only the street address, borough, and zip code of the spot.";
        if (!basic_regex.test(address.street.trim())) throw "editSpot: address.street must contain only letters, numbers, commas, spaces, or hashtags.";
        address.street = xss(address.street.trim());
        if (!helper.boroughs.includes(address.borough.trim().toLowerCase())) throw "editSpot: address.borough must be a recognized borough in our system.";
        address.borough = xss(address.borough.trim());
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (typeof address.zip !== "string" || !zipRegex.test(address.zip.trim())) throw "editSpot: address.zip must be a valid zip code.";
        address.zip = xss(address.zip.trim());
        updateObj["address"] = address;
    }

    const spotsCollection = await spots();
    const findAndUpdateSpot = await spotsCollection.findOneAndUpdate({ _id: new ObjectId(spotId) }, { $set: updateObj }, { returnDocument: "after" });

    if (!findAndUpdateSpot) throw "editSpot: spot could not be updated."

    return findAndUpdateSpot;
};

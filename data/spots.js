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


export const addSpotRating = async (
    spotId,
    userId,
    username,
    comment,
    rating
) => {
    if (!spotId || typeof spotId !== "string" || !userId || typeof userId !== "string" || !username || typeof username !== "string" || !comment || typeof comment !== "string" || !rating || typeof rating !== "number") throw "addSpotRating: all parameters must be supplied to this function.";
    spotId = spotId.trim();
    userId = userId.trim();
    username = username.trim();
    comment = comment.trim();
    if (!ObjectId.isValid(spotId) || !ObjectId.isValid(userId) || !username || !comment || Number.isNaN(rating) || !Number.isFinite(rating) || rating > 5 || rating < 1) throw "addSpotRating: userId parameter must be an ObjectId, username and comment parameters must be strings, and rating parameter must be a valid number between 1 and 5.";

    const usersCollection = await users();
    const findUser = await usersCollection.findOneAndUpdate({ _id: new ObjectId(userId), username });
    if (!findUser) throw "addSpotRating: user with that userId and username combination is not stored within usersCollection.";

    const spotsCollection = await spots();
    
    const findSpot = await spotsCollection.findOne({ _id: new ObjectId(spotId) });

    let count = findSpot.sweetspotRating.count + 1;
    let average = ((findSpot.sweetspotRating.count * findSpot.sweetspotRating.average) + rating) / count;

    const findAndUpdateSpot = await spotsCollection.findOneAndUpdate(
        { _id: new ObjectId(spotId)}, 
        {
            $set: {
                sweetspotRating: {
                    average,
                    count
                }
            },
            $push: {
                comments: {
                    _id: new ObjectId(),
                    userId,
                    username,
                    comment,
                    "createdAt": helper.getCurrentDate()
                }
            }
        },
        {
            returnDocument: "after"
        }
    );
    if (!findAndUpdateSpot) throw "addSpotRating: comment could not be added to the spot.";

    return findAndUpdateSpot;
};

export const deleteSpotRating = async (
    spotId,
    commentId
) => {
    if (!spotId || typeof spotId !== "string" || !commentId || typeof commentId !== "string") throw "deleteSpotRating: all parameters must be supplied.";
    spotId = spotId.trim();
    commentId = commentId.trim();
    if (!ObjectId.isValid(spotId) || !ObjectId.isValid(commentId)) throw "deleteSpotRating: spotId and commentId parameters must be valid ObjectIds.";

    const spotsCollection = await spots();
    
    const findSpot = await spotsCollection.findOne({ _id: new ObjectId(spotId) });

    let count = findSpot.sweetspotRating.count - 1;
    let average = ((findSpot.sweetspotRating.count * findSpot.sweetspotRating.average) - rating) / count;

    const findAndUpdateSpot = await spotsCollection.findOneAndUpdate(
        { _id: new ObjectId(spotId)}, 
        {
            $set: {
                sweetspotRating: {
                    average,
                    count
                }
            },
            $pull: {
                comments: {
                    _id: commentId,
                }
            }
        },
        {
            returnDocument: "after"
        }
    );
    if (!findAndUpdateSpot) throw "deleteSpotRating: comment could not be deleted from the spot.";

    return findAndUpdateSpot;
};
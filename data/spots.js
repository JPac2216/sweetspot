import { dates, spots, users, appeals } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as helper from 'helpers.js';
import bcrypt from 'bcrypt';
const saltRounds = 16;

export const createSpot = async (
    name,
    description,
    address
) => {
    if (!name || !description || !address) throw "createSpot: all parameters must be supplied to create a spot.";
    const basic_regex = /^[a-zA-Z0-9 ,#]{2,25}$/;
    if (typeof name !== "string" || !basic_regex.test(name.trim())) throw "createSpot: name parameter must be a valid name that consists of letters, numbers, spaces, commas, or hashtags.";
    if (typeof description !== "string" || !description.trim()) throw "createSpot: description parameter must contain a description that is a string.";
    const address_fields = ["street", "borough", "zip"];
    name = name.trim();
    description = description.trim();
    if (address_fields.every(field => Object.hasOwn(address, field)) || Object.keys(address).length !== address_fields.length) throw "createSpot: address parameter must contain only the street address, borough, and zip code of the spot.";
    if (!basic_regex.test(address.street)) throw "createSpot: address.street must contain only letters, numbers, commas, spaces, or hashtags.";
    if (!helper.boroughs.includes(address.borough.toLowerCase())) throw "createSpot: address.borough must be a recognized borough in our system.";
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (typeof address.zip !== "string" || !zipRegex.test(address.zip.trim())) throw "editSpot: address.zip must be a valid zip code.";

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


export const addReview = async (
    spotId,
    userId,
    review,
    rating
) => {
    if (!spotId || typeof spotId !== "string" || !userId || typeof userId !== "string" || !review || typeof review !== "string" || !rating || typeof rating !== "number") throw "addReview: all parameters must be supplied to this function.";
    spotId = spotId.trim();
    userId = userId.trim();
    review = review.trim();
    if (!ObjectId.isValid(spotId) || !ObjectId.isValid(userId) || !review || Number.isNaN(rating) || !Number.isFinite(rating) || !Number.isInteger(rating) || rating > 5 || rating < 1) throw "addReview: userId parameter must be an ObjectId, username and review parameters must be strings, and rating parameter must be a valid number between 1 and 5.";

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({ _id: new ObjectId(userId)});
    if (!findUser) throw "addReview: user with that userId and username combination is not stored within usersCollection.";
    const username = findUser.username;

    const spotsCollection = await spots();
    
    const findSpot = await spotsCollection.findOne({ _id: new ObjectId(spotId) });
    if (!findSpot) throw "addReview: spot with that spotId is not stored within spotsCollection.";

    const findAndUpdateSpot = await spotsCollection.findOneAndUpdate(
        { _id: new ObjectId(spotId)}, 
        [{
            $set: {
                "sweetspotRating.count": { $add: ["$sweetspotRating.count", 1]},
                "sweetspotRating.sum": { $add: ["$sweetspotRating.sum", rating]},
                reviews: { 
                    $concatArrays: ["$reviews", 
                    [{
                        _id: new ObjectId(),
                        userId: new ObjectId(userId),
                        username,
                        rating,
                        comment: review,
                        "createdAt": helper.getCurrentDate()
                    }]
                ]}
            }
        }],
        {
            returnDocument: "after"
        }
    );
    if (!findAndUpdateSpot) throw "addReview: review could not be added to the spot.";

    return findAndUpdateSpot;
};

export const deleteReview = async (
    userId,
    spotId,
    reviewId
) => {
    if (!userId || typeof userId !== "string" || !spotId || typeof spotId !== "string" || !reviewId || typeof reviewId !== "string") throw "deleteReview: all parameters must be supplied.";
    userId = userId.trim();
    spotId = spotId.trim();
    reviewId = reviewId.trim();
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(spotId) || !ObjectId.isValid(reviewId)) throw "deleteReview: spotId and reviewId parameters must be valid ObjectIds.";

    const spotsCollection = await spots();
    
    const spot = await spotsCollection.findOne({ _id: new ObjectId(spotId) });
    if (!spot) throw "deleteReview: spot does not exist with spotId.";

    const review = spot.reviews.find(r => r._id.equals(reviewId) && r.userId.equals(new ObjectId(userId)));
    if (!review) throw "deleteReview: review does not exist with reviewId.";
    const rating = review.rating;

    const result = await spotsCollection.updateOne(
        { _id: new ObjectId(spotId) },
        {
            $inc: { "sweetspotRating.count": -1, "sweetspotRating.sum": -rating },
            $pull: { reviews: { _id: new ObjectId(reviewId) } }
        }
    );
    if (result.modifiedCount !== 1) throw "deleteReview: could not delete review.";

    return {reviewDeleted: true};
};

export const getAllSpots = async (
    filter
) => {
    const spotsCollection = await spots();
    const allSpotsFiltered = await spotsCollection.find(filter).toArray();

    if (!allSpotsFiltered) throw "getAllSpots: couldn't retrieve any spots that match with the filter supplied.";
    for (let spot of allSpotsFiltered) {
        spot._id = spot._id.toString();
    }

    return allSpotsFiltered;
};

export const getSpotById = async (
    spotId
) => {
    if (!spotId) throw "getSpotById: spotId must be supplied to this function!";
    if (typeof spotId !== "string" || !ObjectId.isValid(spotId.trim())) throw "getSpotById: spotId must be a valid string that is also a valid ObjectId.";
    spotId = spotId.trim();

    const spotsCollection = await spots();
    const findSpotById = await spotsCollection.findOne({ _id: new ObjectId(spotId) });

    if (!findSpotById) throw "getSpotById: could not find a spot with that ID.";
    
    findSpotById._id = findSpotById._id.toString();
    return findSpotById;
};

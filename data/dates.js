import { dates, spots, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as helper from 'helpers.js'
import bcrypt from 'bcrypt';
const saltRounds = 16;


export const createDate = async (
    title,
    description,
    createdBy,
    visibility,
    borough,
    estimatedCost,
    events,
    tags,
    photos,
    datepointCost
) => {
    // DIDN'T INCLUDE photos parameter here just in case
    // we don't have to require photos.
    if (!title || !description || !createdBy || !visibility || !borough || !estimatedCost || !events || !tags || !datepointCost) throw "createDate: all parameters must be supplied in order to create the date.";
    // TITLE REGEX: I wasn't sure if we wanted a title regex or not.. sometimes people like making cutesy titles with special characters
    // which I feel like would fit with the theme of our app. Kinda a design choice for it, but TBD.
    // This also goes for the description.
    if (typeof title !== "string" || !title.trim()) throw "createDate: title must be supplied and must not be a string of empty spaces.";
    title = title.trim();
    if (typeof description !== "string" || !description.trim()) throw "createDate: description must be supplied and must not be a string of empty spaces.";
    description = description.trim();
    if (typeof createdBy !== "string" || !ObjectId.isValid(createdBy.trim())) throw "createDate: createdBy must be a valid ObjectId.";
    createdBy = createdBy.trim();
    if (typeof visibility !== "string" || !(visibility.trim() === "public" || visibility.trim() !== "private")) throw "createDate: visibility must either be public or private.";
    visibility = visibility.trim();
    // TODO ==> How do we check if it's the correct borough? Are we going to have a hardcoded list of them or are we going to have a collection of boroughs? I think that a list would be better for this project.
    if (typeof borough !== "string" || !borough.trim()) throw "createDate: borough parameter must be a string that is a borough registered in our system.";
    borough = borough.trim();
    if (typeof estimatedCost !== "number" || Number.isNaN(estimatedCost) || !Number.isFinite(estimatedCost)) throw "createDate: estimatedCost parameter must be a valid, finite number.";
    if (typeof events !== "object" || events.length === 0) throw "createDate: events list must be a list that has at least one event in it.";
    const validEvents = await helper.isValidEventList(events);
    if (!validEvents) throw "createDate: events list must contain valid events.";
    const tag_regex = /^[a-zA-Z]{2,20}$/;
    for (let tag of tags) {
        if (typeof tag !== "string" || !tag_regex.test(tag)) throw "createDate: tags list must contain tags that are 2 to 20 characters in length and only consist of characters.";
    }
    const photo_regex = /[]/; // TODO: Photo regex. How will we be evaluating the input for photos?
    if (photos) { 
        for (let photo of photos) {
            if (typeof photo !== "string" || !photo_regex.test(photo.trim())) throw "createDate: photos list must contain photos that are valid photo links.";
            photo = photo.trim();
        }
    }
    else {
        photos = [];
    }
    if (typeof datepointCost !== "number" || Number.isNaN(datepointCost) || !Number.isFinite(datepointCost)) throw "createDate: datepointCost must be a valid number that is finite.";

    const currentTime = helper.getDateTime();
    const dateObj = {
        _id: new ObjectId(),
        title,
        description,
        "createdBy": new ObjectId(createdBy),
        visibility,
        borough,
        estimatedCost,
        events,
        tags,
        "votes": {
            "upvotes": 0,
            "downvotes": 0
        },
        "comments": [],
        photos,
        datepointCost,
        "createdAt": currentTime,
        "updatedAt": currentTime
    };

    const datesCollection = await dates();
    const success = datesCollection.insertOne(dateObj);
    if (!success) throw "createDate: couldn't insert the date into the database.";

    return { "dateCreated": true };
};

export const addToSchedule = async (
    dateId,
    dateSpotId,
    notes
) => {
    if (!dateId || !dateSpotId || typeof dateId !== "string" || typeof dateSpotId !== "string") throw "addToSchedule: all parameters must be provided, dateId and dateSpotId must be of type string.";
    dateId = dateId.trim();
    dateSpotId = dateSpotId.trim();
    if (!ObjectId.isValid(dateId) || !ObjectId.isValid(dateSpotId)) throw "addToSchedule: dateId and dateSpotId must be a valid ObjectIds.";

    if (notes && typeof notes === "string") {
        notes = notes.trim();
    }
    else if (notes && typeof notes !== "string") {
        throw "addToSchedule: if supplying notes to this function, it must be of the type string.";
    }
    else {
        notes = "";
    }

    const spotsCollection = await spots();
    const dateSpot = await spotsCollection.findOne({ _id: new ObjectId(dateSpotId) });
    if (!dateSpot) throw "addToSchedule: could not find dateSpot in the database.";
    
    const datesCollection = await dates();
    const schedule = await datesCollection.findOne({ _id: new ObjectId(dateId) });
    if (!schedule) throw "addToSchedule: could not find schedule in the database.";

    const spotToInsert = {
        "order": schedule.events.length + 1,
        "spotId": dateSpot._id,
        "spotName": dateSpot.name,
        notes
    };

    let events = schedule.events;
    events.push(spotToInsert);

    const successfulAddition = await datesCollection.findOneAndUpdate({ _id: new ObjectId(dateId) }, { $set: { events } }, { returnDocument: "after" });
    if (!successfulAddition) throw "addToSchedule: could not add the spot to the date specified.";

    return successfulAddition;
};

export const deleteFromSchedule = async (
    dateId,
    dateSpotId
) => {
    if (!dateId || !dateSpotId || typeof dateId !== "string" || typeof dateSpotId !== "string") throw "addToSchedule: all parameters must be provided, dateId and dateSpotId must be of type string.";
    dateId = dateId.trim();
    dateSpotId = dateSpotId.trim();
    if (!ObjectId.isValid(dateId) || !ObjectId.isValid(dateSpotId)) throw "deleteFromSchedule: dateId and dateSpotId must be a valid ObjectIds.";

    const datesCollection = await dates();
    const schedule = await datesCollection.findOne({ _id: new ObjectId(dateId) });
    if (!schedule) throw "addToSchedule: could not find schedule in the database.";

    let events = schedule.events;
    let changed = false;
    for (let i = 0; i < events.length; i++) {
        if (events[i]._id === new ObjectId(dateSpotId)) {
            events.split(i, 1);
            changed = true;
            break;
        }
    }
    if (!changed) throw "addToSchedule: unable to remove spot from the date schedule.";

    const successfulAddition = await datesCollection.findOneAndUpdate({ _id: new ObjectId(dateId) }, { $set: { events } }, { returnDocument: "after" });
    if (!successfulAddition) throw "addToSchedule: could not add the spot to the date specified.";

    return successfulAddition;

};
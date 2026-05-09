import { dates, spots, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as helper from '../helpers.js';
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
    tags
) => {
    if (title === undefined || description === undefined || createdBy === undefined || visibility === undefined || borough === undefined || estimatedCost === undefined || events === undefined || tags === undefined || datepointCost === undefined) throw "createDate: all parameters must be supplied in order to create the date.";
    if (typeof title !== "string" || !title.trim()) throw "createDate: title must be supplied and must not be a string of empty spaces.";
    title = title.trim();
    if (typeof description !== "string" || !description.trim()) throw "createDate: description must be supplied and must not be a string of empty spaces.";
    description = description.trim();
    if (typeof createdBy !== "string" || !ObjectId.isValid(createdBy.trim())) throw "createDate: createdBy must be a valid ObjectId.";
    createdBy = createdBy.trim();
    if (typeof visibility !== "string" || (visibility.trim() !== "public" && visibility.trim() !== "private")) throw "createDate: visibility must either be public or private.";
    visibility = visibility.trim();
    if (typeof borough !== "string" || !helper.boroughs.includes(borough.trim().toLowerCase())) throw "createDate: borough parameter must be a string that is a borough registered in our system.";
    borough = borough.trim().toLowerCase();
    if (typeof estimatedCost !== "number" || Number.isNaN(estimatedCost) || !Number.isFinite(estimatedCost)) throw "createDate: estimatedCost parameter must be a valid, finite number.";
    if (!Array.isArray(events) || events.length === 0) throw "createDate: events list must be a list that has at least one event in it.";
    const validEvents = await helper.isValidEventList(events);
    if (!validEvents) throw "createDate: events list must contain valid events.";
    if (!Array.isArray(tags) || tags.length === 0) throw "createDate: tags must be a non-empty list.";
    const tag_regex = /^[a-zA-Z]{2,20}$/;
    for (let tag of tags) {
        if (typeof tag !== "string" || !tag_regex.test(tag.trim())) throw "createDate: tags list must contain tags that are 2 to 20 characters in length and only consist of characters.";
    }
    tags = tags.map(t => t.trim());

    const currentTime = helper.getDateTime();
    const dateObj = {
        _id: new ObjectId(),
        title,
        description,
        createdBy: new ObjectId(createdBy),
        visibility,
        borough,
        estimatedCost,
        events,
        tags,
        votes: [],
        voteCount: 0,
        comments: [],
        createdAt: currentTime,
        updatedAt: currentTime
    };

    const datesCollection = await dates();
    const success = await datesCollection.insertOne(dateObj);
    if (!success.acknowledged || !success.insertedId) throw "createDate: couldn't insert the date into the database.";

    dateObj._id = dateObj._id.toString();
    dateObj.createdBy = dateObj.createdBy.toString();
    return dateObj;
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
            events.splice(i, 1);
            changed = true;
            break;
        }
    }
    if (!changed) throw "addToSchedule: unable to remove spot from the date schedule.";

    const successfulAddition = await datesCollection.findOneAndUpdate({ _id: new ObjectId(dateId) }, { $set: { events } }, { returnDocument: "after" });
    if (!successfulAddition) throw "addToSchedule: could not add the spot to the date specified.";

    return successfulAddition;

};


export const publishDate = async (
    dateId
) => {
    if (!dateId || typeof dateId !== "string") throw "publishDate: dateId parameter must be supplied as a string.";
    dateId = dateId.trim();
    if (!ObjectId.isValid(dateId)) throw "publishDate: dateId parameter must be a valid ObjectId.";

    const datesCollection = await dates();
    const publishDateVisibility = await datesCollection.findOneAndUpdate({ _id: new ObjectId(dateId) }, { $set: {visibility: "public" } }, { returnDocument: "after" });

    if (!publishDateVisibility) throw "publishDate: date could not be published.";

    return publishDateVisibility;
};

export const privateDate = async (
    dateId
) => {
    if (!dateId || typeof dateId !== "string") throw "privateDate: dateId parameter must be supplied as a string.";
    dateId = dateId.trim();
    if (!ObjectId.isValid(dateId)) throw "publishDate: dateId parameter must be a valid ObjectId.";

    const datesCollection = await dates();
    const privateDateVisibility = await datesCollection.findOneAndUpdate({ _id: new ObjectId(dateId) }, { $set: {visibility: "private"} }, { returnDocument: "after" });

    if (!privateDateVisibility) throw "privateDate: date could not be privated.";

    return privateDateVisibility;
};

export const addComment = async (
    userId,
    dateId,
    comment
) => {
    if (!userId || typeof userId !== "string") throw "addComment: userId parameter must be supplied as a string.";
    userId = userId.trim();
    if (!ObjectId.isValid(userId)) throw "addComment: userId parameter must be a valid ObjectId.";

    if (!dateId || typeof dateId !== "string") throw "addComment: dateId parameter must be supplied as a string.";
    dateId = dateId.trim();
    if (!ObjectId.isValid(dateId)) throw "addComment: dateId parameter must be a valid ObjectId.";

    if (typeof comment !== "string" || !comment.trim()) throw "addComment: comment must be supplied and must not be a string of empty spaces.";
    comment = comment.trim();
    if (comment.length > 250) throw "addComment: comment cannot be longer than 250 characters.";

    const datesCollection = await dates();
    const userCollection = await users();
    const currentTime = helper.getDateTime();

    const userObj = await userCollection.findOne({_id: new ObjectId(userId)});
    if (!userObj) throw "addComment: no user exists with id provided.";
    const username = userObj.username;

    const commentObj = {
        _id: new ObjectId(),
        userId: new ObjectId(userId),
        username,
        comment,
        createdAt: currentTime,
        editedAt: null
    }
    const dateWithComment = await datesCollection.findOneAndUpdate({ _id: new ObjectId(dateId) }, { $push: {comments: commentObj} }, { returnDocument: "after" });

    if (!dateWithComment) throw "addComment: comment could not be added.";
    commentObj._id = commentObj._id.toString();
    commentObj.userId = commentObj.userId.toString();
    return commentObj;
}

export const deleteComment = async (
    userId,
    dateId,
    commentId
) => {
    if (!userId || typeof userId !== "string") throw "deleteComment: userId parameter must be supplied as a string.";
    userId = userId.trim();
    if (!ObjectId.isValid(userId)) throw "deleteComment: userId parameter must be a valid ObjectId.";

    if (!dateId || typeof dateId !== "string") throw "deleteComment: dateId parameter must be supplied as a string.";
    dateId = dateId.trim();
    if (!ObjectId.isValid(dateId)) throw "deleteComment: dateId parameter must be a valid ObjectId.";

    if (!commentId || typeof commentId !== "string") throw "deleteComment: commentId parameter must be supplied as a string.";
    commentId = commentId.trim();
    if (!ObjectId.isValid(commentId)) throw "deleteComment: commentId parameter must be a valid ObjectId.";

    const datesCollection = await dates();

    const dateWithComment = await datesCollection.updateOne({ _id: new ObjectId(dateId) }, { $pull: {comments: {_id: new ObjectId(commentId), userId: new ObjectId(userId)}} });

    if (dateWithComment.modifiedCount !== 1) throw "deleteComment: comment could not be deleted.";

    return {commentDeleted: true};
}

export const editComment = async (
    userId,
    dateId,
    commentId,
    comment
) => {
    if (!userId || typeof userId !== "string") throw "editComment: userId parameter must be supplied as a string.";
    userId = userId.trim();
    if (!ObjectId.isValid(userId)) throw "editComment: userId parameter must be a valid ObjectId.";

    if (!dateId || typeof dateId !== "string") throw "editComment: dateId parameter must be supplied as a string.";
    dateId = dateId.trim();
    if (!ObjectId.isValid(dateId)) throw "editComment: dateId parameter must be a valid ObjectId.";

    if (!commentId || typeof commentId !== "string") throw "editComment: commentId parameter must be supplied as a string.";
    commentId = commentId.trim();
    if (!ObjectId.isValid(commentId)) throw "editComment: commentId parameter must be a valid ObjectId.";

    if (typeof comment !== "string" || !comment.trim()) throw "editComment: comment must be supplied and must not be a string of empty spaces.";
    comment = comment.trim();
    if (comment.length > 250) throw "editComment: comment cannot be longer than 250 characters.";

    const datesCollection = await dates();
    const currentTime = helper.getDateTime();

    const dateWithComment = await datesCollection.findOneAndUpdate({ _id: new ObjectId(dateId), comments: { $elemMatch: {_id: new ObjectId(commentId), userId: new ObjectId(userId)}}}, { $set: {"comments.$.editedAt": currentTime, "comments.$.comment": comment}}, { returnDocument: "after" });

    if (!dateWithComment) throw "editComment: comment could not be edited.";

    return dateWithComment.comments.find(c => c._id.equals(commentId));
}

export const voteOnDate = async (
    userId,
    dateId,
    vote
) => {
    if (!userId || typeof userId !== "string") throw "voteOnDate: userId parameter must be supplied as a string.";
    userId = userId.trim();
    if (!ObjectId.isValid(userId)) throw "voteOnDate: userId parameter must be a valid ObjectId.";

    if (!dateId || typeof dateId !== "string") throw "voteOnDate: dateId parameter must be supplied as a string.";
    dateId = dateId.trim();
    if (!ObjectId.isValid(dateId)) throw "voteOnDate: dateId parameter must be a valid ObjectId.";

    if (!vote || typeof vote !== "number" || (vote !== 1 && vote !== -1)) throw "voteOnDate: vote must be an integer value of either 1 or -1.";

    const datesCollection = await dates();

    const date = await datesCollection.findOne({_id: new ObjectId(dateId)})
    if (!date) throw "voteOnDate: cannot find date with id.";

    const voted = date.votes.find(v => v.userId.equals(userId))
    let updateVote = null;

    if (voted){
        if (voted.value === vote){
            updateVote = await datesCollection.findOneAndUpdate(
                {_id: new ObjectId(dateId)},
                {
                    $pull: {votes: {userId: new ObjectId(userId)}},
                    $inc: {voteCount: -vote}
                },
                { returnDocument: "after" }
            )
        } else {
            updateVote = await datesCollection.findOneAndUpdate(
                {_id: new ObjectId(dateId), "votes.userId": new ObjectId(userId)},
                {
                    $set: {"votes.$.value": vote},
                    $inc: {voteCount: 2 * vote}
                },
                { returnDocument: "after" }
            )
        }

    } else {
        const voteObj = {
            userId: new ObjectId(userId),
            value: vote
        }
        updateVote = await datesCollection.findOneAndUpdate(
            {_id: new ObjectId(dateId)}, 
            {
                $push: {votes: voteObj},
                $inc: {voteCount: vote}
            },
            { returnDocument: "after" }
        );
    }
    if (!updateVote) throw "voteOnDate: vote could not be updated.";

    const voteCount = updateVote.voteCount;
    return {voteCount: voteCount};
}

export const getAllPublicDates = async () => {
    const datesCollection = await dates();
    const findAllPublicDates = await datesCollection.find({ visibility: "public" }).toArray();
    if (!findAllPublicDates) throw "getAllPublicDates: no public dates to show at this time...";

    return findAllPublicDates;
}

export const getDateById = async (
    dateId
) => {
    if (!dateId) throw "getDateById: dateId parameter must be supplied!";
    if (typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) throw "getDateById: dateId field must be a string that is a valid ObjectId.";
    dateId = dateId.trim();

    const datesCollection = await dates();
    const findDate = await datesCollection.findOne({ _id: new ObjectId(dateId) });
    
    if (!findDate) throw "getDateById: couldn't find a date with that Id.";

    return findDate;
};

export const getDatesByCreator = async (
    userId
) => {
    if (!userId) throw "getDatesByCreator: userId parameter must be supplied!";
    if (typeof userId !== "string" || !ObjectId.isValid(userId.trim())) throw "getDatesByCreator: userId field must be a string that is a valid ObjectId.";
    userId = userId.trim();
    
    const datesCollection = await dates();
    const findDatesByUser = await datesCollection.find({ createdBy: new ObjectId(userId) }).toArray();

    if (!findDatesByUser) throw "getDatesByCreator: no dates could be found for this userId.";

    return findDatesByUser;
};

export const deleteDateById = async (
    dateId
) => {
    if (!dateId) throw "deleteDateById: dateId field must be supplied.";
    if (typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) throw "deleteDateById: dateId field must be of type string and must be a valid ObjectId.";
    dateId = dateId.trim();

    const datesCollection = await dates();
    const deletedDate = await datesCollection.findOneAndDelete( { _id: new ObjectId(dateId) } );

    if (!deletedDate) throw "deleteDateById: this date could not be deleted from the database.";

    return deletedDate;
};


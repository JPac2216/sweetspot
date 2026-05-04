import { dates, spots, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as helper from '../helpers.js';
import bcrypt from 'bcrypt';
const saltRounds = 16;


export const createUser = async (
    firstName,
    lastName,
    email,
    password,
    gender,
    primaryLocation,
    secondaryLocation  
) => {
    if (!firstName || !lastName || !email || !password || !gender || !primaryLocation || !secondaryLocation) throw "createUser: all fields must be supplied to create a user.";
    const name_regex = /^[a-zA-Z]{2,20}$/;
    if (typeof firstName !== "string" || firstName.trim().length === 0 || !name_regex.test(firstName.trim())) throw "createUser: firstName parameter must be a string between 2 and 20 characters in length only containing letters.";
    if (typeof lastName !== "string" || lastName.trim().length === 0 || !name_regex.test(lastName.trim())) throw "createUser: lastName parameter must be a string between 2 and 20 characters in length only containing letters.";
    firstName = firstName.trim();
    lastName = lastName.trim();
    const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== "string" || email.trim().length === 0 || !email_regex.test(email.trim())) throw "createUser: email parameter must be a valid email address.";
    email = email.trim();
    const usersCollection = await users();
    const existingEmail = await usersCollection.findOne({ "email": email });
    if (existingEmail) throw "createUser: a user with that email already exists in the database!";
    const password_regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 ])[^ ]{8,}$/;
    if (typeof password !== "string" || password.trim().length === 0 || !password_regex.test(password.trim())) throw "createUser: password parameter must be a valid password that is at leat 8 characters in length containing at least one letter, number, and special character.";
    password = password.trim();
    const gender_regex = /[]/; // TODO GENDER REGEX ==> populate with the genders we want
    if (typeof gender !== "string" || gender.trim().length === 0 || !gender_regex.test(gender)) throw "createUser: gender parameter must be a string that is recognized by our system.";
    gender = gender.trim();
    const location_regex = /[]/; // TODO LOCATION REGEX ==> I'm thinking we make it so that commas are allowed, numbers and letters too. No special characters though.
    if (typeof primaryLocation !== "string" || primaryLocation.trim().length === 0 || !location_regex.test(primaryLocation.trim())) throw "createUser: primaryLocation parameter must be a non-empty string that only contains letters, numbers, commas, or spaces.";
    if (!secondaryLocation) {
        secondaryLocation = "";
    }
    else {
        if (secondaryLocation && (typeof secondaryLocation !== "string" || !location_regex.test(secondaryLocation.trim()))) throw "createUser: secondaryLocation parameter, when provided, must be a non-empty string that only contains letters, numbers, commas, or spaces.";
        secondaryLocation = secondaryLocation.trim();
    }

    let userObj = {
        _id: new ObjectId(),
        firstName,
        lastName,
        email,
        "hashedPassword": await bcrypt.hash(password, saltRounds),
        gender,
        primaryLocation,
        secondaryLocation,
        "datepoints": 0,
        "savedSchedules": [], 
        "favoriteDates": [], 
        "membership": "member"
    };

    const success = await usersCollection.insertOne(userObj);
    if (!success) throw "createUser: couldn't register user into the database.";
    return { "memberCreated": true };
};

export const addFavorite = async (userId, dateId) => {
    if (!userId) throw "addFavorite: userId must be supplied.";
    if (!ObjectId.isValid(userId)) throw "addFavorite: userId is not a valid ObjectId.";
    if (!dateId) throw "addFavorite: dateId must be supplied.";
    if (!ObjectId.isValid(dateId)) throw "addFavorite: dateId is not a valid ObjectId.";

    const usersCollection = await users();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) throw "addFavorite: no user found with that id.";

    await getDateById(dateId);

    const alreadySaved = user.favoriteDates.some(id => id.toString() === dateId);
    if (alreadySaved) throw "addFavorite: date is already in the user's favorites.";

    const update = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $push: { favoriteDates: new ObjectId(dateId) } }
    );
    if (update.modifiedCount === 0) throw "addFavorite: couldn't add date to favorites.";

    return { favoriteAdded: true };
};

export const deleteFavorite = async (userId, dateId) => {
    if (!userId) throw "deleteFavorite: userId must be supplied.";
    if (!ObjectId.isValid(userId)) throw "deleteFavorite: userId is not a valid ObjectId.";
    if (!dateId) throw "deleteFavorite: dateId must be supplied.";
    if (!ObjectId.isValid(dateId)) throw "deleteFavorite: dateId is not a valid ObjectId.";

    const usersCollection = await users();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) throw "deleteFavorite: no user found with that id.";

    const isSaved = user.favoriteDates.some(id => id.toString() === dateId);
    if (!isSaved) throw "deleteFavorite: date is not in the user's favorites.";

    const update = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { favoriteDates: new ObjectId(dateId) } }
    );
    if (update.modifiedCount === 0) throw "deleteFavorite: couldn't remove date from favorites.";

    return { favoriteDeleted: true };
};

export const showAllFavorites = async (userId) => {
    if (!userId) throw "showAllFavorites: userId must be supplied.";
    if (!ObjectId.isValid(userId)) throw "showAllFavorites: userId is not a valid ObjectId.";

    const usersCollection = await users();
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) throw "showAllFavorites: no user found with that id.";

    const datesCollection = await dates();

    const favoriteDates = await datesCollection
        .find({ _id: { $in: user.favoriteDates } })
        .toArray();

    favoriteDates.forEach(date => { date._id = date._id.toString(); });

    return favoriteDates;
};
import { dates, spots, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as helper from 'helpers.js'
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
        "savedSchedules": []
    };
    const success = await usersCollection.insertOne(userObj);
    if (!success) throw "createUser: couldn't register user into the database.";
    return { "memberCreated": true };
};
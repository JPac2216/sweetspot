import { dates, members, spots, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import * as helpers from '../helpers.js';
import { getDateById } from './dates.js';
import xss from 'xss';
const saltRounds = 16;

export const createUser = async (
    firstName,
    lastName,
    email,
    username,
    password,
    confirmPassword,
    gender,
    primaryLocation,
    secondaryLocation  
) => {
    //Input validation

    // if (!firstName || !lastName || !email || !username || !password || !gender || !primaryLocation) throw "createUser: all fields must be supplied to create a user.";

    // //Name validation: first and last name must be strings between 2 and 20 characters in length only containing letters
    // const name_regex = /^[a-zA-Z]{2,20}$/;
    // if (typeof firstName !== "string" || firstName.trim().length === 0 || !name_regex.test(firstName.trim())) throw "createUser: firstName parameter must be a string between 2 and 20 characters in length only containing letters.";
    // if (typeof lastName !== "string" || lastName.trim().length === 0 || !name_regex.test(lastName.trim())) throw "createUser: lastName parameter must be a string between 2 and 20 characters in length only containing letters.";
    // firstName = xss(firstName.trim());
    // lastName = xss(lastName.trim());

    // //Email validation: must be a valid email format and not already in the database
    // const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // if (typeof email !== "string" || email.trim().length === 0 || !email_regex.test(email.trim())) throw "createUser: email parameter must be a valid email address.";
    // email = email.trim().toLowerCase();
    // const usersCollection = await users();
    // const existingEmail = await usersCollection.findOne({ "email": email });
    // if (existingEmail) throw "createUser: a user with that email already exists in the database!";

    // //Username validation: 3-20 chars, letters/numbers/underscores, must be unique
    // const username_regex = /^[a-zA-Z0-9_]{3,20}$/;
    // if (typeof username !== "string" || username.trim().length === 0 || !username_regex.test(username.trim())) throw "createUser: username parameter must be a string between 3 and 20 characters in length only containing letters, numbers, and underscores.";
    // username = username.trim().toLowerCase();
    // const existingUsername = await usersCollection.findOne({ "username": username });
    // if (existingUsername) throw "createUser: a user with that username already exists in the database!";

    // //Password validation: must be at least 8 characters in length and contain at least one letter, number, and special character
    // const password_regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 ])[^ ]{8,}$/;
    // if (typeof password !== "string" || password.trim().length === 0 || !password_regex.test(password.trim())) throw "createUser: password parameter must be a valid password that is at leat 8 characters in length containing at least one uppercase letter, number, and special character.";
    // password = password.trim();

    // //Gender validation: must be a string that is either male female non-binary or other
    // const gender_regex = /^(male|female|non-binary|other)$/i; 
    // if (typeof gender !== "string" || gender.trim().length === 0 || !gender_regex.test(gender.trim())) throw "createUser: gender parameter must be a string that is recognized by our system.";
    // gender = gender.trim();

    // //Location validation: primaryLocation must be one of the 5 boroughs of NYC, secondaryLocation can either be empty or one of the 5 boroughs but cannot be the same as primary
    // if(typeof primaryLocation !== "string" || !helpers.boroughs.includes(primaryLocation.trim().toLowerCase())) throw "createUser: primaryLocation must be one of the 5 boroughs of NYC.";
    // primaryLocation = primaryLocation.trim().toLowerCase();
    // if (!secondaryLocation || secondaryLocation.trim().length === 0) {
    //     secondaryLocation = "";
    // } else {
    //     if (typeof secondaryLocation !== "string" || !helpers.boroughs.includes(secondaryLocation.trim().toLowerCase())) throw "createUser: secondaryLocation must be one of the 5 boroughs of NYC.";
    //     if (primaryLocation.toLowerCase() === secondaryLocation.trim().toLowerCase()) throw "createUser: primaryLocation and secondaryLocation cannot be the same.";
    //     secondaryLocation = secondaryLocation.trim().toLowerCase();
    // }

    const validationObj = await helpers.validateUser(firstName, lastName, email, username, password, confirmPassword, gender, primaryLocation, secondaryLocation);

    let userObj = {
        _id: new ObjectId(),
        firstName: validationObj.firstName,
        lastName: validationObj.lastName,
        email: validationObj.email,
        username: validationObj.username,
        hashedPassword: await bcrypt.hash(validationObj.password, saltRounds),
        gender: validationObj.gender,
        primaryLocation: validationObj.primaryLocation,
        secondaryLocation: validationObj.secondaryLocation,
        datepoints: 0,
        savedSchedules: [], 
        favoriteDates: [], 
        membershipLevel: "member"
    };

    const usersCollection = await users();
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


export const authenticateUser = async (email, password) => {
    if(!email || typeof email !== 'string') throw 'You must provide an email';
    email = email.trim().toLowerCase();
    if(email.length === 0) throw 'Email cannot be an empty string';
    let email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!email_regex.test(email)) throw 'You must provide a valid email address';

    if(!password || typeof password !== 'string') throw 'You must provide a password';
    password = password.trim();
    if(password.length === 0) throw 'Password cannot be an empty string';

    const usersCollection = await users();
    const user = await usersCollection.findOne({ email });

    if (!user) throw 'Either the email or password is invalid';

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) throw 'Either the email or password is invalid';

    return {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        membershipLevel: user.membershipLevel,
        datePoints: user.datepoints,
        primaryLocation: user.primaryLocation,
        secondaryLocation: user.secondaryLocation,
        savedSchedules: user.savedSchedules
    };
};

export const deleteUser = async (email, password) => {

    //authenticate user first
    const user = await authenticateUser(email, password);
    if(!user) throw "Either the email or password is invalid.";

    const usersCollection = await users();
    const deletionInfo = await usersCollection.deleteOne({ _id: new ObjectId(user._id) });
    if (deletionInfo.deletedCount === 0) throw `Could not delete user with email ${email}`;
    return { "userDeleted": true };

};


export const updateUser = async (email, password, updateObj) => {

    //authenticate user first
    const user = await authenticateUser(email, password);
    if(!user) throw "Either the email or password is invalid.";
    const usersCollection = await users();

    //validate updateObj
    //error checking for updateObject
    if(!updateObj) throw 'You must provide an update object';
    if(typeof updateObj !== 'object' || Array.isArray(updateObj)) throw 'update object must be an object';
    if(Object.keys(updateObj).length === 0) throw 'update object cannot be empty';

    let validKeys = ["firstName", "lastName", "email", "username", "gender", "primaryLocation", "secondaryLocation",];
    for(let key in updateObj){
    if(!validKeys.includes(key)) throw "Invalid key in update object";
    }

    //error check
    const validated = await helpers.validateUser(
        updateObj.firstName, updateObj.lastName, updateObj.email,
        updateObj.username, updateObj.password, null, updateObj.gender,
        updateObj.primaryLocation, updateObj.secondaryLocation,
        true,  // isUpdating flag
        user._id
    );

    let updateFields = {};
    if(Object.hasOwn(updateObj, 'firstName')){       
        updateFields.firstName = validated.firstName;
    }
    if(Object.hasOwn(updateObj, 'lastName')){          
        updateFields.lastName = validated.lastName;
    }
    if(Object.hasOwn(updateObj, 'email')){
        updateFields.email = validated.email;
    }
    if(Object.hasOwn(updateObj, 'username')){
        updateFields.username = validated.username;
    }
    if(Object.hasOwn(updateObj, 'gender')){            
        updateFields.gender = validated.gender;
    }
    if(Object.hasOwn(updateObj, 'primaryLocation')){   
        updateFields.primaryLocation = validated.primaryLocation;
    }
    if(Object.hasOwn(updateObj, 'secondaryLocation')){
        updateFields.secondaryLocation = validated.secondaryLocation;
    }

    const updatedInfo = await usersCollection.findOneAndUpdate(
        {_id: new ObjectId(user._id)},
        {$set: updateFields},
        {returnDocument: 'after'}
    );
    if(!updatedInfo.value) throw 'Could not update user successfully';


    return { "userUpdated": true };

};

export const getUserById = async (
    userId
) => {
    if (!userId) throw "getUserById: userId field must be supplied!";
    if (typeof userId !== "string" || !ObjectId.isValid(userId.trim())) throw "getUserById: userId field must be a string that is a valid ObjectId.";
    userId = userId.trim();

    const usersCollection = await users();
    const findUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!findUser) throw "getUserById: userId supplied could not be found in the database.";

    return findUser;
}



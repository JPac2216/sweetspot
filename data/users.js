import { dates, members, spots, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
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
    //Input validation

    if (!firstName || !lastName || !email || !password || !gender || !primaryLocation) throw "createUser: all fields must be supplied to create a user.";

    //Name validation: first and last name must be strings between 2 and 20 characters in length only containing letters
    const name_regex = /^[a-zA-Z]{2,20}$/;
    if (typeof firstName !== "string" || firstName.trim().length === 0 || !name_regex.test(firstName.trim())) throw "createUser: firstName parameter must be a string between 2 and 20 characters in length only containing letters.";
    if (typeof lastName !== "string" || lastName.trim().length === 0 || !name_regex.test(lastName.trim())) throw "createUser: lastName parameter must be a string between 2 and 20 characters in length only containing letters.";
    firstName = firstName.trim();
    lastName = lastName.trim();

    //Email validation: must be a valid email format and not already in the database
    const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== "string" || email.trim().length === 0 || !email_regex.test(email.trim())) throw "createUser: email parameter must be a valid email address.";
    email = email.trim().toLowerCase();
    const usersCollection = await users();
    const existingEmail = await usersCollection.findOne({ "email": email });
    if (existingEmail) throw "createUser: a user with that email already exists in the database!";

    //Password validation: must be at least 8 characters in length and contain at least one letter, number, and special character
    const password_regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 ])[^ ]{8,}$/;
    if (typeof password !== "string" || password.trim().length === 0 || !password_regex.test(password.trim())) throw "createUser: password parameter must be a valid password that is at leat 8 characters in length containing at least one letter, number, and special character.";
    password = password.trim();

    //Gender validation: must be a string that is either male female non-binary or other
    const gender_regex = /^(male|female|non-binary|other)$/i; 
    if (typeof gender !== "string" || gender.trim().length === 0 || !gender_regex.test(gender.trim())) throw "createUser: gender parameter must be a string that is recognized by our system.";
    gender = gender.trim();

    //Location validation: primaryLocation must be one of the 5 boroughs of NYC, secondaryLocation can either be empty or one of the 5 boroughs but cannot be the same as primary
    let validLocations = ["manhattan", "brooklyn", "queens", "bronx", "staten island"];
    if(typeof primaryLocation !== "string" || !validLocations.includes(primaryLocation.trim().toLowerCase())) throw "createUser: primaryLocation must be one of the 5 boroughs of NYC.";
    primaryLocation = primaryLocation.trim().toLowerCase();
    if (!secondaryLocation || secondaryLocation.trim().length === 0) {
        secondaryLocation = "";
    } else {
        if (typeof secondaryLocation !== "string" || !validLocations.includes(secondaryLocation.trim().toLowerCase())) throw "createUser: secondaryLocation must be one of the 5 boroughs of NYC.";
        if (primaryLocation.toLowerCase() === secondaryLocation.trim().toLowerCase()) throw "createUser: primaryLocation and secondaryLocation cannot be the same.";
        secondaryLocation = secondaryLocation.trim().toLowerCase();
    }

    let userObj = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        membershipLevel: "standard",
        hashedPassword: await bcrypt.hash(password, saltRounds),
        gender: gender,
        primaryLocation: primaryLocation,
        secondaryLocation: secondaryLocation,
        datepoints: 0,
        savedSchedules: []
    };
    const success = await usersCollection.insertOne(userObj);
    if (!success) throw "createUser: couldn't register user into the database.";
    return { "userCreated": true };
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
  
    let validKeys = ["firstName", "lastName", "email", "gender", "primaryLocation", "secondaryLocation",];
    for(let key in updateObj){
      if(!validKeys.includes(key)) throw "Invalid key in update object";
    }

    //FirstName update
    if(Object.hasOwn(updateObj, 'firstName')){
        //error check the firstName
        const name_regex = /^[a-zA-Z]{2,20}$/;
        if (typeof updateObj.firstName !== "string" || updateObj.firstName.trim().length === 0 || !name_regex.test(updateObj.firstName.trim())) throw "FirstName parameter must be a string between 2 and 20 characters in length only containing letters.";
        updateObj.firstName = updateObj.firstName.trim();

        const updatedInfo = await usersCollection.findOneAndUpdate(
            {_id: new ObjectId(user._id)},
            {$set: {firstName: updateObj.firstName}},
            {returnDocument: 'after'}
        );
        if (!updatedInfo) {
            throw 'could not update first name successfully';
        }
    }

    //LastName update
    if(Object.hasOwn(updateObj, 'lastName')){
        //error check the last Name
        const name_regex = /^[a-zA-Z]{2,20}$/;
        if (typeof updateObj.lastName !== "string" || updateObj.lastName.trim().length === 0 || !name_regex.test(updateObj.lastName.trim())) throw "LastName parameter must be a string between 2 and 20 characters in length only containing letters.";
        updateObj.lastName = updateObj.lastName.trim();
        const updatedInfo = await usersCollection.findOneAndUpdate(
            {_id: new ObjectId(user._id)},
            {$set: {lastName: updateObj.lastName}},
            {returnDocument: 'after'}
        );
        if (!updatedInfo) {
            throw 'could not update Last name successfully';
        }
    }

    //email update
    if(Object.hasOwn(updateObj, 'email')){
        //error check the email
        const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (typeof updateObj.email !== "string" || updateObj.email.trim().length === 0 || !email_regex.test(updateObj.email.trim())) throw "Email parameter must be a valid email address.";
        updateObj.email = updateObj.email.trim().toLowerCase();
        const existingEmail = await usersCollection.findOne({ "email": updateObj.email, "_id": {$ne: new ObjectId(user._id)} });
        if (existingEmail) throw "createUser: a user with that email already exists in the database!";

        const updatedInfo = await usersCollection.findOneAndUpdate(
            {_id: new ObjectId(user._id)},
            {$set: {email: updateObj.email}},
            {returnDocument: 'after'}
        );
        if (!updatedInfo) {
            throw 'could not update email successfully';
        }
    }

    //gender update
    if(Object.hasOwn(updateObj, 'gender')){
        //error check the gender
        const gender_regex = /^(male|female|non-binary|other)$/i; 
        if (typeof updateObj.gender !== "string" || updateObj.gender.trim().length === 0 || !gender_regex.test(updateObj.gender.trim())) throw "Gender parameter must be a string that is recognized by our system.";
        updateObj.gender = updateObj.gender.trim();
        
        const updatedInfo = await usersCollection.findOneAndUpdate(
            {_id: new ObjectId(user._id)},
            {$set: {gender: updateObj.gender}},
            {returnDocument: 'after'}
        );
        if (!updatedInfo) {
            throw 'could not update gender successfully';
        }
    }

    //primaryLocation update
    if(Object.hasOwn(updateObj, 'primaryLocation')){
        //error check the primary location
        let validLocations = ["manhattan", "brooklyn", "queens", "bronx", "staten island"];
        if(typeof updateObj.primaryLocation !== "string" || !validLocations.includes(updateObj.primaryLocation.trim().toLowerCase())) throw "PrimaryLocation must be one of the 5 boroughs of NYC.";
        updateObj.primaryLocation = updateObj.primaryLocation.trim().toLowerCase();
        
        const updatedInfo = await usersCollection.findOneAndUpdate(
            {_id: new ObjectId(user._id)},
            {$set: {primaryLocation: updateObj.primaryLocation}},
            {returnDocument: 'after'}
        );
        if (!updatedInfo) {
            throw 'could not update primary Location successfully';
        }
    }

    //secondaryLocation update
    if(Object.hasOwn(updateObj, 'secondaryLocation')){
        //error check the secondary location
        let validLocations = ["manhattan", "brooklyn", "queens", "bronx", "staten island"];
        let secondaryLocation = updateObj.secondaryLocation;
        if (!secondaryLocation || secondaryLocation.trim().length === 0) {
            secondaryLocation = "";
        } else {
            if (typeof secondaryLocation !== "string" || !validLocations.includes(secondaryLocation.trim().toLowerCase())) throw "SecondaryLocation must be one of the 5 boroughs of NYC.";
            let effectivePrimary = updateObj.primaryLocation ?? user.primaryLocation;
            if (effectivePrimary.toLowerCase() === secondaryLocation.trim().toLowerCase()) throw "PrimaryLocation and secondaryLocation cannot be the same.";
            secondaryLocation = secondaryLocation.trim().toLowerCase();
        }
        
        const updatedInfo = await usersCollection.findOneAndUpdate(
            {_id: new ObjectId(user._id)},
            {$set: {secondaryLocation: secondaryLocation}},
            {returnDocument: 'after'}
        );
        if (!updatedInfo) {
            throw 'could not update secondary Location successfully';
        }
    }

    return { "userUpdated": true };

};
import { ObjectId } from 'mongodb';
import { dates, spots, users } from './config/mongoCollections.js';

// HARDCODE ALL THE BOROUGHS HERE
export const boroughs = ["the bronx", "queens", "manhattan", "staten island", "brooklyn"];

export const isValidEventList = async (events) => {
    const spotsCollection = await spots();
    const fields = ["order", "spotId", "spotName", "notes"];

    for (let i = 0; i < events.length; i++) {
        const hasAllFields = fields.every(field => Object.hasOwn(events[i], field));
        if (!(hasAllFields && Object.keys(events[i]))) return false;
        const currentEvent = events[i];
        if (currentEvent["order"] !== (i + 1)) return false;
        if (!ObjectId.isValid(currentEvent["spotId"].trim())) return false;
        const exists = await spotsCollection.findOne({ _id: new ObjectId(currentEvent["spotId"].trim()) });
        if (!exists) return false;
    }

    return true;
};

// The following 3 functions were pulled from Sameer's Lab 10 implementation
export const getCurrentDate = () => {
    const options = { month: '2-digit', day: '2-digit', year: 'numeric' };
    const todayFormatted = new Date().toLocaleDateString('en-US', options);
    return todayFormatted;
};

export const getDateTime = () => {
    const d = new Date();

    const pad = (num) => String(num).padStart(2, '0');

    const month = pad(d.getMonth() + 1); 
    const day = pad(d.getDate());
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;
    const formattedHours = pad(hours);

    return `${month}/${day}/${year} ${formattedHours}:${minutes}${ampm}`;
};

export const getCurrentTime = () => {
    const d = new Date();
    const pad = (num) => String(num).padStart(2, '0');

    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;
    const formattedHours = pad(hours);

    return `${formattedHours}:${minutes}${ampm}`;
};

export const getAllUsers = async () => {
  const userCollection = await users();
  let userList = await userCollection.find({}).toArray();
  if (!userList) throw 'Could not get all users';
  userList = userList.map((element) => {
    element._id = element._id.toString();
    return element;
  });
  return userList;
};

export const validateUser = async (
    firstName,
    lastName,
    email,
    username,
    password,
    confirmPassword,
    gender,
    primaryLocation,
    secondaryLocation,
    isUpdating = false
) => {
    // Only require all fields when creating
    if (!isUpdating) {
        if (!firstName || !lastName || !email || !username || !password || !gender || !primaryLocation || !confirmPassword){
            throw 'All fields must be supplied to create a user.';
        }
        if (confirmPassword !== password){
            throw "Passwords do not match";
        }
    }

    const name_regex = /^[a-zA-Z]{2,20}$/;
    if (!isUpdating || firstName) {
        if (typeof firstName !== "string" || firstName.trim().length === 0 || !name_regex.test(firstName.trim())){ 
            throw "First name must be a string between 2 and 20 characters in length only containing letters.";
        }
        firstName = firstName.trim();
    }

    if (!isUpdating || lastName) {
        if (typeof lastName !== "string" || lastName.trim().length === 0 || !name_regex.test(lastName.trim())){
            throw "Last name must be a string between 2 and 20 characters in length only containing letters.";
        }
        lastName = lastName.trim();
    }

    if (!isUpdating || email) {
        const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (typeof email !== "string" || email.trim().length === 0 || !email_regex.test(email.trim())){
            throw "Email must be a valid email address.";
        }
        email = email.trim().toLowerCase();
        // Only check duplicate email on create
        if (!isUpdating) {
            const usersCollection = await users();
            const existingEmail = await usersCollection.findOne({ "email": email });
            if (existingEmail){ 
                throw "A user with that email already exists in the database!";
            }
        }
    }

    if (!isUpdating || username) {
        const username_regex = /^[a-zA-Z0-9_]{3,20}$/;
        if (typeof username !== "string" || username.trim().length === 0 || !username_regex.test(username.trim())){
            throw "Username must be a string between 3 and 20 characters in length only containing letters, numbers, and underscores.";
        }
        username = username.trim().toLowerCase();
        const usersCollection = await users();
        const existingUsername = await usersCollection.findOne({ "username": username });
        if (existingUsername){
            throw "A user with that username already exists in the database!";
        }
    }

    if (!isUpdating || password) {
        const password_regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 ])[^ ]{8,}$/;
        if (typeof password !== "string" || password.trim().length === 0 || !password_regex.test(password.trim())){
            throw "Password must be a valid password that is at least 8 characters in length containing at least one uppercase letter, number, and special character.";
        }
        password = password.trim();
    }

    if (!isUpdating || gender) {
        const gender_regex = /^(male|female|non-binary|other)$/i; 
        if (typeof gender !== "string" || gender.trim().length === 0 || !gender_regex.test(gender.trim())){ 
            throw "Gender must be a string that is recognized by our system.";
        }
        gender = gender.trim();
    }

    if (!isUpdating || primaryLocation) {
        if(typeof primaryLocation !== "string" || !boroughs.includes(primaryLocation.trim().toLowerCase())){
            throw "Primary location must be one of the 5 boroughs of NYC.";
        }
        primaryLocation = primaryLocation.trim().toLowerCase();
    }

    if (!secondaryLocation || secondaryLocation.trim().length === 0) {
        secondaryLocation = "";
    } else {
        if (typeof secondaryLocation !== "string" || !boroughs.includes(secondaryLocation.trim().toLowerCase())){ 
            throw "Secondary location must be one of the 5 boroughs of NYC.";
        }
        if (primaryLocation && primaryLocation.toLowerCase() === secondaryLocation.trim().toLowerCase()){ 
            throw "Primary location and secondary location cannot be the same.";
        }
        secondaryLocation = secondaryLocation.trim().toLowerCase();
    }

    return { firstName, lastName, email, username, password, gender, primaryLocation, secondaryLocation };
};

export const checkObjectID = (id) => {
    if (!id) throw 'You must provide an id to search for';
    if (typeof id !== 'string') throw 'Id must be a string';
    if (id.trim().length === 0)
        throw 'Id cannot be an empty string or just spaces';
    id = id.trim();
    if (!ObjectId.isValid(id)) throw 'invalid object ID';

    return id;
};


export const validateSpotFields = (name, description, address) => {
    if (!name || !description || !address) throw "all parameters must be supplied.";
    const basic_regex = /^[a-zA-Z0-9 ,#]{2,25}$/;
    if (typeof name !== "string" || !basic_regex.test(name.trim())) throw "name must be a valid name consisting of letters, numbers, or spaces.";
    if (typeof description !== "string" || !description.trim()) throw "description must be a non-empty string.";
    const address_fields = ["street", "borough", "zip"];
    if (!address_fields.every(field => Object.hasOwn(address, field)) || Object.keys(address).length !== address_fields.length) throw "address must contain only street, borough, and zip.";
    if (!basic_regex.test(address.street)) throw "address.street must contain only letters, numbers, commas, spaces, or hashtags.";
    if (!boroughs.includes(address.borough.toLowerCase())) throw "address.borough must be a recognized borough in our system.";
    if (typeof address.zip !== "number" || Number.isNaN(address.zip) || !Number.isFinite(address.zip)) throw "address.zip must be a valid zip code.";
};
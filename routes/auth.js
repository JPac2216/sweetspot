import {Router} from 'express';
const router = Router();
import { createUser ,authenticateUser } from '../data/users.js';
import { dates, members, spots, users } from '../config/mongoCollections.js';

router
  .route('/')
  .get(async (req, res) => {
    //code here for GET
    res.render('signin', {title: 'Sign In'});
    });


router
  .route('/signin')
  .get(async (req, res) => {
    //code here for GET
    res.render('signin', {title: 'Sign In'});
  })
  .post(async (req, res) => {
    //code here for POST
    let email = req.body.email;
    let password = req.body.password;

    //error checking
    if(!email || email.trim().length === 0){
      return res.status(400).render('signin', {error: 'You must provide an email', title: 'Error: No Email Provided'});
    }
    if(!password || password.trim().length === 0){
      return res.status(400).render('signin', {error: 'You must provide a password', title: 'Error: No Password Provided'});
    }
    //check email
    try{
        const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (typeof email !== "string" || email.trim().length === 0 || !email_regex.test(email.trim())){ 
          return res.status(400).render('signin', {error: 'You must provide a valid email address', title: 'Error: Invalid Email'});
        }
        email = email.trim();

        //check password
        const password_regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 ])[^ ]{8,}$/;
        if (typeof password !== "string" || password.trim().length === 0 || !password_regex.test(password.trim())){ 
          return res.status(400).render('signin', {error: 'You must provide a valid password that is at least 8 characters in length containing at least one letter, number, and special character.', title: 'Error: Invalid Password'});
        }
        password = password.trim();
    } catch(e){
      return res.status(400).render('signin', {error: e, title: 'Error: Invalid Input'});
    }

    //check if user exists
    let user = null;
    try{
      user = await authenticateUser(email, password);
    }catch(e){
      return res.status(400).render('signin', {error: 'Invalid email or password', title: 'Error: Invalid Credentials'});
    }

    req.session.member = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      membershipLevel: user.membershipLevel,
      datePoints: user.datePoints,
      primaryLocation: user.primaryLocation,
      secondaryLocation: user.secondaryLocation,
      savedSchedules: user.savedSchedules
    };

    if (user.membershipLevel === 'admin') {
      return res.redirect('/admin');
    } else {
      return res.redirect('/home');
    }
  });


router
  .route('/register')
  .get(async (req, res) => {
    //code here for GET
    res.render('register', {title: 'Register'});
  })
  .post(async (req, res) => {
    //code here for POST
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let gender = req.body.gender;
    let primaryLocation = req.body.primaryLocation;
    let secondaryLocation = req.body.secondaryLocation;

    if (!firstName || !lastName || !email || !password || !gender || !primaryLocation || !confirmPassword){
      return res.status(400).render('register', {error: 'All fields must be supplied to create a user.', title: 'Error: Missing Fields'});
    }
   
    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim();
    password = password.trim();
    confirmPassword = confirmPassword.trim();
    gender = gender.trim();
    primaryLocation = primaryLocation.trim();

    //error checking
    //Password and confirm password match
    if(confirmPassword !== password){
      return res.status(400).render('register', {error: 'Passwords do not match', title: 'Error: Password Mismatch'});
    }

    //check first name and last name
    const name_regex = /^[a-zA-Z]{2,20}$/;
    if (typeof firstName !== "string" || firstName.trim().length === 0 || !name_regex.test(firstName.trim())){ 
      return res.status(400).render('register', {error: 'First name must be a string between 2 and 20 characters in length only containing letters.', title: 'Error: Invalid Input'});
    }
    if (typeof lastName !== "string" || lastName.trim().length === 0 || !name_regex.test(lastName.trim())){
      return res.status(400).render('register', {error: 'Last name must be a string between 2 and 20 characters in length only containing letters.', title: 'Error: Invalid Input'});
    }
    firstName = firstName.trim();
    lastName = lastName.trim();

    //check email
    const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== "string" || email.trim().length === 0 || !email_regex.test(email.trim())){
      return res.status(400).render('register', {error: 'Email must be a valid email address.', title: 'Error: Invalid Input'});
    }
    email = email.trim().toLowerCase();
    const usersCollection = await users();
    const existingEmail = await usersCollection.findOne({ "email": email });
    if (existingEmail){ 
      return res.status(400).render('register', {error: 'A user with that email already exists in the database!', title: 'Error: Email Already Exists'});
    }

    //check password
    const password_regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 ])[^ ]{8,}$/;
    if (typeof password !== "string" || password.trim().length === 0 || !password_regex.test(password.trim())){
       return res.status(400).render('register', {error: 'Password must be a valid password that is at least 8 characters in length containing at least one letter, number, and special character.', title: 'Error: Invalid Input'});
    }
    password = password.trim();

    //check gender
    const gender_regex = /^(male|female|non-binary|other)$/i; 
    if (typeof gender !== "string" || gender.trim().length === 0 || !gender_regex.test(gender.trim())){ 
      return res.status(400).render('register', {error: 'Gender must be a string that is recognized by our system.', title: 'Error: Invalid Input'});
    }
    gender = gender.trim();

    //check primary and secondary location
    let validLocations = ["manhattan", "brooklyn", "queens", "the bronx", "staten island"];
    if(typeof primaryLocation !== "string" || !validLocations.includes(primaryLocation.trim().toLowerCase())){
      return res.status(400).render('register', {error: 'Primary location must be one of the 5 boroughs of NYC.', title: 'Error: Invalid Input'});
    }
    primaryLocation = primaryLocation.trim().toLowerCase();
    if (!secondaryLocation || secondaryLocation.trim().length === 0) {
        secondaryLocation = "";
    } else {
        if (typeof secondaryLocation !== "string" || !validLocations.includes(secondaryLocation.trim().toLowerCase())){ 
          return res.status(400).render('register', {error: 'Secondary location must be one of the 5 boroughs of NYC.', title: 'Error: Invalid Input'});
        }
        if (primaryLocation.toLowerCase() === secondaryLocation.trim().toLowerCase()){ 
          return res.status(400).render('register', {error: 'Primary location and secondary location cannot be the same.', title: 'Error: Invalid Input'});
        }
        secondaryLocation = secondaryLocation.trim().toLowerCase();
    }

    try{
      let newUser = await createUser(firstName, lastName, email, password, gender, primaryLocation, secondaryLocation);
      if(newUser.userCreated !== true || !newUser){
        return res.status(500).render('register', {error: 'Failed to create user', title: 'Error: Internal Server Error'});
      }else{
        res.redirect('/signin');
      }
    }catch(e){
      return res.status(400).render('register', {error: e, title: 'Error: Invalid Input'});
    }
  
  });

export default router;
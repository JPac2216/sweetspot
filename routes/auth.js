import {Router} from 'express';
const router = Router();
import { createUser ,authenticateUser } from '../data/users.js';
import { dates, members, spots, users } from '../config/mongoCollections.js';
import * as helpers from '../helpers.js';
import xss from 'xss';

router
  .route('/')
  .get(async (req, res) => {
    //code here for GET
    res.status(200).render('signin', {title: 'Sign In'});
    });


router
  .route('/signin')
  .get(async (req, res) => {
    //code here for GET
    res.status(200).render('signin', {title: 'Sign In'});
  })
  .post(async (req, res) => {
    //code here for POST
    let email = xss(req.body.email);
    let password = xss(req.body.password);

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
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      username: user.username,
      membershipLevel: user.membershipLevel,
      datepoints: user.datepoints,
      primaryLocation: user.primaryLocation,
      secondaryLocation: user.secondaryLocation,
      savedSchedules: user.savedSchedules
    };

    if (user.membershipLevel === 'admin') {
      return res.render('adminDashboard', {title: 'Admin Dashboard'});
    } else {
      return res.redirect('/home');
    }
  });


router
  .route('/register')
  .get(async (req, res) => {
    //code here for GET
    res.status(200).render('register', {title: 'Register'});
  })
  .post(async (req, res) => {
    //code here for POST
    let firstName = xss(req.body.firstName);
    let lastName = xss(req.body.lastName);
    let email = xss(req.body.email);
    let username = xss(req.body.username);
    let password = xss(req.body.password);
    let confirmPassword = xss(req.body.confirmPassword);
    let gender = xss(req.body.gender);
    let primaryLocation = xss(req.body.primaryLocation);
    let secondaryLocation = xss(req.body.secondaryLocation); 

    if (!firstName || !lastName || !email || !username || !password || !gender || !primaryLocation || !confirmPassword){
      return res.status(400).render('register', {error: 'All fields must be supplied to create a user.', title: 'Error: Missing Fields'});
    }

    const username_regex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!username_regex.test(username.trim())) {
      return res.status(400).render('register', {error: 'Username must be 3-20 characters and only contain letters, numbers, and underscores.', title: 'Error: Invalid Username'});
    }

    //error checking
    let validated = null;
    try{
      validated = await helpers.validateUser(firstName, lastName, email, username, password, confirmPassword, gender, primaryLocation, secondaryLocation);
    } catch(e){
      return res.status(400).render('register', {error: e, title: 'Error: Invalid Input'});
    }

    try{
      let newUser = await createUser(validated.firstName, validated.lastName, validated.email, validated.username, validated.password, validated.confirmPassword, validated.gender, validated.primaryLocation, validated.secondaryLocation);
      if(newUser.memberCreated !== true || !newUser){
        return res.status(500).render('register', {error: 'Failed to create user', title: 'Error: Internal Server Error'});
      }else{
        res.redirect('/signin');
      }
    }catch(e){
      return res.status(400).render('register', {error: e, title: 'Error: Invalid Input'});
    }
  
  });

export default router;
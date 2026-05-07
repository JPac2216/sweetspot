import {Router} from 'express';
const router = Router();
import { getSpotById, createSpot } from '../data/spots.js';
import * as helpers from '../helpers.js';


router
  .route('/create')
  .get(async (req, res) => {
        //code here for GET
        //check if the user is admin
        if (!req.session.member) {
            return res.status(403).render('signin', {title: 'Sign In'});
        }
        if (req.session.member.membershipLevel !== 'admin') {
            return res.status(403).render('userHome', {title: 'User Home'}); 
        }
        return res.status(200).render('spotCreate', {title: 'Create Spot'});
    })
    .post(async (req, res) => {
        //code here for POST
        if (!req.session.member) {
            return res.status(403).render('signin', {title: 'Sign In'});
        }
        if (req.session.member.membershipLevel !== 'admin') {
            return res.status(403).render('userHome', {title: 'User Home'}); 
        }
        let description = req.body.description;
        let name = req.body.name;
        let address = {
            street: req.body.street,
            borough: req.body.borough,
            zip: parseInt(req.body.zip)
        };

        try{
            helpers.validateSpotFields(name, description, address);
        }catch(e){
            return res.status(400).render('spotCreate', {title: 'Create Spot', error: e});
        }

        try{
            await createSpot(name.trim(), description.trim(), address);
            return res.redirect('/spots');
        }catch(e){
            return res.status(400).render('spotCreate', {title: 'Create Spot', error: e});
        }

    });


router
  .route('/:spotId')
  .get(async (req, res) => {
        //code here for GET
        try {
            req.params.spotId = helpers.checkObjectID(req.params.spotId);
        } catch (e) {
            return res.status(404).render('error', { title: 'Error', error: 'Must give Valid ID'}); //not too sure what to render if there is an error here
        }
        try {
            let spot = await getSpotById(req.params.spotId);
            let userDates = await getDatesByCreator(req.session.member._id.toString());
            return res.status(200).render('pages/locationDesc', {title: 'Location Description', spot: spot, userDates: userDates}); 
        } catch (e) {
            return res.status(404).render('error', { title: 'Error', error: 'Spot not found.'});
        }
    });




export default router;
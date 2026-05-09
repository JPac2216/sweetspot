import {Router} from 'express';
const router = Router();
import { getSpotById, createSpot, deleteReview, addReview, appealSpot } from '../data/spots.js';
import { getDatesByCreator, getAllPublicDates } from '../data/dates.js';
import * as helpers from '../helpers.js';
import { dates } from '../config/mongoCollections.js';


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
            let newSpot = await createSpot(name.trim(), description.trim(), address);
            return res.redirect(`/spot/${newSpot._id}`);
        }catch(e){
            return res.status(400).render('spotCreate', {title: 'Create Spot', error: e});
        }

    });


router
  .route('/explore')
  .get(async (req, res) => {
        //code here for GET
        //check if the user is logged in
        if (!req.session.member) {
            return res.status(403).render('signin', {title: 'Sign In'});
        }

        try{
            let allDates = await getAllPublicDates();
            return res.status(200).render('pages/explore', {title: 'Explore', dates: allDates});
        }catch(e){
            return res.status(400).render('error', { title: 'Error', error: e });
        }
    });

router
  .route('/appeal')
  .get(async (req, res) => {
        //code here for GET
        //check if the user is logged in
        if (!req.session.member) {
            return res.status(403).render('signin', {title: 'Sign In'});
        }
        return res.status(200).render('appealSpotCreate', {title: 'Create Spot'});
    })
    .post(async (req, res) => {
        //code here for POST
        if (!req.session.member) {
            return res.status(403).render('signin', {title: 'Sign In'});
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
            return res.status(400).render('appealSpotCreate', {title: 'Create Spot', error: e});
        }
        
        try{
            await appealSpot(req.session.member._id.toString(), name.trim(), description.trim(), address); 
            return res.redirect('/spots');
        }catch(e){
            return res.status(400).render('appealSpotCreate', {title: 'Create Spot', error: e});
        }

    });



router
  .route('/:spotId/review/:reviewId/delete')
  .post(async (req, res) => {
        if (!req.session.member) {
            return res.status(403).render('signin', {title: 'Sign In'});
        }

        let spotId;
        let reviewId;
        try{
            spotId = helpers.checkObjectID(req.params.spotId);
            reviewId = helpers.checkObjectID(req.params.reviewId);
        }catch(e){
            return res.status(400).render('error', { title: 'Error', error: 'Must give Valid ID' });
        }
        try{
            await deleteReview(req.session.member._id.toString(), spotId, reviewId);
            return res.redirect(`/spot/${spotId}`);
        }catch(e){
            return res.status(400).render('error', { title: 'Error', error: e });
        }
  });

router
  .route('/:spotId/review')
  .get(async (req, res) => {
        //code here for GET
        try{
            req.params.spotId = helpers.checkObjectID(req.params.spotId);
        }catch (e){
            return res.status(400).render('error', { title: 'Error', error: 'Must give Valid ID'}); //not too sure what to render if there is an error here
        }
        try{
            let spot = await getSpotById(req.params.spotId);
            return res.status(200).render('addReview', {title: 'Add Review', spot: spot}); 
        }catch(e){
            return res.status(404).render('userHome', { title: 'Error', error: 'Spot not found.'}); //again what should we render here?
        }
  })
  .post(async (req, res) => {
        //code here for POST
        if (!req.session.member) {
            return res.status(403).render('signin', {title: 'Sign In'});
        }

        let spotId;
        try {
            spotId = helpers.checkObjectID(req.params.spotId);
        } catch (e) {
            return res.status(400).render('error', { title: 'Error', error: 'Must give Valid ID' });
        }
        let review = req.body.review;
        let rating = parseInt(req.body.rating);
        let userId = req.session.member._id.toString();
        try{
            await helpers.validateReviewFields(spotId, userId, review, rating);
        }catch(e){
            try{
                let spot = await getSpotById(spotId);
                return res.status(400).render('addReview', {title: 'Add Review', spot: spot, error: e});
            }catch(e){
                return res.status(404).render('error', {title: 'Error', error: e});
            }
        }

        try{
            await addReview(spotId, userId, review.trim(), rating);
            return res.redirect(`/spot/${spotId}`);
        }catch(e){
            try{
                let spot = await getSpotById(spotId);
                return res.status(400).render('addReview', {title: 'Add Review', spot: spot, error: e});
            }catch(e){
                return res.status(404).render('error', {title: 'Error', error: e});
            }
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

        let spot;
        try {
            spot = await getSpotById(req.params.spotId);
        } catch (e) {
            return res.status(404).render('error', { title: 'Error', error: 'Spot not found.'});
        }

        let userDates = [];
        try {
            userDates = await getDatesByCreator(req.session.member._id.toString());
        } catch (e) {
            // user has no dates yet
        }
        return res.status(200).render('pages/locationDesc', {title: 'Location Description', spot: spot, userDates: userDates});
    });




export default router;
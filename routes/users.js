import {Router} from 'express';
const router = Router();
import {getUserById, getDatesByCreator, showAllFavorites, updateUser, addFavorite, deleteFavorite} from '../data/users.js';
import * as spot from '../data/spots.js';
import * as dateData from '../data/dates.js';


router
    .route('/home')
    .get(async (req, res) => {
        try {
            const filteredSpots = await spot.getAllSpots({ address: {borough: req.session.member.primaryLocation} });
            return res.status(200).render('pages/userHome', { title: "Homepage", filteredSpots, member: req.session.member });
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router 
    .route('/profile')
    .get(async (req, res) => {
        try {
            const user = await getUserById(req.session.member._id);
            const createdDates = await dateData.getDatesByCreator(req.session.member._id);
            const favoriteDates = await showAllFavorites(req.session.member._id);
            const publicDates = createdDates.filter(d => d.isPublic);
            const privateDates = createdDates.filter(d => !d.isPublic);
            return res.status(200).render('pages/userProfile', {
                title: 'Profile',
                user,
                publicDates,
                privateDates,
                favoriteDates
            });
        } catch (e) {
            return res.status(500).render('error', { title: 'Error', error: e });
        }
    });


router
    .route('/profile/edit')
    .get(async (req, res) => {
        try {
            return res.status(200).render('pages/userEdit')
        } catch (e) {
            return res.status(500).render('error', { title: 'Error', error: e });
        }
    })
    .post(async (req, res) => {
        const { firstName, lastName, email, username, gender, primaryLocation, secondaryLocation, currentPassword } = req.body;

        if (!currentPassword || currentPassword.trim().length === 0) {
            return res.status(400).render('pages/userEdit', {
                title: 'Edit Profile',
                member: req.session.member,
                error: 'Current password is required to save changes.'
            });
        }

        let updateObj = {};
        if (firstName) updateObj.firstName = firstName;
        if (lastName) updateObj.lastName = lastName;
        if (email) updateObj.email = email;
        if (username) updateObj.username = username;
        if (gender) updateObj.gender = gender;
        if (primaryLocation) updateObj.primaryLocation = primaryLocation;
        if (secondaryLocation !== undefined) updateObj.secondaryLocation = secondaryLocation;

        if (Object.keys(updateObj).length === 0) {
            return res.status(400).render('pages/userEdit', {
                title: 'Edit Profile',
                member: req.session.member,
                error: 'No fields provided to update.'
            });
        }

        try {
            await updateUser(req.session.member.email, currentPassword.trim(), updateObj);
            if (updateObj.email) req.session.member.email = updateObj.email.trim().toLowerCase();
            if (updateObj.username) req.session.member.username = updateObj.username.trim().toLowerCase();
            return res.redirect('/profile');
        } catch (e) {
            return res.status(400).render('pages/userEdit', {
                title: 'Edit Profile',
                member: req.session.member,
                error: e
            });
        }
    });

router
    .route('/date/:id/favorite')
    .post(async (req, res) => {
        try {
            await addFavorite(req.session.member._id, req.params.id);
            return res.redirect('back');
        } catch (e) {
            return res.status(500).render('error', { title: 'Error', error: e });
        }
    });

router
    .route('/date/:id/unfavorite')
    .post(async (req, res) => {
        try {
            await deleteFavorite(req.session.member._id, req.params.id);
            return res.redirect('back');
        } catch (e) {
            return res.status(500).render('error', { title: 'Error', error: e });
        }
    });

router
    .route('/logout')
    .get(async (req, res) => {
        req.session.destroy();
        return res.redirect('/signin');
    });

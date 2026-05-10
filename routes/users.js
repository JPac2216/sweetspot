import {Router} from 'express';
const router = Router();
import {getUserById, showAllFavorites, updateUser, addFavorite, deleteFavorite} from '../data/users.js';
import * as spot from '../data/spots.js';
import * as dateData from '../data/dates.js';
import xss from 'xss';


router
    .route('/home')
    .get(async (req, res) => {
        try {
            const filteredSpots = await spot.getAllSpots(req.session.member.primaryLocation);
            return res.status(200).render('pages/userHome', { title: "Homepage", spots: filteredSpots, member: req.session.member, isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin" });
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
            const publicDates = createdDates.filter(d => d.visibility === "public");
            const privateDates = createdDates.filter(d => d.visibility === "private");
            return res.status(200).render('pages/userProfile', {
                title: 'Profile',
                user,
                publicDates,
                privateDates,
                favoriteDates,
                isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin"
            });
        } catch (e) {
            return res.status(500).render('error', { title: 'Error', error: e });
        }
    });


router
    .route('/profile/edit')
    .get(async (req, res) => {
        try {
            return res.status(200).render('pages/userEdit', {title: 'Edit Profile', member: req.session.member, isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin"});
        } catch (e) {
            return res.status(500).render('error', { title: 'Error', error: e });
        }
    })
    .post(async (req, res) => {
        if(!req.session.member){
            return res.status(401).render('error', {title: 'Unauthorized', error: 'You must be logged in to edit your profile.'});
        }

        const firstName = req.body.firstName ? xss(req.body.firstName): undefined;
        const lastName = req.body.lastName ? xss(req.body.lastName) : undefined;
        const email = req.body.email ? xss(req.body.email) : undefined;
        const username = req.body.username ? xss(req.body.username) : undefined;
        const gender = req.body.gender ? xss(req.body.gender) : undefined;
        const primaryLocation = req.body.primaryLocation  ? xss(req.body.primaryLocation)  : undefined;
        const secondaryLocation = req.body.secondaryLocation ? xss(req.body.secondaryLocation) : undefined;
        const currentPassword = req.body.currentPassword  ? xss(req.body.currentPassword)  : undefined;
        const newPassword = req.body.newPassword ? xss(req.body.newPassword) : undefined;

        if (!currentPassword || currentPassword.trim().length === 0) {
            return res.status(400).render('pages/userEdit', {
                title: 'Edit Profile',
                member: req.session.member,
                isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",
                error: 'Current password is required to save changes.'
            });
        }

        let updateObj = {};
        if (firstName) updateObj.firstName = firstName;
        if (lastName) updateObj.lastName = lastName;
        if (email) updateObj.email = email;
        if (username) updateObj.username = username;
        if (newPassword) updateObj.password = newPassword;
        if (gender) updateObj.gender = gender;
        if (primaryLocation) updateObj.primaryLocation = primaryLocation;
        if (secondaryLocation !== undefined) updateObj.secondaryLocation = secondaryLocation;

        if (Object.keys(updateObj).length === 0) {
            return res.status(400).render('pages/userEdit', {
                title: 'Edit Profile',
                member: req.session.member,
                isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",
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
                isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",
                error: e
            });
        }
    });

router
    .route('/date/:id/favorite')
    .post(async (req, res) => {
        const dateId = xss(req.params.id);
        try {
            await addFavorite(req.session.member._id, dateId);
            return res.json({ favorited: true });
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    });

router
    .route('/date/:id/unfavorite')
    .post(async (req, res) => {
        const dateId = xss(req.params.id);
        try {
            await deleteFavorite(req.session.member._id, dateId);
            return res.json({ favorited: false });
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    });

router
    .route('/logout')
    .get(async (req, res) => {
        req.session.destroy((err) => {
            if (err) return res.status(500).render('error', {title: 'Error', error: 'Could not log out.'});
            res.clearCookie('UserAuthState');
            return res.redirect('/signin');
        });
    });


export default router;
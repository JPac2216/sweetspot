import {Router} from 'express';
const router = Router();
import * as dataUsers from '../data/users.js';
import * as dataDates from '../data/dates.js';
import * as dataSpots from '../data/spots.js';
import { dates, members, spots, users } from '../config/mongoCollections.js';
import * as helpers from '../helpers.js';

router
    .route('/mydates')
    .get(async (req, res) => {
        try {
            const savedSchedules = req.session.member.savedSchedules;
            return res.status(200).render('viewSavedSchedules', {title: "My Saved Schedules", userSchedules: savedschedules});
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

export default router;
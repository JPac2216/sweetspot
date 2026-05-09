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

router
    .route('/:id/upvote')
    .post(async (req, res) => {
        try {
            await dataDates.voteOnDate(req.session.member._id, req.params.id, 1);
            const date = await dataDates.getDateById(req.params.id);
            const upvotes = date.votes.filter(v => v.value === 1).length;
            const downvotes = date.votes.filter(v => v.value === -1).length;
            return res.json({ upvotes, downvotes });
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    });

router
    .route('/:id/downvote')
    .post(async (req, res) => {
        try {
            await dataDates.voteOnDate(req.session.member._id, req.params.id, -1);
            const date = await dataDates.getDateById(req.params.id);
            const upvotes = date.votes.filter(v => v.value === 1).length;
            const downvotes = date.votes.filter(v => v.value === -1).length;
            return res.json({ upvotes, downvotes });
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    });

export default router;
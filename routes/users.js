import {Router} from 'express';
const router = Router();
import { createUser ,authenticateUser } from '../data/users.js';
import * as spot from '../data/spots.js';
import { dates, members, spots, users } from '../config/mongoCollections.js';
import * as helpers from '../helpers.js';


router
    .route('/home')
    .get(async (req, res) => {
        try {
            const filteredSpots = await spot.getAllSpots({ address: {borough: req.session.member.primaryLocation} });
            return res.status(200).render('userHome', { title: "Homepage", filteredSpots, member: req.session.member });
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

export default router;
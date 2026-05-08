import {Router} from 'express';
const router = Router();
import * as spotData from '../data/spots.js';
import * as adminData from '../data/admin.js';
import * as dateData from '../data/dates.js';
import * as helper from '../helpers.js';
import { dates, spots, users, members, appeals } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

router
    .route('/')
    .get(async (req, res) => {
        try {
            const appeals = await spotData.getAllPendingAppeals();
            const flaggedDates = [];
            return res.status(200).render('adminDashboard', { title: "Admin Dashboard", appeals, flaggedDates});
        } catch (e) {
            return res.status(500).render('error', { title: "Error", error: e });
        }
    });

router
    .route('/appeals/:id/approve')
    .post(async (req, res) => {
        try {
            const appealId = req.params.id;
            if (!appealId) throw "approveAppeal: appealId field must be supplied.";
            if (typeof appealId !== "string" || !ObjectId.isValid(appealId.trim())) throw "approveAppeal: appealId field must be of type string and must be a valid ObjectId.";

            const approved = await spotData.approveAppeal(appealId.trim());
            return res.redirect('/admin');
        } catch (e) {
            return res.status(400).render('error', { title: "Error", error: e });
        }
    });

router
    .route('/appeals/:id/reject')
    .post(async (req, res) => {
        try {
            const appealId = req.params.id;
            if (!appealId) throw "rejectAppeal: appealId field must be supplied.";
            if (typeof appealId !== "string" || !ObjectId.isValid(appealId.trim())) throw "rejectAppeal: appealId field must be of type string and must be a valid ObjectId.";
            
            const rejected = await spotData.rejectAppeal(appealId.trim());
            return res.redirect('/admin');
        } catch (e) {
            return res.status(400).render('error', { title: "Error", error: e });
        }
    });

router
    .route('/dates/:id/delete')
    .post(async (req, res) => {
        try {
            const dateId = req.params.id;
            if (!dateId) throw "deleteDateById: dateId field must be supplied.";
            if (typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) throw "deleteDate: dateId field must be of type string and must be a valid ObjectId.";

            const deleted = await dateData.deleteDateById(dateId.trim());
            if (!deleted) throw "deleteDateById: date could not be deleted from the database.";

            return res.redirect('/admin');
        } catch (e) {
            return res.status(400).render('error', { title: "Error", error: e });
        }
    });



export default router;
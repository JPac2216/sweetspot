import {Router} from 'express';
const router = Router();
import { ObjectId } from 'mongodb';
import * as dataUsers from '../data/users.js';
import * as dataDates from '../data/dates.js';
import * as dataSpots from '../data/spots.js';
import { dates, members, spots, users } from '../config/mongoCollections.js';
import * as helper from '../helpers.js';
import xss from 'xss';

router
    .route('/mydates')
    .get(async (req, res) => {
        try {
            const savedSchedules = req.session.member.savedSchedules;
            return res.status(200).render('pages/viewSavedSchedules', {title: "My Saved Schedules", userSchedules: savedSchedules, isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin"});
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/create')
    .get(async (req, res) => {
        res.status(200).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",title: 'Create a Schedule'})
    })
    .post(async (req, res) => {
        let title = req.body.title;
        let description = req.body.description;
        let createdBy = req.session.member._id;
        let visibility = req.body.visibility;
        let borough = req.body.borough;
        let estimatedCost = req.body.estimatedCost;
        let events = req.body.events;
        let tags = req.body.tags;

        if (req.body.action === "save") {
            if (typeof events === "string") {
                try { 
                    events = JSON.parse(events); 
                } catch (e) { 
                    events = []; 
                }
            }
            if (!Array.isArray(events)) events = [];

            if (typeof tags === "string") {
                try { 
                    tags = JSON.parse(tags); 
                } catch (e) { 
                    tags = [tags]; 
                }
            }
            if (!Array.isArray(tags)) tags = [];

            try {
                const draft = await dataDates.saveDraft(createdBy, title, description, borough, estimatedCost, events, tags);
                return res.redirect(`/date/${draft._id}`);
            } catch (e) {
                return res.status(500).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin", error: e, title: "Error: Could Not Save Draft."});
            }
        }

        if (!title || !description || !createdBy || !visibility || !borough || !estimatedCost || !tags) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: all parameters must be supplied in order to create the date.", title: 'Error: Missing Arguments.'});

        if (typeof title !== "string" || !title.trim()) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: title must be supplied and must not be a string of empty spaces.", title: "Error: Invalid Title."});
        title = xss(title.trim());

        if (typeof description !== "string" || !description.trim()) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: description must be supplied and must not be a string of empty spaces."});
        description = xss(description.trim());

        if (typeof createdBy !== "string" || !ObjectId.isValid(createdBy.trim())) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: createdBy must be a valid ObjectId.", title: "Error: Invalid Creator ID."});
        createdBy = xss(createdBy.trim());

        if (typeof visibility !== "string" || (visibility.trim() !== "public" && visibility.trim() !== "private")) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: visibility must either be public or private.", title: "Error: Invalid Visiblity."});
        visibility = xss(visibility.trim());

        if (typeof borough !== "string" || !helper.boroughs.includes(borough.trim().toLowerCase())) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: borough parameter must be a string that is a borough registered in our system.", title: "Error: Invalid Borough."});
        borough = xss(borough.trim().toLowerCase());

        estimatedCost = Number(estimatedCost);
        if (!Number.isFinite(estimatedCost)) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: estimatedCost parameter must be a valid, finite number.", title: "Error: Invalid Cost."});

        if (typeof events === "string") {
            try { events = JSON.parse(events); }
            catch (e) { return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: events must be valid JSON.", title: "Error: Invalid Events."}); }
        }
        if (!Array.isArray(events) || events.length === 0) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "You need at least one spot. Save a draft first, then visit a spot page and use 'Add to Date' to add spots before publishing.", title: "Error: No Spots Added."});

        const validEvents = await helper.isValidEventList(events);
        if (!validEvents) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: events list must contain valid events.", title: "Error: Invalid Events."});

        events = events.map(ev => ({
            ...ev,
            notes: typeof ev.notes === "string" ? xss(ev.notes.trim()) : ev.notes
        }));

        if (typeof tags === "string") {
            tags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        if (!Array.isArray(tags) || tags.length === 0) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: tags must be a non-empty list.", title: "Error: Invalid Tags."});
        const tag_regex = /^[a-zA-Z]{2,20}$/;
        for (let tag of tags) {
            if (typeof tag !== "string" || !tag_regex.test(tag.trim())) return res.status(400).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: "createDate: tags list must contain tags that are 2 to 20 characters in length and only consist of characters.", title: "Error: Invalid Tags."});
        }
        tags = tags.map(t => xss(t.trim()));

        try {
            const newDate = await dataDates.createDate(title, description, createdBy, visibility, borough, estimatedCost, events, tags);
            return res.redirect(`/date/${newDate._id}`);
        } catch (e) {
            return res.status(500).render('pages/dateCreate', {isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",error: e, title: "Error: Could Not Create Date."});
        }
    });

router
    .route('/:id/upvote')
    .post(async (req, res) => {
        let dateId = req.params.id;
        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }
        const userId = req.session.member._id;

        try {
            await dataDates.voteOnDate(userId, dateId, 1);
            const date = await dataDates.getDateById(dateId);
            const upvotes = date.votes.filter(v => v.value === 1).length;
            const downvotes = date.votes.filter(v => v.value === -1).length;

            if (req.accepts('json') && !req.accepts('html')) {
                return res.json({ upvotes, downvotes });
            }
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/:id/downvote')
    .post(async (req, res) => {
        let dateId = req.params.id;
        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }
        const userId = req.session.member._id;

        try {
            await dataDates.voteOnDate(userId, dateId, -1);
            const date = await dataDates.getDateById(dateId);
            const upvotes = date.votes.filter(v => v.value === 1).length;
            const downvotes = date.votes.filter(v => v.value === -1).length;
            if (req.accepts('json') && !req.accepts('html')) {
                return res.json({ upvotes, downvotes });
            }
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/:id/comment')
    .post(async (req, res) => {
        let dateId = req.params.id;
        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }
        const userId = req.session.member._id;

        let comment = req.body.comment;
        if (!comment || typeof comment !== "string" || !comment.trim()) {
            return res.status(400).render('error', {error: "comment must be a non-empty string.", title: 'Error: Invalid Comment'});
        }
        comment = comment.trim();
        if (comment.length > 250) {
            return res.status(400).render('error', {error: "comment cannot be longer than 250 characters.", title: 'Error: Invalid Comment'});
        }
        comment = xss(comment);

        try {
            await dataDates.addComment(userId, dateId, comment);
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/:id/comment/:commentId/delete')
    .post(async (req, res) => {
        let dateId = req.params.id;
        let commentId = req.params.commentId;

        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!commentId || typeof commentId !== "string" || !ObjectId.isValid(commentId.trim())) {
            return res.status(400).render('error', {error: "commentId must be a valid ObjectId.", title: 'Error: Invalid CommentId'});
        }
        commentId = commentId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }
        const userId = req.session.member._id;

        try {
            await dataDates.deleteComment(userId, dateId, commentId);
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/:id/addSpot')
    .post(async (req, res) => {
        let dateId = req.params.id;
        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }

        let dateSpotId = req.body.dateSpotId;
        let notes = req.body.notes;

        if (!dateSpotId || typeof dateSpotId !== "string" || !ObjectId.isValid(dateSpotId.trim())) {
            return res.status(400).render('error', {error: "dateSpotId must be a valid ObjectId.", title: 'Error: Invalid SpotId'});
        }
        dateSpotId = dateSpotId.trim();

        if (notes !== undefined && typeof notes !== "string") {
            return res.status(400).render('error', {error: "notes must be a string if provided.", title: 'Error: Invalid Notes'});
        }
        if (typeof notes === "string") notes = xss(notes.trim());

        try {
            await dataDates.addToSchedule(dateId, dateSpotId, notes);
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/:id/publish')
    .post(async (req, res) => {
        let dateId = req.params.id;
        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }
        const userId = req.session.member._id;

        try {
            const date = await dataDates.getDateById(dateId);
            if (date.createdBy.toString() !== userId) {
                return res.status(403).render('error', {title: 'Error: Invalid Permissions', error: "Only the creator can publish this date."});
            }

            await dataDates.publishDate(dateId);
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/:id/private')
    .post(async (req, res) => {
        let dateId = req.params.id;
        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }
        const userId = req.session.member._id;

        try {
            const date = await dataDates.getDateById(dateId);
            if (date.createdBy.toString() !== userId) {
                return res.status(403).render('error', {title: 'Error: Invalid Permissions', error: "Only the creator can make this date private."});
            }

            await dataDates.privateDate(dateId);
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
  .route('/explore')
  .get(async (req, res) => {
        //code here for GET
        //check if the user is logged in
        if (!req.session.member) {
            return res.redirect('/signin');
        }

        try{
            let tags = req.query.tags;
            if (tags && !Array.isArray(tags)) tags = [tags];
            tags = (tags || []).map(t => xss(t.trim().toLowerCase())).filter(Boolean);
            let cost = req.query.cost ? xss(req.query.cost.trim()) : '';

            let allDates = await dataDates.getAllPublicDates(tags, cost);

            for (let d of allDates) {
                const creator = await dataUsers.getUserById(d.createdBy.toString());
                d.createdByUsername = creator.username;
                d.createdById = d.createdBy.toString();
                d._id = d._id.toString();
            }

            return res.status(200).render('pages/explore', {
                title: 'Explore',
                dates: allDates,
                isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin",
                tag_outdoor: tags.includes('outdoor'),
                tag_indoor: tags.includes('indoor'),
                tag_food: tags.includes('food'),
                tag_free: tags.includes('free'),
                tag_nightlife: tags.includes('nightlife'),
                tag_romantic: tags.includes('romantic'),
                tag_adventure: tags.includes('adventure'),
                cost1: cost === '1',
                cost2: cost === '2',
                cost3: cost === '3',
            });
        }catch(e){
            return res.status(500).render('error', { title: 'Error', error: e });
        }
    });

router
    .route('/creator/:userId')
    .get(async (req, res) => {
        let userId = req.params.userId;
        if (!userId || typeof userId !== "string" || !ObjectId.isValid(userId.trim())) {
            return res.status(400).render('error', {error: "userId must be a valid ObjectId.", title: 'Error: Invalid UserId'});
        }
        userId = userId.trim();

        try {
            const datesList = await dataDates.getDatesByCreator(userId);
            datesList.forEach(d => { d._id = d._id.toString(); });

            const creator = await dataUsers.getUserById(userId);

            return res.status(200).render('pages/creatorDates', {title: `${creator.username}'s Dates`, dates: datesList, creator: {username: creator.username, _id: userId}, isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin"});
        } catch (e) {
            return res.status(404).render('error', {title: 'Error: Creator Not Found', error: e});
        }
    });

router
    .route('/:id/comment/:commentId/edit')
    .post(async (req, res) => {
        let dateId = req.params.id;
        let commentId = req.params.commentId;

        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!commentId || typeof commentId !== "string" || !ObjectId.isValid(commentId.trim())) {
            return res.status(400).render('error', {error: "commentId must be a valid ObjectId.", title: 'Error: Invalid CommentId'});
        }
        commentId = commentId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }
        const userId = req.session.member._id;

        let comment = req.body.comment;
        if (!comment || typeof comment !== "string" || !comment.trim()) {
            return res.status(400).render('error', {error: "comment must be a non-empty string.", title: 'Error: Invalid Comment'});
        }
        comment = comment.trim();
        if (comment.length > 250) {
            return res.status(400).render('error', {error: "comment cannot be longer than 250 characters.", title: 'Error: Invalid Comment'});
        }
        comment = xss(comment);

        try {
            await dataDates.editComment(userId, dateId, commentId, comment);
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/:id/spot/:dateSpotId/delete')
    .post(async (req, res) => {
        let dateId = req.params.id;
        let dateSpotId = req.params.dateSpotId;

        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        if (!dateSpotId || typeof dateSpotId !== "string" || !ObjectId.isValid(dateSpotId.trim())) {
            return res.status(400).render('error', {error: "dateSpotId must be a valid ObjectId.", title: 'Error: Invalid SpotId'});
        }
        dateSpotId = dateSpotId.trim();

        if (!req.session.member || !req.session.member._id) {
            return res.status(403).redirect('/signin');
        }
        const userId = req.session.member._id;

        try {
            const date = await dataDates.getDateById(dateId);
            if (date.createdBy.toString() !== userId) {
                return res.status(403).render('error', {title: 'Error', error: "Only the creator can remove spots from this date."});
            }

            await dataDates.deleteFromSchedule(dateId, dateSpotId);
            return res.redirect(`/date/${dateId}`);
        } catch (e) {
            return res.status(500).render('error', {title: 'Error', error: e});
        }
    });

router
    .route('/:id')
    .get(async (req, res) => {
        let dateId = req.params.id;
        if (!dateId || typeof dateId !== "string" || !ObjectId.isValid(dateId.trim())) {
            return res.status(400).render('error', {error: "dateId must be a valid ObjectId.", title: 'Error: Invalid DateId'});
        }
        dateId = dateId.trim();

        const sessionUserId = req.session.member && req.session.member._id ? req.session.member._id : null;

        try {
            const date = await dataDates.getDateById(dateId);

            const creator = await dataUsers.getUserById(date.createdBy.toString());
            date.createdByUsername = creator.username;
            date.createdById = date.createdBy.toString();

            const isCreator = sessionUserId !== null && date.createdById === sessionUserId;

            const upvotes = date.votes.filter(v => v.value === 1).length;
            const downvotes = date.votes.filter(v => v.value === -1).length;
            date.votes = {upvotes, downvotes};

            date.comments = date.comments.map(c => {
                const ownsComment = sessionUserId !== null && c.userId.toString() === sessionUserId;
                return {
                    _id: c._id.toString(),
                    username: c.username,
                    createdAt: c.createdAt,
                    editedAt: c.editedAt,
                    text: c.comment,
                    canEdit: ownsComment,
                    canDelete: ownsComment || isCreator
                };
            });

            date._id = date._id.toString();
            date.isCreator = isCreator;
            date.isLoggedIn = !!req.session.member;
            date.isPublic = date.visibility === "public";

            return res.status(200).render('pages/dateDetail', {title: date.title, date, isAdmin: !req.session.member ? false : req.session.member.membershipLevel === "admin"});
        } catch (e) {
            return res.status(404).render('error', {title: 'Error: Date Not Found', error: e});
        }
    });

export default router;

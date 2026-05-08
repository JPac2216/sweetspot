import {Router} from 'express';
const router = Router();
import { createUser ,authenticateUser } from '../data/users.js';
import { dates, members, spots, users } from '../config/mongoCollections.js';
import * as helpers from '../helpers.js';



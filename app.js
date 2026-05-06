// Setup server, session and middleware here.
import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import configRoutes from './routes/index.js';

const app = express();

app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(session({
  name: 'UserAuthState',
  secret: 'some secret string',
  resave: false,
  saveUninitialized: false
}));

app.use('/', async (req, res, next) => {
    const timestamp = new Date().toUTCString();
    const authState = !req.session.member ? "Non-Authenticated" : req.session.member.membershipLevel === "admin" ? "Authenticated Admin." : "Authenticated Member.";
    console.log(`[${timestamp}]: ${req.method} ${req.path} ${authState}`);
    next();
});

app.use('/', async (req, res, next) => {
    if (!req.session.member) return res.redirect('/signin');
    next();
});

app.use('/', async (req, res, next) => {
    if (!req.session.member) return res.redirect('/signin');
    if (req.session.member.membershipLevel !== 'admin') return res.status(403).render('error', { title: "Error", e: "This page is forbidden." });
    next();
});

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const connectMongo = require('connect-mongo');
require('./config/passport')(passport);

const config = require('./config/config');

mongoose.connect(config.MongoURI, {useNewUrlParser: true, useCreateIndex: true})
    .then(() => console.log('DB connected...'))
    .catch((err) => console.log(err));

const app = express();
const PORT = process.env.PORT || 3000;
const MongoStore = connectMongo(session);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/assets', express.static(path.join(__dirname, 'assets'), {maxAge: '15 days'}));
app.use(flash());
app.use(session({
    secret: config.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 7200000,
    },
    name: '_ssid',
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
    const { user } = req;
    res.render('dashboard', { title: 'Dashboard', user });
});

app.get('/login', (req, res) => {
    const messages = req.flash('error');
    res.render('login', {title: 'Login', messages});
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/logout', function (req, res) {
    req.logout();
    return res.redirect('/');
});

app.get('/register', (req, res) => {
    res.render('register', {title: 'Register'});
});

app.post('/register', function (req, res) {
    const credentials = req.body;
    const { username, password } = credentials;

    const user = new User({ username });
    user.setPassword(password);
    user.save()
        .then(() => {
            res.redirect('/login');
        })
        .catch(() => {
            res.redirect('/register');
        });
});

app.listen(PORT, function() {
    console.log(`Server started on http://localhost:${PORT}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const connectMongo = require('connect-mongo');

const config = require('./config/config');
const users = require('./routes/users');

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
app.use(function(req, res, next) {
    res.locals.success = req.flash('success');
    res.locals.warnings = req.flash('warning');
    res.locals.errors = req.flash('error');
    next();
})

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
    const { user } = req;
    return res.render('dashboard', { title: 'Dashboard', user });
});

app.use('/users', users);

app.listen(PORT, function() {
    console.log(`Server started on http://localhost:${PORT}`);
});

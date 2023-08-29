require('dotenv').config({ path: ".env" });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('./user');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
const PORT = 3001; // Use port from .env file or default to 3001

app.use(bodyParser.json());

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
}));


mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

const store = new MongoStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions', // The name of the collection where the sessions will be stored
  mongooseConnection: mongoose.connection,
  autoRemove: 'interval',
  autoRemoveInterval: 60, // Remove expired sessions every 1 minute
});


app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      ...req.body,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).send(newUser);
  } catch (error) {
    res.status(400).send(error);
  }
});

// ... (Other imports and configurations)

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: info.message });
    }
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json({ 
        message: 'Login successful', user: user,
        user:user,
        firstname:user.firstname,
        lastname:user.lastname});
    });
  })(req, res, next);
});

// ... (Other routes and app.listen)

app.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) {
        console.log('Error: Failed to destroy the session during logout.', err);
        res.status(500).json({ error: err.message });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logout successful' });
    });
  });
});

// Add this route to your backend code
app.get('/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ isLoggedIn: true, user: req.user });
  } else {
    res.status(200).json({ isLoggedIn: false });
  }
});


passport.use(
  new LocalStrategy(
    { usernameField: 'email', passReqToCallback: true }, // Change 'username' to 'email'
    async (req, email, password, done) => { // Change 'username' to 'email'
      try {
        const user = await User.findOne({ email }); // Change 'username' to 'email'
        if (!user) {
          console.log(`User ${email} not found`);
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          console.log(`Password mismatch for user ${email}`);
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err);
    });
});






app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

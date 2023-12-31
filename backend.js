require('dotenv').config({ path: ".env" });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('./user');
const StaffMember = require('./StaffMember');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const Vacation = require('./Vacation'); // Import the Mongoose model for Application
const multer = require('multer');
const XLSX = require('xlsx');
const EBITDA = require('./EBITDA');
const router = express.Router();
const path = require('path');


const app = express();
const PORT = 3001; // Use port from .env file or default to 3001
const upload = multer({ dest: 'uploads/' });


app.use(bodyParser.json());

// ... (Other imports and configurations)

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
}));

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

function generateRandomPassword() {
  const length = 10; // You can adjust the length of the password
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(characters.length);
    password += characters.charAt(randomIndex);
  }

  return password;
}

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

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    for (let i = 1; i < data.length; i++) {
      const entity = data[i][0];
      const planned = parseFloat(data[i][1]);
      const actual = parseFloat(data[i][2]);
      const ebitda = new EBITDA({ Entity: entity, Planned: planned, Actual: actual });
      await ebitda.save();
    }
    res.send('Data saved to database.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error.');
  }
});

app.get('/api/ebitda', async (req, res) => {
  try {
    const data = await EBITDA.find();
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error.');
  }
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

app.post('/api/submit-vacation', async (req, res) => {
  try {
    const {
      userFullName,
      userEmail,
      startDate,
      endDate,
      paymentTiming,
      selectedOptionLabel,
      lineManagerEmail,
      selectedOptionsignLabel,
      directorEmail,
      status_1,
      status_2,
    } = req.body;
console.log(req.body);
    // Validate date inputs
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Check if end date is after start date
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (endDateObj <= startDateObj) {
      return res.status(400).json({ error: 'End date should be after start date' });
    }

    // Other validations and processing...

    // Create a new application document using the schema
    const comments = [];

    const vacation = new Vacation({
      userFullName,
      userEmail,
      startDate,
      endDate,
      paymentTiming,
      selectedOptionLabel,
      lineManagerEmail,
      selectedOptionsignLabel,
      directorEmail,
      status_1,
      status_2,
    });

    // Save the application to the database
    await vacation.save();

    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to validate date format
function isValidDate(dateString) {
  return !isNaN(Date.parse(dateString));
}


// Add this route to your backend code
app.put('/api/update-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus_1, newStatus_2 } = req.body;

    // Find the vacation record by ID
    const vacation = await Vacation.findById(id);

    if (!vacation) {
      console.log(`Vacation not found for ID: ${id}`);
      return res.status(404).json({ error: 'Vacation record not found' });
    }

    // Update the status fields based on the provided values
    if (newStatus_1 !== undefined) {
      vacation.status_1 = newStatus_1;
    }
    if (newStatus_2 !== undefined) {
      vacation.status_2 = newStatus_2;
    }

    // Save the updated vacation record
    const updatedVacation = await vacation.save();

    res.status(200).json({ message: 'Status updated successfully', vacation: updatedVacation });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



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
      return res.status(200).json({ message: 'Login successful', user: user });
    });
  })(req, res, next);
});

// Add this route to your backend code
app.put('/api/staffmembers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedStaff = req.body;

    const staffMember = await StaffMember.findByIdAndUpdate(id, updatedStaff, {
      new: true, // Return the updated staff member
    });

    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.status(200).json({ message: 'Staff member updated successfully', staffMember });
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging
    res.status(500).json({ error: 'Error updating staff member' });
  }
});


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
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.status(200).json({ user: req.user, isAuthenticated: true });
  } else {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.status(200).json({ user: null, isAuthenticated: false });
  }
});

// Define the route to fetch registered staff members
app.get('/api/registeredstaffmembers', async (req, res) => {
  try {
    const user = req.user;

    const selectedOptionLabels = await StaffMember.find({
      
      addedBy_company: user.organization,
    });
    res.status(200).json(selectedOptionLabels);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching registered line managers' });
  }
});


// Define the route to fetch staff members
app.get('/api/staffmembers', async (req, res) => {
  try {
    const staffMembers = await StaffMember.find();
    res.status(200).json(staffMembers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching staff members' });
  }
});

app.get('/api/vacation-data', async (req, res) => {
  try {
    const vacationData = await Vacation.find();
    res.status(200).json(vacationData);
  } catch (error) {
    console.error('Error fetching vacation data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/add-comment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { commentedUserFullName, comment } = req.body;

    // Find the vacation record by ID
    const vacation = await Vacation.findById(id);

    if (!vacation) {
      console.log(`Vacation not found for ID: ${id}`);
      return res.status(404).json({ error: 'Vacation record not found' });
    }
    
    if (!vacation.comments) {
      vacation.comments = []; // Initialize comments array if it doesn't exist
    }

    // Add the comment to the vacation record
    vacation.comments.push({ commentedUserFullName, comment });

    // Save the updated vacation record
    const updatedVacation = await vacation.save();
    
    console.log('Updated Vacation with Comment:', updatedVacation); // Log the updated vacation

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this route to your backend code
app.get('/api/get-comments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the vacation record by ID
    const vacation = await Vacation.findById(id);

    if (!vacation) {
      return res.status(404).json({ error: 'Vacation record not found' });
    }

    // Return the comments for the vacation record
    res.status(200).json({ comments: vacation.comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Backend route
app.get('/api/staffmemberstoregister', async (req, res) => {
  try {
    const userEmail = req.user.email; // Get the user's email from the authenticated user object

    // Find the staff member based on the user's email
    const staffMember = await StaffMember.findOne({ 'personalInfo.email': userEmail });

    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Access the "corporateInfo.annualLeaveDays"
    const annualLeaveDays = staffMember.corporateInfo.annualLeaveDays;
    const position = staffMember.corporateInfo.position;
    res.status(200).json({ staffMember, annualLeaveDays, position });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Error fetching staff member' });
  }
});

app.get('/api/staffregistrationpage', async (req, res) => {
  try {
    const email = req.query.email; // Get the email from the query parameters

    // Modify the database query to filter staff members by email
    const staffmembers = await StaffMember.find({ 'personalInfo.email': email });

    res.status(200).json({ staffmembers });
  } catch (error) {
    console.error('Error fetching staff members:', error);
    res.status(500).json({ error: 'Error fetching staff members' });
  }
});

// Define the route to handle the POST request
app.post('/api/staffmember', async (req, res) => {
try {
  const newStaffMember = new StaffMember(req.body);
  const savedStaffMember = await newStaffMember.save();
  res.status(201).json({ message: 'Staff member added successfully', staffMember: savedStaffMember });
} catch (error) {
  console.error('Error:', error); // Log the error for debugging
  let response;
  if (error.name === 'ValidationError') {
    response = res.status(400).json({ error: 'Validation error', details: error.message });
  } else {
    response = res.status(500).json({ error: 'Error adding staff member' });
  }
  return response; // Make sure to return the response
}
});

// Modify the route to return user data for the authenticated user
// Modify the route to fetch user data based on the user's ID in the session

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Set up multer upload
const uploadphoto = multer({ storage: storage });

// Handle photo upload
app.post('/api/upload-photo', uploadphoto.single('photo'), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.status(200).json({ message: 'File uploaded successfully', filename: file.filename });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    const userId = req.user.id; // Get the user's ID from the authenticated user
    User.findById(userId) // Fetch the user data based on the ID
      .then((user) => {
        if (user) {
          res.status(200).json({ user }); // Return the user data
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Error fetching user data' });
      });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

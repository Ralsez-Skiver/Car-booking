const express = require('express');
const session = require('express-session');
const cors = require('cors');
const connection_pool = require('./database');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: 'mock-ms-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
  },
}));

app.post('/login', (req, res) => {
  const { username, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role required' });
  }

  // save usr session
  req.session.user = { username, role };
  res.json({ message: 'Login successful', user: req.session.user });
});

app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});


app.get('/requestee_past_data', async (req, res) => {
  try {
    // console.log('Session:', req.session);
    const username = req.session.user?.username

    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const [rows] = await connection_pool.query(
      'SELECT * FROM booking_request WHERE requester = ?',
      [username]
    );
    res.json(rows)
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error')
  }
})

app.post('/makebooking', async (req, res) => {
  try {
    const username = req.session.user?.username
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      pick_up_time_dept,
      pick_up_time_return,
      passenger,
      luggage,
      markerLocations,
    } = req.body;

    if (
      !pick_up_time_dept ||
      !passenger ||
      !markerLocations ||
      !Array.isArray(markerLocations) ||
      markerLocations.length < 2
    ) {
      return res.status(400).json({ error: 'Invalid booking data' });
    }

    const origin = markerLocations[0];
    const destination = markerLocations[1];
    const returnLocation = markerLocations.length >= 3 ? markerLocations[2] : null;

    // Validate coordinates
    const isValidCoord = (loc) =>
      loc && typeof loc.lat === 'number' && typeof loc.lng === 'number';

    if (!isValidCoord(origin) || !isValidCoord(destination)) {
      return res.status(400).json({ error: 'Invalid origin or destination location data' });
    }

    if (returnLocation && !isValidCoord(returnLocation)) {
      return res.status(400).json({ error: 'Invalid return location data' });
    }

    const sql = `
      INSERT INTO booking_request
      (requester, pick_up_time_dept, pick_up_time_return, origin_lat, origin_long,
       destination_lat, destination_long, return_lat, return_long,
       passenger, luggage, requested_time, approval, approve_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, NULL)
    `;

    await connection_pool.query(sql, [
      username,
      pick_up_time_dept,
      pick_up_time_return || null,
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
      returnLocation ? returnLocation.lat : null,
      returnLocation ? returnLocation.lng : null,
      passenger,
      luggage || 0,
    ]);

    res.status(201).json({ message: 'Booking saved successfully' });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'Server error saving booking' });
  }
});

app.get('/schedule', async (req, res)=> {
  try {
    const username = req.session.user?.username
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const date = req.query.date
    const [rows] = await connection_pool.query(
      'SELECT * FROM booking_request WHERE DATE(pick_up_time_dept) = ?', // not all?
      [date]
    );
    // console.log('q:', rows)
    res.json(rows)
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error')
  }
})

app.get('/distancematrix', async (req, res)=> {
  try {
    // const username = req.session.user?.username
    // if (!username) {
    //   return res.status(401).json({ error: 'Not authenticated' });
    // }

    const date = req.query.date
    const [rows] = await connection_pool.query(
      'SELECT origin_lat,origin_long,destination_lat,destination_long,return_lat,return_long FROM booking_request WHERE DATE(pick_up_time_dept) = ?',
      [date]
    );
    const latlongs = new Set();

    rows.forEach(item => {
      latlongs.add(`${item.origin_long},${item.origin_lat}`);
      latlongs.add(`${item.destination_long},${item.destination_lat}`);
      latlongs.add(`${item.return_long},${item.return_lat}`);
    });

    const locations = Array.from(latlongs).map(latlong => {
      const [lng, lat] = latlong.split(',').map(Number);
      return [lng, lat];
    }); 

    const ors_url = "http://localhost:8080/ors/v2/matrix/driving-car";
    const ors_payload = {
      locations,
      metrics: ['duration']
    }
    const ors_response = await fetch('http://localhost:8080/ors/v2/matrix/driving-car',{
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json'
      },
      body: JSON.stringify(ors_payload)
    })

    if (!ors_response.ok) {
      const error = await ors_response.text();
      throw new Error(`ORS API error: ${ors_response.status} - ${error}`)
    }
    
    const matrix = await ors_response.json();

    // console.log('q:', rows)
    
    res.json({
      rows,
      matrix})

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error')
  }
})

app.get('/locations', async (req,res) => {
  try {
    const username = req.session.user?.username
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated'})
    }
    const [rows] = await connection_pool.query(
      'SELECT location_name, location_lat, location_lng FROM locations'
    );
    res.json(rows)

  } catch (error) {
    console.error(error);
  }
})

app.post('/addnewlocation', async (req,res) => {
  try {
    const username = req.session.user?.username
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated'});
    }
    
    const {
      location_name,
      location_lat,
      location_lng
    } = req.body;

    const sql = `
    INSERT INTO locations
    (location_name,location_lat,location_lng)
    VALUES (?,?,?)
    `

    await connection_pool.query(sql, [
      location_name,
      location_lat,
      location_lng
    ]);

    res.status(201).json({ message: 'Added new location'});
  } catch (error) {
    console.error('Error adding new location:', error);
    res.status(500).json({ error: 'Error saving new location'})
  }
})

app.listen(PORT, () => {
  console.log(`car booking backend running on http://localhost:${PORT}`);
});

// add query loging for debugging
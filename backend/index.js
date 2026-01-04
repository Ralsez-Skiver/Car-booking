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
    const username = req.session.user?.username;
    if (!username) return res.status(401).json({ error: 'Not authenticated' });

    // 1. Get the main Bookings
    const [bookings] = await connection_pool.query(`
      SELECT 
        booking_id, title, requester, booking_type, 
        DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date, 
        approval
      FROM booking
      WHERE requester = ? 
      ORDER BY booking_date DESC
    `, [username]);

    if (bookings.length === 0) return res.json([]);

    const bookingIds = bookings.map(b => b.booking_id);

    // 2. Get ALL segments (Outbound AND Return are now in this one table)
    const [segments] = await connection_pool.query(`
      SELECT 
        bs.segment_id, bs.booking_id, bs.segment_order, bs.is_return_trip,
        bs.pickup_location, lp.location_name AS pickup_location_name,
        bs.destination, ld.location_name AS destination_name,
        bs.pickup_time
      FROM booking_segment bs
      LEFT JOIN locations lp ON bs.pickup_location = lp.location_id
      LEFT JOIN locations ld ON bs.destination = ld.location_id
      WHERE bs.booking_id IN (?)
      ORDER BY bs.booking_id, bs.segment_order
    `, [bookingIds]);

    // 3. (Optional) Get Deliveries if you want to show postal info
    const [deliveries] = await connection_pool.query(`
      SELECT * FROM deliveries WHERE booking_id IN (?)
    `, [bookingIds]);

    // 4. Merge Data
    const segmentsByBooking = segments.reduce((acc, seg) => {
      if (!acc[seg.booking_id]) acc[seg.booking_id] = [];
      acc[seg.booking_id].push(seg);
      return acc;
    }, {});

    const deliveriesByBooking = deliveries.reduce((acc, del) => {
      acc[del.booking_id] = del;
      return acc;
    }, {});

    const fullData = bookings.map(b => ({
      ...b,
      segments: segmentsByBooking[b.booking_id] || [],
      delivery_details: deliveriesByBooking[b.booking_id] || null
    }));
    console.log('past_data:', fullData)
    res.json(fullData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// --- CHANGED: MAKE BOOKING ---
app.post('/makebooking', async (req, res) => {
  let connection;
  try {
    const username = req.session.user?.username;
    if (!username) return res.status(401).json({ error: 'Not authenticated' });

    const {
      title, date, passenger, luggage, // Basic Info
      segments,                        // Array of outbound segments
      return_pickup_time,              // Legacy Frontend Data
      return_pickup_location_id,       // Legacy Frontend Data
      return_destination_id,           // Legacy Frontend Data
      booking_type = 'passenger',      // Default to passenger
      delivery_details                 // Object: { recipient, item_desc, weight }
    } = req.body;

    if (!title || !date || !segments || segments.length === 0) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    connection = await connection_pool.getConnection();
    await connection.beginTransaction();

    // 1. Insert into BOOKINGS
    const [bookingRes] = await connection.query(`
      INSERT INTO booking 
      (title, booking_date, requester, booking_type, passenger, luggage, approval)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [title, date, username, booking_type, passenger || 0, luggage ? 1 : 0]);
    
    const bookingId = bookingRes.insertId;

    // 2. Insert Outbound Segments
    const segmentSql = `
      INSERT INTO booking_segment
      (booking_id, segment_order, pickup_location, destination, pickup_time, is_return_trip)
      VALUES (?, ?, ?, ?, ?, 0)
    `;

    // Note: 'segment_order' logic here assumes the frontend sends order, 
    // or we can auto-increment i.
    let orderCounter = 1;

    for (const seg of segments) {
      await connection.query(segmentSql, [
        bookingId,
        seg.segment_order || orderCounter++, 
        seg.pickup_dept_location_id,
        seg.destination_id,
        // If postal, time might be null
        booking_type === 'postal' ? null : seg.pickup_dept_time 
      ]);
    }

    // 3. Handle Return Trip (Convert Legacy Frontend Data to a New Segment Row)
    if (return_pickup_time && return_pickup_location_id && return_destination_id) {
      await connection.query(`
        INSERT INTO booking_segment
        (booking_id, segment_order, pickup_location, destination, pickup_time, is_return_trip)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [
        bookingId,
        orderCounter++, // Increment order
        return_pickup_location_id,
        return_destination_id,
        return_pickup_time
      ]);
    }

    // 4. Handle Postal Delivery Details
    if (booking_type === 'postal' && delivery_details) {
      await connection.query(`
        INSERT INTO deliveries (booking_id, recipient_name, item_description, item_weight_kg)
        VALUES (?, ?, ?, ?)
      `, [
        bookingId, 
        delivery_details.recipient_name, 
        delivery_details.item_description, 
        delivery_details.item_weight_kg
      ]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Booking saved successfully' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (connection) connection.release();
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
      `
      SELECT 
        -- Booking Info
        b.booking_id,
        b.title,
        b.booking_type,
        b.approval,

        -- Segment Info
        s.segment_id   AS trip_id,
        s.segment_order,
        s.is_return_trip,
        
        -- Times & Locs
        s.pickup_time AS start_time,
        
        s.pickup_location    AS source_location,
        ls.location_name     AS source_name,
        
        s.destination        AS destination_location,
        ld.location_name     AS destination_name,

        -- Assignment / Overrides
        dm.duration_sec      AS time_matrix,
        ta.manual_start_time,
        ta.manual_duration_sec AS manual_estimate,
        ta.car_id,
        c.car_name

      FROM booking_segment s
      JOIN booking b ON b.booking_id = s.booking_id
      
      -- Location Joins
      LEFT JOIN locations ls ON ls.location_id = s.pickup_location
      LEFT JOIN locations ld ON ld.location_id = s.destination

      -- Distance Matrix Join
      LEFT JOIN distance_matrix dm 
        ON dm.source_location = s.pickup_location 
        AND dm.destination_location = s.destination

      -- Trip Assignment Join (1:1 now)
      LEFT JOIN trip_assignments ta ON ta.segment_id = s.segment_id
      LEFT JOIN car c ON ta.car_id = c.car_id

      WHERE b.booking_date = ?
      ORDER BY COALESCE(ta.manual_start_time, s.pickup_time) ASC`, [date, date]
    );
    console.log('schedule:', rows)
    res.json(rows)
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error')
  }
})


app.get('/cardata', async (req, res)=> {
  try{
    const username = req.session.user?.username
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const [car] = await connection_pool.query(`SELECT * from car`);
    res.json(car)
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
      'SELECT * FROM locations'
    );
    res.json(rows)

  } catch (error) {
    console.error(error);
  }
})

app.post('/addnewlocation', async (req,res) => {
  let connection;
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

    connection = await connection_pool.getConnection();
    await connection.beginTransaction();

    const [existingLocations] = await connection.query(
      `SELECT location_id, location_lat, location_lng FROM locations FOR UPDATE`
    )

    const sqlNewLocation = `
    INSERT INTO locations
    (location_name,location_lat,location_lng)
    VALUES (?,?,?)
    `

    const [newLocationResult] = await connection.query(sqlNewLocation, [
      location_name,
      location_lat,
      location_lng
    ]);
    const newLocationId = newLocationResult.insertId

    if (existingLocations.length === 0){
      await connection.commit();
      return res.status(201).json({ message: 'Added new location, no distance calculated', newLocationId: newLocationId })
    }

    const newLocCoords = [location_lng, location_lat];
    const existingLocCoords = existingLocations.map(loc => [loc.location_lng, loc.location_lat]);
    const allCoords = [newLocCoords, ...existingLocCoords];

    const ors_url = "http://localhost:8080/ors/v2/matrix/driving-car";
    const ors_payload = {
      locations: allCoords,
      metrics: ['duration'],
      sources: [0],
      destinations: Array.from({length: allCoords.length}, (_, i) => i)
      };
    const ors_response = await fetch(ors_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ors_payload)
      });

      if (!ors_response.ok) {
        const error = await ors_response.text();
        throw new Error(`ORS API error: ${ors_response.status} - ${error}`);
      }
        
    const durations = (await ors_response.json()).durations[0];

    const today = new Date();
    const sqlDistanceMatrix = `
    INSERT INTO distance_matrix
    (source_location, destination_location, duration_sec, last_updated)
    VALUES ?
    on DUPLICATE KEY UPDATE duration_sec = VALUES(duration_sec), last_updated = VALUES(last_updated)
    `
    const values = [];

    durations.forEach((duration, index) => {
      if (index === 0) return;

      const otherLocationId = existingLocations[index - 1].location_id;

      values.push([newLocationId, otherLocationId, duration, today]);
      values.push([otherLocationId, newLocationId, duration, today]);
    });

    await connection.query(sqlDistanceMatrix, [values]);

    await connection.commit();

    res.status(201).json({ message: 'Added new location, distance calculated', newLocationId: newLocationId});
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error adding new location:', error);
    res.status(500).json({ error: 'Error saving new location'})
  } finally {
    if (connection) {
      connection.release();
    }
  }
})

app.listen(PORT, () => {
  console.log(`car booking backend running on http://localhost:${PORT}`);
});

// add query loging for debugging
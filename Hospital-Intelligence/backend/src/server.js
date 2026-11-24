
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import hospitals from './routes/hospitals.js';
import auth from './routes/auth.js';
import doctors from './routes/doctors.js';
import patients from './routes/patients.js';
import appointments from './routes/appointments.js';

const app = express();

// Security and middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  })
);

app.use(express.json({ limit: '1mb' }));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Hospital Intelligence API'
  });
});

// API routes
app.use('/api/hospitals', hospitals);
app.use('/api/auth', auth);
app.use('/api/doctors', doctors);
app.use('/api/patients', patients);
app.use('/api/appointments', appointments);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: 'Something went wrong. Check the server logs.'
  });
});

// Start server
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});

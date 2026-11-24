
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Convert appointment date (IST) into UTC range
function getISTDateRange(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);

  const start = new Date(Date.UTC(year, month - 1, day, -5, -30));
  const end = new Date(Date.UTC(year, month - 1, day + 1, -5, -30));

  return { start, end };
}

// Convert 12-hour slot to a Date in IST
function slotToDate(dateString, slot) {
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const [year, month, day] = dateString.split('-').map(Number);

  // IST = UTC + 5:30
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) - 330 * 60 * 1000
  );
}

const appointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  hospitalId: z.string().min(1),
  appointmentDate: z.string().datetime(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

const updateSchema = z.object({
  appointmentDate: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
}).refine(data => Object.keys(data).length > 0);

// GET available slots for a doctor on a selected date
router.get('/available-slots', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        error: 'doctorId and date are required'
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Date must be in YYYY-MM-DD format'
      });
    }

    const selectedDate = new Date(`${date}T12:00:00`);
    const dayLabel = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long'
    });

    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        doctorId,
        dayLabel,
        status: 'ACTIVE'
      }
    });

    if (!availability) {
      return res.json({
        doctorId,
        date,
        dayLabel,
        slotDuration: null,
        availableSlots: []
      });
    }

    const { start, end } = getISTDateRange(date);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: start,
          lt: end
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        appointmentDate: true
      }
    });

    const bookedTimes = new Set(
      bookedAppointments.map(a => a.appointmentDate.getTime())
    );

    const now = new Date();

    const availableSlots = availability.slots
      .map(slot => {
        const slotDate = slotToDate(date, slot);

        if (!slotDate) return null;

        if (slotDate <= now) return null;

        if (bookedTimes.has(slotDate.getTime())) return null;

        return {
          time: slot,
          datetime: slotDate.toISOString()
        };
      })
      .filter(Boolean);

    res.json({
      doctorId,
      date,
      dayLabel,
      slotDuration: availability.slotDuration,
      availableSlots
    });
  } catch (error) {
    next(error);
  }
});

// GET all appointments
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { search, status } = req.query;

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search ? {
          patient: {
            name: { contains: search, mode: 'insensitive' }
          }
        } : {})
      },
      include: {
        patient: true,
        doctor: true,
        hospital: true
      },
      orderBy: { appointmentDate: 'asc' }
    });

    res.json({ count: appointments.length, appointments });
  } catch (error) {
    next(error);
  }
});

// GET appointment by ID
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { patient: true, doctor: true, hospital: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// BOOK appointment
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = appointmentSchema.parse(req.body);

    const appointmentDate = new Date(data.appointmentDate);

    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid appointment date'
      });
    }

    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        error: 'Appointment must be scheduled in the future'
      });
    }

    const [patient, doctor, hospital] = await Promise.all([
      prisma.patient.findUnique({ where: { id: data.patientId } }),
      prisma.doctor.findUnique({ where: { id: data.doctorId } }),
      prisma.hospital.findUnique({ where: { id: data.hospitalId } })
    ]);

    if (!patient || !doctor || !hospital) {
      return res.status(400).json({
        error: 'Invalid patient, doctor or hospital selection'
      });
    }

    if (doctor.hospitalId !== hospital.id) {
      return res.status(400).json({
        error: 'Selected doctor does not belong to this hospital'
      });
    }

    // Extract selected date and time in Indian timezone
    const istDateTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(appointmentDate);

    const dateParts = istDateTime.match(
      /^(\d{4})-(\d{2})-(\d{2}),?\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (!dateParts) {
      return res.status(400).json({
        error: 'Could not validate appointment time'
      });
    }

    const [, year, month, day, hour, minute, period] = dateParts;

    const date = `${year}-${month}-${day}`;

    const selectedTime =
      `${Number(hour)}:${minute} ${period.toUpperCase()}`;

    const weekday = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day))
    ).toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: 'UTC'
    });

    // Check doctor weekly availability
    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        doctorId: data.doctorId,
        dayLabel: weekday,
        status: 'ACTIVE'
      }
    });

    if (!availability) {
      return res.status(400).json({
        error: 'Doctor is not available on the selected date'
      });
    }

    if (!availability.slots.includes(selectedTime)) {
      return res.status(400).json({
        error: 'Selected time is not in the doctor schedule'
      });
    }

    // Check existing appointments for this doctor and date
    const { start, end } = getISTDateRange(date);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: data.doctorId,
        appointmentDate: {
          gte: start,
          lt: end
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        appointmentDate: true
      }
    });

    const alreadyBooked = existingAppointments.some(
      appointment =>
        appointment.appointmentDate.getTime() === appointmentDate.getTime()
    );

    if (alreadyBooked) {
      return res.status(409).json({
        error: 'This appointment slot is already booked'
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        appointmentDate
      },
      include: {
        patient: true,
        doctor: true,
        hospital: true
      }
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE appointment
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);

    const existing = await prisma.appointment.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.appointmentDate
          ? { appointmentDate: new Date(data.appointmentDate) }
          : {})
      },
      include: { patient: true, doctor: true, hospital: true }
    });

    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    next(error);
  }
});

// CANCEL appointment
router.patch('/:id/cancel', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (existing.status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Completed appointments cannot be cancelled'
      });
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { patient: true, doctor: true, hospital: true }
    });

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    next(error);
  }
});

// DELETE appointment
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

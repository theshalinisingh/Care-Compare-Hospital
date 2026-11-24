
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Validation schema
const doctorSchema = z.object({
  name: z.string().min(2),
  speciality: z.string().min(2),
  qualification: z.string().min(2),
  experienceYears: z.coerce.number().int().min(0),
  consultationFee: z.coerce.number().int().min(0),
  hospitalId: z.string().min(1)
});

const updateSchema = doctorSchema.partial();

// Weekly availability validation
const availabilitySchema = z.object({
  days: z.array(
    z.object({
      dayLabel: z.enum([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ]),
      startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    })
  ).max(7)
    .refine(
      days => new Set(days.map(day => day.dayLabel)).size === days.length,
      'Each weekday can appear only once'
    ),
  slotDuration: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(60)
  ])
});

// GET all doctors
router.get('/', async (req, res, next) => {
  try {
    const { search, speciality, hospitalId } = req.query;

    const doctors = await prisma.doctor.findMany({
      where: {
        ...(search && {
          name: { contains: search, mode: 'insensitive' }
        }),
        ...(speciality && { speciality }),
        ...(hospitalId && { hospitalId })
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        },
        availability: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ count: doctors.length, doctors });
  } catch (error) {
    next(error);
  }
});

// GET doctor weekly availability
router.get('/:id/availability', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: { availability: true }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({
      doctorId: doctor.id,
      doctorName: doctor.name,
      availability: doctor.availability
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE doctor weekly availability (Admin only)
router.put('/:id/availability', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = availabilitySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid availability details',
        details: parsed.error.flatten()
      });
    }

    const { days, slotDuration } = parsed.data;

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Validate timings and generate slots
    const records = [];

    for (const day of days) {
      const [startHour, startMinute] = day.startTime.split(':').map(Number);
      const [endHour, endMinute] = day.endTime.split(':').map(Number);

      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;

      if (end <= start) {
        return res.status(400).json({
          error: `End time must be after start time for ${day.dayLabel}`
        });
      }

      const slots = [];

      for (
        let time = start;
        time + slotDuration <= end;
        time += slotDuration
      ) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;

        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;

        slots.push(
          `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
        );
      }

      records.push({
        dayLabel: day.dayLabel,
        slots,
        status: 'ACTIVE',
        doctorId: doctor.id
      });
    }

    // Replace old weekly schedule safely in a transaction
    const availability = await prisma.$transaction(async (tx) => {
      await tx.doctorAvailability.deleteMany({
        where: { doctorId: doctor.id }
      });

      if (records.length > 0) {
        await tx.doctorAvailability.createMany({
          data: records
        });
      }

      return tx.doctorAvailability.findMany({
        where: { doctorId: doctor.id },
        orderBy: { dayLabel: 'asc' }
      });
    });

    res.json({
      message: 'Doctor availability updated successfully',
      doctorId: doctor.id,
      availability
    });
  } catch (error) {
    next(error);
  }
});

// GET single doctor
router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        hospital: true,
        availability: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    next(error);
  }
});

// ADD doctor (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = doctorSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid doctor details',
        details: parsed.error.flatten()
      });
    }

    const doctor = await prisma.doctor.create({
      data: parsed.data,
      include: { hospital: true }
    });

    res.status(201).json(doctor);
  } catch (error) {
    next(error);
  }
});

// UPDATE doctor (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({ error: 'Provide valid doctor details' });
    }

    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { hospital: true }
    });

    res.json(doctor);
  } catch (error) {
    next(error);
  }
});

// DELETE doctor (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await prisma.doctor.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

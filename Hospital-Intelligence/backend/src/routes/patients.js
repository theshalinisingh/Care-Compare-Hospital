
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const patientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  age: z.coerce.number().int().min(0).max(120).optional().nullable(),
  gender: z.string().optional(),
  city: z.string().optional()
});

const updateSchema = patientSchema.partial();

// GET all patients
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { search } = req.query;

    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } }
            ]
          }
        : {},
      orderBy: { createdAt: 'desc' }
    });

    res.json({ count: patients.length, patients });
  } catch (error) {
    next(error);
  }
});

// GET patient by ID
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    next(error);
  }
});

// ADD patient
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = patientSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid patient details',
        details: parsed.error.flatten()
      });
    }

    const patient = await prisma.patient.create({
      data: parsed.data
    });

    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
});

// UPDATE patient
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({
        error: 'Provide valid patient details'
      });
    }

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: parsed.data
    });

    res.json(patient);
  } catch (error) {
    next(error);
  }
});

// DELETE patient
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await prisma.patient.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

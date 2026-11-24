import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { scoreHospital } from '../services/scoring.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const include = {
  doctors: { include: { availability: true } },
  services: true,
  facilities: true
};

// Hospital input validation
const hospitalSchema = z.object({
  name: z.string().trim().min(2).max(150),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100).optional(),
  region: z.string().trim().min(2).max(100).optional(),
  address: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10).max(2000),
  phone: z.string().trim().max(30).nullable().optional(),
  website: z.string().trim().max(300).nullable().optional()
});

const updateSchema = hospitalSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'Provide at least one field to update' }
);

// GET: Hospital directory
router.get('/', async (req, res, next) => {
  try {
    const { q, city, state, region, speciality, emergency } = req.query;

    const where = {
      AND: [
        q ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } }
          ]
        } : {},
        city ? { city: { contains: city, mode: 'insensitive' } } : {},
        state && state !== 'All India'
          ? { state: { equals: state, mode: 'insensitive' } }
          : {},
        region && region !== 'All regions'
          ? { region: { equals: region, mode: 'insensitive' } }
          : {},
        speciality ? {
          services: {
            some: {
              speciality: { contains: speciality, mode: 'insensitive' }
            }
          }
        } : {},
        emergency === 'true'
          ? { services: { some: { emergencyAvailable: true } } }
          : {}
      ]
    };

    const rows = await prisma.hospital.findMany({
      where,
      include,
      orderBy: { name: 'asc' }
    });

    res.json({
      data: rows.map(h => scoreHospital(h, {
        speciality,
        emergency: emergency === 'true'
      })),
      count: rows.length
    });
  } catch (e) {
    next(e);
  }
});

// POST: Compare hospitals
router.post('/compare', async (req, res, next) => {
  try {
    const { ids, speciality, budgetMax, emergency } = req.body;

    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
      return res.status(400).json({
        error: 'Choose between 2 and 4 hospitals to compare'
      });
    }

    const hospitals = await prisma.hospital.findMany({
      where: { id: { in: ids } },
      include
    });

    const ranked = hospitals.map(h =>
      scoreHospital(h, {
        speciality,
        budgetMax: Number(budgetMax) || undefined,
        emergency: Boolean(emergency)
      })
    ).sort((a, b) => b.comparison.score - a.comparison.score);

    res.json({
      data: ranked,
      disclaimer: 'Scores are informational preference matches based on entered/demo data. They do not measure clinical quality or guarantee treatment outcomes.'
    });
  } catch (e) {
    next(e);
  }
});

// GET: Single hospital details
router.get('/:id', async (req, res, next) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.params.id },
      include
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json({ data: hospital });
  } catch (e) {
    next(e);
  }
});

// POST: Add hospital (ADMIN only)
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = hospitalSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid hospital details',
        details: parsed.error.flatten()
      });
    }

    const hospital = await prisma.hospital.create({
      data: parsed.data,
      include
    });

    res.status(201).json({
      message: 'Hospital created successfully',
      data: hospital
    });
  } catch (e) {
    next(e);
  }
});

// PUT: Update hospital (ADMIN only)
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid hospital details',
        details: parsed.error.flatten()
      });
    }

    const existing = await prisma.hospital.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const hospital = await prisma.hospital.update({
      where: { id: req.params.id },
      data: parsed.data,
      include
    });

    res.json({
      message: 'Hospital updated successfully',
      data: hospital
    });
  } catch (e) {
    next(e);
  }
});

// DELETE: Delete hospital (ADMIN only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.hospital.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    await prisma.hospital.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Hospital deleted successfully' });
  } catch (e) {
    next(e);
  }
});

export default router;
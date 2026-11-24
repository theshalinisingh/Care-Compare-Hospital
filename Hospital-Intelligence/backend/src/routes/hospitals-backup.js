import { Router } from 'express';
import { prisma } from '../prisma.js';
import { scoreHospital } from '../services/scoring.js';
const router=Router();
const include={doctors:{include:{availability:true}},services:true,facilities:true};
router.get('/',async(req,res,next)=>{try{
 const {q,city,state,region,speciality,emergency}=req.query;
 const where={AND:[q?{OR:[{name:{contains:q,mode:'insensitive'}},{city:{contains:q,mode:'insensitive'}}]}:{},city?{city:{contains:city,mode:'insensitive'}}:{},state&&state!=='All India'?{state:{equals:state,mode:'insensitive'}}:{},region&&region!=='All regions'?{region:{equals:region,mode:'insensitive'}}:{},speciality?{services:{some:{speciality:{contains:speciality,mode:'insensitive'}}}}:{},emergency==='true'?{services:{some:{emergencyAvailable:true}}}:{}]};
 const rows=await prisma.hospital.findMany({where,include,orderBy:{name:'asc'}});
 res.json({data:rows.map(h=>scoreHospital(h,{speciality,emergency:emergency==='true'})),count:rows.length});
 }catch(e){next(e)}});
router.get('/:id',async(req,res,next)=>{try{const h=await prisma.hospital.findUnique({where:{id:req.params.id},include}); if(!h)return res.status(404).json({error:'Hospital not found'}); res.json({data:h});}catch(e){next(e)}});
router.post('/compare',async(req,res,next)=>{try{
 const {ids,speciality,budgetMax,emergency}=req.body;
 if(!Array.isArray(ids)||ids.length<2||ids.length>4)return res.status(400).json({error:'Choose between 2 and 4 hospitals to compare'});
 const hospitals=await prisma.hospital.findMany({where:{id:{in:ids}},include});
 const ranked=hospitals.map(h=>scoreHospital(h,{speciality,budgetMax:Number(budgetMax)||undefined,emergency:Boolean(emergency)})).sort((a,b)=>b.comparison.score-a.comparison.score);
 res.json({data:ranked,disclaimer:'Scores are informational preference matches based on entered/demo data. They do not measure clinical quality or guarantee treatment outcomes.'});
 }catch(e){next(e)}});
export default router;

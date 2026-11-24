// Transparent preference score, not a clinical quality or outcome prediction.
export function scoreHospital(hospital,{speciality,budgetMax,emergency}={}){
 const services=hospital.services||[]; const facilities=hospital.facilities||[];
 const match=speciality?services.some(s=>s.speciality.toLowerCase()===speciality.toLowerCase()):true;
 const price=services.filter(s=>!speciality||s.speciality.toLowerCase()===speciality.toLowerCase()).map(s=>(s.estimatedCostMin+s.estimatedCostMax)/2);
 const avg=price.length?price.reduce((a,b)=>a+b,0)/price.length:null;
 const costScore=budgetMax&&avg!==null?Math.max(0,Math.min(100,100-(avg/budgetMax)*50)):70;
 const ratingScore=Math.max(0,Math.min(100,(hospital.rating/5)*100));
 const serviceScore=match?100:(speciality?20:70);
 const facilityScore=Math.min(100,facilities.length*20);
 const emergencyScore=emergency?(services.some(s=>s.emergencyAvailable)?100:0):70;
 const score=Math.round(serviceScore*.30+costScore*.25+ratingScore*.20+facilityScore*.15+emergencyScore*.10);
 return {...hospital,comparison:{score,estimatedAverageCost:avg,matchedSpeciality:match,scoreNote:'Preference-based score using listed services, estimated cost, rating, facilities and emergency flag. Not a clinical recommendation.'}};
}

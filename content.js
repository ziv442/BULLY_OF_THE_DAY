import express from 'express';
import dotenv from 'dotenv';
import { writeFile } from 'fs/promises';
dotenv.config();

const keywords = [
  'בריונות', 'השפלה', 'העלבות', 'הקנטות',
  'חרם', 'נידוי', 'הצקות', 'איומים',
  'שיימינג',  'טוקבקים פוגעניים',
  'הפצת תמונות', 'חדירה לפרטיות', 'פגיעה ברשת', 
  'דיכאון', 'חרדה', 'בדידות', 'חוסר שייכות',
  'מחשבות אובדניות', 'פגיעה עצמית', 
  'בית ספר', 'מורה', 'כיתה', 'תלמיד',
  'חברים', 'קבוצת ווטסאפ', 'רשת חברתית'
];
const ageGroup = 'בני נוער';
const app = express();
const PORT = 3000;

const API_KEY = process.env.API;
const CSE_ID = process.env.CSE;
console.log(API_KEY)
console.log(CSE_ID)
app.use(express.static('public'));

app.get('/index', async (req, res) => {
 let results=[]
  for (let keyword of keywords) {
  const query = `${keyword} ${ageGroup}`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    results.push({ keyword, results: data.items || [] })
    console.log(data);
  } catch (error) {
    console.error('שגיאה בשליפת נתונים:', error);
    res.status(500).json({ error: 'שגיאה בשליפת כתבות' });
  }}
  await writeFile('results.json', JSON.stringify(results || [], null, 2), 'utf-8');
  res.json(results|| []);
  console.log(results.length)
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
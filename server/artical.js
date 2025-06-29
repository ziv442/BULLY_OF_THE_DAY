import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// טוען את קובץ ה-.env מהתיקיה ההורה
dotenv.config({ path: '../.env' });
const openai =new OpenAI({
    apiKey: process.env.API_AR,
    baseURL: 'https://openrouter.ai/api/v1',
});



async function send(url){
    const promt = 'תכין כתבה מהטקסטט. אל תחזור על עצמך, שושהכתבה תהיה מעניינת ועם עובדות מהכתבה ההמקורריתת'
    const urlpromt = url + promt;

    const chat = await openai.chat.completions.create({
        model:'openai/gpt-4o',
        messages:[{role:"user", content: urlpromt}],
        temperature:0.7,
        max_tokens:200
        
    });
return chat.choices[0].message.content.trim()}

let results = []
async function change() {
  const artical = JSON.parse(fs.readFileSync('../results2024up.json'))
    for (let arti of artical){
         const tags = arti.pagemap.metatags[0]
         const url = arti.snippet
         const title = arti.title
         const all = await send(url)
         results.push({all, title})
         
}
fs.writeFile('../articales.json', JSON.stringify({ results }, null, 2), 'utf-8', (err) => {
    if (err) throw err;
    console.log('נשמר בהצלחה!');
  });
    console.log('נשמר בהצלחה לקובץ articales.json');
}

const majorCitiesInIsrael = [
  "תל אביב", "ירושלים", "חיפה", "באר שבע", "אשדוד", "אשקלון", "נתניה",
  "רמת גן", "פתח תקווה", "ראשון לציון", "בת ים", "כפר סבא", "רעננה",
  "מודיעין", "קריית אתא", "קריית מוצקין", "נצרת", "עפולה", "חדרה",
  "אום אל פחם", "טבריה", "נהריה", "אילת", "רמלה", "לוד", "שפרעם",
  "קריית גת", "דימונה",'ראש הנקרה ', 'מטולה', 'טבריה', 'שדרות', 'אופקים','בית שאן','בני ברק '
  ,'קריית ארבע','כפר קאסם','נתיבות','דימונה','אום אל פאחם', 'כפר סבא', 'ערד','מצפה רמון ','סכנין'
  ,'מגדל שמס','גבעת שמואל','שוהם','קריית יערים','נווה אילן ','ים מלח','מזכרת בתיה ','בית שמש ','מעלה אדומים'
  ,'מבשרת ציון','רהט','כפר שמריהו','קסריה','צפת','אור יהודה ','ראש העין','רעננה','באקה אל גרבייה','באר יעקב '
  ,'אבן שמואל','הר גילה ','אריאל','שומרון','פלמחים','בית מאיר','יפו','מרכז','צפון','דרום'
];

const ages10to18 = ["10", "11", "12", "13", "14", "15", "16", "17", "18"];

const recognizedGenders = [
  "זכר", "נקבה", "ילד", "ילדה", "תלמיד", "תלמידה", "נער", "נערה", "בת", "בן",'בנים','בנות','ילדים','ילדות','צעיר','צעירה','צעירים','צעירות','תלמידים','תלמידות'
];

const ageS = {};
const cityS = {};
const genderS = {};
const nomachS = [];

function normalize(text) {
  return text.replace(/[.,?!״”“–\-]/g, '').replace(/\s+/g, ' ').trim();
}

function analyze(text, title) {
  const fullText = normalize(`${title} ${text}`);
  let found = false;

  // מגדר
  for (const age of ages10to18) {
    if (fullText.includes(age)) {
      ageS[age] = (ageS[age] || 0) + 1;
      found = true;
      break;
    }
  }


  // עיר
  for (const city of majorCitiesInIsrael) {
    if (fullText.includes(city)) {
      cityS[city] = (cityS[city] || 0) + 1;
      found = true;
      break;
    }
  }

  // מגדר
  for (const gender of recognizedGenders) {
    if (fullText.includes(gender)) {
      genderS[gender] = (genderS[gender] || 0) + 1;
      found = true;
      break;
    }
  }

  if (!found) {
    nomachS.push(fullText);
  }
}

async function processArticles() {
  const fileContent = await readFile('../results.json', 'utf-8');
  const articles = JSON.parse(fileContent);

  for (const keyword of articles) {
    const words = keyword.results || [];
    for (const article of words) {
    const descrip = article.pagemap.metatags[0]
    analyze(descrip["og:description"], article.title);
    }
  }

  await writeFile('../statistics.json', JSON.stringify({
    ages: ageS,
    cities: cityS,
    genders: genderS,
    noMatch: nomachS
  }, null, 2), 'utf-8');

  console.log('סטטיסטיקות נשמרו בקובץ statistics.json');
}

processArticles().catch(console.error);

export {processArticles, change};

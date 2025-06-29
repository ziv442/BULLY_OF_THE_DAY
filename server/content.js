import express from 'express';
import dotenv from 'dotenv';
import { writeFile, readFile } from 'fs/promises';
import { change, processArticles} from './artical.js';
dotenv.config({ path: '../.env' });
import cors from 'cors';
const allowedOrigins = ['https://bully-of-the-day.onrender.com']; // כתובת הפרונט ברנדר שלך

const ageGroup = 'בני נוער';
const app = express();
const PORT = 3000;

app.use(cors({
  origin: allowedOrigins,
}));


const keywords = [
  'בריונות', 'השפלה', 'העלבות', 'הקנטות',
  'חרם', 'נידוי', 'הצקות', 'איומים',
  'שיימינג', 'טוקבקים פוגעניים',
  'הפצת תמונות', 'חדירה לפרטיות', 'פגיעה ברשת',
  'דיכאון', 'חרדה', 'בדידות', 'חוסר שייכות',
  'מחשבות אובדניות', 'פגיעה עצמית', 'מוקד 105','השיימינג'
];

const filterArray = [
  'שבי', 'רבי', 'מלחמה', 'צבא', 'פוליטיקה', 'דת', 'היסטוריה','פרות','75 לישראל','צרפת','ניו יורק'
];
           
const socialMediaArray = [
  'רשת', 'רשת חברתית', 'אינסטגרם', 'טיקטוק', 'פייסבוק',
  'וואטסאפ', 'בני נוער', 'נוער', 'תלמידים','רשתות חברתיות'
];

const API_KEY = process.env.API;
const CSE_ID = process.env.CSE;

app.use(express.static('../client'));

// שליפת כתבות ושמירה לקובץ
app.get('/index', async (req, res) => {
  let results = [];

  for (let keyword of keywords) {
    const query = `${keyword} ${ageGroup}`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log(data)

      const filteredItems = (data.items || []).filter(item => {
        const text = (item.title + ' ' + item.snippet).toLowerCase();

        const hasFilteredWord = filterArray.some(word => text.includes(word.toLowerCase()));
        if (hasFilteredWord) return false;

        const hasRelevantWord = socialMediaArray.some(word => text.includes(word.toLowerCase()));
        return hasRelevantWord;
      });

      results.push({ keyword, results: filteredItems });

    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
      res.status(500).json({ error: 'שגיאה בשליפת כתבות' });
      return;
    }
  }

  await writeFile('../results.json', JSON.stringify(results, null, 2), 'utf-8');
  res.json(results);
});

// ניתוח הכתבות לפי מילות מפתח ושנים
app.get('/analyze', async (req, res) => {
  try {
    const raw = await readFile('../results.json', 'utf-8');
    const data = JSON.parse(raw);

    let totalCount = 0;
    let countByKeyword = {};
    let countByYear = {};
    let nodate = 0;
    let articles2024 = [];

    for (const entry of data) {
      const keyword = entry.keyword;
      const articles = entry.results || [];

      countByKeyword[keyword] = articles.length;
      totalCount += articles.length;

      for (const article of articles) {
        if (article.pagemap && article.pagemap.metatags) {
          const metatags = article.pagemap.metatags[0];
          let date =
            metatags['article:published_time'] ||
            metatags['og:published_time'] ||
            metatags['og:updated_time'] ||
            metatags['vr:published_time'] ||
            metatags['article:update_time'] ||
            metatags['article:modified_time'] ||
            metatags['publishdate'];

          if (date) {
            const yearMatch = date.match(/\d{4}/);
            if (yearMatch) {
              const year = yearMatch[0];
              if (year === '2024' || year === '2025') {
                articles2024.push(article);
              }
              countByYear[year] = (countByYear[year] || 0) + 1;
            } else {
              nodate++;
            }
          } else {
            nodate++;
          }
        }
      }
    }

    await writeFile('../results2024up.json', JSON.stringify(articles2024, null, 2), 'utf-8');

    res.json({
      totalArticles: totalCount,
      articlesByKeyword: countByKeyword,
      articlesByYear: countByYear
    });

    console.log('Total:', totalCount);
    console.log('By Year:', countByYear);
    console.log('No Date:', nodate);

  } catch (error) {
    console.error('שגיאה בניתוח הנתונים:', error);
    res.status(500).json({ error: 'שגיאה בניתוח הנתונים' });
  }
});

function calculateRelevance(text) {
  // אם יש מילת סינון – לא רלוונטי
  if (filterArray.some(word => text.includes(word))) {
    return 1;
  }

  let score = 1; // בסיס

  // חישוב הופעות מילות מפתח
  const keywordMatches = keywords.filter(word => text.includes(word)).length;
  if (keywordMatches >= 3) score += 2; // הופיעו 3 ומעלה מילים – ציון גבוה
  else if (keywordMatches >= 1) score += 1; // הופיעה לפחות 1 – תוספת בינונית

  // חישוב הופעות מילים חברתיות
  const socialMatches = socialMediaArray.filter(word => text.includes(word)).length;
  if (socialMatches >= 2) score += 1.5; // לפחות 2 הופעות – תוספת

  // בדיקת גיל
  if (
  text.includes(ageGroup) ||
  /\b(1[0-8]|[1-9])\b ?(שנה|שנים|בן|בני|בת|בנות)/.test(text) ||
  /\b(1[0-8]|[1-9])\b ?עד ?\b(1[0-8]|[1-9])\b/.test(text)
) {
  score += 1;
}

  // אורך טקסט
  if (text.length > 300) score += 0.5;

  // הגבלת ציון למקסימום 5
  return Math.min(Math.round(score), 5);
}

async function addRelevanceScores() {
  try {
    const rawData = await readFile('../results2024up.json', 'utf-8');
    const data = JSON.parse(rawData);

    const updated = data.map(article => {
      const text = (article.title || '') + ' ' + (article.snippet || '');
      const relevance = calculateRelevance(text);
      return { ...article, relevance_score: relevance };
    });

    await writeFile('../results_with_relevance.json', JSON.stringify(updated, null, 2), 'utf-8');
    console.log('Relevance scores added successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

addRelevanceScores();

app.listen(PORT, () => {
  //change();
  processArticles();
  console.log(`http://localhost:${PORT}`);
});

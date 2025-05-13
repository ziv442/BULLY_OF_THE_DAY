import express from 'express';
import dotenv from 'dotenv';
import { writeFile, readFile } from 'fs/promises';
dotenv.config();

const keywords = [
  'בריונות', 'השפלה', 'העלבות', 'הקנטות',
  'חרם', 'נידוי', 'הצקות', 'איומים',
  'שיימינג', 'טוקבקים פוגעניים',
  'הפצת תמונות', 'חדירה לפרטיות', 'פגיעה ברשת', 
  'דיכאון', 'חרדה', 'בדידות', 'חוסר שייכות',
  'מחשבות אובדניות', 'פגיעה עצמית', 
  'בית ספר', 'מורה', 'כיתה', 'תלמיד',
  'חברים', 'קבוצת ווטסאפ', 'רשת חברתית'
];

const ageGroup = 'בני נוער';
const app = express();
const PORT = 3000;

const API_KEY = process.env.API;
const CSE_ID = process.env.CSE;

app.use(express.static('public'));

// שליפת כתבות ושמירה לקובץ
app.get('/index', async (req, res) => {
  let results = [];
  for (let keyword of keywords) {
    const query = `${keyword} ${ageGroup}`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(query)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      results.push({ keyword, results: data.items || [] });
    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
      res.status(500).json({ error: 'שגיאה בשליפת כתבות' });
      return;
    }
  }

  await writeFile('results.json', JSON.stringify(results, null, 2), 'utf-8');
  res.json(results);
});

// ניתוח הכתבות לפי מילות מפתח ושנים
app.get('/analyze', async (req, res) => {
  try {
    const raw = await readFile('results.json', 'utf-8');
    const data = JSON.parse(raw);

    let totalCount = 0;
    let countByKeyword = {};
    let countByYear = {};
    let nodate=0;
    let articles2024= []

    for (const entry of data) {
      const keyword = entry.keyword;
      const articles = entry.results || [];

      countByKeyword[keyword] = articles.length;
      totalCount += articles.length;

      for (const article of articles) {
        if (article.pagemap && article.pagemap.metatags) {
          const metatags = article.pagemap.metatags[0];
          let date = metatags['article:published_time'] || metatags['og:published_time'] || metatags['og:updated_time'] || metatags['vr:published_time'] || metatags['article:update_time']||metatags['article:modified_time']|| metatags['publishdate'];

          if (date) {
            const yearMatch = date.match(/\d{4}/);
            console.log(yearMatch)
            if (yearMatch) {
              const year = yearMatch[0];
              console.log(year)
              if(year==='2024'||year==='2025') {
                articles2024.push(article)
              }
              countByYear[year] = (countByYear[year] || 0) + 1;
            }
            else {
              nodate++
            }
          }
          else {
            nodate++
          }
        }
      }
      await writeFile('results2024up.json', JSON.stringify(articles2024, null, 2), 'utf-8');
    }

    res.json({
      totalArticles: totalCount,
      articlesByKeyword: countByKeyword,
      articlesByYear: countByYear
      
    });
console.log(totalCount, countByYear)
console.log(nodate)
  } catch (error) {
    console.error('שגיאה בניתוח הנתונים:', error);
    res.status(500).json({ error: 'שגיאה בניתוח הנתונים' });
  }
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
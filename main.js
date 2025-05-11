import axios from "axios";

const keywords = [ "מכונת כביסה"];
const sites = [
  "www.walla.co.il",
  "www.mako.co.il",
  "www.ynet.co.il",
  "www.israelhayom.co.il",
  "www.maariv.co.il",
  "www.kshalem.org.il/",
  "www.keyvan.io/",
"www.gov.il/",
"www.srugim.co.il/",
"www.hamal.co.il/",
"www.c14.co.il/"
];

async function searchKeywords() {
  for (const keyword of keywords) {
    for (const site of sites) {
      const query = encodeURIComponent(keyword);
      const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${query}&key=${API_KEY}&cx=${CX}`;

      try {
        const response = await axios.get(searchUrl);
        const results = response.data.items;
        if (results) {
          results.forEach(item => {
            console.log(`נמצא: ${item.title} - ${item.link}`);
          });
        }
      } catch (error) {
        console.error(`שגיאה בעת חיפוש ${keyword} ב-${site}:`, error.message);
      }
    }
  }
}

searchKeywords();
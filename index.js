import express from 'express';
import pg from "pg";
import postgres from 'postgres';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';


dotenv.config();
const url=process.env.DATABASE_URL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const app = express();
const PORT = 4000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static( path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
const sql = postgres(url);

app.get("/", async (req, res) => {
  const result = await sql`SELECT * FROM links`;
  const currentUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log(result);
  console.log(currentUrl);
  res.render('index.ejs', { links: result ,host:currentUrl});
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.post("/shorten", async (req, res) => {
  const { url, name, tag, description } = req.body;

  const result = await sql`
    INSERT INTO links (redirect_to, name, tagname, description) VALUES (${url}, ${name}, ${tag}, ${description}) RETURNING *;
  `;
  res.send(result[0]);
});

app.post("/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await sql`DELETE FROM links WHERE link_id = ${id}`;
  const result2 = await sql`DELETE FROM linkclicks WHERE link_id = ${id}`;
  res.status(200).send('Link deleted successfully');;
});
  
app.get("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { url, name, tag, description } = req.query;
  const result = await sql`
    UPDATE links SET redirect_to = ${url}, name = ${name}, tagname = ${tag}, description = ${description} WHERE link_id = ${id} RETURNING *;
  `;
  res.send(result[0]);
});

app.get("/clicks/:id", async (req, res) => {
  const { id } = req.params;
  const result = await sql`SELECT * FROM linkclicks WHERE link_id = ${id}`;
  res.send(result);
});



app.get("/link/:id", async (req, res) => {
  const { id } = req.params;
  const result = await sql`SELECT redirect_to FROM links WHERE link_id = ${id}`;
  const details = await axios.get("http://ip-api.com/json/")
  try {
    const updatedUser = await sql`
      INSERT INTO linkclicks (
        status, country, country_code, region, region_name, city, zip, lat, lon, timezone, isp, org, as_full, query, link_id
      ) VALUES (
        ${details.data.status}, 
        ${details.data.country}, 
        ${details.data.countryCode}, 
        ${details.data.region}, 
        ${details.data.regionName}, 
        ${details.data.city}, 
        ${details.data.zip}, 
        ${details.data.lat}, 
        ${details.data.lon}, 
        ${details.data.timezone}, 
        ${details.data.isp}, 
        ${details.data.org}, 
        ${details.data.as}, 
        ${details.data.query},
        ${id}
      ) RETURNING *;
    `;
    res.redirect(result[0].redirect_to);
    console.log('User updated successfully:');
  } catch (error) {
    console.log('Error updating user:');
  }
  console.log(details);
});
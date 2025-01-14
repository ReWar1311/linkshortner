import express from 'express';
import pg from "pg";
import postgres from 'postgres';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';



dotenv.config();
const url=process.env.DATABASE_URL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const app = express();
const PORT = 4000;
app.use(cookieParser());
const SECRET_KEY = process.env.SECRET_KEY;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static( path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
const sql = postgres(url);

const authenticateUser = async (username, password) => {
  try {
    const result = await sql`SELECT * FROM users WHERE username = ${username}`;
    const user = result[0];
    console.log(user);

    if (!user || !user.password_hash) {
      return null;
    }

    if (bcrypt.compareSync(password, user.password_hash)) {
      return user;
    }
    return null;
  } catch (error) {
    console.error("Error during user authentication:", error);
    return null;
  }
};

const authenticateToken = (req, res, next) => {
  const token2 = req.cookies.token || "";


  if (token2 == "") return res.render("login.ejs", { message: "Please login first" });
  const decoded = jwt.decode(token2);
  jwt.verify(token2, SECRET_KEY, (err, user) => {
    if (err) return res.render("login.ejs", { message: "Session expired, please login again" });
    // req.user = user;
    // user_id = decoded.userId;
    next();
  });
};

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  // Validate credentials
  const userexist = await authenticateUser(username, password);
  console.log(userexist);

  if (userexist == null) {
    console.log("Invalid username or password");
    return res.render("login.ejs", { message: "Invalid username or password" });
  }
  else{
    const token = jwt.sign(
      { userId: userexist.business_id, username: userexist.user_name },
      SECRET_KEY,
      {
        expiresIn: "1h", // Token expires in 1 hour
      }
    );
    res.cookie("token", token, {
      httpOnly: true, // Prevent access from JavaScript
      secure: false, // Set to true if using HTTPS
      sameSite: "strict", // Prevent CSRF
    });
  
  }
  
  res.redirect("/");
});

// Logout route
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/",authenticateToken, async (req, res) => {
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
  res.redirect('/');
});

app.post("/delete/:id",authenticateToken, async (req, res) => {
  const { id } = req.params;
  const result = await sql`DELETE FROM links WHERE link_id = ${id}`;
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
app.get("/ipadress", async (req, res) => {
  // Capture the user's IP address
  let userIP = req.ip;
  console.log(userIP);



  // If you're using a reverse proxy (like Vercel), check for the x-forwarded-for header
  if (req.headers['x-forwarded-for']) {
    userIP = req.headers['x-forwarded-for'].split(',')[0];  // The first IP in the list is the user's original IP
  }

  res.send(userIP);
});


app.get("/link/:id", async (req, res) => {
  const { id } = req.params;
  let userIP = req.ip;
  console.log(userIP);
  if (req.headers['x-forwarded-for']) {
    userIP = req.headers['x-forwarded-for'].split(',')[0];  // The first IP in the list is the user's original IP
  }
  const result = await sql`SELECT redirect_to FROM links WHERE link_id = ${id}`;
  const details = await axios.get("http://ip-api.com/json/"+userIP);
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
import express from 'express';
import postgres from 'postgres';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import sendaMail from './sendotp.js';
import { OAuth2Client } from 'google-auth-library';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';





dotenv.config();
const url=process.env.DATABASE_URL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SECRET_KEY2 = process.env.SECRET_KEY;
const JWT_SECRET = process.env.SECRET_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "/oauth";
const sql = postgres(url);






const app = express();
const PORT = 4000;
app.use(cookieParser());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static( path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.use(
//   session({
//       secret: JWT_SECRET,
//       resave: false,
//       saveUninitialized: true,
//   })
// );
app.use(passport.initialize());
// app.use(passport.session());

// Passport configuration for Google OAuth
passport.use(
  new GoogleStrategy(
      {
          clientID: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          callbackURL: "https://www.prashantrewar.me/oauth",
      },
      (accessToken, refreshToken, profile, done) => {
          // Attach access token to the user profile
          profile.token = accessToken;
          return done(null, profile);
      }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes

// Initiate Google OAuth login
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email", "openid"] })
);

// Handle callback after Google login
app.get("/oauth", (req, res, next) => {
  passport.authenticate("google", { session: false, failureRedirect: "/failed" }, async (err, googleUser) => {
    if (err || !googleUser) {
      console.error("Authentication failed:", err);
      return res.redirect("/failed");
    }

    try {
      const email = googleUser.emails[0].value;
      const googleId = googleUser.id;
      const displayName = googleUser.displayName;

      

      let userExist = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (userExist.length === 0) {
        let exists = true;
        let counter = 1;
        let baseUsername = email.split('@')[0];
        let username = baseUsername;

        while (exists) {
          const result = await sql`SELECT * FROM users WHERE username = ${username}`;
          if (result.length === 0) {
            exists = false;
          } else {
            username = `${baseUsername}${counter}`;
            counter++;
          }
        }

        const newUser = await sql`
          INSERT INTO users (email, username, first_name, google_id, provider) 
          VALUES (${email}, ${username}, ${displayName}, ${googleId}, 'google')  
          RETURNING *;
        `;
        userExist = newUser[0];
      } else {
        userExist = userExist[0];
      }


      const token = jwt.sign(
        { userId: userExist.user_id, username: userExist.username },
        SECRET_KEY2,
        { expiresIn: "30d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 2592000000 // 30 days in milliseconds (1 month)
      });

      res.redirect("/");
    } catch (error) {
      console.error("Error during Google OAuth:", error);
      res.status(500).send("An error occurred during authentication.");
    }
  })(req, res, next);
});

const authenticateUser = async (username, password) => {
  try {
    const result = await sql`SELECT * FROM users WHERE username = ${username} OR email = ${username}`;

    
    const user = result[0];

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
  jwt.verify(token2, SECRET_KEY2, (err, user) => {
    if (err) return res.render("login.ejs", { message: "Session expired, please login again" });
    // req.user = user;
    // user_id = decoded.userId;
    next();
  });
};

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Validate credentials
  const userexist = await authenticateUser(username, password);

  if (userexist == null) {
    return res.render("login.ejs", { message: "Invalid username or password" });
  }
  else{
    const token = jwt.sign(
      { userId: userexist.user_id, username: userexist.username },
      SECRET_KEY2,
      {
      expiresIn: "30d", // Token expires in 30 days (1 month)
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

app.get("/failed", (req, res) => {
  res.send("Authentication failed");
})

// Logout route
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.get("/public", (req, res) => {
  const token = jwt.sign(
    { userId: 0, username: "guest" },
    SECRET_KEY2,
    {
    expiresIn: "30d", // Token expires in 30 days (1 month)
    }
  );
  res.cookie("token", token, {
    httpOnly: true, // Prevent access from JavaScript
    secure: false, // Set to true if using HTTPS
    sameSite: "strict", // Prevent CSRF
  });
  res.redirect("/");
});


app.get("/",authenticateToken, async (req, res) => {
  const token2 = req.cookies.token
  const decoded = jwt.decode(token2);
  const user_id = decoded.userId;
  const result = await sql`SELECT * FROM links WHERE user_id = ${user_id}`; 
  const currentUrl = req.protocol + '://' + req.get('host') + req.originalUrl; 
  res.render('index.ejs', { links: result ,host:currentUrl});
});

app.post("/shorten",authenticateToken, async (req, res) => {
  const { url, name, tag, description } = req.body;
  const token2 = req.cookies.token
  const decoded = jwt.decode(token2);
  const user_id = decoded.userId;

  const result = await sql`
    INSERT INTO links (redirect_to, name, tagname, description, user_id) VALUES (${url}, ${name}, ${tag}, ${description}, ${user_id}) RETURNING *;
  `;
  res.redirect('/');
});

app.post("/delete/:id",authenticateToken, async (req, res) => {
  const { id } = req.params;
  const token2 = req.cookies.token
  const decoded = jwt.decode(token2);
  const user_id = decoded.userId;
  const result = await sql`DELETE FROM links WHERE link_id = ${id} AND user_id = ${user_id}`;
  res.status(200).send('Link deleted successfully');;
});
  
app.get("/update/:id", async (req, res) => {
  const token2 = req.cookies.token
  const decoded = jwt.decode(token2);
  const user_id = decoded.userId;
  const { id } = req.params;
  const { url, name, tag, description } = req.query;
  const result = await sql`
    UPDATE links SET redirect_to = ${url}, name = ${name}, tagname = ${tag}, description = ${description} WHERE link_id = ${id} AND user_id = ${user_id} RETURNING *;
  `;
  res.send(result[0]);
});

app.get("/clicks/:id",authenticateToken, async (req, res) => {
  const token2 = req.cookies.token
  const decoded = jwt.decode(token2);
  const user_id = decoded.userId;
  const { id } = req.params;
  try{
  const result = await sql`SELECT * FROM linkclicks WHERE link_id = ${id}`;
  if (result.length > 0) {
  res.send(result);}
  else{
    res.send("No clicks found");
  }}
  catch(err){
    res.send("Access Denied "+err);
  }
});
app.get("/ipadress", async (req, res) => {
  // Capture the user's IP address
  let userIP = req.ip;



  // If you're using a reverse proxy (like Vercel), check for the x-forwarded-for header
  if (req.headers['x-forwarded-for']) {
    userIP = req.headers['x-forwarded-for'].split(',')[0];  // The first IP in the list is the user's original IP
  }

  res.send(userIP);
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.post("/signup", async (req, res) => {
  const { name, email, username, password } = req.body;
  const user = await sql`SELECT * FROM users WHERE username = ${username}`;
  if (user.length > 0) {
    return res.render("signup.ejs", { message: "Username already exists" });
  }
  const user2 = await sql`SELECT * FROM users WHERE email = ${email}`;
  if (user2.length > 0) {
    return res.render("signup.ejs", { message: "Email already exists,try login" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000);
  sendaMail({ name: name, email: email, otp: otp });
  res.render("otp.ejs", { name: name, email: email, username: username, password: password ,token:otp});

  ;})

app.post("/otp", async (req, res) => {
  const { name, email, username, password, token, otp } = req.body;

  if (token != otp) {
    return res.render("otp.ejs", {
      message: "Invalid OTP",
      name: name,
      email: email,
      username: username,
      password: password,
      token: token,
    });
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await sql`
      INSERT INTO users (first_name, email, username, password_hash) VALUES ( ${name}, ${email}, ${username}, ${hashedPassword}) RETURNING *
    `;
    res.render("login.ejs", {
      message: "User created successfully, please login",
    });
  }
});

app.get("/forgotpassword", (req, res) => {
  res.render("forgotpassword.ejs");
});


app.post("/forgotpassword", async (req, res) => {
  const { username } = req.body;
  const user = await sql`SELECT * FROM users WHERE email = ${username} OR username = ${username}`;
  if (user.length == 0) {
    return res.render("forgotpassword.ejs", { message: "Email not found" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000);
  await sendaMail({ name: user[0].first_name, email: user[0].email, otp: otp });
  res.render("resetpassword.ejs", { email: user[0].email, token: otp });
  })

app.post("/resetpassword", async (req, res) => {
  const { email, token, password, otp } = req.body;
  const user = await sql`SELECT * FROM users WHERE email = ${email}`;
  if (otp != token) {
    return res.render("resetpassword.ejs", { message: "OTP is incorrect", email: email,token:token });
  }
  else{
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await sql`
      UPDATE users SET password_hash = ${hashedPassword} WHERE email = ${email} RETURNING *;
    `;
    res.render("login.ejs", { message: "Password reset successfully, please login" })}
  })


app.get("/link/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let userIP = req.ip;
    
    if (req.headers['x-forwarded-for']) {
      userIP = req.headers['x-forwarded-for'].split(',')[0];
    }
    
    const result = await sql`SELECT redirect_to,user_id FROM links WHERE link_id = ${id}`;
    if (!result || result.length === 0) {
      return res.status(404).send('Link not found');
    }
    let user_id = result[0].user_id;

    const details = await axios.get(`http://ip-api.com/json/${userIP}`);
    await sql`
      INSERT INTO linkclicks (
        status, country, country_code, region, region_name, city, zip, lat, lon, timezone, isp, org, as_full, query, link_id, user_id
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
        ${id},
        ${user_id}
      )
    `;

    res.redirect(result[0].redirect_to);
  } catch (error) {
    console.error('Error processing link:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
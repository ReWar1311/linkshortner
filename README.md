# URL Shortener with Google OAuth & JWT Authentication

This is a URL shortener application built using Express.js, PostgreSQL, JWT authentication, and Google OAuth 2.0. It allows users to shorten links, view click data, and manage their shortened URLs. The app also supports sign-up, login, password reset, and OTP verification features.

## Live Application

You can access the live application here: [linksho.vercel.app](https://linksho.vercel.app)

## Features

- **Google OAuth Login**: Users can log in via Google OAuth.
- **JWT Authentication**: Secure user authentication using JSON Web Tokens (JWT).
- **Link Management**: Users can shorten links, edit, and delete them.
- **Link Click Tracking**: The app tracks the number of clicks on shortened links and logs detailed information about each click (e.g., IP address, location).
- **Signup & OTP Verification**: Users can sign up with their email and username, and verify via OTP.
- **Forgot Password**: Users can reset their password using OTP sent to their email.

## Pacakages/frameworks Used

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for building APIs and handling HTTP requests.
- **PostgreSQL**: Relational database to store user data and shortened links.
- **JWT (JSON Web Tokens)**: Authentication and session management.
- **Google OAuth 2.0**: Google login integration.
- **bcryptjs**: Password hashing and verification.
- **Axios**: For HTTP requests (used for IP geolocation when clicking links).
- **cookie-parser**: Middleware for parsing cookies.
- **ejs**: Embedded JavaScript templating engine for rendering HTML views.

## API Routes

- **POST /login**: Login with username and password.
- **POST /signup**: Signup for a new account.
- **POST /otp**: Verify OTP during signup.
- **POST /forgotpassword**: Request OTP to reset password.
- **POST /resetpassword**: Reset password using OTP.
- **GET /auth/google**: Start Google OAuth login.
- **GET /oauth**: Google OAuth callback.
- **GET /logout**: Log out and clear JWT cookie.
- **GET /link/:id**: Redirect to the shortened URL and track click information.
- **POST /shorten**: Shorten a new link (requires authentication).
- **POST /delete/:id**: Delete a shortened link (requires authentication).
- **GET /update/:id**: Update a shortened link (requires authentication).
- **GET /clicks/:id**: View click data for a specific link (requires authentication).
- **GET /ipadress**: Get the user's IP address.
- **GET /public**: Login as a guest with a token that is publically visible.

File Structure
```bash
Copy
.
├── public/                   # Static files (CSS, images)
│   ├── main.css              # CSS
│   └── images                # Image files
├── views/                    # EJS views (HTML templates)
│   ├── index.ejs             # Home page view
│   ├── login.ejs             # Login page view
│   ├── signup.ejs            # Signup page view
│   ├── otp.ejs               # OTP verification page
│   ├── forgotpassword.ejs    # Forgot password page
│   └── resetpassword.ejs     # Reset password page
├── sendotp.js                # OTP sending utility
├── index.js                  # Main Express server setup
├── .env                      # Environment variables
├── package.json              # Node.js dependencies and scripts
├── vercel.json               # Config for vercel to run express
└── README.md                 # This file
```
## Contributing

Feel free to fork this project, create issues, and submit pull requests. Contributions are always welcome!

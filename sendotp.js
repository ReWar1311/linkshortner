 import nodemailer from 'nodemailer';
 import fs from 'fs';
 import dotenv from 'dotenv';
 dotenv.config();

 
 const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
        user: "no-reply@prashantrewar.me",
        pass: process.env.EMAIL_PASSWORD, // Use App-Specific Password
    },
    tls: {
        rejectUnauthorized: false, // Disables certificate validation
    },
});

 async function sendaMail(params) {
    console.log("Sending email to", params.email);
   await new Promise((resolve, reject) => {
    transporter.sendMail({
        from:'"OTP Verification" <no-reply@prashantrewar.me>',
        to:params.email,
        subject:"Please verify your email",
        html:`
<body style="font-family: Arial, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0;">

    <div style="max-width: 600px; margin: 50px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">

            <h2 style="font-size: 24px; color: #333333;">OTP Verification</h2>
        </div>
        <div style="font-size: 16px; color: #333333;">
            <p>Dear ${params.name},</p>
            <p>Thank you for choosing to verify your identity with us. To complete the process, please use the OTP below:</p>
            <div style="font-size: 24px; font-weight: bold; color: #007bff; margin-top: 20px; text-align: center;">
                <strong>${params.otp}</strong>
            </div>
            <p style="margin-top: 20px;">This OTP is valid for the next 10 minutes.</p>
            <p>If you did not request this verification, please ignore this email.</p>
        </div>
        <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #777777;">
            <p>Thank you for using <strong>prashantrewar.me</strong></p>
            <p>If you have any questions, feel free to <a href="mailto:support@prashantrewar.me" style="color: #007bff; text-decoration: none;">contact us</a>.</p>
        </div>
    </div>

</body>
`},
     (err, info) => {
        if (err) {
            console.error(err);
            reject(err);
        } else {
            console.log(info);
            resolve(info);
        }
    });
});
 }

export default sendaMail;

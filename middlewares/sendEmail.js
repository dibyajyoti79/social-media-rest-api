const nodeMailer = require('nodemailer');


exports.sendEmail = async (options) => {
    try {
        const transporter = nodeMailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            service: process.env.SMTP_SERVICE,
        });
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: options.email,
            subject: options.subject,
            text: options.message
            };
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
            } else {
                console.log(info);
            }
        }
        );
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
// }
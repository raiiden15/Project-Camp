import mail_gen from "mailgen";
import nodemailer from "nodemailer";

// send email
const sendMail = async (options) => {
    const mail_generator = new mail_gen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanagerlink.com",
        },
    });

    const email_textual = mail_generator.generatePlaintext(options.mail_gen_content);
    const email_html = mail_generator.generate(options.mail_gen_content);

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_TRAP_SMPT_HOST,
        port: process.env.MAIL_TRAP_SMPT_PORT,
        auth: {
            user: process.env.MAIL_TRAP_SMPT_USER,
            pass: process.env.MAIL_TRAP_SMPT_PASS,
        },
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: email_textual,
        html: email_html,
    };

    try {
        await transporter.sendMail(mail);
    } catch (err) {
        console.error(
            "Email Service Failed, make sure you have provided your mailtrap credentials in .env file",
        );
        console.error(err);
    }
};

// generate mail
const email_verification_mail_gen_content = (username, verification_url) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our app, we are excited to have you onboard!",
            action: {
                instructions:
                    "To verify your email, please click on the following button",
                button: {
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verification_url,
                },
            },
            outro: "Need help, or have questions, just reply to this email. We would love to help you out!",
        },
    };
};

const forgot_password_mail_gen_content = (username, pass_reset_url) => {
    return {
        body: {
            name: username,
            intro: "We got a request to reset password for your account",
            action: {
                instructions:
                    "To change your email, please click on the following button",
                button: {
                    color: "#22BC66",
                    text: "Reset password",
                    link: pass_reset_url,
                },
            },
            outro: "Need help, or have questions, just reply to this email. We would love to help you out!",
        },
    };
};

export {
    email_verification_mail_gen_content,
    forgot_password_mail_gen_content,
    sendMail,
};

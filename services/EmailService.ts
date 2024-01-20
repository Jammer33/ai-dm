import AWS from "aws-sdk";

class EmailService {
    private sesClient: AWS.SES;

    constructor() {
        this.sesClient = new AWS.SES();
    }

    public async sendPasswordResetEmail(email: string, token: string) {
        const subject = "WizardGM Password Reset";
        const html = `<p>Click <a href="http://localhost:3000/reset-password?resetToken=${token}">here</a> to reset your password.</p>`;

        console.log("Sending email to " + email);
        console.log("Subject: " + subject);
        console.log("Body: " + html);

        await this.sendEmail(email, subject, html);
    }

    private sendEmail = async (email: string, subject: string, html: string) => {
        const params = {
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Body: {
                    Html: {
                        Data: html,
                    },
                },
                Subject: {
                    Data: subject,
                },
            },
            Source: "support@wizardgm.ai",
        };

        this.sesClient.sendEmail(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
            }
        }
        );
    }
}

export default new EmailService();
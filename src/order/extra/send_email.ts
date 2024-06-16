import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, html: string) {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground",
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'noreply.service.restock@gmail.com',
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token, 
      },
    });

    try {
        const info = await transporter.sendMail({
          from: '"RESTOCK" <noreply.service.restock@gmail.com>',
          to: to,
          subject: subject,
          html: html,
        });
    
        console.log('Correo electrónico enviado correctamente:', info.response);
      } 
    catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
    };
  }
}

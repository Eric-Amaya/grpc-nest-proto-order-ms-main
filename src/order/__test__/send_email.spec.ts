import { EmailService } from '../extra/send_email';
import { google } from 'googleapis';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

jest.mock('nodemailer');
jest.mock('googleapis', () => {
  const mAuth = {
    OAuth2: jest.fn().mockImplementation(() => ({
      setCredentials: jest.fn(),
      getAccessToken: jest
        .fn()
        .mockResolvedValue({ token: 'test-access-token' }),
    })),
  };
  return { google: { auth: mAuth } };
});

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  it('should send an email successfully', async () => {
    const sendMailMock = jest
      .fn()
      .mockResolvedValue({ response: 'Email sent' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const result = await emailService.sendEmail(
      'test@example.com',
      'Test Subject',
      '<h1>Test</h1>',
    );

    expect(sendMailMock).toHaveBeenCalledWith({
      from: '"RESTOCK" <noreply.service.restock@gmail.com>',
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<h1>Test</h1>',
    });

    expect(result).toBeUndefined(); // Since the method does not return anything
  });

  it('should log an error if sending email fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const sendMailMock = jest
      .fn()
      .mockRejectedValue(new Error('Failed to send email'));
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    await emailService.sendEmail(
      'test@example.com',
      'Test Subject',
      '<h1>Test</h1>',
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error al enviar el correo electrónico:',
      new Error('Failed to send email'),
    );

    consoleErrorSpy.mockRestore();
  });
});

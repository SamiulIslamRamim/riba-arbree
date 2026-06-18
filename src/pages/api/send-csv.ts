// pages/api/send-csv.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { csv, filename } = req.body;

  if (!csv || !filename) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),   // ← cast to number
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,           // ← needed for Gmail STARTTLS
      },
    } as SMTPTransport.Options);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,          // ← was FROM_EMAIL (wrong key)
      to: 'samiramipuchut409@gmail.com',
      subject: 'New User Interaction',
      html: `
        <h2>🔔 New User Interaction Alert</h2>
        <p>A new user has completed the RibaWarrior Score test.</p>
        <p>Their response data is attached as <strong>${filename}</strong>.</p>
      `,
      text: `New user interaction.\n\nResponse file: ${filename}`,
      attachments: [
        {
          filename,
          content: csv,
          contentType: 'text/csv',
        },
      ],
    });

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ message: 'Failed to send email' });
  }
}
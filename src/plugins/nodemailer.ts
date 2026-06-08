import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const nodemailerPlugin: Plugin = {
  name: 'nodemailer',
  dependencies: {
    'nodemailer': '^6.9.13'
  },
  devDependencies: {
    '@types/nodemailer': '^6.4.14'
  },
  execute: async (context: PluginContext) => {
    const { targetDir } = context;

    const envPath = path.join(targetDir, '.env');
    if (await fs.pathExists(envPath)) {
      let envContent = await fs.readFile(envPath, 'utf-8');
      envContent += `\n# Email Config\nSMTP_HOST=smtp.mailtrap.io\nSMTP_PORT=2525\nSMTP_USER=your_user\nSMTP_PASS=your_pass\nEMAIL_FROM=noreply@example.com\n`;
      await fs.writeFile(envPath, envContent);
    }

    const utilsDir = path.join(targetDir, 'src', 'utils');
    await fs.ensureDir(utilsDir);

    await fs.writeFile(path.join(utilsDir, 'email.ts'), `import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  return await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};
`);
  }
};

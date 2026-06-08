import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const oauthPlugin: Plugin = {
  name: 'oauth',
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    const envPath = path.join(targetDir, '.env');
    if (await fs.pathExists(envPath)) {
      let envContent = await fs.readFile(envPath, 'utf-8');
      if (!envContent.includes('GOOGLE_CLIENT_ID')) {
        envContent += `\n# Google OAuth Config\nGOOGLE_CLIENT_ID=your_google_client_id\nGOOGLE_CLIENT_SECRET=your_google_client_secret\nGOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback\n`;
        await fs.writeFile(envPath, envContent);
      }
    }

    if (config.framework === 'express') {
      oauthPlugin.dependencies = {
        'passport': '^0.7.0',
        'passport-google-oauth20': '^2.0.0',
        'express-session': '^1.18.0' // passport requires session usually
      };
      oauthPlugin.devDependencies = {
        '@types/passport': '^1.0.16',
        '@types/passport-google-oauth20': '^2.0.14',
        '@types/express-session': '^1.18.0'
      };

      const configDir = path.join(targetDir, 'src', 'config');
      await fs.ensureDir(configDir);
      
      await fs.writeFile(path.join(configDir, 'passport.ts'), `import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // Typically you would find or create a user in your database here
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
`);

      const appTsPath = path.join(targetDir, 'src', 'app.ts');
      if (await fs.pathExists(appTsPath)) {
        let content = await fs.readFile(appTsPath, 'utf-8');
        content = content.replace('// PLUGINS_IMPORT', `// PLUGINS_IMPORT\nimport passport from './config/passport';\nimport session from 'express-session';`);
        
        const setupString = `app.use(session({ secret: 'super-secret', resave: false, saveUninitialized: false }));\napp.use(passport.initialize());\napp.use(passport.session());\n`;
        content = content.replace('app.use(express.json());', `app.use(express.json());\n${setupString}`);
        await fs.writeFile(appTsPath, content);
      }

    } else if (config.framework === 'fastify') {
      oauthPlugin.dependencies = {
        '@fastify/oauth2': '^7.9.0'
      };

      const appTsPath = path.join(targetDir, 'src', 'app.ts');
      if (await fs.pathExists(appTsPath)) {
        let content = await fs.readFile(appTsPath, 'utf-8');
        content = content.replace('// PLUGINS_IMPORT', `// PLUGINS_IMPORT\nimport fastifyOauth2 from '@fastify/oauth2';`);
        
        const setupString = `app.register(fastifyOauth2, {
  name: 'googleOAuth2',
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID || '',
      secret: process.env.GOOGLE_CLIENT_SECRET || ''
    },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION
  },
  startRedirectPath: '/api/auth/google',
  callbackUri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
});\n`;
        
        content = content.replace('// PLUGINS_INIT', `// PLUGINS_INIT\n${setupString}`);
        await fs.writeFile(appTsPath, content);
      }
    }
  }
};

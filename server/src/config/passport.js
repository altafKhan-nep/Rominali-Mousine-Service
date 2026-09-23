import dotenv from 'dotenv';
import passport from 'passport';
import crypto from 'crypto';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

// Load .env early — strategies read config at module load, before index.js runs.
dotenv.config();

// Stateless auth: every strategy runs with session:false. No session store, no
// sticky sessions — any instance can serve any request (horizontal scaling).

// Email-OR-phone + password. The client sends { identifier, password }.
passport.use(
  new LocalStrategy(
    { usernameField: 'identifier', passwordField: 'password', session: false },
    async (identifier, password, done) => {
      try {
        const user = await User.findByLogin(identifier);
        if (!user || !(await user.matchPassword(password))) {
          return done(null, false, { message: 'Invalid email/phone or password' });
        }
        if (user.isSuspended) {
          return done(null, false, { message: 'Account suspended' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Bearer access-token for API authorization. Rejects when tokenVersion changed
// (password reset / global logout) so old JWTs die immediately.
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id);
        if (!user || user.tokenVersion !== payload.v) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Find-or-create the user behind a verified OAuth profile, linking it when a
// local account with the same email already exists.
const upsertSocialUser = async ({ email, name, provider, emailVerified }, done) => {
  try {
    const normalized = (email || '').toLowerCase();
    if (!normalized) return done(null, false, { message: 'Provider returned no email' });

    let user = await User.findOne({ email: normalized });
    if (!user) {
      user = await User.create({
        name,
        email: normalized,
        phone: '',
        password: crypto.randomBytes(24).toString('hex'), // never used for social accounts
        emailVerified,
        authProvider: provider,
      });
    } else if (user.authProvider === 'local') {
      user.authProvider = provider;
      user.emailVerified = user.emailVerified || emailVerified;
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

const socialEmail = (profile) =>
  profile.emails && profile.emails[0] ? profile.emails[0].value : '';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          `${process.env.APP_URL || `http://localhost:${process.env.PORT || 5001}`}/api/auth/google/callback`,
      },
      (_accessToken, _refreshToken, profile, done) =>
        upsertSocialUser(
          {
            email: socialEmail(profile),
            name: profile.displayName || socialEmail(profile)?.split('@')[0] || 'Google User',
            provider: 'google',
            emailVerified: true,
          },
          done
        )
    )
  );
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL:
          process.env.FACEBOOK_CALLBACK_URL ||
          `${process.env.APP_URL || `http://localhost:${process.env.PORT || 5001}`}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails'],
      },
      (_accessToken, _refreshToken, profile, done) =>
        upsertSocialUser(
          {
            email: socialEmail(profile),
            name: profile.displayName || 'Facebook User',
            provider: 'facebook',
            emailVerified: Boolean(profile.emails && profile.emails[0]),
          },
          done
        )
    )
  );
}

export default passport;
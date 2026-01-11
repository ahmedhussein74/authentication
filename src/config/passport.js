const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const AppleStrategy = require("passport-apple");
const authService = require("../modules/auth/auth.service");

const socialCallback = async (at, rt, profile, done) => {
  try {
    const userProfile = {
      id: profile.id,
      email: profile.emails[0].value,
      firstName: profile.name?.givenName || profile.username,
      lastName: profile.name?.familyName || "",
      avatar: profile.photos?.[0]?.value || "",
    };
    const result = await authService.socialLogin(userProfile, profile.provider);
    return done(null, result);
  } catch (err) {
    return done(err, null);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    socialCallback
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
    },
    socialCallback
  )
);

module.exports = passport;

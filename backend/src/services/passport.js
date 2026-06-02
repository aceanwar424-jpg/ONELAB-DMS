const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function(passport, pool) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE google_id = $1', [profile.id]
      );
      if (rows.length > 0) {
        return done(null, rows[0]);
      }
      // Count existing users - first user becomes admin
      const countResult = await pool.query('SELECT COUNT(*) FROM users');
      const isFirst = parseInt(countResult.rows[0].count) === 0;
      const { rows: newUser } = await pool.query(
        `INSERT INTO users (google_id, email, name, avatar, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          profile.id,
          profile.emails[0].value,
          profile.displayName,
          profile.photos?.[0]?.value,
          isFirst ? 'admin' : 'viewer'
        ]
      );
      return done(null, newUser[0]);
    } catch (err) {
      return done(err, null);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, rows[0] || null);
    } catch (err) {
      done(err, null);
    }
  });
};

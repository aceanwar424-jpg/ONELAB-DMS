module.exports = async function initDB(pool) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
      );
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR UNIQUE NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        name VARCHAR NOT NULL,
        avatar VARCHAR,
        role VARCHAR DEFAULT 'viewer' CHECK (role IN ('admin', 'approver', 'editor', 'viewer')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sop_documents (
        id SERIAL PRIMARY KEY,
        nomor_sop VARCHAR NOT NULL,
        judul_sop VARCHAR NOT NULL,
        departemen VARCHAR,
        link_google_doc VARCHAR,
        status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
        version INTEGER DEFAULT 1,
        content TEXT,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        published_at TIMESTAMP,
        pdf_path VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sop_history (
        id SERIAL PRIMARY KEY,
        sop_id INTEGER REFERENCES sop_documents(id) ON DELETE CASCADE,
        action VARCHAR NOT NULL,
        old_status VARCHAR,
        new_status VARCHAR,
        notes TEXT,
        performed_by INTEGER REFERENCES users(id),
        performed_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sop_comments (
        id SERIAL PRIMARY KEY,
        sop_id INTEGER REFERENCES sop_documents(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('DB init error:', err.message);
  } finally {
    client.release();
  }
};

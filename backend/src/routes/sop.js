const express = require('express');
const { isAuthenticated, hasRole } = require('../middleware/auth');

module.exports = function(pool) {
  const router = express.Router();

  // GET all SOPs with filters
  router.get('/', isAuthenticated, async (req, res) => {
    try {
      const { search, status, departemen, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      let where = [];
      let params = [];
      let idx = 1;

      if (search) {
        where.push(`(s.nomor_sop ILIKE $${idx} OR s.judul_sop ILIKE $${idx})`);
        params.push(`%${search}%`); idx++;
      }
      if (status) { where.push(`s.status = $${idx}`); params.push(status); idx++; }
      if (departemen) { where.push(`s.departemen = $${idx}`); params.push(departemen); idx++; }

      // Viewers only see published, others see all
      if (req.user.role === 'viewer') {
        where.push(`s.status = 'published'`);
      }

      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const query = `
        SELECT s.*, 
          u1.name as created_by_name, 
          u2.name as approved_by_name,
          u3.name as updated_by_name
        FROM sop_documents s
        LEFT JOIN users u1 ON s.created_by = u1.id
        LEFT JOIN users u2 ON s.approved_by = u2.id
        LEFT JOIN users u3 ON s.updated_by = u3.id
        ${whereClause}
        ORDER BY s.updated_at DESC
        LIMIT $${idx} OFFSET $${idx+1}
      `;
      params.push(limit, offset);

      const countQuery = `SELECT COUNT(*) FROM sop_documents s ${whereClause}`;
      const [data, count] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params.slice(0, -2))
      ]);

      res.json({ data: data.rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET single SOP
  router.get('/:id', isAuthenticated, async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT s.*, 
          u1.name as created_by_name, u1.avatar as created_by_avatar,
          u2.name as approved_by_name,
          u3.name as updated_by_name
        FROM sop_documents s
        LEFT JOIN users u1 ON s.created_by = u1.id
        LEFT JOIN users u2 ON s.approved_by = u2.id
        LEFT JOIN users u3 ON s.updated_by = u3.id
        WHERE s.id = $1
      `, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });

      // Viewer can only see published
      if (req.user.role === 'viewer' && rows[0].status !== 'published') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Get history & comments
      const [history, comments] = await Promise.all([
        pool.query(`SELECT h.*, u.name, u.avatar FROM sop_history h LEFT JOIN users u ON h.performed_by = u.id WHERE h.sop_id = $1 ORDER BY h.performed_at DESC`, [req.params.id]),
        pool.query(`SELECT c.*, u.name, u.avatar FROM sop_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.sop_id = $1 ORDER BY c.created_at ASC`, [req.params.id])
      ]);

      res.json({ ...rows[0], history: history.rows, comments: comments.rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // CREATE SOP (admin/editor)
  router.post('/', hasRole('admin', 'editor'), async (req, res) => {
    try {
      const { nomor_sop, judul_sop, departemen, link_google_doc, content } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO sop_documents (nomor_sop, judul_sop, departemen, link_google_doc, content, created_by, updated_by, status)
         VALUES ($1,$2,$3,$4,$5,$6,$6,'draft') RETURNING *`,
        [nomor_sop, judul_sop, departemen, link_google_doc, content, req.user.id]
      );
      await pool.query(
        `INSERT INTO sop_history (sop_id, action, new_status, performed_by) VALUES ($1,'created','draft',$2)`,
        [rows[0].id, req.user.id]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // UPDATE SOP content (admin/editor, only draft/review)
  router.put('/:id', hasRole('admin', 'editor'), async (req, res) => {
    try {
      const { nomor_sop, judul_sop, departemen, link_google_doc, content } = req.body;
      const existing = await pool.query('SELECT * FROM sop_documents WHERE id=$1', [req.params.id]);
      if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });
      if (!['draft', 'review'].includes(existing.rows[0].status) && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Cannot edit approved/published document' });
      }
      const { rows } = await pool.query(
        `UPDATE sop_documents SET nomor_sop=$1, judul_sop=$2, departemen=$3, link_google_doc=$4, content=$5, updated_by=$6, updated_at=NOW()
         WHERE id=$7 RETURNING *`,
        [nomor_sop, judul_sop, departemen, link_google_doc, content, req.user.id, req.params.id]
      );
      await pool.query(
        `INSERT INTO sop_history (sop_id, action, notes, performed_by) VALUES ($1,'edited',$2,$3)`,
        [req.params.id, 'Document updated', req.user.id]
      );
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // WORKFLOW: change status
  router.post('/:id/transition', hasRole('admin', 'approver', 'editor'), async (req, res) => {
    try {
      const { action, notes } = req.body; // submit_review | approve | reject | publish | unpublish
      const existing = await pool.query('SELECT * FROM sop_documents WHERE id=$1', [req.params.id]);
      if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });
      const sop = existing.rows[0];

      const transitions = {
        submit_review: { from: 'draft', to: 'review', roles: ['admin', 'editor'] },
        approve:       { from: 'review', to: 'approved', roles: ['admin', 'approver'] },
        reject:        { from: 'review', to: 'draft', roles: ['admin', 'approver'] },
        publish:       { from: 'approved', to: 'published', roles: ['admin', 'approver'] },
        unpublish:     { from: 'published', to: 'draft', roles: ['admin'] },
      };

      const t = transitions[action];
      if (!t) return res.status(400).json({ error: 'Invalid action' });
      if (sop.status !== t.from) return res.status(400).json({ error: `Cannot ${action} from status: ${sop.status}` });
      if (!t.roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

      let extraFields = {};
      if (action === 'approve') {
        extraFields = { approved_by: req.user.id, approved_at: new Date() };
      } else if (action === 'publish') {
        extraFields = { published_at: new Date(), version: sop.version + 1 };
      }

      const setClause = ['status = $1', 'updated_at = NOW()', 'updated_by = $2'];
      const values = [t.to, req.user.id];
      let idx = 3;
      for (const [k, v] of Object.entries(extraFields)) {
        setClause.push(`${k} = $${idx}`); values.push(v); idx++;
      }
      values.push(req.params.id);

      const { rows } = await pool.query(
        `UPDATE sop_documents SET ${setClause.join(',')} WHERE id = $${idx} RETURNING *`,
        values
      );

      await pool.query(
        `INSERT INTO sop_history (sop_id, action, old_status, new_status, notes, performed_by) VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.id, action, t.from, t.to, notes || null, req.user.id]
      );

      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADD COMMENT
  router.post('/:id/comments', isAuthenticated, async (req, res) => {
    try {
      const { comment } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO sop_comments (sop_id, user_id, comment) VALUES ($1,$2,$3) RETURNING *, (SELECT name FROM users WHERE id=$2) as name, (SELECT avatar FROM users WHERE id=$2) as avatar`,
        [req.params.id, req.user.id, comment]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET departments list
  router.get('/meta/departments', isAuthenticated, async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT DISTINCT departemen FROM sop_documents WHERE departemen IS NOT NULL ORDER BY departemen`);
      res.json(rows.map(r => r.departemen));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // BULK IMPORT from JSON (admin only)
  router.post('/import/bulk', hasRole('admin'), async (req, res) => {
    try {
      const { documents } = req.body;
      let imported = 0;
      for (const doc of documents) {
        await pool.query(
          `INSERT INTO sop_documents (nomor_sop, judul_sop, departemen, link_google_doc, status, created_by, updated_by)
           VALUES ($1,$2,$3,$4,'published',$5,$5)
           ON CONFLICT DO NOTHING`,
          [doc.nomor_sop, doc.judul_sop, doc.departemen || null, doc.link_google_doc || null, req.user.id]
        );
        imported++;
      }
      res.json({ imported });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

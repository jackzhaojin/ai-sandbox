const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await req.supabase
    .from('ts_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await req.supabase
    .from('ts_users')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

module.exports = router;

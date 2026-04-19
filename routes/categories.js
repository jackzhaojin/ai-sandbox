const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { user_id } = req.query;
  let query = req.supabase.from('ts_categories').select('*').order('created_at', { ascending: false });
  if (user_id) query = query.eq('user_id', user_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { user_id, name, color } = req.body;
  if (!user_id || !name) {
    return res.status(400).json({ error: 'user_id and name are required' });
  }

  const { data, error } = await req.supabase
    .from('ts_categories')
    .insert([{ user_id, name, color: color || '#3B82F6' }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await req.supabase
    .from('ts_categories')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Category not found' });
  res.json(data);
});

router.put('/:id', async (req, res) => {
  const { name, color } = req.body;
  const { data, error } = await req.supabase
    .from('ts_categories')
    .update({ name, color })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Category not found' });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await req.supabase
    .from('ts_categories')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { task_id, is_active } = req.query;
  let query = req.supabase.from('ts_task_schedules').select('*').order('created_at', { ascending: false });

  if (task_id) query = query.eq('task_id', task_id);
  if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { task_id, recurrence_rule, next_run_at, end_date, is_active } = req.body;
  if (!task_id || !recurrence_rule || !next_run_at) {
    return res.status(400).json({ error: 'task_id, recurrence_rule, and next_run_at are required' });
  }

  const { data, error } = await req.supabase
    .from('ts_task_schedules')
    .insert([{
      task_id,
      recurrence_rule,
      next_run_at,
      end_date,
      is_active: is_active !== undefined ? is_active : true
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await req.supabase
    .from('ts_task_schedules')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Schedule not found' });
  res.json(data);
});

router.put('/:id', async (req, res) => {
  const update = {};
  const allowed = ['recurrence_rule', 'next_run_at', 'end_date', 'is_active'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const { data, error } = await req.supabase
    .from('ts_task_schedules')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Schedule not found' });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await req.supabase
    .from('ts_task_schedules')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;

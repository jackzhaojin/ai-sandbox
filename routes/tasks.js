const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const { user_id, status, priority } = req.query;
  let query = req.supabase.from('ts_tasks').select('*').order('created_at', { ascending: false });

  if (user_id) query = query.eq('user_id', user_id);
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { user_id, title, description, status, priority, due_date, estimated_minutes } = req.body;
  if (!user_id || !title) {
    return res.status(400).json({ error: 'user_id and title are required' });
  }

  const { data, error } = await req.supabase
    .from('ts_tasks')
    .insert([{
      user_id,
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      due_date,
      estimated_minutes
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await req.supabase
    .from('ts_tasks')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Task not found' });
  res.json(data);
});

router.put('/:id', async (req, res) => {
  const update = {};
  const allowed = ['title', 'description', 'status', 'priority', 'due_date', 'started_at', 'completed_at', 'estimated_minutes', 'actual_minutes'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const { data, error } = await req.supabase
    .from('ts_tasks')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Task not found' });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await req.supabase
    .from('ts_tasks')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// Task dependencies nested routes
router.get('/:id/dependencies', async (req, res) => {
  const { data, error } = await req.supabase
    .from('ts_task_dependencies')
    .select('*')
    .eq('task_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/dependencies', async (req, res) => {
  const { depends_on_task_id, dependency_type } = req.body;
  if (!depends_on_task_id) {
    return res.status(400).json({ error: 'depends_on_task_id is required' });
  }

  const { data, error } = await req.supabase
    .from('ts_task_dependencies')
    .insert([{
      task_id: req.params.id,
      depends_on_task_id,
      dependency_type: dependency_type || 'blocks'
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/:id/dependencies/:depId', async (req, res) => {
  const { error } = await req.supabase
    .from('ts_task_dependencies')
    .delete()
    .eq('id', req.params.depId);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// Task logs nested route
router.get('/:id/logs', async (req, res) => {
  const { data, error } = await req.supabase
    .from('ts_task_logs')
    .select('*')
    .eq('task_id', req.params.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;

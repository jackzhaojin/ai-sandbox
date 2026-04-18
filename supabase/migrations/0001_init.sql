DROP SCHEMA IF EXISTS expense_tracker_v1 CASCADE;

CREATE SCHEMA expense_tracker_v1;

CREATE TABLE expense_tracker_v1.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL
);

CREATE TABLE expense_tracker_v1.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_cents integer NOT NULL,
  category_id uuid REFERENCES expense_tracker_v1.categories(id),
  occurred_on date NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

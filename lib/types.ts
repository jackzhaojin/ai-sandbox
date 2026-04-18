export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Expense = {
  id: string;
  amount_cents: number;
  category_id: string;
  occurred_on: string;
  note: string | null;
  created_at: string;
};

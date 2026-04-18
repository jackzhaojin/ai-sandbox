export type Category = {
  id: number;
  name: string;
  color: string;
};

export type Expense = {
  id: number;
  amount_cents: number;
  category_id: number;
  occurred_on: string;
  note: string | null;
  created_at: string;
};

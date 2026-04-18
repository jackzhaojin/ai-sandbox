'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { fetchCategories, createExpense } from '../actions';
import type { Category } from '@/lib/types';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export default function NewExpensePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [occurredOn, setOccurredOn] = useState(getTodayString);
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, formAction] = useActionState(createExpense, null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : 'Failed to load categories'
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  const validate = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};

    const amountNum = Number(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      nextErrors.amount = 'Amount must be greater than 0';
    }

    if (!categoryId) {
      nextErrors.category = 'Please select a category';
    }

    if (!occurredOn) {
      nextErrors.occurredOn = 'Date is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [amount, categoryId, occurredOn]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const amountNum = Number(amount);
    const amountCents = Math.round(amountNum * 100);

    const formData = new FormData(e.currentTarget);
    formData.set('amount_cents', String(amountCents));

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="min-h-full bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Add Expense
          </h1>
          <Link
            href="/expenses"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Cancel
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          {fetchError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {fetchError}
            </div>
          )}

          {state?.message && (
            <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              {state.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="amount"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Amount
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="category_id"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100"
              >
                <option value="">
                  {loadingCategories ? 'Loading...' : 'Select a category'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="occurred_on"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Date
              </label>
              <input
                id="occurred_on"
                name="occurred_on"
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              {errors.occurredOn && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.occurredOn}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="note"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Note <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Saving...' : 'Save Expense'}
              </button>
              <Link
                href="/expenses"
                className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

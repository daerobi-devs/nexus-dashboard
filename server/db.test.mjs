import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  initDb,
  getDashboardState,
  createTransaction,
  deleteTransaction,
  createTask,
  updateTaskStatus,
  updateSetting,
} from './db.mjs';

test('SQLite engine initializes schema, seeds realistic Indonesian data, and maintains atomic wallet balances', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-test-'));
  const dbPath = path.join(tempDir, 'nexus-test.db');
  const db = initDb(dbPath);

  const initial = getDashboardState(db);
  assert.equal(initial.wallets.length, 3, 'Should seed 3 operational wallets');
  assert.ok(initial.tasks.length >= 6, 'Should seed UNPAM & client tasks');
  assert.ok(initial.maintenance.length >= 4, 'Should seed maintenance items');

  const bcaBefore = initial.wallets.find((w) => w.id === 'wallet-bca').balance;

  // Test invalid transaction rejection
  assert.throws(
    () =>
      createTransaction(db, {
        title: 'Invalid Entry',
        category: 'Proyek Klien',
        type: 'income',
        amount: -5000,
        wallet_id: 'wallet-bca',
      }),
    /Nominal transaksi harus lebih besar dari Rp 0/
  );

  // Test income increments wallet balance
  const tx = createTransaction(db, {
    title: 'Termin 2 Sistem ERP Klinik Sentosa',
    category: 'Proyek Klien',
    type: 'income',
    amount: 2500000,
    wallet_id: 'wallet-bca',
    status: 'Completed',
  });
  assert.ok(tx.id);

  const afterIncome = getDashboardState(db);
  const bcaAfterIncome = afterIncome.wallets.find((w) => w.id === 'wallet-bca').balance;
  assert.equal(bcaAfterIncome, bcaBefore + 2500000);

  // Test deleting transaction reverts wallet balance
  deleteTransaction(db, tx.id);
  const afterDelete = getDashboardState(db);
  const bcaAfterDelete = afterDelete.wallets.find((w) => w.id === 'wallet-bca').balance;
  assert.equal(bcaAfterDelete, bcaBefore);

  // Test task creation and status transition
  const newTask = createTask(db, {
    title: 'Susun Bab 3 Metodologi Penelitian',
    scope: 'kuliah',
    subject_or_client: 'Metodologi Penelitian - UNPAM',
    priority: 'high',
    due_date: '2026-11-20',
    budget_or_weight: '3 SKS',
    notes: 'Revisi diagram alir penelitian',
  });
  const updatedTask = updateTaskStatus(db, newTask.id, 'in_progress');
  assert.equal(updatedTask.status, 'in_progress');

  // Test setting update
  updateSetting(db, 'monthly_spending_limit', '7500000');
  const afterSetting = getDashboardState(db);
  assert.equal(afterSetting.settings.monthly_spending_limit, '7500000');

  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

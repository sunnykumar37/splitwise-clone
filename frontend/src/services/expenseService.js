import apiClient from "../api/axios";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export async function fetchGroupExpenses(groupId) {
  const response = await apiClient.get(`/api/groups/${groupId}/expenses/`);
  return unwrap(response) || [];
}

export async function createExpense(groupId, payload) {
  const response = await apiClient.post(`/api/groups/${groupId}/expenses/`, payload);
  return unwrap(response);
}

export async function fetchExpenseById(expenseId) {
  const response = await apiClient.get(`/api/expenses/${expenseId}/`);
  return unwrap(response);
}

export async function deleteExpenseById(expenseId) {
  const response = await apiClient.delete(`/api/expenses/${expenseId}/`);
  return unwrap(response);
}

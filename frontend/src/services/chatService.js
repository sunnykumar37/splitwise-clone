import apiClient from "../api/axios";

function unwrap(response) {
  return response?.data ?? null;
}

export async function fetchExpenseMessages(expenseId) {
  const response = await apiClient.get(`/api/expenses/${expenseId}/messages/`);
  return unwrap(response)?.messages ?? [];
}

import apiClient from "../api/axios";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export async function fetchGroupSettlements(groupId) {
  const response = await apiClient.get(`/api/groups/${groupId}/settlements/`);
  return unwrap(response) || [];
}

export async function createSettlement(groupId, payload) {
  const response = await apiClient.post(`/api/groups/${groupId}/settlements/`, payload);
  return unwrap(response);
}

export async function fetchSettlementById(settlementId) {
  const response = await apiClient.get(`/api/settlements/${settlementId}/`);
  return unwrap(response);
}

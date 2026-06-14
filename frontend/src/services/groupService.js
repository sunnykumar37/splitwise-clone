import apiClient from "../api/axios";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export async function fetchDashboardSummary() {
  const response = await apiClient.get("/api/dashboard/summary/");
  return unwrap(response);
}

export async function fetchGroups() {
  const response = await apiClient.get("/api/groups/");
  return unwrap(response) || [];
}

export async function createGroup(payload) {
  const response = await apiClient.post("/api/groups/", payload);
  return unwrap(response);
}

export async function fetchGroupById(groupId) {
  const response = await apiClient.get(`/api/groups/${groupId}/`);
  return unwrap(response);
}

export async function fetchGroupBalances(groupId) {
  const response = await apiClient.get(`/api/groups/${groupId}/balances/`);
  return unwrap(response);
}

export async function addGroupMember(groupId, payload) {
  const response = await apiClient.post(`/api/groups/${groupId}/add-member/`, payload);
  return unwrap(response);
}

export async function removeGroupMember(groupId, payload) {
  const response = await apiClient.post(`/api/groups/${groupId}/remove-member/`, payload);
  return unwrap(response);
}

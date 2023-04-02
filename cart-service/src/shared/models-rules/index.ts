import { AppRequest } from '../models';

const USER_ID_TO_UUID_MAP = {
    'Shagon1k': 'ab097b18-cfdc-45ad-855d-2088f1618eec',
    'Shagon2k': '2e432e75-cdfc-4fdb-9169-853ef74a5618',
    'Shagon3k': '1766cf74-a0c9-4383-bb6a-cac628ab140b',
}

/**
 * @param {AppRequest} request
 * @returns {string}
 */
export function getUserIdFromRequest(request: AppRequest): string {
  const userId = request.user && request.user.id;

  return USER_ID_TO_UUID_MAP[userId];
}

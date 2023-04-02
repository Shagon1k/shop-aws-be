import { AppRequest } from '../models';


/**
 * @param {AppRequest} request
 * @returns {string}
 */
export function getUserIdFromRequest(request: AppRequest): string {
  const userId = request.user && request.user.id;

  return userId
}

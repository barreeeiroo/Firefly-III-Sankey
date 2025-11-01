/**
 * About API endpoints
 */

import { BaseFireflyClient } from './base-client';
import { FireflyAboutResponse, FireflyUserResponse } from '../models';

export class AboutClient extends BaseFireflyClient {
  /**
   * Get system information
   */
  async getAbout(): Promise<FireflyAboutResponse> {
    return this.get<FireflyAboutResponse>('/v1/about');
  }

  /**
   * Get authenticated user information
   */
  async getAboutUser(): Promise<FireflyUserResponse> {
    return this.get<FireflyUserResponse>('/v1/about/user');
  }
}

/**
 * TypeScript interfaces for Firefly III About API responses
 */

export interface FireflyAboutResponse {
  data: {
    version: string;
    api_version: string;
    os: string;
    php_version: string;
  };
}

export interface FireflyUserResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      created_at: string;
      updated_at: string;
      email: string;
      blocked: boolean;
      blocked_code?: string;
      role?: string;
    };
  };
}

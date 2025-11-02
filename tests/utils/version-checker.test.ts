import {
  compareVersions,
  isApiVersionSupported,
  getVersionErrorMessage,
  SUPPORTED_API_VERSION,
} from '../../src/utils/version-checker';

describe('version-checker', () => {
  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('6.3.0', '6.3.0')).toBe(0);
      expect(compareVersions('10.20.30', '10.20.30')).toBe(0);
    });

    it('should return -1 when v1 < v2', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('6.2.0', '6.3.0')).toBe(-1);
    });

    it('should return 1 when v1 > v2', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('6.3.0', '6.2.0')).toBe(1);
    });

    it('should handle versions with different lengths', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.1', '1.0')).toBe(1);
      expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    });

    it('should handle multi-digit version numbers', () => {
      expect(compareVersions('10.0.0', '9.0.0')).toBe(1);
      expect(compareVersions('1.20.0', '1.3.0')).toBe(1);
      expect(compareVersions('1.2.100', '1.2.99')).toBe(1);
    });

    it('should compare major version differences correctly', () => {
      expect(compareVersions('7.0.0', '6.9.9')).toBe(1);
      expect(compareVersions('5.9.9', '6.0.0')).toBe(-1);
    });

    it('should compare minor version differences correctly', () => {
      expect(compareVersions('6.4.0', '6.3.9')).toBe(1);
      expect(compareVersions('6.2.9', '6.3.0')).toBe(-1);
    });

    it('should compare patch version differences correctly', () => {
      expect(compareVersions('6.3.1', '6.3.0')).toBe(1);
      expect(compareVersions('6.3.0', '6.3.1')).toBe(-1);
    });
  });

  describe('isApiVersionSupported', () => {
    it('should return true for minimum supported version', () => {
      expect(isApiVersionSupported('6.3.0')).toBe(true);
    });

    it('should return true for versions within the supported range', () => {
      expect(isApiVersionSupported('6.3.1')).toBe(true);
      expect(isApiVersionSupported('6.4.0')).toBe(true);
      expect(isApiVersionSupported('6.5.0')).toBe(true);
      expect(isApiVersionSupported('6.9.9')).toBe(true);
    });

    it('should return false for versions below minimum', () => {
      expect(isApiVersionSupported('6.2.9')).toBe(false);
      expect(isApiVersionSupported('6.2.0')).toBe(false);
      expect(isApiVersionSupported('6.0.0')).toBe(false);
      expect(isApiVersionSupported('5.9.9')).toBe(false);
    });

    it('should return false for maximum version (exclusive)', () => {
      expect(isApiVersionSupported('7.0.0')).toBe(false);
    });

    it('should return false for versions above maximum', () => {
      expect(isApiVersionSupported('7.0.1')).toBe(false);
      expect(isApiVersionSupported('7.1.0')).toBe(false);
      expect(isApiVersionSupported('8.0.0')).toBe(false);
    });

    it('should handle edge cases near the boundaries', () => {
      expect(isApiVersionSupported('6.2.99')).toBe(false);
      expect(isApiVersionSupported('6.3.0')).toBe(true);
      expect(isApiVersionSupported('6.99.99')).toBe(true);
      expect(isApiVersionSupported('7.0.0')).toBe(false);
    });
  });

  describe('getVersionErrorMessage', () => {
    it('should return message for versions too old', () => {
      const message = getVersionErrorMessage('6.2.0');
      expect(message).toBe('API version 6.2.0 is too old. Minimum supported version is 6.3.0.');
    });

    it('should return message for versions way too old', () => {
      const message = getVersionErrorMessage('5.0.0');
      expect(message).toBe('API version 5.0.0 is too old. Minimum supported version is 6.3.0.');
    });

    it('should return message for versions too new', () => {
      const message = getVersionErrorMessage('7.0.0');
      expect(message).toBe('API version 7.0.0 is too new. Maximum supported version is below 7.0.0.');
    });

    it('should return message for versions way too new', () => {
      const message = getVersionErrorMessage('8.0.0');
      expect(message).toBe('API version 8.0.0 is too new. Maximum supported version is below 7.0.0.');
    });

    it('should not return error message for supported versions', () => {
      // For supported versions, the message should be the generic one
      // since none of the conditions (too old or too new) match
      const message = getVersionErrorMessage('6.3.0');
      expect(message).toBe('API version 6.3.0 is not supported.');
    });

    it('should handle edge cases', () => {
      expect(getVersionErrorMessage('6.2.99')).toContain('too old');
      expect(getVersionErrorMessage('6.99.99')).toContain('is not supported');
      expect(getVersionErrorMessage('7.0.1')).toContain('too new');
    });
  });

  describe('SUPPORTED_API_VERSION constant', () => {
    it('should have expected min and max values', () => {
      expect(SUPPORTED_API_VERSION.min).toBe('6.3.0');
      expect(SUPPORTED_API_VERSION.max).toBe('7.0.0');
    });

    it('should have min < max', () => {
      expect(compareVersions(SUPPORTED_API_VERSION.min, SUPPORTED_API_VERSION.max)).toBe(-1);
    });
  });

  describe('integration', () => {
    it('should correctly validate a range of versions', () => {
      const testVersions = [
        { version: '5.0.0', supported: false },
        { version: '6.2.9', supported: false },
        { version: '6.3.0', supported: true },
        { version: '6.3.1', supported: true },
        { version: '6.5.0', supported: true },
        { version: '6.9.9', supported: true },
        { version: '7.0.0', supported: false },
        { version: '8.0.0', supported: false },
      ];

      testVersions.forEach(({ version, supported }) => {
        expect(isApiVersionSupported(version)).toBe(supported);
      });
    });

    it('should provide appropriate error messages for each invalid version', () => {
      const tooOld = getVersionErrorMessage('6.2.0');
      const tooNew = getVersionErrorMessage('7.0.0');

      expect(tooOld).toContain('too old');
      expect(tooOld).toContain('6.3.0');
      expect(tooNew).toContain('too new');
      expect(tooNew).toContain('7.0.0');
    });
  });
});

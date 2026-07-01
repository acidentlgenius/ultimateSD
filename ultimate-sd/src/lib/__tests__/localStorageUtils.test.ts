import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { safeGetJSON, safeSetJSON, safeGetString, safeSetString, isStorageAvailable } from '../localStorageUtils';

describe('localStorageUtils', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('isStorageAvailable', () => {
        it('returns true when localStorage is available', () => {
            expect(isStorageAvailable()).toBe(true);
        });

        it('returns false when window.localStorage throws on access', () => {
            // Since our new implementation only checks !!window.localStorage,
            // we should simulate window.localStorage throwing on property access.
            const originalLocalStorage = window.localStorage;
            Object.defineProperty(window, 'localStorage', {
                get: () => { throw new Error('Denied'); },
                configurable: true,
            });

            expect(isStorageAvailable()).toBe(false);

            Object.defineProperty(window, 'localStorage', {
                value: originalLocalStorage,
                configurable: true,
            });
        });
    });

    describe('safeGetJSON', () => {
        it('returns parsed object when valid JSON is stored', () => {
            localStorage.setItem('test-key', '{"hello":"world"}');
            expect(safeGetJSON('test-key')).toEqual({ hello: 'world' });
        });

        it('returns default value when no key exists', () => {
            expect(safeGetJSON('non-existent', { default: true })).toEqual({ default: true });
        });

        it('returns default value and removes key on corrupted JSON', () => {
            localStorage.setItem('corrupt-key', 'not-json');

            // Should suppress console.error and console.warn in test output
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            expect(safeGetJSON('corrupt-key', { fallback: 1 })).toEqual({ fallback: 1 });
            expect(localStorage.getItem('corrupt-key')).toBeNull();

            expect(errorSpy).toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalled();
        });

        it('returns default value but does not remove key on corrupted JSON if removeOnCorrupt is false', () => {
            localStorage.setItem('corrupt-key-2', 'not-json-2');
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(safeGetJSON('corrupt-key-2', null, false)).toBeNull();
            expect(localStorage.getItem('corrupt-key-2')).toBe('not-json-2');

            expect(errorSpy).toHaveBeenCalled();
        });
    });

    describe('safeSetJSON', () => {
        it('sets valid JSON string', () => {
            const success = safeSetJSON('set-key', { data: 123 });
            expect(success).toBe(true);
            expect(localStorage.getItem('set-key')).toBe('{"data":123}');
        });

        it('handles QuotaExceededError gracefully', () => {
            vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
                const err = new Error('Quota');
                err.name = 'QuotaExceededError';
                throw err;
            });

            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const success = safeSetJSON('quota-key', { big: 'data' });
            expect(success).toBe(false);
            expect(errorSpy).toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalled();
        });
    });

    describe('safeGetString and safeSetString', () => {
        it('sets and gets simple strings', () => {
            expect(safeSetString('str-key', 'hello-world')).toBe(true);
            expect(safeGetString('str-key')).toBe('hello-world');
        });

        it('returns default value if string not found', () => {
            expect(safeGetString('non-str-key', 'default-str')).toBe('default-str');
        });

        it('handles QuotaExceededError for string setting', () => {
            vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
                const err = new Error('Quota');
                err.name = 'QuotaExceededError';
                throw err;
            });

            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            expect(safeSetString('quota-str', 'large')).toBe(false);
            expect(errorSpy).toHaveBeenCalled();
        });
    });
});

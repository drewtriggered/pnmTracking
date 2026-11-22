import { describe, expect, it } from 'vitest';
import { resolveAuthDomain } from '../src/lib/authDomain';

const CONFIGURED = 'example-project.firebaseapp.com';

describe('resolveAuthDomain', () => {
  it('uses the page host on a web.app domain', () => {
    expect(resolveAuthDomain(CONFIGURED, 'example-project.web.app')).toBe('example-project.web.app');
  });

  it('uses the page host on a firebaseapp.com domain', () => {
    expect(resolveAuthDomain(CONFIGURED, 'example-project.firebaseapp.com')).toBe(
      'example-project.firebaseapp.com',
    );
  });

  it('ignores letter case in the host', () => {
    expect(resolveAuthDomain(CONFIGURED, 'Example-Project.Web.App')).toBe('Example-Project.Web.App');
  });

  it('keeps the configured value on localhost', () => {
    expect(resolveAuthDomain(CONFIGURED, 'localhost:5173')).toBe(CONFIGURED);
  });

  it('keeps the configured value on any other host', () => {
    expect(resolveAuthDomain(CONFIGURED, 'chapter.example.org')).toBe(CONFIGURED);
  });

  it('does not match a look-alike host', () => {
    expect(resolveAuthDomain(CONFIGURED, 'evil-web.app.example.org')).toBe(CONFIGURED);
  });

  it('keeps the configured value when there is no page', () => {
    expect(resolveAuthDomain(CONFIGURED, undefined)).toBe(CONFIGURED);
  });
});

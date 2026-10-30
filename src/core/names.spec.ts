import { initials } from './names';

describe('initials', () => {
  it('uses first and last word', () => {
    expect(initials('Dana Reyes')).toBe('DR');
    expect(initials('Dana M. Reyes')).toBe('DR');
  });

  it('handles a single word', () => {
    expect(initials('dana')).toBe('D');
  });

  it('ignores extra whitespace', () => {
    expect(initials('  dana   reyes ')).toBe('DR');
  });

  it('returns ? for an empty name', () => {
    expect(initials('')).toBe('?');
    expect(initials('   ')).toBe('?');
  });
});

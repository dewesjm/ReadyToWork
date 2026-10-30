import {
  Announcement,
  AnnouncementDraft,
  activeAnnouncements,
  announcementProblems,
  announcementState,
  createAnnouncement,
  deleteAnnouncement,
  dismissKey,
  setAnnouncementOn,
  updateAnnouncement,
} from './announcements';

const note = (over: Partial<Announcement> = {}): Announcement => ({
  id: 'a1',
  type: 'info',
  message: 'Hello',
  startsOn: null,
  endsOn: null,
  on: true,
  revision: 1,
  ...over,
});

const draft = (over: Partial<AnnouncementDraft> = {}): AnnouncementDraft => ({
  type: 'outage',
  message: 'SAP is down',
  startsOn: null,
  endsOn: null,
  on: true,
  ...over,
});

describe('announcementState', () => {
  const dated = note({ startsOn: '2026-11-02', endsOn: '2026-11-04' });

  it('is live with no dates, off when turned off', () => {
    expect(announcementState(note(), '2026-10-30')).toBe('live');
    expect(announcementState(note({ on: false }), '2026-10-30')).toBe('off');
    expect(announcementState({ ...dated, on: false }, '2026-11-03')).toBe('off');
  });

  it('shows from the start day through the end day', () => {
    expect(announcementState(dated, '2026-11-01')).toBe('scheduled');
    expect(announcementState(dated, '2026-11-02')).toBe('live');
    expect(announcementState(dated, '2026-11-04')).toBe('live');
    expect(announcementState(dated, '2026-11-05')).toBe('ended');
  });

  it('takes an open start or end', () => {
    expect(announcementState(note({ startsOn: '2026-11-02' }), '2027-06-01')).toBe('live');
    expect(announcementState(note({ endsOn: '2026-11-02' }), '2020-01-01')).toBe('live');
  });
});

describe('activeAnnouncements', () => {
  it('keeps live notices, outages first, then delays, then info, list order within a type', () => {
    const list = [
      note({ id: 'i1', type: 'info' }),
      note({ id: 'd1', type: 'delayed' }),
      note({ id: 'o-off', type: 'outage', on: false }),
      note({ id: 'o1', type: 'outage' }),
      note({ id: 'i2', type: 'info' }),
      note({ id: 'later', type: 'outage', startsOn: '2026-12-01' }),
    ];
    expect(activeAnnouncements(list, '2026-10-30').map((a) => a.id)).toEqual(['o1', 'd1', 'i1', 'i2']);
  });
});

describe('announcementProblems', () => {
  it('accepts a good draft', () => {
    expect(announcementProblems(draft())).toEqual({});
    expect(announcementProblems(draft({ startsOn: '2026-11-02', endsOn: '2026-11-02' }))).toEqual({});
  });

  it('needs a message of at most 300 characters', () => {
    expect(announcementProblems(draft({ message: '   ' })).message).toBe('Enter a message.');
    expect(announcementProblems(draft({ message: 'x'.repeat(300) })).message).toBeUndefined();
    expect(announcementProblems(draft({ message: 'x'.repeat(301) })).message).toContain('300 characters');
  });

  it('checks the dates', () => {
    expect(announcementProblems(draft({ startsOn: '2026-11-04', endsOn: '2026-11-02' })).dates).toBe(
      'The end date is before the start date.',
    );
    expect(announcementProblems(draft({ endsOn: '2026-02-30' })).dates).toBe('Enter dates like 2026-10-30.');
  });
});

describe('edits', () => {
  it('creates at the top with a fresh id and trims the message', () => {
    const first = createAnnouncement([], draft({ message: '  SAP is down  ' }));
    expect(first.id).toBe('a1');
    expect(first.list).toEqual([{ ...draft(), id: 'a1', revision: 1 }]);
    const second = createAnnouncement(first.list, draft({ type: 'info' }));
    expect(second.id).toBe('a2');
    expect(second.list.map((a) => a.id)).toEqual(['a2', 'a1']);
    // Ids are not reused after a delete.
    const third = createAnnouncement(deleteAnnouncement(second.list, 'a1'), draft());
    expect(third.id).not.toBe('a2');
  });

  it('bumps the revision on a published edit, so the dismiss key changes', () => {
    const list = [note()];
    const edited = updateAnnouncement(list, 'a1', draft({ message: 'New text' }));
    expect(edited[0]).toMatchObject({ id: 'a1', message: 'New text', type: 'outage', revision: 2 });
    expect(dismissKey(edited[0])).not.toBe(dismissKey(list[0]));
  });

  it('turns on and off without a new revision, and deletes', () => {
    const off = setAnnouncementOn([note()], 'a1', false);
    expect(off[0]).toMatchObject({ on: false, revision: 1 });
    expect(deleteAnnouncement(off, 'a1')).toEqual([]);
  });
});

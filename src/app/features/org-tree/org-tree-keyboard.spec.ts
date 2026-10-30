import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { Readiness } from '../readiness/readiness';

@Component({ template: 'person' })
class PersonStub {}

/** Director, Issues only off: managers open, crew leads collapsed. */
const URL = '/readiness?issues=all';

describe('OrgTree keyboard', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'readiness', component: Readiness },
          { path: 'person/:id', component: PersonStub },
        ]),
      ],
    });
    await loadAppState();
    TestBed.inject(SettingsService).updatePreferences({ layout: 'drilldown' });
    TestBed.inject(ViewerService).setPersona('director');
  });

  async function open() {
    const harness = await RouterTestingHarness.create(URL);
    const el = () => harness.routeNativeElement as HTMLElement;
    const rows = () => [...el().querySelectorAll<HTMLElement>('[role="treeitem"]')];
    const row = (id: string) => el().querySelector<HTMLElement>(`[role="treeitem"][data-id="${id}"]`)!;
    const focused = () => (document.activeElement as HTMLElement | null)?.dataset['id'];
    const press = async (key: string) => {
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      await harness.fixture.whenStable();
    };
    const org = TestBed.inject(ReadinessService).result().org;
    /** First visible row that has reports but is collapsed (a crew lead). */
    const collapsedLead = () => rows().find((r) => r.getAttribute('aria-expanded') === 'false')!;
    return { harness, el, rows, row, focused, press, org, collapsedLead };
  }

  it('puts exactly one row in the tab order, with tree semantics', async () => {
    const { rows, el } = await open();
    expect(el().querySelector('[role="tree"]')).not.toBeNull();
    expect(rows().filter((r) => r.tabIndex === 0)).toEqual([rows()[0]]);
    const r = rows()[1];
    expect(r.getAttribute('aria-level')).toBe('2');
    expect(r.getAttribute('aria-posinset')).toBe('1');
    expect(Number(r.getAttribute('aria-setsize'))).toBeGreaterThan(1);
  });

  it('moves with Down, Up, Home and End', async () => {
    const { rows, focused, press } = await open();
    rows()[0].focus();
    await press('ArrowDown');
    expect(focused()).toBe(rows()[1].dataset['id']);
    await press('ArrowDown');
    await press('ArrowUp');
    expect(focused()).toBe(rows()[1].dataset['id']);
    await press('End');
    expect(focused()).toBe(rows().at(-1)!.dataset['id']);
    await press('Home');
    expect(focused()).toBe(rows()[0].dataset['id']);
    await press('ArrowUp');
    expect(focused()).toBe(rows()[0].dataset['id']);
    expect(rows()[0].getAttribute('aria-selected')).toBe('true');
    expect(rows()[0].tabIndex).toBe(0);
  });

  it('expands with Right, then moves to the first child', async () => {
    const { focused, press, org, collapsedLead, row } = await open();
    const lead = collapsedLead();
    const id = lead.dataset['id']!;
    lead.focus();
    await press('ArrowRight');
    expect(row(id).getAttribute('aria-expanded')).toBe('true');
    expect(focused()).toBe(id);
    await press('ArrowRight');
    expect(focused()).toBe(org.childrenOf(id)[0].id);
  });

  it('moves to the parent with Left, then collapses it', async () => {
    const { focused, press, org, collapsedLead, row } = await open();
    const id = collapsedLead().dataset['id']!;
    row(id).focus();
    await press('ArrowRight');
    await press('ArrowRight');
    await press('ArrowLeft'); // a crew member has no reports: go to the parent
    expect(focused()).toBe(id);
    await press('ArrowLeft');
    expect(row(id).getAttribute('aria-expanded')).toBe('false');
    expect(row(org.childrenOf(id)[0].id)).toBeNull();
  });

  it('expands every sibling with *', async () => {
    const { press, collapsedLead, row, org } = await open();
    const lead = collapsedLead();
    const parentId = org.get(lead.dataset['id']!)!.managerId!;
    lead.focus();
    await press('*');
    for (const sibling of org.childrenOf(parentId)) {
      if (org.childrenOf(sibling.id).length > 0) {
        expect(row(sibling.id).getAttribute('aria-expanded')).toBe('true');
      }
    }
  });

  it('opens the person with Enter and puts focus back on that row after Back', async () => {
    const { harness, rows, press, focused } = await open();
    const target = rows()[3];
    const id = target.dataset['id']!;
    target.focus();
    await press('Enter');
    expect(TestBed.inject(Router).url).toBe(`/person/${id}`);

    (document.activeElement as HTMLElement | null)?.blur();
    await harness.navigateByUrl(URL);
    await harness.fixture.whenStable();
    expect(focused()).toBe(id);
  });
});

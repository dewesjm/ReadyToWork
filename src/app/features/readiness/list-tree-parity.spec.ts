import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { isIssue } from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { Readiness } from './readiness';
import { ReadinessQueryService } from './readiness-query-service';

/** M5 "Done when": the list matches the checks behind the tree for every view-as persona. */
describe('List and tree agree', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'readiness', component: Readiness }])],
    });
    await loadAppState();
  });

  for (const persona of ['foreman', 'superintendent', 'director', 'admin']) {
    it(`for the ${persona}, with Issues only on and off`, async () => {
      TestBed.inject(ViewerService).setPersona(persona);
      const harness = await RouterTestingHarness.create('/readiness');
      const query = harness.routeDebugElement!.injector.get(ReadinessQueryService);
      const { checksByPerson } = TestBed.inject(ReadinessService).result();

      for (const url of ['/readiness', '/readiness?issues=all']) {
        await harness.navigateByUrl(url);
        const issuesOnly = query.issuesOnly();
        const treePeople = query
          .result()
          .rows.filter((r) => !r.context)
          .map((r) => r.person.id)
          .filter((id) => (checksByPerson.get(id) ?? []).length > 0);
        const listRows = query.listResult().rows;
        expect(treePeople.length).toBeGreaterThan(0);

        // Same people...
        expect(new Set(listRows.map((r) => r.person.id))).toEqual(new Set(treePeople));
        // ...and for each, exactly their issue checks (or every check with Issues only off).
        for (const id of treePeople) {
          const expected = (checksByPerson.get(id) ?? []).filter((c) => !issuesOnly || isIssue(c, query.query()));
          const listed = listRows.filter((r) => r.person.id === id).map((r) => r.check);
          expect(listed.length).toBe(expected.length);
          expect(new Set(listed)).toEqual(new Set(expected));
        }
      }
    });
  }
});

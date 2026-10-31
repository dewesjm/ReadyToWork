import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { worstStatus } from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { Readiness } from './readiness';
import { ReadinessQueryService } from './readiness-query-service';

/** The list shows the tree's people, each category as the worst of their checks, for every persona. */
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
        const treePeople = query.result().rows.filter((r) => !r.context).map((r) => r.person.id);
        const { columns, rows } = query.listResult();
        expect(treePeople.length).toBeGreaterThan(0);

        // Same people...
        expect(rows.map((r) => r.person.id).sort()).toEqual([...treePeople].sort());
        // ...and each cell is the worst status of that person's checks in the category.
        for (const row of rows) {
          const checks = checksByPerson.get(row.person.id) ?? [];
          columns.forEach((category, i) => {
            const worst = worstStatus(checks.filter((c) => c.category === category).map((c) => c.status));
            expect(row.cells[i]?.status ?? null).toBe(worst);
          });
        }
      }
    });
  }
});

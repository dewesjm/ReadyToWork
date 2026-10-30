import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CategoryId,
  DEFAULT_CONFIG,
  FilterViewer,
  ISSUE_STATUSES,
  ReadinessFilter,
  ReadinessQuery,
  Status,
  supervisorOptions,
} from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { ViewerService } from '../../services/viewer-service';
import { READINESS_PAGE_CONFIG } from './readiness-page-config';

export type ReadinessView = 'tree' | 'list';

/** URL parameters. Defaults are left out so links stay short. */
type Param = 'view' | 'issues' | 'sup' | 'prog' | 'cat' | 'status' | 'direct' | 'q';

/**
 * The Readiness page's query, read from and written to the URL so a view can be bookmarked,
 * shared and reloaded. Provided by the page, so it reads the page's own route.
 *
 * Missing `sup` / `prog` fall back to the viewer's Preferences, then to the viewer and all
 * programs. Values the viewer can't use (unknown ids, someone outside their subtree) are ignored.
 */
@Injectable()
export class ReadinessQueryService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly settings = inject(SettingsService);
  private readonly readiness = inject(ReadinessService);
  private readonly viewerService = inject(ViewerService);
  private readonly filter = new ReadinessFilter(DEFAULT_CONFIG.categories);

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private param(name: Param): string | null {
    return this.params().get(name);
  }

  readonly view = computed<ReadinessView>(() => (this.param('view') === 'list' ? 'list' : 'tree'));
  /** On unless the URL says `issues=all`. */
  readonly issuesOnly = computed(() => this.param('issues') !== 'all');

  readonly viewer = computed<FilterViewer | null>(() => {
    const v = this.viewerService.viewer();
    return v ? { personId: v.personId, isAdmin: v.isAdmin } : null;
  });

  /** The viewer, then the managers they may scope to. */
  readonly supervisorOptions = computed(() => {
    const viewer = this.viewer();
    return viewer ? supervisorOptions(this.readiness.result().org, viewer) : [];
  });
  private validSupervisor(id: string | null): string | null {
    return id !== null && this.supervisorOptions().some((o) => o.person.id === id) ? id : null;
  }
  readonly defaultSupervisorId = computed(
    () =>
      this.validSupervisor(this.settings.preferences().defaultSupervisorId) ??
      this.viewer()?.personId ??
      null,
  );
  readonly supervisorId = computed(
    () => this.validSupervisor(this.param('sup')) ?? this.defaultSupervisorId(),
  );

  readonly programs = computed(() => this.settings.settings().programs);
  private validProgram(id: string | null): string | null {
    return id !== null && this.programs().some((p) => p.id === id) ? id : null;
  }
  readonly defaultProgramId = computed(() =>
    this.validProgram(this.settings.preferences().defaultProgramId),
  );
  /** Null is all programs. `prog=all` overrides a default program from Preferences. */
  readonly programId = computed(() => {
    const prog = this.param('prog');
    if (prog === 'all') return null;
    return this.validProgram(prog) ?? this.defaultProgramId();
  });

  readonly categories = computed<CategoryId[]>(() =>
    splitList(this.param('cat')).filter((c) => DEFAULT_CONFIG.categories.some((k) => k.id === c)),
  );
  readonly statuses = computed<Status[]>(() =>
    ISSUE_STATUSES.filter((s) => splitList(this.param('status')).includes(s)),
  );
  readonly directOnly = computed(() => this.param('direct') === '1');

  /** What's typed in the search box. Filters at once; reaches the URL after a short pause. */
  readonly keyword = signal(this.param('q') ?? '');
  private keywordTimer: ReturnType<typeof setTimeout> | null = null;

  readonly query = computed<ReadinessQuery>(() => ({
    supervisorId: this.supervisorId(),
    programId: this.programId(),
    issuesOnly: this.issuesOnly(),
    categories: this.categories(),
    statuses: this.statuses(),
    directOnly: this.directOnly(),
    keyword: this.keyword(),
  }));

  /** Identifies the current query (for remembering tree expand state per query). */
  readonly queryKey = computed(() =>
    JSON.stringify({ viewer: this.viewer()?.personId, ...this.query(), keyword: this.keyword().trim() }),
  );

  readonly result = computed(() => {
    const viewer = this.viewer();
    const readiness = this.readiness.result();
    if (!viewer) return { rootId: '', rows: [], shownCount: 0, scopeCount: 0, narrowed: false };
    return this.filter.apply({
      readiness,
      assignments: this.settings.settings().assignments,
      viewer,
      query: this.query(),
    });
  });

  /** Any filter Clear filters would reset (scope, view and Issues only are not filters). */
  readonly hasFilters = computed(
    () =>
      this.categories().length > 0 ||
      this.statuses().length > 0 ||
      this.directOnly() ||
      this.keyword().trim() !== '',
  );

  constructor() {
    // Follow the URL (Back, a pasted link) unless the user is mid-typing.
    effect(() => {
      const q = this.param('q') ?? '';
      if (this.keywordTimer === null && untracked(this.keyword).trim() !== q) this.keyword.set(q);
    });
    inject(DestroyRef).onDestroy(() => this.cancelKeywordWrite());
  }

  setView(view: ReadinessView): void {
    this.navigate({ view: view === 'tree' ? null : view });
  }

  setIssuesOnly(on: boolean): void {
    this.navigate({ issues: on ? null : 'all' });
  }

  setSupervisor(id: string): void {
    this.navigate({ sup: id === this.defaultSupervisorId() ? null : id });
  }

  setProgram(id: string | null): void {
    this.navigate({ prog: id === this.defaultProgramId() ? null : (id ?? 'all') });
  }

  toggleCategory(id: CategoryId): void {
    const current = this.categories();
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    this.navigate({ cat: joinList(next) });
  }

  toggleStatus(status: Status): void {
    const current = this.statuses();
    const next = current.includes(status) ? current.filter((s) => s !== status) : [...current, status];
    this.navigate({ status: joinList(ISSUE_STATUSES.filter((s) => next.includes(s))) });
  }

  setDirectOnly(on: boolean): void {
    this.navigate({ direct: on ? '1' : null });
  }

  setKeyword(text: string): void {
    this.keyword.set(text);
    this.cancelKeywordWrite();
    this.keywordTimer = setTimeout(() => {
      this.keywordTimer = null;
      this.navigate({ q: text.trim() || null }, true);
    }, READINESS_PAGE_CONFIG.keywordUrlDelayMs);
  }

  clearFilters(): void {
    this.cancelKeywordWrite();
    this.keyword.set('');
    this.navigate({ cat: null, status: null, direct: null, q: null });
  }

  private cancelKeywordWrite(): void {
    if (this.keywordTimer !== null) clearTimeout(this.keywordTimer);
    this.keywordTimer = null;
  }

  /** Changes not yet in the URL. A navigation started before the last one lands replaces it. */
  private pending: Partial<Record<Param, string | null>> = {};

  private navigate(changes: Partial<Record<Param, string | null>>, replaceUrl = false): void {
    const queryParams = (this.pending = { ...this.pending, ...changes });
    void this.router
      .navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge', replaceUrl })
      .finally(() => {
        if (this.pending === queryParams) this.pending = {};
      });
  }
}

function splitList(value: string | null): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

function joinList(values: readonly string[]): string | null {
  return values.length > 0 ? values.join(',') : null;
}

import { Injectable, computed, inject } from '@angular/core';
import { initials } from '../../core';
import { DEFAULT_PERSONA_ID, Persona } from '../../data';
import { ReadinessService } from './readiness-service';
import { SettingsService } from './settings-service';

export interface Viewer {
  name: string;
  title: string;
  personId: string;
  isAdmin: boolean;
}

/** Who is "logged in": the demo persona chosen with "View as" (the superintendent by default). */
@Injectable({ providedIn: 'root' })
export class ViewerService {
  private readonly readiness = inject(ReadinessService);
  private readonly settings = inject(SettingsService);

  readonly persona = computed<Persona | null>(() => {
    const personas = this.readiness.personas();
    const id = this.settings.preferences().personaId ?? DEFAULT_PERSONA_ID;
    return personas.find((p) => p.id === id) ?? personas[0] ?? null;
  });

  readonly viewer = computed<Viewer | null>(() => {
    const persona = this.persona();
    const person = persona && this.readiness.result().org.get(persona.personId);
    if (!persona || !person) return null;
    return { name: person.name, title: person.title, personId: person.id, isAdmin: persona.isAdmin };
  });

  readonly isAdmin = computed(() => this.viewer()?.isAdmin ?? false);
  readonly canRunServices = computed(() => this.persona()?.id === 'developer' && this.isAdmin());

  readonly initials = computed(() => {
    const v = this.viewer();
    return v ? initials(v.name) : '?';
  });

  setPersona(id: string): void {
    this.settings.updatePreferences({ personaId: id });
  }
}

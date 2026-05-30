import { getCostValue } from './formatters.js';
import type { Event } from './types.js';

export interface ICSOptions {
  /** 'event' = itse koe, 'registration' = ilmoittautumismuistutus */
  type: 'event' | 'registration';
  /** Käyttäjälle näytettävä sijainti etäisyyden kuvauksessa */
  userLocationName?: string;
  /** Indeksi UID:ssa erottamaan saman kokeen eri kalenteripyynnöt */
  index?: number;
  /** Override "nyt"-aikaleima testauksen helpottamiseksi */
  now?: Date;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDateOnly(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function formatICSTimestamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours(),
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function parseRegistrationDate(entryDate: string, dateSort: string): Date {
  const match = entryDate.match(/(\d{1,2})\.(\d{1,2})\./);
  if (match) {
    const year = new Date(dateSort).getFullYear();
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    return new Date(year, month - 1, day);
  }
  return new Date(dateSort);
}

function buildEventDescription(
  event: Event,
  userLocationName?: string,
): string {
  let description = '';
  if (event.description) {
    description += event.description;
    description += '\\n\\n--- Perustiedot ---\\n';
  }
  description += `Tyyppi: ${event.type}\\n`;

  if (event.classes && event.classes.length > 0) {
    description += '\\nLuokat ja päivät:\\n';
    const classesByDate: Record<string, { dateStr: string; dayName: string; classes: string[] }> = {};
    const weekdays = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];

    for (const cls of event.classes) {
      if (cls.class && cls.date) {
        const clsDate = new Date(cls.date);
        const dateKey = formatDateOnly(clsDate);
        const dayName = weekdays[clsDate.getDay()];
        const dateStr = `${clsDate.getDate()}.${clsDate.getMonth() + 1}.`;
        if (!classesByDate[dateKey]) {
          classesByDate[dateKey] = { dateStr, dayName, classes: [] };
        }
        classesByDate[dateKey].classes.push(cls.class);
      }
    }
    for (const dateKey of Object.keys(classesByDate).sort()) {
      const info = classesByDate[dateKey];
      description += `  ${info.dayName} ${info.dateStr}: ${info.classes.join(', ')}\\n`;
    }
  } else {
    description += `Tasot: ${event.levels}\\n`;
  }

  if (event.organizer) description += `\\n\\nJärjestäjä: ${event.organizer}`;
  if (event.judges && event.judges.length > 0) {
    description += `\\n\\nTuomarit: ${event.judges.join(', ')}`;
  }
  if (event.secretary && event.secretary.name) {
    description += `\\n\\nSihteeri: ${event.secretary.name}`;
    if (event.secretary.phone) description += `, puh. ${event.secretary.phone}`;
    if (event.secretary.email) description += `, ${event.secretary.email}`;
  }
  if (event.official && event.official.name) {
    description += `\\n\\nYhteyshenkilö: ${event.official.name}`;
    if (event.official.phone) description += `, puh. ${event.official.phone}`;
    if (event.official.email) description += `, ${event.official.email}`;
  }
  if (event.distance !== null && event.distance !== undefined) {
    description += `\\n\\n--- Etäisyys (${userLocationName ?? 'oma sijainti'}) ---`;
    description += `\\nLinnuntie: ${event.distance} km`;
  }
  description += `\\n\\nIlmoittautumisaika: ${event.entry_date}`;

  const icsCost = getCostValue(event.cost);
  const icsCostMember = getCostValue(event.cost_member);
  if (icsCost !== null || icsCostMember !== null) {
    description += '\\n\\n--- Osallistumismaksut ---';
    if (icsCost !== null) description += `\\nMaksu: ${icsCost} €`;
    if (icsCostMember !== null) description += `\\nJäsenmaksu: ${icsCostMember} €`;
  }
  return description;
}

function buildRegistrationDescription(event: Event): string {
  let description = 'MUISTUTUS: Ilmoittautuminen kokeeseen alkaa\\n\\n';
  description += `Koe: ${event.date}\\n`;
  description += `Paikkakunta: ${event.location}\\n`;
  description += `Tyyppi: ${event.type}\\n`;
  description += `Tasot: ${event.levels}\\n`;
  description += `Ilmoittautumisaika: ${event.entry_date}\\n`;
  if (event.official && event.official.name) {
    description += `\\n\\nYhteyshenkilö: ${event.official.name}`;
    if (event.official.phone) description += `, puh. ${event.official.phone}`;
    if (event.official.email) description += `, ${event.official.email}`;
  }
  if (event.organizer) description += `\\n\\nJärjestäjä: ${event.organizer}`;
  return description;
}

/**
 * Tuottaa ICS-tekstin annetulle kokeelle tai ilmoittautumismuistutukselle.
 * Tekstin voi tallentaa selaimessa Blobina tai mobiilissa tiedostona.
 */
export function generateICS(event: Event, options: ICSOptions): string {
  const startDate =
    options.type === 'registration'
      ? parseRegistrationDate(event.entry_date, event.date_sort)
      : new Date(event.date_sort);

  const endDate = new Date(
    options.type === 'event' && event.end_date_sort
      ? event.end_date_sort
      : startDate,
  );
  endDate.setDate(endDate.getDate() + 1);

  const dtstart = formatDateOnly(startDate);
  const dtend = formatDateOnly(endDate);
  const dtstamp = formatICSTimestamp(options.now ?? new Date());

  let title: string;
  let description: string;
  if (options.type === 'registration') {
    title = `Ilmoittautuminen: ${event.location} - ${event.type}`;
    description = buildRegistrationDescription(event);
  } else {
    title = `${event.location} - ${event.type} - ${event.levels}`;
    description = buildEventDescription(event, options.userLocationName);
  }

  const location = event.coordinates
    ? `${event.location} (${event.coordinates[0]}, ${event.coordinates[1]})`
    : event.location;

  const uidIndex = options.index ?? 0;
  const uidPrefix = options.type === 'registration' ? 'reg-' : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Koetutka//FI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `DTSTAMP:${dtstamp}`,
    `UID:${uidPrefix}${event.date_sort}-${uidIndex}@koetutka.fi`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

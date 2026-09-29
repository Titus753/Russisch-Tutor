import { useEffect, useRef, useState } from 'preact/hooks';
import { useApp } from '../../app/kontext.ts';
import { Abschnitt, Unterseite } from '../../bausteine/Bedienelemente.tsx';
import { pruefeStand, type Stand } from '../../speicher/schema.ts';
import {
  fortschrittGeloescht,
  MAX_SICHERUNG_BYTES,
  sicherungErstellen,
  sicherungLesen,
  sicherungsDateiname,
} from '../../speicher/sicherung.ts';
import { SCHLUESSEL } from '../../speicher/speicher.ts';

interface Vorschau {
  stand: Stand;
  verworfen: number;
  erstellt: Date | null;
}

const anzahl = (s: Stand) => Object.keys(s.karten).length;
const datum = (d: Date) =>
  d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

export function Sicherung({ onZurueck }: { onZurueck: () => void }) {
  const { stand, aendere, zeigeHinweis, ablage } = useApp();
  const [vorschau, setVorschau] = useState<Vorschau | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [loeschenSchritt, setLoeschenSchritt] = useState(false);
  const [rueckwege, setRueckwege] = useState<{ import: Stand | null; loeschen: Stand | null }>({
    import: null,
    loeschen: null,
  });
  const dateiRef = useRef<HTMLInputElement>(null);
  const bestaetigenRef = useRef<HTMLButtonElement>(null);

  /** Interne Sicherungen (vor Import/Löschen) laden – ebenfalls als feindlich geprüft. */
  const ladeRueckwege = async () => {
    const lese = async (schluessel: string) => {
      try {
        return pruefeStand(await ablage.get(schluessel))?.stand ?? null;
      } catch {
        return null;
      }
    };
    setRueckwege({
      import: await lese(SCHLUESSEL.vorImport),
      loeschen: await lese(SCHLUESSEL.vorLoeschen),
    });
  };
  useEffect(() => void ladeRueckwege(), []);
  useEffect(() => {
    if (vorschau || loeschenSchritt) bestaetigenRef.current?.focus();
  }, [vorschau, loeschenSchritt]);

  const exportieren = () => {
    const blob = new Blob([sicherungErstellen(stand)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = sicherungsDateiname();
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    zeigeHinweis('Sicherung gespeichert.');
  };

  const dateiGewaehlt = async (e: Event) => {
    const eingabe = e.currentTarget as HTMLInputElement;
    const datei = eingabe.files?.[0];
    eingabe.value = ''; // dieselbe Datei erneut wählbar
    setFehler(null);
    setVorschau(null);
    if (!datei) return;
    const ergebnis = await sicherungLesen(datei);
    if (ergebnis.ok) setVorschau(ergebnis);
    else setFehler(ergebnis.fehler);
  };

  /** Vor dem Ersetzen den aktuellen Stand intern sichern; ohne erfolgreiche Sicherung kein Ersetzen. */
  const ersetzeMitSicherung = async (schluessel: string, neu: Stand, meldung: string) => {
    try {
      await ablage.setMany([[schluessel, structuredClone(stand)]]);
    } catch {
      zeigeHinweis('Der aktuelle Stand konnte nicht gesichert werden. Es wurde nichts geändert.');
      return false;
    }
    aendere(() => neu);
    zeigeHinweis(meldung);
    await ladeRueckwege();
    return true;
  };

  const importieren = async () => {
    if (!vorschau) return;
    if (await ersetzeMitSicherung(SCHLUESSEL.vorImport, vorschau.stand, 'Sicherung importiert.')) {
      setVorschau(null);
    }
  };

  const loeschen = async () => {
    if (
      await ersetzeMitSicherung(
        SCHLUESSEL.vorLoeschen,
        fortschrittGeloescht(stand),
        'Fortschritt gelöscht.',
      )
    ) {
      setLoeschenSchritt(false);
    }
  };

  const wiederherstellen = async (art: 'import' | 'loeschen') => {
    const alt = rueckwege[art];
    if (!alt) return;
    aendere(() => alt);
    await ablage.del(art === 'import' ? SCHLUESSEL.vorImport : SCHLUESSEL.vorLoeschen);
    zeigeHinweis('Vorheriger Stand wiederhergestellt.');
    await ladeRueckwege();
  };

  return (
    <Unterseite titel="Sicherung" onZurueck={onZurueck}>
      <p>
        Dein Lernstand liegt nur auf diesem Gerät. Speichere regelmäßig eine Sicherung, zum Beispiel
        vor einem Handywechsel.
      </p>

      <Abschnitt titel="Exportieren">
        <p class="kleingedruckt">
          {anzahl(stand)} Karten, Lernserie und Einstellungen als Datei auf diesem Gerät speichern.
        </p>
        <button type="button" class="knopf knopf--haupt" onClick={exportieren}>
          Sicherung speichern
        </button>
      </Abschnitt>

      <Abschnitt titel="Importieren">
        <p class="kleingedruckt">
          Eine Sicherungsdatei dieser App wählen (höchstens {MAX_SICHERUNG_BYTES / 1024 / 1024} MB).
          Vor dem Ersetzen wird dein aktueller Stand automatisch gesichert.
        </p>
        <input
          ref={dateiRef}
          id="sicherung-datei"
          class="nur-sr"
          type="file"
          accept="application/json,.json"
          onChange={(e) => void dateiGewaehlt(e)}
        />
        <button type="button" class="knopf" onClick={() => dateiRef.current?.click()}>
          Sicherungsdatei wählen
        </button>
        {fehler && (
          <p role="alert" class="meldung meldung--falsch">
            {fehler}
          </p>
        )}
        {vorschau && (
          <div class="bestaetigung" role="group" aria-label="Import bestätigen">
            <p>
              <strong>{anzahl(stand)} Karten werden ersetzt</strong> durch {anzahl(vorschau.stand)}{' '}
              Karten aus der Sicherung
              {vorschau.erstellt ? ` vom ${datum(vorschau.erstellt)}` : ''}.
            </p>
            {vorschau.verworfen > 0 && (
              <p class="kleingedruckt">
                {vorschau.verworfen} ungültige Einträge in der Datei werden übersprungen.
              </p>
            )}
            <div class="aktionen aktionen--reihe">
              <button type="button" class="knopf" onClick={() => setVorschau(null)}>
                Abbrechen
              </button>
              <button
                ref={bestaetigenRef}
                type="button"
                class="knopf knopf--haupt"
                onClick={() => void importieren()}
              >
                Importieren
              </button>
            </div>
          </div>
        )}
        {rueckwege.import && (
          <button
            type="button"
            class="knopf knopf--klein"
            onClick={() => void wiederherstellen('import')}
          >
            Stand vor dem letzten Import wiederherstellen ({anzahl(rueckwege.import)} Karten)
          </button>
        )}
      </Abschnitt>

      <Abschnitt titel="Fortschritt löschen">
        <p class="kleingedruckt">
          Löscht alle Karten und die Lernserie. Einstellungen bleiben erhalten.
        </p>
        {!loeschenSchritt ? (
          <button
            type="button"
            class="knopf knopf--warnung"
            onClick={() => setLoeschenSchritt(true)}
          >
            Fortschritt löschen …
          </button>
        ) : (
          <div
            class="bestaetigung bestaetigung--warnung"
            role="group"
            aria-label="Löschen bestätigen"
          >
            <p>
              <strong>Wirklich löschen?</strong> {anzahl(stand)} Karten und deine Lernserie gehen
              verloren. Der aktuelle Stand wird vorher intern gesichert und lässt sich hier
              wiederherstellen.
            </p>
            <div class="aktionen aktionen--reihe">
              <button
                ref={bestaetigenRef}
                type="button"
                class="knopf"
                onClick={() => setLoeschenSchritt(false)}
              >
                Abbrechen
              </button>
              <button type="button" class="knopf knopf--gefahr" onClick={() => void loeschen()}>
                Endgültig löschen
              </button>
            </div>
          </div>
        )}
        {rueckwege.loeschen && (
          <button
            type="button"
            class="knopf knopf--klein"
            onClick={() => void wiederherstellen('loeschen')}
          >
            Gelöschten Stand wiederherstellen ({anzahl(rueckwege.loeschen)} Karten)
          </button>
        )}
      </Abschnitt>
    </Unterseite>
  );
}

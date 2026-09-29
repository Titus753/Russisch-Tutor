import { Abschnitt, Unterseite } from '../../bausteine/Bedienelemente.tsx';

/** Datenschutzerklärung (Art. 13 DSGVO). Angaben zum Verantwortlichen kommen aus dem Build. */
const V = __VERANTWORTLICHER__;

function ExternerLink({ href, children }: { href: string; children: string }) {
  return (
    <a class="link-knopf" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function Datenschutz({ onZurueck }: { onZurueck: () => void }) {
  return (
    <Unterseite titel="Datenschutz" onZurueck={onZurueck}>
      <Abschnitt titel="Kurz gesagt">
        <p>
          Die App speichert deinen Lernstand ausschließlich auf deinem Gerät. Es gibt kein Konto,
          keine Cookies, kein Tracking, keine Analyse, keine Werbung und keine Anfragen an andere
          Anbieter. Beim Aufruf der App verarbeitet nur der Hosting-Anbieter technisch notwendige
          Daten (siehe unten).
        </p>
      </Abschnitt>

      <Abschnitt titel="Verantwortlich">
        {V.platzhalter && (
          <p role="alert" class="meldung meldung--falsch">
            Angaben fehlen – vor der Veröffentlichung in Netlify eintragen.
          </p>
        )}
        <p>
          {V.name}
          {V.anschrift && (
            <>
              <br />
              {V.anschrift}
            </>
          )}
          <br />
          E-Mail:{' '}
          {V.platzhalter ? (
            V.kontakt
          ) : (
            <a class="link-knopf" href={`mailto:${V.kontakt}`}>
              {V.kontakt}
            </a>
          )}
        </p>
      </Abschnitt>

      <Abschnitt titel="Daten auf deinem Gerät">
        <p>
          Gespeichert werden dein Lernfortschritt (Stufe und Fälligkeit je Karte), die Lerntage für
          die Lernserie und deine Einstellungen – im lokalen Speicher des Browsers (IndexedDB).
          Diese Daten verlassen das Gerät nicht. Das Speichern ist für die von dir gewünschte
          Funktion unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).
        </p>
        <p>
          Löschen kannst du sie jederzeit unter „Mehr → Sicherung → Fortschritt löschen“ oder indem
          du die Website-Daten im Browser löscht bzw. die App entfernst.
        </p>
        <p>
          Sicherungsdateien entstehen nur, wenn du sie selbst speicherst, und liegen dann dort, wo
          du sie ablegst. Beim Import wird die Datei nur auf deinem Gerät gelesen.
        </p>
        <p>
          Die Aussprache-Aufnahmen sind Teil der App. Fehlt eine, nutzt die App ausschließlich eine
          lokal installierte Stimme deines Geräts; es wird kein Text übertragen.
        </p>
      </Abschnitt>

      <Abschnitt titel="Hosting">
        <p>
          Die App wird von Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, USA,
          ausgeliefert. Beim Aufruf verarbeitet Netlify technisch notwendige Daten wie IP-Adresse,
          Zeitpunkt, abgerufene Datei und Browser-Angaben in Server-Protokollen, um die App
          auszuliefern und vor Angriffen zu schützen.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren
          Bereitstellung). Netlify handelt als Auftragsverarbeiter (Art. 28 DSGVO) auf Grundlage
          seines Auftragsverarbeitungsvertrags. Für die Übermittlung in die USA nimmt Netlify am
          EU-US Data Privacy Framework teil (Angemessenheitsbeschluss, Art. 45 DSGVO) und nutzt
          zusätzlich EU-Standardvertragsklauseln. Die Speicherdauer richtet sich nach den Vorgaben
          von Netlify.
        </p>
        <p>
          <ExternerLink href="https://www.netlify.com/privacy/">
            Datenschutzerklärung von Netlify
          </ExternerLink>
        </p>
      </Abschnitt>

      <Abschnitt titel="Deine Rechte">
        <p>
          Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art.
          17), Einschränkung der Verarbeitung (Art. 18) und Widerspruch (Art. 21). Wende dich dafür
          an die oben genannte E-Mail-Adresse. Außerdem kannst du dich bei einer
          Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).
        </p>
        <p class="kleingedruckt">Stand: September 2026</p>
      </Abschnitt>
    </Unterseite>
  );
}

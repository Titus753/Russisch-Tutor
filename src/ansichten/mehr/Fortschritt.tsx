import vokabeln from 'virtual:vokabeln';
import { useApp } from '../../app/kontext.ts';
import { Abschnitt, Unterseite } from '../../bausteine/Bedienelemente.tsx';
import { THEMEN } from '../../daten/themen.ts';
import { heute } from '../../logik/datum.ts';
import { kartenFuer } from '../../logik/karten.ts';
import { anzahlFaellig, fortschrittJeThema, lernserie } from '../../logik/statistik.ts';

export function Fortschritt({ onZurueck }: { onZurueck: () => void }) {
  const { stand } = useApp();
  const tag = heute();
  const serie = lernserie(stand.lerntage, tag);
  const faellig = anzahlFaellig(
    kartenFuer(vokabeln, { ...stand.einstellungen, richtung: 'gemischt' }),
    stand.karten,
    tag,
  );
  const themen = fortschrittJeThema(vokabeln, stand.karten);
  const begonnen = themen.reduce((n, t) => n + t.begonnen, 0);
  const gefestigt = themen.reduce((n, t) => n + t.gefestigt, 0);

  return (
    <Unterseite titel="Fortschritt" onZurueck={onZurueck}>
      <div class="kennzahlen">
        <p class="kennzahl">
          <span class="kennzahl__wert">{serie}</span>
          <span class="kennzahl__text">{serie === 1 ? 'Tag in Folge' : 'Tage in Folge'}</span>
        </p>
        <p class="kennzahl">
          <span class="kennzahl__wert">{faellig}</span>
          <span class="kennzahl__text">heute fällig</span>
        </p>
        <p class="kennzahl">
          <span class="kennzahl__wert">{begonnen}</span>
          <span class="kennzahl__text">begonnen</span>
        </p>
        <p class="kennzahl">
          <span class="kennzahl__wert">{gefestigt}</span>
          <span class="kennzahl__text">gefestigt</span>
        </p>
      </div>
      <p class="kleingedruckt">
        Von {vokabeln.length} Einträgen. Gefestigt heißt: in mindestens einer Richtung Stufe 4 oder
        höher.
      </p>
      <Abschnitt titel="Je Thema">
        <ul class="themenliste">
          {themen.map((t) => {
            const name = THEMEN.find((x) => x.id === t.thema)?.name ?? t.thema;
            const anteil = t.gesamt === 0 ? 0 : Math.round((t.gefestigt / t.gesamt) * 100);
            return (
              <li key={t.thema} class="themenliste__eintrag">
                <span class="themenliste__kopf">
                  <span>{name}</span>
                  <span class="kleingedruckt">
                    {t.gefestigt} / {t.gesamt} gefestigt · {t.begonnen} begonnen
                  </span>
                </span>
                <span
                  class="balken"
                  role="progressbar"
                  aria-label={`${name}: gefestigt`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={anteil}
                >
                  <span class="balken__fuellung" style={{ width: `${anteil}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      </Abschnitt>
    </Unterseite>
  );
}

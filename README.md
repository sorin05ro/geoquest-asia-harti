# GeoQuest – Hărțile Asiei 🦉🗺️

Joc de **localizare pe hartă** pentru **clasa a VII-a**: apele, țărmurile și relieful Asiei. Este un joc separat de [GeoQuest – Expediția Asia](https://sorin05ro.github.io/geoquest-asia/), cel cu itemii din teste. Progresul celor două jocuri nu se amestecă.

**Deschide jocul:** https://sorin05ro.github.io/geoquest-asia-harti/

## Ce conține

- **Trei hărți din manual:** hidrografia, poziția geografică și țărmurile, relieful. În timpul jocului, denumirile tipărite sunt **acoperite cu măști**.
- **174 de elemente** în **20 de niveluri**, plus **Marele Atlas**: 12 itemi din toate hărțile, deblocat cu 2★ la fiecare nivel „Amestec”.
- **5 tipuri de exerciții:** Găsește pe hartă, Ce e aici?, Pune etichetele, Spre ce ocean curge?, Ce formă de relief este?
- **Explorează:** harta fără măști. Atingi un loc și afli ce este acolo.
- **Recompense:**
  - XP și 6 ranguri;
  - stele (1★ de la 60%, 2★ de la 80%, 3★ de la 95%);
  - seria zilnică și 10 insigne;
  - flashcard-uri Leitner cu elementele greșite.
- **Harta interactivă:** zoom cu două degete sau cu butoanele, iar atingerea se confirmă prin „Verifică”. Elevii care nu pot atinge precis aleg dintre marcaje numerotate.
- **Modul Profesor** (PIN):
  - calibrarea hărților: zone de răspuns, măști, „verificat”, export/import `atlas.json`;
  - activarea sau dezactivarea elementelor;
  - greșelile frecvente;
  - export/import al progresului.
- **Funcționează offline** și se poate instala pe telefon. Nu are conturi; elevul folosește doar o poreclă.

## Cum se modifică datele

```bash
python3 tools/genereaza_atlas.py      # regenerează data/atlas.json din coordonatele (în pixeli) din script
python3 -m http.server 8765
node tests/ruleaza.mjs                # are nevoie de Playwright
```

| Fișier | Conținut |
|---|---|
| `tools/genereaza_atlas.py` | Elementele, zonele, măștile, nivelurile și insignele |
| `data/atlas.json` | Datele generate (coordonate 0–1). Se poate înlocui direct cu fișierul exportat din Modul Profesor |
| `assets/atlas/` | Cele trei hărți (WebP + JPG) |
| `js/harta-interactiva.js` | Harta cu zoom, măști și pini |
| `js/atlas.js` | Ecranele și exercițiile |
| `js/atlas-geo.js` | Geometria (atingere în zonă) |
| `js/atlas-calibrare.js` | Editorul profesorului |

## Meta-prompt

`META_PROMPT.md` descrie aplicația. Este scris inițial pentru React; aplicația folosește însă JavaScript simplu, ca restul modulelor GeoQuest.

## Autor și licență

**Autor:** prof. Negraru Sorin Norocel, Școala Gimnazială Nr. 6, Râmnicu Sărat.

**Licență:**
- codul: MIT;
- conținutul educațional: CC BY-NC-SA 4.0;
- hărțile: manualul de Geografie pentru clasa a VII-a (Art Klett), folosite cu acordul profesorului, în scop educațional.

# META-PROMPT — GeoQuest · „Atlasul Asiei” (localizare pe hartă, clasa a VII-a)

> Copiază tot documentul într-o sesiune nouă, împreună cu cele trei hărți și cu acces la depozitul `sorin05ro/geoquest-asia`.

---

## 0. Rolul tău

Ești dezvoltator front-end și designer de jocuri educaționale. Construiești un **modul de localizare pe hartă** pentru GeoQuest, aplicația gamificată de geografie a prof. Negraru Sorin (Școala Gimnazială Nr. 6 Râmnicu Sărat; folosită și la Boldu și Râmnicelu). Modulul se adaugă lângă „Expediția Asia” (itemii din Testul nr. 1 și nr. 2), **nu o înlocuiește**.

Lucrezi în limba română, cu diacritice corecte (ș, ț cu virgulă).

## 1. Contextul existent (de respectat, nu de reinventat)

- **GeoQuest** (`sorin05ro/geoquest`): React + TypeScript + Vite, PWA offline, stocare locală (IndexedDB), publicare pe GitHub Pages prin ramura `gh-pages` (acțiunea `JamesIves/github-pages-deploy-action@v4`).
- **Gamificare deja stabilită**: XP, ranguri, stele (1–3 pe nivel), insigne legate de competențe, serie zilnică „blândă”, repetare spațiată Leitner, mascota **Geo**, bufnița-cartograf.
- **Moduri existente**: elev (individual), clasă live (PIN/QR, canal Supabase fără bază de date, tablă interactivă), profesor (rezultate, export CSV/PDF).
- **Module surori**: `geoquest-carpati` (clasa a VIII-a) și `geoquest-asia` (clasa a VII-a).
- **Decizie implicită**: noul modul intră în depozitul `sorin05ro/geoquest-asia`, ca a doua secțiune: „Expediția Asia” (teste) + „Atlasul Asiei” (hărți). Refolosește componentele, stilurile, sistemul de XP și mascota de acolo. Citește întâi codul existent și aliniază-te la el.

## 2. Materialele de pornire: trei hărți

Hărțile sunt furnizate ca imagini. Salvează-le în `public/harti/` cu numele:

| Fișier | Conținut | Dimensiuni aprox. |
|---|---|---|
| `asia_hidrografie.png` | Bazine hidrografice (Oc. Arctic, Indian, Pacific, M. Neagră + Mediterană, regiuni endoreice), râuri, lacuri, mări | 1200 × 864 |
| `asia_pozitie.png` | Poziție geografică: puncte extreme N/S/E/V, rețea de meridiane/paralele, emisfere, peninsule, insule, strâmtori, golfuri, scară 0–1 400–2 800 km | ~1000 × 780 |
| `asia_relief.png` | Relief: câmpii, dealuri și podișuri, munți, vârfuri, vulcani stinși / activi, cote altimetrice | 2266 × 1652 |

„Deocamdată folosim hărțile” — arhitectura trebuie totuși să permită ulterior înlocuirea imaginii cu o hartă vectorială proprie (vezi §9), fără rescrierea itemilor.

### Problema-cheie: hărțile au deja denumirile scrise
Un exercițiu de localizare pe o hartă etichetată e banal. Prin urmare:
- Fiecare element are, pe lângă **zona de răspuns**, una sau mai multe **măști** (dreptunghiuri sau poligoane) care acoperă eticheta tipărită pe hartă.
- Măștile se desenează cu o culoare apropiată de fundalul local (sau un ușor blur/ estompare), ca harta să rămână lizibilă.
- În modul „Explorează” (învățare), măștile se ascund; în modurile de joc/evaluare, se afișează.
- Legenda hărții de relief rămâne vizibilă (e utilă), dar legenda hărții hidrografice se poate ascunde la exercițiile de tip „spre ce ocean curge?”.

## 3. Instrumentul obligatoriu: modul de calibrare (profesor)

Nu ghici coordonatele în pixeli din descrieri. Construiește un **editor de calibrare** accesibil din modul profesor:
1. Alegi harta și elementul din listă (§4).
2. Dai click pentru **punct** (vârf, vulcan, punct extrem, lac mic, oraș nu e cazul), tragi un **poligon** (câmpie, podiș, munți, deșert, mare, insulă, peninsulă, bazin) sau o **polilinie** (râu, lanț muntos îngust, strâmtoare) cu toleranță setabilă.
3. Desenezi măștile pentru etichetele tipărite.
4. Export / import `JSON`.

Coordonatele se salvează **procentual** (0–1 din lățime/înălțime), ca să funcționeze pe telefon, tabletă, PC și tablă interactivă. Livrează un prim set de coordonate aproximative, marcate `"verificat": false`, pe care profesorul le corectează în editor; doar elementele cu `"verificat": true` intră în jocurile cu notare.

### Model de date (orientativ)
```json
{
  "id": "rel-munti-himalaya",
  "harta": "relief",
  "nume": "Munții Himalaya",
  "categorie": "munti",
  "geometrie": { "tip": "polilinie", "puncte": [[0.31,0.66],[0.37,0.67]], "toleranta": 0.02 },
  "masti": [[0.30,0.65,0.09,0.03]],
  "info": "Cei mai înalți munți ai Terrei; vârful Chomolungma/Everest.",
  "valoare": null,
  "dificultate": 1,
  "verificat": false,
  "sursa": "Harta relief, manual Art Klett cls. a VII-a"
}
```

## 4. Inventarul elementelor (din hărțile atașate)

Folosește exact denumirile și valorile de pe hărți (sunt cele din manualul elevilor). Unde o valoare diferă de date mai noi (ex. Everest 8 848,86 m, măsurătoare 2020), păstrează valoarea manualului în joc și pune valoarea actuală, cu sursă, în fișa „Știai că?”.

### 4.1 Harta hidrografică
- **Bazine** (exercițiu de colorare/clasificare): spre Oc. Arctic, spre Oc. Indian, spre Oc. Pacific, spre M. Neagră și M. Mediterană; regiuni endoreice: aralo-caspică, central-asiatică, arabă.
- **Râuri spre Oc. Arctic**: Obi, Irtîș, Enisei, Tunguska Inferioară, Tunguska Pietroasă, Angara, Lena, Kolîma.
- **Râuri spre Oc. Pacific**: Amur, Huang He, Chang Jiang (Yangtze), Mekong.
- **Râuri spre Oc. Indian**: Indus, Gange, Brahmaputra, Irrawaddy, Tigru, Eufrat.
- **Râuri endoreice**: Sîr-Daria, Amu-Daria; **Ural** (limită cu Europa, se varsă în M. Caspică).
- **Lacuri**: Baikal, Aral, Balhaș, Marea Caspică.
- **Mări, golfuri**: M. Kara, M. Laptev, M. Siberiei de Est, M. Ciukotsk, M. Ohotsk, M. Japoniei, M. Galbenă, M. Chinei de Est, M. Chinei de Sud, M. Arabiei, M. Roșie, M. Neagră, M. Mediterană; G. Persic, G. Bengal; oceanele Arctic, Pacific, Indian.

### 4.2 Harta poziției geografice
- **Puncte extreme** (pinii N, S, E, V de pe hartă): N continental – Peninsula Taimîr (Capul Celiuskin); N insular – I-le Severnaia Zemlia; S continental – Peninsula Malacca (Capul Piai); S insular – în arhipelagul indonezian (verifică în manual punctul exact folosit); E – Peninsula Ciukotka (Capul Dejnev); V – Peninsula Asia Mică (Capul Baba).
- **Distanțele N–S și V–E** (cele două „??? km” de pe hartă): exercițiu de măsurare cu scara grafică (0–1 400–2 800 km). Elevul trage o riglă virtuală, aplicația calculează din scară; acceptă o marjă (ex. ±10%). Valoarea de referință se stabilește cu profesorul din manual — nu o inventa.
- **Linii și emisfere**: Ecuatorul, Tropicul Racului, Cercul Polar de Nord, meridianul de 180°; emisfera nordică/sudică, estică/vestică (Asia are teritorii în toate patru).
- **Peninsule**: Iamal, Taimîr, Ciukotka, Kamciatka, Coreea, Indochina, Malacca, India (Hindustan), Arabia, Asia Mică.
- **Insule și arhipelaguri**: Severnaia Zemlia, Noua Siberie, Sahalin, Kurile, Arhipelagul Japonez (Hokkaido, Honshu, Shikoku, Kyushu), Taiwan, Hainan, Arhipelagul Filipine (Luzon, Mindanao), Arhipelagul Indonezian (Sumatra, Java, Kalimantan/Borneo, Sulawesi, Timor), Noua Guinee, Sri Lanka, Maldive.
- **Strâmtori**: Bering, Ormuz, Bab-el-Mandeb. **Golfuri**: Persic, Oman, Aden, Bengal, Anadîr.
- **Vecinătăți**: Europa (limita Munții Ural – râul Ural – M. Caspică – Munții Caucaz – M. Neagră), Africa, America de Nord, Australia.
- **Coordonate**: exercițiu „citește coordonatele punctului” folosind rețeaua de meridiane (din 15° în 15°) și paralele.

### 4.3 Harta reliefului
- **Câmpii**: Câmpia Siberiei de Vest, Câmpia Turanului, Câmpia Mesopotamiei, Câmpia Indusului, Câmpia Gangelui, Marea Câmpie Chineză, Câmpia Mekongului.
- **Podișuri**: Podișul Siberiei Centrale, Podișul Anatoliei, Podișul Iran, Podișul Pamir, Podișul Tibet, Podișul de Loess, Podișul Deccan.
- **Munți**: Ural, Caucaz, Elburs, Zagros, Hindukush, Karakorum, Himalaya, Kunlun, Tian Shan, Altai, Saian, Iablonovîi, Hinganul Mare, Verhoiansk, Cerski, Kolîma, Gații de Vest, Gații de Est.
- **Deșerturi**: Karakum, Taklamakan, Gobi, An-Nafūd, Rub al-Khāli.
- **Depresiuni / cote negative**: Depresiunea Turfan (−154 m), țărmul Mării Moarte (−427 m).
- **Vârfuri**: Chomolungma/Everest (8 850 m); Ararat (5 165 m, vulcan stins).
- **Vulcani activi sau latenți**: Kliucev (4 750 m), Fuji (3 776 m), Sakura (1 117 m), Mayon (2 463 m), Pinatubo (1 486 m), Taal (311 m), Krakatoa (813 m), Merapi (2 930 m), Semeru (3 676 m), Tambora (2 850 m).

## 5. Tipuri de exerciții

Nivel de bază (obligatorii în prima livrare):
1. **Găsește pe hartă** — se dă numele, elevul atinge harta. Corect dacă atinge în zonă (cu toleranță). La greșeală: se arată locul corect + distanța aproximativă de greșeală („ai fost la ~800 km”).
2. **Ce e aici?** — apare un pin/zonă evidențiată, elevul alege din 4 variante (distractori din aceeași categorie și aceeași regiune, ca să nu fie evident).
3. **Pune eticheta** — trage etichete (3–6) pe pinii corespunzători.
4. **Spre ce ocean curge?** — se evidențiază un râu, elevul alege bazinul (Arctic / Indian / Pacific / Neagră-Mediterană / endoreic).
5. **Clasifică forma de relief** — zonă evidențiată → câmpie / podiș / munți / deșert / depresiune.

Nivel avansat:
6. **Puncte extreme** — plasează cei patru pini N, S, E, V pe țărmuri.
7. **Măsoară cu scara** — rigla virtuală pentru distanțele N–S și V–E și alte distanțe cerute de profesor.
8. **Coordonate geografice** — citește/plasează un punct după latitudine și longitudine.
9. **Mai înalt / mai jos** — ordonează vârfuri și vulcani după altitudine (valori de pe hartă).
10. **Traseul expediției** — narativ: „Geo pleacă din Peninsula Asia Mică spre Capul Dejnev…”, elevul atinge pe rând elementele traversate.
11. **Contra cronometru** — 10 elemente, cât mai repede (pentru tablă / modul clasă), cu scor pe precizie și timp.

Fiecare exercițiu are o **fișă „Știai că?”** de 1–2 propoziții, cu sursă, afișată după răspuns.

## 6. Structura jocului

- **Trei regiuni-hartă** pe ecranul principal: „Apele Asiei”, „Granițele Asiei”, „Relieful Asiei”, plus „Marele Atlas” (amestec din toate, deblocat după 2 stele în fiecare).
- Niveluri pe categorii, de la ușor la greu (ex. Relief: 1 Câmpii → 2 Podișuri → 3 Munți → 4 Deșerturi și depresiuni → 5 Vârfuri și vulcani → 6 Amestec).
- 8–12 itemi pe nivel; stele: 1★ ≥ 60%, 2★ ≥ 80%, 3★ ≥ 95%.
- Elementele greșite intră în cutiile Leitner existente și revin la repetare.
- **Insigne noi** (exemple): „Hidrograful Siberiei” (toate râurile arctice), „Cuceritorul Himalayei”, „Inelul de Foc” (toți vulcanii), „Cele patru vânturi” (punctele extreme), „Cartograful” (100% pe Marele Atlas).
- Mod **Explorează** fără notare: atingi harta, apar denumirea și fișa.

## 7. Moduri de utilizare

- **Elev**: telefon/tabletă — pinch-zoom, pan, butoane mari (min. 44 px), confirmare înainte de trimiterea atingerii (evită atingerile accidentale la zoom).
- **Clasă (tablă interactivă)**: refolosește PIN/QR live existent; profesorul alege nivelul, elevii răspund de pe telefoane, pe tablă apar toate atingerile ca „nor de puncte” (bun pentru discuție) și apoi răspunsul corect.
- **Profesor**: editorul de calibrare (§3), activarea/dezactivarea elementelor, alegerea listei pentru o temă, rezultate pe element (care sunt cele mai greșite), export CSV/PDF ca în celelalte module.
- **Fișă tipărită**: generează harta cu măști + numere și lista de denumiri (pentru lucru pe hârtie / evaluare).

## 8. Cerințe tehnice

- Componentă `HartaInteractiva` reutilizabilă (imagine + strat SVG suprapus pentru zone, măști, pini, riglă), cu zoom/pan (pointer events, fără dependențe grele).
- Verificarea răspunsului: punct-în-poligon, distanță față de polilinie, rază față de punct — toate în coordonate procentuale corectate cu raportul de aspect al imaginii.
- Imaginile comprimate (WebP + PNG de rezervă), încărcate leneș; funcționare offline (adaugă-le în cache-ul PWA).
- Accesibilitate: contrast, text alternativ, variantă cu listă pentru elevii care nu pot folosi harta (exercițiile 2, 4, 5 pot fi rezolvate și fără atingere precisă).
- Fără conturi și fără date personale în această etapă; progres doar local, ca în restul aplicației.
- Toate datele (elemente, coordonate, fișe) în fișiere JSON separate de cod, ca profesorul să le poată edita.

## 9. Drepturi de autor (de verificat înainte de publicare)

Hărțile provin din manual. Depozitul `geoquest-asia` este **public**, iar GitHub Pages expune imaginile oricui. Înainte de publicare, oprește-te și cere decizia profesorului între:
- (a) folosire doar în clasă / depozit privat sau rulare locală, cu hărțile manualului;
- (b) publicare cu hărți proprii, redesenate pe o bază liberă (ex. Natural Earth, domeniu public), păstrând aceleași elemente și același model de date — etapa de dezvoltare ulterioară.

Arhitectura trebuie să permită trecerea de la (a) la (b) doar prin înlocuirea imaginii și recalibrare.

## 10. Plan de livrare

1. **Etapa A** — citirea codului `geoquest-asia`, componenta `HartaInteractiva`, editorul de calibrare, datele brute pentru toate elementele din §4 (`verificat: false`). Livrează și oprește-te: profesorul calibrează.
2. **Etapa B** — exercițiile 1–5, cele trei regiuni-hartă, stele, XP, Leitner, modul Explorează.
3. **Etapa C** — exercițiile 6–11, Marele Atlas, insignele, modul clasă, fișa tipărită, rapoarte.
4. **Etapa D** (ulterior) — hărți proprii vectoriale, alte continente după același model.

La finalul fiecărei etape: build fără erori, testare pe lățime de telefon (360 px) și pe ecran mare, listă scurtă cu ce s-a făcut și ce trebuie verificat de profesor.

## 11. Ce să nu faci

- Nu inventa coordonate „exacte” și nu le marca drept verificate.
- Nu inventa valori (altitudini, distanțe, puncte extreme) care nu sunt pe hartă sau în manual; dacă lipsesc, întreabă.
- Nu copia text din manual în fișele „Știai că?” — scrie-le cu propriile cuvinte și citează sursa.
- Nu modifica „Expediția Asia” (itemii din teste) decât pentru integrarea în meniul comun.

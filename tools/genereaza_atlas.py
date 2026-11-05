#!/usr/bin/env python3
"""
GeoQuest – Atlasul Asiei: generatorul datelor de localizare pe hartă.

Rulare (din rădăcina proiectului):
    python3 tools/genereaza_atlas.py                 # scrie data/atlas.json
    python3 tools/genereaza_atlas.py --imagini DIR    # (re)face și imaginile din assets/atlas din hărțile originale
    python3 tools/genereaza_atlas.py --control DIR    # desenează zonele și măștile peste hărți, pentru verificare

Coordonatele de mai jos sunt în PIXELI ai imaginii originale (ușor de citit pe hartă).
În data/atlas.json ele devin FRACȚII (0–1), ca să funcționeze la orice mărime de ecran.
Toate elementele pleacă cu "verificat": false. Profesorul le confirmă în
Modul Profesor → Calibrare Atlas și exportă fișierul corectat.

Geometrie:
  P(x, y, r)            – punct cu rază de acceptare r (vârf, vulcan, insulă, câmpie...)
  L([(x,y),...], tol)   – polilinie cu toleranță (râu, lanț muntos, linie a rețelei)
Măștile [x, y, lățime, înălțime] acoperă denumirile tipărite pe hartă.
"""
import json, os, sys

RAD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SURSA_HARTI = 'Harta {}, manualul de Geografie pentru clasa a VII-a (Art Klett)'

HARTI = {
    'hidrografie': dict(nume='Apele Asiei', fisier='asia_hidrografie', original='Asia_-_Hidrografie.jpg', latime=1200, inaltime=864,
                        titlu='hidrografică a Asiei',
                        masti_fixe=[[1110, 12, 72, 70]],                      # lupa din colț (element al manualului digital)
                        legenda=[796, 600, 360, 188],
                        scara={'x0': 294, 'x1': 420, 'km': 2000}),
    'pozitie': dict(nume='Granițele Asiei', fisier='asia_pozitie', original='Asia_-_harta_articulatii.jpg', latime=1000, inaltime=769,
                    titlu='poziției geografice și a țărmurilor Asiei',
                    masti_fixe=[], legenda=None,
                    scara={'x0': 771, 'x1': 914, 'km': 2800}),
    'relief': dict(nume='Relieful Asiei', fisier='asia_relief', original='Asia_-_harta_fizica.jpg', latime=2286, inaltime=1667,
                   titlu='fizică (relieful) a Asiei',
                   masti_fixe=[], legenda=[1730, 1236, 556, 370], scara=None),
}

def P(x, y, r): return {'tip': 'punct', 'c': [x, y], 'r': r}
def L(pts, tol): return {'tip': 'polilinie', 'puncte': [list(p) for p in pts], 'toleranta': tol}

E = []  # (harta, id, nume, categorie, geometrie, masti, info, extra)
def el(harta, id_, nume, cat, geom, masti, info, **extra):
    E.append(dict(harta=harta, id=id_, nume=nume, categorie=cat, geometrie=geom, masti=masti, info=info, **extra))

# =====================================================================  HARTA HIDROGRAFICĂ (1200 × 864)
H = 'hidrografie'
# --- râuri spre Oceanul Arctic
el(H, 'obi', 'Obi', 'rau', L([(300, 206), (290, 235), (306, 256), (350, 268), (375, 276), (400, 294), (437, 313), (480, 350)], 12),
   [[300, 186, 24, 28], [362, 262, 28, 20]], 'Împreună cu Irtîșul formează unul dintre cele mai lungi sisteme de râuri ale Asiei. Se varsă în Golful Obi, la Marea Kara.', bazin='arctic', regiune='siberia')
el(H, 'irtis', 'Irtîș', 'rau', L([(300, 244), (312, 288), (337, 312), (375, 350), (400, 375)], 12),
   [[322, 302, 36, 18]], 'Cel mai lung afluent al Obiului. Izvorăște din Munții Altai.', bazin='arctic', regiune='siberia')
el(H, 'enisei', 'Enisei', 'rau', L([(405, 120), (430, 160), (445, 205), (452, 250), (460, 300), (475, 335), (487, 380)], 12),
   [[436, 152, 22, 46], [474, 333, 24, 46]], 'Curge de la sud la nord prin Siberia și se varsă în Marea Kara. Primește Angara, singurul râu care iese din Lacul Baikal.', bazin='arctic', regiune='siberia')
el(H, 'tunguska-inf', 'Tunguska Inferioară', 'rau', L([(453, 244), (500, 236), (562, 236), (600, 246)], 10),
   [[494, 224, 110, 20]], 'Afluent de dreapta al Eniseiului. Curge prin Podișul Siberiei Centrale.', bazin='arctic', regiune='siberia')
el(H, 'tunguska-pietr', 'Tunguska Pietroasă', 'rau', L([(456, 275), (500, 262), (550, 281), (600, 294)], 10),
   [[472, 248, 108, 42]], 'Afluent al Eniseiului. În bazinul său a avut loc „evenimentul Tunguska” din 1908, o explozie uriașă în atmosferă.', bazin='arctic', regiune='siberia')
el(H, 'angara', 'Angara', 'rau', L([(592, 372), (575, 330), (545, 300), (505, 298), (460, 300)], 10),
   [[502, 286, 46, 20]], 'Singurul râu care iese din Lacul Baikal. Se varsă în Enisei.', bazin='arctic', regiune='siberia')
el(H, 'lena', 'Lena', 'rau', L([(700, 112), (712, 150), (720, 200), (705, 245), (670, 270), (635, 290), (615, 320)], 12),
   [[698, 145, 32, 36], [616, 277, 32, 24]], 'Se varsă în Marea Laptev printr-o deltă foarte mare, înghețată o bună parte din an.', bazin='arctic', regiune='siberia')
el(H, 'kolima', 'Kolîma', 'rau', L([(912, 172), (898, 205), (885, 240), (875, 265)], 10),
   [[902, 178, 42, 32]], 'Curge prin nord-estul Siberiei și se varsă în Marea Siberiei de Est.', bazin='arctic', regiune='siberia')
# --- spre Oceanul Pacific
el(H, 'amur', 'Amur', 'rau', L([(700, 385), (760, 390), (800, 380), (828, 355), (848, 325)], 12),
   [[810, 352, 34, 34]], 'Pe o mare parte a cursului desparte Rusia de China. Se varsă în strâmtoarea dintre continent și Insula Sahalin.', bazin='pacific', regiune='est')
el(H, 'huang-he', 'Huang He', 'rau', L([(560, 515), (600, 498), (630, 500), (660, 508), (690, 500)], 12),
   [[612, 490, 70, 38]], '„Fluviul Galben”: culoarea vine de la loessul pe care îl cară. Se varsă în Marea Galbenă.', bazin='pacific', regiune='est')
el(H, 'chang-jiang', 'Chang Jiang (Yangtze)', 'rau', L([(520, 555), (560, 568), (600, 575), (640, 570), (675, 565)], 12),
   [[572, 543, 68, 40]], 'Cel mai lung fluviu al Asiei. Pe el se află barajul Trei Defileuri.', bazin='pacific', regiune='est')
el(H, 'mekong', 'Mekong', 'rau', L([(560, 560), (570, 610), (580, 650), (590, 700), (600, 735)], 12),
   [[575, 650, 26, 48]], 'Străbate mai multe țări din Peninsula Indochina și formează o deltă întinsă în Vietnam.', bazin='pacific', regiune='sud-est')
# --- spre Oceanul Indian
el(H, 'indus', 'Indus', 'rau', L([(290, 515), (305, 550), (300, 585), (285, 612)], 12),
   [[296, 550, 26, 36]], 'Izvorăște din Podișul Tibet și se varsă în Marea Arabiei. În valea lui a apărut o civilizație foarte veche.', bazin='indian', regiune='sud')
el(H, 'gange', 'Gange', 'rau', L([(360, 555), (400, 575), (440, 590), (470, 600)], 12),
   [[394, 585, 40, 20]], 'Fluviu sfânt pentru hinduși. Împreună cu Brahmaputra formează o deltă uriașă la Golful Bengal.', bazin='indian', regiune='sud')
el(H, 'brahmaputra', 'Brahmaputra', 'rau', L([(390, 545), (440, 548), (495, 555), (500, 575), (480, 595)], 12),
   [[428, 556, 76, 20]], 'Izvorăște din Tibet, ocolește Himalaya prin est și se unește cu Gangele.', bazin='indian', regiune='sud')
el(H, 'irrawaddy', 'Irrawaddy', 'rau', L([(495, 575), (500, 610), (502, 650)], 12),
   [[493, 585, 20, 55]], 'Principalul fluviu al Myanmarului. Se varsă în Oceanul Indian.', bazin='indian', regiune='sud-est')
el(H, 'tigru', 'Tigru', 'rau', L([(118, 498), (135, 520), (155, 550), (165, 572)], 10),
   [[108, 494, 32, 48]], 'Se unește cu Eufratul înainte de vărsarea în Golful Persic. Între cele două râuri se află Mesopotamia.', bazin='indian', regiune='vest')
el(H, 'eufrat', 'Eufrat', 'rau', L([(92, 500), (110, 525), (140, 555), (160, 575)], 10),
   [[86, 494, 28, 26]], 'Cel mai lung râu din vestul Asiei. Împreună cu Tigrul delimitează Mesopotamia.', bazin='indian', regiune='vest')
# --- regiunea endoreică aralo-caspică
el(H, 'sir-daria', 'Sîr-Daria', 'rau', L([(248, 408), (270, 420), (300, 440), (335, 460)], 10),
   [[265, 402, 48, 40]], 'Se varsă în Lacul Aral. Apele lui sunt folosite intens pentru irigații.', bazin='endoreic', regiune='centru')
el(H, 'amu-daria', 'Amu-Daria', 'rau', L([(240, 428), (265, 458), (295, 485), (325, 505)], 10),
   [[265, 469, 46, 32]], 'Izvorăște din Pamir. Folosirea apelor pentru irigații a contribuit la micșorarea Lacului Aral.', bazin='endoreic', regiune='centru')
el(H, 'ural-rau', 'Ural (râul)', 'rau', L([(205, 345), (200, 375), (185, 405), (172, 425)], 10),
   [[178, 370, 32, 22]], 'Pe o parte din curs este considerat limita dintre Europa și Asia. Se varsă în Marea Caspică.', bazin='endoreic', regiune='centru')
# --- lacuri
el(H, 'baikal', 'Lacul Baikal', 'lac', L([(598, 375), (608, 352), (622, 330)], 10),
   [[580, 346, 44, 40]], 'Cel mai adânc lac de pe Terra (peste 1 600 m) și cea mai mare rezervă de apă dulce lichidă de la suprafață.', regiune='siberia')
el(H, 'aral', 'Lacul Aral', 'lac', P(228, 398, 16),
   [[208, 404, 40, 38]], 'S-a micșorat foarte mult după 1960, pentru că apa râurilor Amu-Daria și Sîr-Daria a fost folosită la irigații.', regiune='centru')
el(H, 'balhas', 'Lacul Balhaș', 'lac', P(365, 412, 16),
   [[349, 421, 46, 32]], 'Are o parte vestică cu apă dulce și o parte estică cu apă sărată.', regiune='centru')
el(H, 'caspica', 'Marea Caspică', 'lac', L([(172, 425), (182, 470), (198, 515)], 18),
   [[156, 424, 52, 98]], 'Cel mai întins lac de pe Terra. Are apă sărată și nu comunică cu oceanul.', regiune='centru')
# --- regiuni endoreice
el(H, 'endo-aralo', 'Regiunea endoreică aralo-caspică', 'regiune_endoreica', P(245, 505, 55),
   [[202, 482, 96, 64]], 'Râurile de aici nu ajung la ocean: se varsă în Marea Caspică și în Lacul Aral sau se pierd în deșert.', regiune='centru')
el(H, 'endo-central', 'Regiunea endoreică central-asiatică', 'regiune_endoreica', P(520, 450, 80),
   [[430, 428, 158, 52]], 'Cuprinde deșerturi și depresiuni închise între munți înalți; apele se pierd în nisipuri sau în lacuri sărate.', regiune='centru')
el(H, 'endo-araba', 'Regiunea endoreică arabă', 'regiune_endoreica', P(140, 620, 45),
   [[100, 590, 84, 64]], 'Deșert fără râuri permanente: apele rare ale ploilor se evaporă sau se infiltrează.', regiune='vest')
# --- mări, golfuri, oceane
el(H, 'h-kara', 'Marea Kara', 'mare', P(330, 110, 30), [[300, 78, 108, 48]], 'Mare a Oceanului Arctic, în care se varsă Obi și Enisei.', regiune='nord')
el(H, 'h-laptev', 'Marea Laptev', 'mare', P(720, 95, 40), [[655, 86, 135, 34]], 'Mare a Oceanului Arctic, între Peninsula Taimîr și Insulele Noua Siberie. Aici se varsă Lena.', regiune='nord')
el(H, 'h-siberiei-est', 'Marea Siberiei de Est', 'mare', P(960, 110, 45), [[860, 102, 90, 30], [945, 115, 125, 55]], 'Mare a Oceanului Arctic, acoperită de gheață cea mai mare parte a anului.', regiune='nord')
el(H, 'h-ciukotsk', 'Marea Ciukotsk', 'mare', P(1140, 150, 40), [[1114, 152, 86, 60]], 'Între Asia și America de Nord, la nord de Strâmtoarea Bering.', regiune='nord')
el(H, 'h-ohotsk', 'Marea Ohotsk', 'mare', P(880, 320, 45), [[814, 315, 140, 50]], 'Mărginită de Peninsula Kamciatka, Insulele Kurile și Sahalin. Iarna îngheață în mare parte.', regiune='est')
el(H, 'h-japoniei', 'Marea Japoniei', 'mare', P(800, 470, 30), [[770, 498, 40, 50], [790, 422, 62, 84]], 'Între Arhipelagul Japonez și continent.', regiune='est')
el(H, 'h-galbena', 'Marea Galbenă', 'mare', P(700, 505, 18), [[698, 480, 26, 74]], 'Numele vine de la apele încărcate cu aluviuni gălbui aduse de Huang He.', regiune='est')
el(H, 'h-chinei-est', 'Marea Chinei de Est', 'mare', P(735, 575, 22), [[722, 540, 50, 105]], 'Între China, Coreea de Sud, Japonia și Taiwan.', regiune='est')
el(H, 'h-chinei-sud', 'Marea Chinei de Sud', 'mare', P(650, 690, 40), [[580, 690, 50, 80], [615, 640, 50, 70], [655, 620, 50, 50]], 'Mare întinsă între Indochina, Filipine și Borneo, cu multe insule mici.', regiune='sud-est')
el(H, 'h-arabiei', 'Marea Arabiei', 'mare', P(260, 660, 40), [[244, 635, 72, 36]], 'Parte a Oceanului Indian, între Peninsula Arabia și Peninsula India. Aici se varsă Indusul.', regiune='sud')
el(H, 'h-rosie', 'Marea Roșie', 'mare', L([(70, 585), (95, 640), (118, 690)], 14), [[56, 570, 40, 60], [80, 625, 44, 72]], 'Desparte Asia de Africa. Comunică cu Marea Mediterană prin Canalul Suez.', regiune='vest')
el(H, 'h-neagra', 'Marea Neagră', 'mare', P(65, 465, 28), [[16, 444, 100, 26]], 'Mare interioară la limita dintre Europa și Asia. România are ieșire la ea.', regiune='vest')
el(H, 'h-mediterana', 'Marea Mediterană', 'mare', P(40, 540, 22), [[0, 514, 72, 36]], 'Comunică cu Oceanul Atlantic prin Strâmtoarea Gibraltar.', regiune='vest')
el(H, 'h-g-persic', 'Golful Persic', 'golf', P(180, 575, 16), [[156, 556, 60, 52]], 'Golf al Oceanului Indian; în jurul lui se află mari zăcăminte de petrol. Aici se varsă Tigrul și Eufratul.', regiune='vest')
el(H, 'h-g-bengal', 'Golful Bengal', 'golf', P(440, 670, 35), [[416, 663, 66, 36]], 'Considerat cel mai mare golf de pe Terra. Aici se varsă Gangele și Brahmaputra.', regiune='sud')
el(H, 'h-oc-arctic', 'Oceanul Arctic', 'ocean', P(550, 30, 70), [[300, 10, 192, 42], [646, 12, 158, 40]], 'Cel mai mic și cel mai rece ocean; în el se varsă marile râuri ale Siberiei.', regiune='nord')
el(H, 'h-oc-pacific', 'Oceanul Pacific', 'ocean', P(980, 530, 80), [[845, 495, 265, 32], [912, 533, 180, 32]], 'Cel mai mare ocean de pe Terra. Spre el curg Amurul, Huang He, Chang Jiang și Mekongul.', regiune='est')
el(H, 'h-oc-indian', 'Oceanul Indian', 'ocean', P(330, 780, 80), [[155, 770, 90, 65], [230, 735, 80, 55], [290, 712, 70, 42], [400, 728, 70, 55], [460, 780, 80, 80]], 'Spre el curg Indusul, Gangele, Brahmaputra, Tigrul și Eufratul.', regiune='sud')

# =====================================================================  HARTA POZIȚIEI GEOGRAFICE (1000 × 769)
Z = 'pozitie'
PIN = dict(n1=[400, 0, 50, 62], n2=[452, 42, 50, 62], e=[936, 165, 56, 68], v=[12, 370, 40, 70], s1=[452, 615, 42, 60], s2=[562, 688, 42, 56])
# --- puncte extreme
el(Z, 'cap-celiuskin', 'Capul Celiuskin (extremitatea nordică a continentului)', 'punct_extrem', P(475, 108, 14), [PIN['n2']],
   'Cel mai nordic punct al continentului asiatic, în Peninsula Taimîr (aproximativ 77°43′ N).', extrem='N', regiune='nord')
el(Z, 'cap-dejnev', 'Capul Dejnev (extremitatea estică)', 'punct_extrem', P(952, 236, 14), [PIN['e']],
   'Cel mai estic punct al Asiei, în Peninsula Ciukotka, la Strâmtoarea Bering (aproximativ 169°40′ V).', extrem='E', regiune='est')
el(Z, 'cap-baba', 'Capul Baba (extremitatea vestică)', 'punct_extrem', P(30, 440, 14), [PIN['v']],
   'Cel mai vestic punct al Asiei, în Peninsula Asia Mică (aproximativ 26°04′ E).', extrem='V', regiune='vest')
el(Z, 'cap-piai', 'Capul Piai (extremitatea sudică a continentului)', 'punct_extrem', P(472, 675, 14), [PIN['s1']],
   'Cel mai sudic punct al continentului asiatic, în Peninsula Malacca (aproximativ 1°16′ N).', extrem='S', regiune='sud-est')
el(Z, 'extrem-n-insular', 'Extremitatea nordică insulară (Severnaia Zemlia)', 'punct_extrem', P(425, 65, 14), [PIN['n1'], [338, 90, 112, 30]],
   'Punctul cel mai nordic al Asiei, dacă socotim și insulele, se află în arhipelagul Severnaia Zemlia.', extrem='N', regiune='nord')
el(Z, 'extrem-s-insular', 'Insula Roti (extremitatea sudică insulară)', 'punct_extrem', P(578, 744, 14), [PIN['s2']],
   'Punctul cel mai sudic al Asiei, dacă socotim și insulele: Insula Roti, la sud-vest de Timor, în Arhipelagul Indonezian.', extrem='S', regiune='sud-est')
# --- peninsule
el(Z, 'pen-iamal', 'Peninsula Iamal', 'peninsula', P(285, 185, 22), [[266, 152, 28, 66]], 'Peninsulă din nordul Siberiei de Vest, între Marea Kara și Golful Obi, cu mari zăcăminte de gaze naturale.', regiune='nord')
el(Z, 'pen-taimir', 'Peninsula Taimîr', 'peninsula', P(480, 125, 28), [[444, 122, 82, 22]], 'Cea mai nordică peninsulă a Asiei. Aici se află Capul Celiuskin.', regiune='nord')
el(Z, 'pen-ciukotka', 'Peninsula Ciukotka', 'peninsula', P(925, 222, 20), [[896, 206, 52, 32]], 'În extremitatea nord-estică a Asiei. Aici se află Capul Dejnev.', regiune='est')
el(Z, 'pen-kamciatka', 'Peninsula Kamciatka', 'peninsula', P(795, 300, 24), [[770, 262, 60, 66]], 'Peninsulă cu mulți vulcani activi, între Marea Ohotsk și Oceanul Pacific.', regiune='est')
el(Z, 'pen-coreea', 'Peninsula Coreea', 'peninsula', P(595, 455, 14), [[577, 438, 30, 30]], 'Între Marea Galbenă și Marea Japoniei.', regiune='est')
el(Z, 'pen-indochina', 'Peninsula Indochina', 'peninsula', P(480, 600, 30), [[444, 568, 58, 52]], 'Peninsulă din sud-estul Asiei, străbătută de Mekong.', regiune='sud-est')
el(Z, 'pen-malacca', 'Peninsula Malacca', 'peninsula', P(455, 650, 16), [[434, 600, 40, 68]], 'Peninsulă lungă și îngustă; la capătul ei sudic se află Capul Piai.', regiune='sud-est')
el(Z, 'pen-india', 'Peninsula India (Hindustan)', 'peninsula', P(325, 600, 35), [[294, 562, 46, 28]], 'Peninsulă de formă triunghiulară, ocupată în mare parte de Podișul Deccan.', regiune='sud')
el(Z, 'pen-arabia', 'Peninsula Arabia', 'peninsula', P(130, 555, 40), [[104, 519, 60, 28]], 'Cea mai mare peninsulă de pe Terra, acoperită în mare parte de deșerturi.', regiune='vest')
el(Z, 'pen-asia-mica', 'Peninsula Asia Mică (Anatolia)', 'peninsula', P(60, 450, 22), [[28, 429, 66, 28]], 'Între Marea Neagră și Marea Mediterană. Aici se află Capul Baba.', regiune='vest')
# --- insule și arhipelaguri
el(Z, 'i-severnaia', 'Insulele Severnaia Zemlia', 'insula', P(435, 75, 22), [[338, 90, 112, 30], PIN['n1']], 'Arhipelag rusesc în Oceanul Arctic.', regiune='nord')
el(Z, 'i-noua-siberie', 'Insulele Noua Siberie', 'insula', P(683, 132, 22), [[648, 98, 84, 30]], 'Arhipelag rusesc între Marea Laptev și Marea Siberiei de Est.', regiune='nord')
el(Z, 'i-sahalin', 'Insula Sahalin', 'insula', P(692, 350, 18), [[686, 360, 36, 28]], 'Insulă rusească lungă și îngustă, la nord de Hokkaido.', regiune='est')
el(Z, 'i-kurile', 'Insulele Kurile', 'insula', P(750, 385, 20), [[735, 382, 40, 30]], 'Lanț de insule vulcanice între Kamciatka și Hokkaido.', regiune='est')
el(Z, 'i-hokkaido', 'Insula Hokkaido', 'insula', P(705, 405, 14), [[705, 415, 45, 20]], 'Cea mai nordică dintre insulele mari ale Japoniei.', regiune='est')
el(Z, 'i-honshu', 'Insula Honshu', 'insula', P(680, 445, 18), [[686, 442, 44, 18]], 'Cea mai mare insulă a Japoniei. Aici se află Tokyo și Muntele Fuji.', regiune='est')
el(Z, 'i-shikoku', 'Insula Shikoku', 'insula', P(640, 482, 10), [[642, 476, 42, 18]], 'Cea mai mică dintre cele patru insule mari ale Japoniei.', regiune='est')
el(Z, 'i-kyushu', 'Insula Kyushu', 'insula', P(624, 495, 10), [[624, 488, 42, 16]], 'Cea mai sudică dintre cele patru insule mari ale Japoniei.', regiune='est')
el(Z, 'arh-japonez', 'Arhipelagul Japonez', 'insula', P(685, 450, 40), [[698, 458, 42, 28]], 'Format din patru insule mari (Hokkaido, Honshu, Shikoku, Kyushu) și mii de insule mici.', regiune='est')
el(Z, 'i-taiwan', 'Insula Taiwan', 'insula', P(572, 550, 10), [[576, 540, 44, 28]], 'Insulă la est de China, între Marea Chinei de Est și Marea Chinei de Sud.', regiune='est')
el(Z, 'i-hainan', 'Insula Hainan', 'insula', P(512, 583, 12), [[498, 570, 46, 30]], 'Insulă chinezească în Marea Chinei de Sud.', regiune='sud-est')
el(Z, 'i-luzon', 'Insula Luzon', 'insula', P(575, 572, 16), [[560, 572, 46, 18]], 'Cea mai mare insulă a Filipinelor.', regiune='sud-est')
el(Z, 'i-mindanao', 'Insula Mindanao', 'insula', P(595, 632, 16), [[598, 625, 48, 18]], 'A doua insulă ca mărime din Filipine, în sudul arhipelagului.', regiune='sud-est')
el(Z, 'arh-filipine', 'Arhipelagul Filipine', 'insula', P(590, 600, 30), [[594, 595, 48, 30]], 'Arhipelag format din peste 7 000 de insule.', regiune='sud-est')
el(Z, 'i-kalimantan', 'Insula Kalimantan (Borneo)', 'insula', P(525, 660, 28), [[476, 666, 66, 26]], 'A treia insulă ca mărime de pe Terra, împărțită între Indonezia, Malaysia și Brunei.', regiune='sud-est')
el(Z, 'i-sulawesi', 'Insula Sulawesi', 'insula', P(590, 665, 18), [[563, 654, 58, 20]], 'Insulă indoneziană cu o formă neobișnuită, cu brațe lungi și înguste.', regiune='sud-est')
el(Z, 'i-sumatra', 'Insula Sumatra', 'insula', P(455, 690, 20), [[455, 671, 38, 30]], 'Insulă mare a Indoneziei, traversată de Ecuator.', regiune='sud-est')
el(Z, 'i-java', 'Insula Java', 'insula', P(515, 722, 18), [[487, 719, 34, 18]], 'Cea mai populată insulă de pe Terra, cu mulți vulcani activi.', regiune='sud-est')
el(Z, 'i-timor', 'Insula Timor', 'insula', P(600, 738, 12), [[580, 729, 32, 16]], 'Insulă în sud-estul Arhipelagului Indonezian.', regiune='sud-est')
el(Z, 'arh-indonezian', 'Arhipelagul Indonezian', 'insula', P(530, 700, 60), [[476, 734, 94, 18]], 'Cel mai mare arhipelag de pe Terra.', regiune='sud-est')
el(Z, 'i-noua-guinee', 'Insula Noua Guinee', 'insula', P(700, 700, 30), [[650, 671, 76, 20]], 'A doua insulă ca mărime de pe Terra.', regiune='sud-est')
el(Z, 'i-sri-lanka', 'Insula Sri Lanka', 'insula', P(338, 640, 12), [[338, 618, 58, 18]], 'Insulă la sud-est de Peninsula India.', regiune='sud')
el(Z, 'i-maldive', 'Insulele Maldive', 'insula', P(292, 655, 16), [[242, 661, 62, 18]], 'Arhipelag de atoli din corali, foarte puțin înalți deasupra nivelului mării.', regiune='sud')
# --- strâmtori
el(Z, 'str-bering', 'Strâmtoarea Bering', 'stramtoare', P(962, 235, 12), [[962, 212, 24, 40]], 'Desparte Asia de America de Nord și leagă Oceanul Arctic de Oceanul Pacific.', regiune='est')
el(Z, 'str-ormuz', 'Strâmtoarea Ormuz', 'stramtoare', P(198, 525, 10), [[207, 513, 52, 18]], 'Leagă Golful Persic de Golful Oman. Pe aici trec multe petroliere.', regiune='vest')
el(Z, 'str-bab', 'Strâmtoarea Bab-el-Mandeb', 'stramtoare', P(115, 605, 10), [[122, 572, 78, 38]], 'Leagă Marea Roșie de Golful Aden și desparte Asia de Africa.', regiune='vest')
# --- golfuri
el(Z, 'g-persic', 'Golful Persic', 'golf', P(168, 520, 14), [[152, 500, 26, 36]], 'Golf al Oceanului Indian, cu mari zăcăminte de petrol pe țărmuri.', regiune='vest')
el(Z, 'g-oman', 'Golful Oman', 'golf', P(220, 540, 14), [[205, 525, 52, 16]], 'Leagă Marea Arabiei de Strâmtoarea Ormuz.', regiune='vest')
el(Z, 'g-aden', 'Golful Aden', 'golf', P(140, 610, 14), [[126, 590, 56, 24]], 'Între Peninsula Arabia și Africa. Prin Bab-el-Mandeb comunică cu Marea Roșie.', regiune='vest')
el(Z, 'g-bengal', 'Golful Bengal', 'golf', P(375, 610, 28), [[355, 582, 48, 32]], 'Considerat cel mai mare golf de pe Terra.', regiune='sud')
el(Z, 'g-anadir', 'Golful Anadîr', 'golf', P(915, 250, 12), [[903, 236, 40, 30]], 'Golf al Mării Bering, la sud de Peninsula Ciukotka.', regiune='est')
# --- mări
el(Z, 'p-kara', 'Marea Kara', 'mare', P(280, 135, 22), [[254, 112, 86, 32]], 'Mare a Oceanului Arctic, la est de Novaia Zemlia.', regiune='nord')
el(Z, 'p-laptev', 'Marea Laptev', 'mare', P(580, 120, 28), [[530, 114, 112, 30]], 'Mare a Oceanului Arctic, între Peninsula Taimîr și Insulele Noua Siberie.', regiune='nord')
el(Z, 'p-siberiei-est', 'Marea Siberiei de Est', 'mare', P(760, 150, 30), [[698, 135, 162, 55]], 'Mare a Oceanului Arctic, la est de Insulele Noua Siberie.', regiune='nord')
el(Z, 'p-bering', 'Marea Bering', 'mare', P(880, 285, 28), [[880, 270, 100, 32]], 'Mare a Oceanului Pacific, la sud de Strâmtoarea Bering.', regiune='est')
el(Z, 'p-ohotsk', 'Marea Ohotsk', 'mare', P(725, 315, 28), [[672, 317, 96, 24]], 'Între Kamciatka, Insulele Kurile și Sahalin.', regiune='est')
el(Z, 'p-japoniei', 'Marea Japoniei', 'mare', P(660, 430, 22), [[634, 368, 60, 88]], 'Între Arhipelagul Japonez și continent.', regiune='est')
el(Z, 'p-galbena', 'Marea Galbenă', 'mare', P(575, 455, 12), [[566, 414, 24, 64]], 'Între China și Peninsula Coreea.', regiune='est')
el(Z, 'p-chinei-est', 'Marea Chinei de Est', 'mare', P(600, 490, 18), [[580, 440, 48, 92]], 'Între China, Japonia și Taiwan.', regiune='est')
el(Z, 'p-chinei-sud', 'Marea Chinei de Sud', 'mare', P(530, 620, 28), [[478, 640, 40, 70], [505, 600, 45, 55], [540, 572, 45, 45]], 'Între Indochina, Filipine și Borneo.', regiune='sud-est')
el(Z, 'p-arabiei', 'Marea Arabiei', 'mare', P(240, 595, 35), [[220, 558, 60, 32]], 'Între Peninsula Arabia și Peninsula India.', regiune='sud')
el(Z, 'p-rosie', 'Marea Roșie', 'mare', P(95, 560, 14), [[68, 505, 30, 45], [90, 545, 38, 55]], 'Desparte Peninsula Arabia de Africa.', regiune='vest')
el(Z, 'p-neagra', 'Marea Neagră', 'mare', P(70, 415, 18), [[28, 404, 96, 28]], 'La limita dintre Europa și Asia.', regiune='vest')
el(Z, 'p-mediterana', 'Marea Mediterană', 'mare', P(30, 470, 18), [[10, 455, 80, 38]], 'Udă țărmul vestic al Peninsulei Asia Mică.', regiune='vest')
el(Z, 'p-caspica', 'Marea Caspică', 'mare', P(160, 425, 18), [[144, 374, 34, 62]], 'Cel mai întins lac de pe Terra, la limita dintre Europa și Asia.', regiune='vest')
el(Z, 'p-java', 'Marea Java', 'mare', P(520, 705, 20), [[476, 692, 82, 28]], 'Între Kalimantan (Borneo), Java și Sumatra.', regiune='sud-est')
el(Z, 'p-arafura', 'Marea Arafura', 'mare', P(680, 735, 22), [[590, 724, 144, 24]], 'Între Noua Guinee și Australia.', regiune='sud-est')
el(Z, 'p-oc-arctic', 'Oceanul Arctic', 'ocean', P(330, 70, 60), [[233, 54, 145, 42], [518, 78, 130, 36]], 'Udă țărmul nordic al Asiei.', regiune='nord')
el(Z, 'p-oc-pacific', 'Oceanul Pacific', 'ocean', P(800, 560, 80), [[736, 461, 160, 26], [730, 606, 150, 24]], 'Udă țărmul estic al Asiei.', regiune='est')
el(Z, 'p-oc-indian', 'Oceanul Indian', 'ocean', P(230, 680, 70), [[140, 640, 170, 55], [355, 640, 95, 80]], 'Udă țărmul sudic al Asiei.', regiune='sud')
# --- linii ale rețelei geografice
el(Z, 'ecuator', 'Ecuatorul', 'linie', L([(25, 682), (500, 679), (970, 669)], 10), [[735, 655, 66, 22]],
   'Împarte Pământul în emisfera nordică și emisfera sudică. Trece prin Sumatra și Kalimantan.', regiune='sud-est')
el(Z, 'tropic-rac', 'Tropicul Racului', 'linie', L([(25, 537), (500, 538), (970, 526)], 10), [[740, 518, 64, 36]],
   'Paralela de aproximativ 23°27′ N. Traversează Peninsula Arabia, India și sudul Chinei.', regiune='sud')
el(Z, 'cerc-polar', 'Cercul Polar de Nord', 'linie', L([(26, 203), (250, 226), (516, 234), (950, 234)], 10), [[478, 214, 174, 26]],
   'Paralela de aproximativ 66°33′ N. La nord de ea apar ziua polară și noaptea polară.', regiune='nord')
el(Z, 'meridian-180', 'Meridianul de 180°', 'linie', L([(902, 55), (902, 705)], 10), [[876, 400, 26, 248], [885, 36, 40, 18], [877, 744, 40, 18]],
   'De-a lungul lui trece, în mare, linia de schimbare a datei. O mică parte din Ciukotka se află în emisfera vestică.', regiune='est')
# --- vecinătăți
el(Z, 'vec-europa', 'Europa', 'vecin', P(150, 300, 60), [[165, 286, 180, 38]], 'Limita față de Asia: Munții Ural, râul Ural, Marea Caspică, Munții Caucaz și Marea Neagră.', regiune='vest')
el(Z, 'vec-africa', 'Africa', 'vecin', P(60, 650, 40), [[36, 634, 92, 32]], 'Despărțită de Asia prin Canalul Suez și Marea Roșie.', regiune='vest')
el(Z, 'vec-america', 'America de Nord', 'vecin', P(985, 240, 20), [[962, 85, 38, 220]], 'Despărțită de Asia prin Strâmtoarea Bering.', regiune='est')
el(Z, 'vec-australia', 'Australia', 'vecin', P(720, 760, 25), [[664, 745, 130, 24]], 'Se află la sud-est de Arhipelagul Indonezian.', regiune='sud-est')

# =====================================================================  HARTA RELIEFULUI (2286 × 1667)
R = 'relief'
# --- câmpii
el(R, 'c-siberiei-vest', 'Câmpia Siberiei de Vest', 'campie', P(650, 470, 120), [[645, 488, 110, 100]], 'Una dintre cele mai întinse câmpii de pe Terra, cu multe mlaștini. O străbate râul Obi.', regiune='siberia')
el(R, 'c-turanului', 'Câmpia Turanului', 'campie', P(470, 880, 60), [[436, 844, 120, 88]], 'Câmpie joasă și uscată, cu deșerturi, la est de Marea Caspică.', regiune='centru')
el(R, 'c-mesopotamiei', 'Câmpia Mesopotamiei', 'campie', L([(220, 980), (265, 1030), (315, 1085)], 30), [[205, 960, 50, 55], [240, 1010, 50, 50], [275, 1050, 50, 50], [285, 1090, 50, 35]], 'Câmpia dintre Tigru și Eufrat, „țara dintre râuri”.', regiune='vest')
el(R, 'c-indusului', 'Câmpia Indusului', 'campie', L([(615, 1040), (600, 1100), (585, 1170)], 30), [[558, 1040, 50, 75], [578, 1110, 72, 80], [560, 1115, 45, 45], [615, 1070, 40, 45]], 'Câmpie formată din aluviunile aduse de Indus.', regiune='sud')
el(R, 'c-gangelui', 'Câmpia Gangelui', 'campie', L([(730, 1120), (820, 1140), (900, 1160)], 35), [[700, 1095, 215, 85]], 'Câmpie foarte fertilă și foarte populată.', regiune='sud')
el(R, 'c-chineza', 'Marea Câmpie Chineză', 'campie', P(1260, 1040, 55), [[1216, 1008, 100, 96]], 'Formată din aluviunile fluviilor Huang He și Chang Jiang.', regiune='est')
el(R, 'c-mekongului', 'Câmpia Mekongului', 'campie', P(1080, 1330, 40), [[992, 1252, 60, 45], [1030, 1285, 60, 45], [1065, 1318, 58, 48]], 'Câmpie fertilă, cu orezării, la vărsarea Mekongului.', regiune='sud-est')
# --- podișuri
el(R, 'p-siberiei-centrale', 'Podișul Siberiei Centrale', 'podis', P(1100, 430, 150), [[1080, 383, 110, 95]], 'Podiș întins între Enisei și Lena.', regiune='siberia')
el(R, 'p-anatoliei', 'Podișul Anatoliei', 'podis', P(100, 955, 55), [[46, 916, 120, 66]], 'Podiș înalt în Peninsula Asia Mică, înconjurat de munți.', regiune='vest')
el(R, 'p-iran', 'Podișul Iran', 'podis', P(430, 1040, 65), [[360, 1005, 100, 80]], 'Podiș uscat, mărginit de Munții Elburs și Munții Zagros.', regiune='vest')
el(R, 'p-pamir', 'Podișul Pamir', 'podis', P(660, 955, 30), [[620, 925, 92, 55]], 'Numit „Acoperișul lumii”. De aici pornesc lanțuri muntoase foarte înalte.', regiune='centru')
el(R, 'p-tibet', 'Podișul Tibet', 'podis', P(880, 1030, 95), [[812, 1008, 90, 60]], 'Cel mai înalt și cel mai întins podiș înalt de pe Terra, cu altitudini medii de peste 4 000 m.', regiune='centru')
el(R, 'p-loess', 'Podișul de Loess', 'podis', P(1140, 950, 50), [[1096, 920, 112, 68]], 'Acoperit cu loess, un depozit fin adus de vânt, ușor de erodat de ape.', regiune='est')
el(R, 'p-deccan', 'Podișul Deccan', 'podis', P(720, 1250, 60), [[672, 1180, 100, 64]], 'Ocupă cea mai mare parte a Peninsulei India, între Munții Gații de Vest și Gații de Est.', regiune='sud')
# --- munți
el(R, 'm-ural', 'Munții Ural', 'munti', L([(478, 440), (465, 540), (455, 650), (445, 760)], 25), [[444, 515, 36, 140]], 'Munți vechi și joși. Sunt limita convențională dintre Europa și Asia.', regiune='vest')
el(R, 'm-caucaz', 'Munții Caucaz', 'munti', L([(205, 870), (270, 900), (345, 930)], 25), [[196, 860, 90, 40], [270, 885, 90, 48]], 'Munți înalți între Marea Neagră și Marea Caspică.', regiune='vest')
el(R, 'm-elburs', 'Munții Elburs', 'munti', L([(300, 985), (380, 970), (450, 955)], 25), [[282, 985, 90, 45], [360, 965, 100, 40]], 'Munți la sud de Marea Caspică.', regiune='vest')
el(R, 'm-zagros', 'Munții Zagros', 'munti', L([(290, 995), (350, 1055), (410, 1120)], 28), [[285, 990, 50, 50], [320, 1030, 50, 50], [360, 1070, 60, 60]], 'Munți în vestul Iranului, de-a lungul Golfului Persic.', regiune='vest')
el(R, 'm-hindukush', 'Munții Hindukush', 'munti', L([(560, 1020), (610, 995), (660, 970)], 25), [[545, 990, 60, 45], [590, 955, 75, 50], [535, 1015, 80, 40]], 'Munți înalți în Afganistan și Pakistan.', regiune='centru')
el(R, 'm-karakorum', 'Munții Karakorum', 'munti', L([(680, 990), (740, 995), (790, 1005)], 22), [[650, 975, 145, 45], [600, 1020, 110, 35]], 'Aici se află vârful K2, al doilea ca înălțime de pe Terra.', regiune='centru')
el(R, 'm-himalaya', 'Munții Himalaya', 'munti', L([(700, 1060), (790, 1100), (880, 1130), (980, 1150)], 30), [[698, 1045, 100, 55], [795, 1078, 40, 44], [856, 1100, 52, 36]], 'Cei mai înalți munți de pe Terra. S-au format prin ciocnirea plăcii Indiei cu restul Asiei.', regiune='centru')
el(R, 'm-kunlun', 'Munții Kunlun', 'munti', L([(760, 995), (850, 975), (940, 960)], 25), [[760, 955, 175, 35], [760, 975, 90, 30]], 'Mărginesc la nord Podișul Tibet.', regiune='centru')
el(R, 'm-tian-shan', 'Munții Tian Shan', 'munti', L([(640, 895), (730, 875), (830, 870)], 25), [[630, 855, 210, 40], [625, 885, 80, 40]], '„Munții Cerești”, între Kazahstan, Kârgâzstan și China.', regiune='centru')
el(R, 'm-altai', 'Munții Altai', 'munti', L([(820, 780), (885, 745), (950, 710)], 28), [[815, 740, 70, 45], [870, 705, 85, 45]], 'La întâlnirea Rusiei, Kazahstanului, Chinei și Mongoliei. Aici izvorăsc Obi și Irtîș.', regiune='centru')
el(R, 'm-saian', 'Munții Saian', 'munti', P(1010, 770, 38), [[970, 740, 82, 60]], 'În sudul Siberiei, la vest de Lacul Baikal.', regiune='siberia')
el(R, 'm-iablonovii', 'Munții Iablonovîi', 'munti', L([(1170, 760), (1210, 710), (1250, 660)], 28), [[1150, 700, 60, 70], [1185, 650, 80, 70], [1200, 700, 40, 40]], 'La est de Lacul Baikal.', regiune='siberia')
el(R, 'm-hinganul', 'Munții Hinganul Mare', 'munti', L([(1320, 860), (1350, 790), (1390, 720)], 30), [[1294, 716, 114, 100]], 'Despart Câmpia Manciuriei de Podișul Mongoliei.', regiune='est')
el(R, 'm-verhoiansk', 'Munții Verhoiansk', 'munti', L([(1390, 350), (1450, 410), (1530, 480)], 30), [[1380, 330, 70, 70], [1430, 390, 70, 65], [1480, 440, 70, 65], [1395, 365, 60, 60]], 'În apropiere se află unul dintre „polii frigului” din emisfera nordică.', regiune='siberia')
el(R, 'm-cerski', 'Munții Cerski', 'munti', P(1610, 470, 55), [[1556, 440, 104, 68], [1548, 470, 30, 40]], 'Munți în nord-estul Siberiei.', regiune='siberia')
el(R, 'm-kolima', 'Munții Kolîma', 'munti', L([(1760, 520), (1830, 490), (1910, 455)], 28), [[1745, 490, 90, 45], [1820, 450, 100, 45]], 'Munți în nord-estul Siberiei, la nord de Marea Ohotsk.', regiune='siberia')
el(R, 'm-gatii-vest', 'Munții Gații de Vest', 'munti', L([(640, 1160), (680, 1260), (710, 1370)], 25), [[630, 1165, 50, 80], [655, 1240, 55, 80], [680, 1310, 52, 80]], 'Mărginesc la vest Podișul Deccan și primesc ploi musonice foarte bogate.', regiune='sud')
el(R, 'm-gatii-est', 'Munții Gații de Est', 'munti', L([(720, 1340), (790, 1260), (870, 1180)], 25), [[700, 1290, 60, 72], [745, 1225, 62, 70], [795, 1168, 90, 62]], 'Mărginesc la est Podișul Deccan. Sunt mai joși și mai fragmentați decât Gații de Vest.', regiune='sud')
# --- deșerturi
el(R, 'd-karakum', 'Deșertul Karakum', 'desert', P(520, 960, 45), [[466, 925, 120, 72]], 'Deșert de nisip în Turkmenistan.', regiune='centru')
el(R, 'd-taklamakan', 'Deșertul Taklamakan', 'desert', P(800, 935, 65), [[700, 900, 165, 65]], 'Deșert de nisip în vestul Chinei, înconjurat de munți înalți.', regiune='centru')
el(R, 'd-gobi', 'Deșertul Gobi', 'desert', P(1160, 860, 85), [[1108, 840, 110, 64]], 'Deșert rece în Mongolia și China, cu ierni geroase.', regiune='centru')
el(R, 'd-an-nafud', 'Deșertul An-Nafūd', 'desert', P(215, 1110, 45), [[160, 1066, 122, 66]], 'Deșert de nisip în nordul Peninsulei Arabia, cu dune roșiatice.', regiune='vest')
el(R, 'd-rub-al-khali', 'Deșertul Rub al-Khāli', 'desert', P(330, 1250, 60), [[254, 1228, 152, 64]], '„Sfertul gol”: cel mai mare deșert continuu de nisip de pe Terra.', regiune='vest')
# --- depresiuni
el(R, 'dep-turfan', 'Depresiunea Turfan (−154 m)', 'depresiune', P(858, 894, 14), [[868, 840, 156, 64], [844, 902, 96, 30]], 'Pe hartă: −154 m. Una dintre cele mai joase depresiuni de pe uscat.', valoare=-154, regiune='centru')
el(R, 'dep-marea-moarta', 'Țărmul Mării Moarte (−427 m)', 'depresiune', P(140, 1056, 14), [[110, 1016, 98, 30]], 'Pe hartă: −427 m. Țărmul Mării Moarte este cel mai jos loc de pe uscatul Terrei.', valoare=-427, regiune='vest')
# --- vârfuri
el(R, 'v-everest', 'Vârful Chomolungma / Everest (8 850 m)', 'varf', P(844, 1110, 14), [[850, 1068, 175, 26], [850, 1090, 180, 26]],
   'Cel mai înalt vârf de pe Terra. Pe hartă: 8 850 m; măsurătoarea comună China–Nepal din 2020 a dat 8 848,86 m.', valoare=8850, regiune='centru')
el(R, 'v-ararat', 'Ararat (5 165 m) – vulcan stins', 'varf', P(244, 932, 14), [[168, 916, 70, 28], [150, 942, 104, 28]], 'Vulcan stins, cel mai înalt vârf al Turciei (5 165 m pe hartă).', valoare=5165, regiune='vest')
# --- vulcani activi sau latenți
el(R, 'vu-kliucev', 'Kliucev (4 750 m)', 'vulcan', P(1864, 648, 14), [[1752, 604, 96, 30], [1740, 630, 120, 30]], 'Cel mai înalt vulcan activ din Asia (4 750 m pe hartă), în Peninsula Kamciatka.', valoare=4750, regiune='est')
el(R, 'vu-fuji', 'Fuji (3 776 m)', 'vulcan', P(1562, 994, 14), [[1572, 980, 52, 30], [1540, 1006, 116, 30]], 'Simbolul Japoniei: un vulcan cu formă de con aproape perfect, pe insula Honshu.', valoare=3776, regiune='est')
el(R, 'vu-sakura', 'Sakura (1 117 m)', 'vulcan', P(1448, 1064, 14), [[1455, 1048, 90, 30], [1430, 1076, 130, 28]], 'Vulcan foarte activ (Sakurajima) în sudul insulei Kyushu.', valoare=1117, regiune='est')
el(R, 'vu-mayon', 'Mayon (2 463 m)', 'vulcan', P(1314, 1270, 12), [[1212, 1222, 84, 28], [1196, 1246, 110, 28]], 'Vulcan din Filipine, cu formă de con aproape perfect.', valoare=2463, regiune='sud-est')
el(R, 'vu-pinatubo', 'Pinatubo (1 486 m)', 'vulcan', P(1304, 1291, 11), [[1184, 1278, 112, 28], [1180, 1302, 120, 28]], 'Erupția din 1991 a fost una dintre cele mai mari din secolul XX și a răcit temporar clima Terrei.', valoare=1486, regiune='sud-est')
el(R, 'vu-taal', 'Taal (311 m)', 'vulcan', P(1316, 1318, 12), [[1326, 1310, 54, 28], [1302, 1334, 98, 28]], 'Vulcan mic din Filipine, aflat pe o insulă dintr-un lac.', valoare=311, regiune='sud-est')
el(R, 'vu-krakatoa', 'Krakatoa (813 m)', 'vulcan', P(1102, 1594, 12), [[1012, 1600, 112, 28], [1020, 1626, 96, 28]], 'Erupția din 1883 s-a auzit la mii de kilometri distanță.', valoare=813, regiune='sud-est')
el(R, 'vu-merapi', 'Merapi (2 930 m)', 'vulcan', P(1168, 1616, 12), [[1152, 1555, 88, 28], [1136, 1578, 120, 28]], 'Unul dintre cei mai activi vulcani din Indonezia, pe insula Java.', valoare=2930, regiune='sud-est')
el(R, 'vu-semeru', 'Semeru (3 676 m)', 'vulcan', P(1206, 1624, 12), [[1214, 1608, 94, 30], [1200, 1636, 120, 30]], 'Cel mai înalt vulcan de pe insula Java.', valoare=3676, regiune='sud-est')
el(R, 'vu-tambora', 'Tambora (2 850 m)', 'vulcan', P(1316, 1622, 12), [[1322, 1604, 110, 30], [1312, 1630, 120, 30]], 'Erupția din 1815 a dus la „anul fără vară” (1816) în Europa și America de Nord.', valoare=2850, regiune='sud-est')
# --- oceane
el(R, 'r-oc-arctic', 'Oceanul Arctic', 'ocean', P(1300, 170, 130), [[505, 55, 330, 90], [1195, 35, 270, 100]], 'Udă țărmul nordic al Asiei.', regiune='nord')
el(R, 'r-oc-pacific', 'Oceanul Pacific', 'ocean', P(1950, 1000, 150), [[1795, 910, 325, 55], [1795, 1060, 315, 70]], 'Udă țărmul estic al Asiei.', regiune='est')
el(R, 'r-oc-indian', 'Oceanul Indian', 'ocean', P(700, 1500, 150), [[250, 1430, 260, 160], [500, 1400, 260, 120], [760, 1420, 140, 120], [880, 1540, 140, 110]], 'Udă țărmul sudic al Asiei.', regiune='sud')

# =====================================================================  REGIUNI ȘI NIVELURI
REGIUNI = [
    dict(id='ape', harta='hidrografie', nume='Apele Asiei', icon='🌊', culoare='#1e6fa8', niveluri=[
        dict(id='a1', titlu='Râurile Siberiei', categorii=['rau'], filtru={'bazin': ['arctic']}, tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='a2', titlu='Râuri spre Pacific și Oceanul Indian', categorii=['rau'], filtru={'bazin': ['pacific', 'indian']}, tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='a3', titlu='Lacuri și regiuni fără scurgere', categorii=['lac', 'regiune_endoreica'], extra_ids=['sir-daria', 'amu-daria', 'ural-rau'], tipuri=['gaseste', 'ce_e_aici']),
        dict(id='a4', titlu='Mări, golfuri și oceane', categorii=['mare', 'golf', 'ocean'], tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='a5', titlu='Spre ce ocean curge?', categorii=['rau'], tipuri=['ocean']),
        dict(id='a6', titlu='Amestec: apele Asiei', categorii=None, tipuri=['gaseste', 'ce_e_aici', 'eticheta', 'ocean']),
    ]),
    dict(id='granite', harta='pozitie', nume='Granițele Asiei', icon='🧭', culoare='#c0392b', niveluri=[
        dict(id='g1', titlu='Puncte extreme și vecini', categorii=['punct_extrem', 'vecin'], tipuri=['gaseste', 'ce_e_aici']),
        dict(id='g2', titlu='Peninsule', categorii=['peninsula'], tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='g3', titlu='Insule și arhipelaguri', categorii=['insula'], tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='g4', titlu='Mări și oceane', categorii=['mare', 'ocean'], tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='g5', titlu='Golfuri și strâmtori', categorii=['golf', 'stramtoare'], tipuri=['gaseste', 'ce_e_aici']),
        dict(id='g6', titlu='Liniile rețelei geografice', categorii=['linie'], tipuri=['gaseste', 'ce_e_aici']),
        dict(id='g7', titlu='Amestec: țărmurile Asiei', categorii=None, tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
    ]),
    dict(id='relief', harta='relief', nume='Relieful Asiei', icon='🏔️', culoare='#94532a', niveluri=[
        dict(id='r1', titlu='Câmpii', categorii=['campie'], tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='r2', titlu='Podișuri', categorii=['podis'], tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='r3', titlu='Munți', categorii=['munti'], tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='r4', titlu='Deșerturi și depresiuni', categorii=['desert', 'depresiune'], tipuri=['gaseste', 'ce_e_aici']),
        dict(id='r5', titlu='Vârfuri și vulcani', categorii=['varf', 'vulcan'], tipuri=['gaseste', 'ce_e_aici', 'eticheta']),
        dict(id='r6', titlu='Ce formă de relief este?', categorii=['campie', 'podis', 'munti', 'desert', 'depresiune'], tipuri=['clasifica']),
        dict(id='r7', titlu='Amestec: relieful Asiei', categorii=None, tipuri=['gaseste', 'ce_e_aici', 'eticheta', 'clasifica']),
    ]),
]

CATEGORII = {
    'rau': 'Râu', 'lac': 'Lac', 'regiune_endoreica': 'Regiune endoreică', 'mare': 'Mare', 'golf': 'Golf', 'ocean': 'Ocean',
    'punct_extrem': 'Punct extrem', 'peninsula': 'Peninsulă', 'insula': 'Insulă / arhipelag', 'stramtoare': 'Strâmtoare',
    'linie': 'Linie a rețelei geografice', 'vecin': 'Continent vecin',
    'campie': 'Câmpie', 'podis': 'Podiș', 'munti': 'Munți', 'desert': 'Deșert', 'depresiune': 'Depresiune', 'varf': 'Vârf montan', 'vulcan': 'Vulcan activ sau latent',
}
BAZINE = {'arctic': 'Oceanul Arctic', 'pacific': 'Oceanul Pacific', 'indian': 'Oceanul Indian',
          'neagra': 'Marea Neagră și Marea Mediterană', 'endoreic': 'Regiune endoreică (nu ajunge la ocean)'}

INSIGNE_ATLAS = [
    dict(id='hidrograful-siberiei', nume='Hidrograful Siberiei', icon='🛶', descriere='Ai găsit toate cele 8 râuri care curg spre Oceanul Arctic.',
         ids=['obi', 'irtis', 'enisei', 'tunguska-inf', 'tunguska-pietr', 'angara', 'lena', 'kolima']),
    dict(id='cuceritorul-himalayei', nume='Cuceritorul Himalayei', icon='🧗', descriere='Ai găsit Himalaya, Everestul, Podișul Tibet, Karakorum și Kunlun.',
         ids=['m-himalaya', 'v-everest', 'p-tibet', 'm-karakorum', 'm-kunlun']),
    dict(id='inelul-de-foc', nume='Inelul de Foc', icon='🌋', descriere='Ai găsit toți cei 10 vulcani activi sau latenți de pe hartă.',
         ids=['vu-kliucev', 'vu-fuji', 'vu-sakura', 'vu-mayon', 'vu-pinatubo', 'vu-taal', 'vu-krakatoa', 'vu-merapi', 'vu-semeru', 'vu-tambora']),
    dict(id='cele-patru-vanturi', nume='Cele patru vânturi', icon='🧭', descriere='Ai găsit cele patru extremități ale continentului.',
         ids=['cap-celiuskin', 'cap-dejnev', 'cap-baba', 'cap-piai']),
    dict(id='cartograful', nume='Cartograful', icon='🗺️', descriere='100% la Marele Atlas.', ids=[]),
]


# =====================================================================  generare
def culoare_fond(im, m):
    """culoarea dominantă din zona măștii (fundalul de sub text) – ca masca să se topească în hartă"""
    x, y, w, h = [int(v) for v in m]
    W, Hh = im.size
    cos = {}
    for xx in range(max(0, x), min(W, x + w), 2):
        for yy in range(max(0, y), min(Hh, y + h), 2):
            c = im.getpixel((xx, yy))
            if sum(c) < 240: continue                         # textul închis la culoare nu contează
            k = (c[0] // 24, c[1] // 24, c[2] // 24)
            cos.setdefault(k, []).append(c)
    if not cos: return '#e8eef0'
    grup = max(cos.values(), key=len)
    r = sum(c[0] for c in grup) // len(grup); g = sum(c[1] for c in grup) // len(grup); b = sum(c[2] for c in grup) // len(grup)
    return '#%02x%02x%02x' % (r, g, b)


def genereaza(dir_originale=None, dir_control=None):
    imagini = {}
    try:
        from PIL import Image
        for hid, hm in HARTI.items():
            cale = os.path.join(RAD, 'assets', 'atlas', hm['fisier'] + '.jpg')
            if dir_originale:
                im = Image.open(os.path.join(dir_originale, hm['original'])).convert('RGB')
                assert im.size == (hm['latime'], hm['inaltime']), (hid, im.size)
                os.makedirs(os.path.dirname(cale), exist_ok=True)
                im.save(cale, quality=86, optimize=True, progressive=True)
                im.save(cale[:-4] + '.webp', quality=80, method=6)
            if os.path.exists(cale):
                imagini[hid] = Image.open(cale).convert('RGB')
    except ImportError:
        pass

    def fr(hid, v, ax):
        return round(v / (HARTI[hid]['latime'] if ax == 0 else HARTI[hid]['inaltime']), 5)

    def masca(hid, m):
        im = imagini.get(hid)
        return {'x': fr(hid, m[0], 0), 'y': fr(hid, m[1], 1), 'w': fr(hid, m[2], 0), 'h': fr(hid, m[3], 1),
                'culoare': culoare_fond(im, m) if im else '#e8eef0'}

    ids = set()
    elemente = []
    for e in E:
        assert e['id'] not in ids, e['id']; ids.add(e['id'])
        hid = e['harta']; W = HARTI[hid]['latime']
        g = e['geometrie']
        if g['tip'] == 'punct':
            geom = {'tip': 'punct', 'c': [fr(hid, g['c'][0], 0), fr(hid, g['c'][1], 1)], 'r': round(g['r'] / W, 5)}
        else:
            geom = {'tip': 'polilinie', 'puncte': [[fr(hid, x, 0), fr(hid, y, 1)] for x, y in g['puncte']], 'toleranta': round(g['toleranta'] / W, 5)}
        out = {'id': e['id'], 'harta': hid, 'nume': e['nume'], 'categorie': e['categorie'], 'geometrie': geom,
               'masti': [masca(hid, m) for m in e['masti']], 'info': e['info'],
               'valoare': e.get('valoare'), 'dificultate': 2 if e['categorie'] in ('stramtoare', 'golf', 'linie', 'regiune_endoreica') else 1,
               'verificat': False, 'sursa': SURSA_HARTI.format(HARTI[hid]['titlu'])}
        for k in ('bazin', 'regiune', 'extrem', 'de_confirmat'):
            if k in e: out[k] = e[k]
        elemente.append(out)

    harti = {}
    for hid, hm in HARTI.items():
        harti[hid] = {'nume': hm['nume'], 'imagine': f"assets/atlas/{hm['fisier']}.webp", 'imagine_jpg': f"assets/atlas/{hm['fisier']}.jpg",
                      'latime': hm['latime'], 'inaltime': hm['inaltime'], 'titlu': hm['titlu'], 'sursa': SURSA_HARTI.format(hm['titlu']),
                      'masti_fixe': [masca(hid, m) for m in hm['masti_fixe']],
                      'legenda': masca(hid, hm['legenda']) if hm['legenda'] else None,
                      'scara': hm['scara']}
    for r in REGIUNI:
        for n in r['niveluri']:
            if n.get('extra_ids'):
                assert all(i in ids for i in n['extra_ids'])
    for ins in INSIGNE_ATLAS:
        assert all(i in ids for i in ins['ids']), ins['id']
    date = {'versiune': 1, 'harti': harti, 'regiuni': REGIUNI, 'categorii': CATEGORII, 'bazine': BAZINE,
            'insigne': [{k: v for k, v in i.items()} for i in INSIGNE_ATLAS], 'elemente': elemente}
    with open(os.path.join(RAD, 'data', 'atlas.json'), 'w', encoding='utf-8') as f:
        json.dump(date, f, ensure_ascii=False, indent=1)
    print(f'data/atlas.json: {len(elemente)} elemente pe {len(harti)} hărți, {sum(len(r["niveluri"]) for r in REGIUNI)} niveluri')

    if dir_control and imagini:
        from PIL import ImageDraw
        os.makedirs(dir_control, exist_ok=True)
        for hid, im0 in imagini.items():
            im = im0.copy(); d = ImageDraw.Draw(im, 'RGBA')
            for e in E:
                if e['harta'] != hid: continue
                for m in e['masti']:
                    d.rectangle([m[0], m[1], m[0] + m[2], m[1] + m[3]], fill=(255, 255, 255, 150), outline=(0, 0, 255, 255))
                g = e['geometrie']
                if g['tip'] == 'punct':
                    x, y, r = g['c'][0], g['c'][1], g['r']
                    d.ellipse([x - r, y - r, x + r, y + r], outline=(220, 0, 0, 255), width=2)
                else:
                    d.line([tuple(p) for p in g['puncte']], fill=(220, 0, 160, 220), width=max(2, g['toleranta'] // 2))
                cx, cy = g['c'] if g['tip'] == 'punct' else g['puncte'][len(g['puncte']) // 2]
                d.text((cx + 3, cy + 3), e['id'], fill=(0, 0, 0, 255))
            im.save(os.path.join(dir_control, f'control_{hid}.png'))
        print('control →', dir_control)


if __name__ == '__main__':
    a = sys.argv[1:]
    genereaza(a[a.index('--imagini') + 1] if '--imagini' in a else None, a[a.index('--control') + 1] if '--control' in a else None)

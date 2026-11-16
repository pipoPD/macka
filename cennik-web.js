// Cenník prevzatý z verejného webu www.mackinetorty.sk (16. 11. 2026).
// Slúži len na prvé naplnenie cenníka v appke; ďalej sa údaje upravujú v appke a sú vo Firebase (apps/cennik).
// Položka: {id, name, desc, valid, flav, note, vars:[{n, d, p, od, u, min}]}
//   n = varianta, d = detail (veľkosť, porcie), p = cena (číslo) alebo text, od = cena „od“,
//   u = "" (€ za celok) | "ks" (€/ks) | "+" (príplatok), min = minimálny odber v ks
var KORPUSY = "Korpusy: vanilka, kakao, orechy, škorica, mak, kokos\n" +
  "Plnky: vanilková, čokoláda tmavá, čokoláda biela, domáci karamel, kokos, mak, lemon curd (citrónový krém), lesné ovocie, arašidová s arašidmi, pistáciová, oreo s oreo keksíkmi\n" +
  "Doplnky do vnútra (max. 2 druhy): maliny, lesné ovocie, čučoriedky, višne, čerstvé jahody, mango, oriešky";
var CHEESE = "new york cheesecake (čistá vanilka), vanilkový základ s ovocným pyré (malina, čučoriedka, jahoda, lesné ovocie, mango), tmavá čokoláda, biela čokoláda, biela čokoláda s marakujou, raffaello, mak + citrón, citrón, slowtella, nutella, snickers, horalka (keks), mila (keks), oreo (keks), lotus (keks), banán v čokoláde, pistácia, slaný karamel, vanilkový s penou z lesného ovocia";
var BL4 = {n: "Bezlepková verzia", d: "", p: 4, u: "+"};
var JEDNO = [
  {n: "Priemer 18 cm", d: "do 10 porcií", p: 75, od: true},
  {n: "Priemer 21 cm", d: "10–15 porcií", p: 85, od: true},
  {n: "Priemer 24 cm", d: "15–20 porcií", p: 95, od: true},
  {n: "Priemer 27 cm", d: "20–30 porcií", p: 120, od: true},
  {n: "Srdiečko 23 cm", d: "12–16 porcií", p: 95, od: true}
];
function ks(p, min, n, d) { return {n: n || "Jedna príchuť", d: d || "", p: p, u: "ks", min: min || 0}; }

export var CENNIK_WEB = {
  src: "www.mackinetorty.sk, prevzaté 16. 11. 2026",
  torty: [
    {id: "t-jedno", name: "Jednoposchodové torty", valid: "1. 1. 2025",
      desc: "4 pláty korpusu a 3 vrstvy plnky; 1 druh korpusu a 2 príchute plnky. Väčšinou obtreté mascarpone krémom.",
      vars: JEDNO.concat([BL4]), flav: KORPUSY,
      note: "Náročné zdobenie, zápichy, medovníčky a jedlé obrázky môžu cenu zvýšiť."},
    {id: "t-dvoj", name: "Dvojposchodové torty", valid: "1. 1. 2025",
      desc: "4 pláty korpusu a 3 vrstvy plnky; 1 druh korpusu a 2 príchute plnky.",
      vars: [
        {n: "Mini poschodová", d: "22 / 15 cm, 20–25 porcií", p: 140, od: true},
        {n: "Malá poschodová", d: "25 / 18 cm, 30–40 porcií", p: 180, od: true},
        {n: "Veľká poschodová", d: "28 / 21 cm, 40–50 porcií", p: 220, od: true},
        BL4
      ], flav: KORPUSY, note: ""},
    {id: "t-troj", name: "Trojposchodové torty", valid: "1. 1. 2025",
      desc: "Každé poschodie môže mať inú príchuť. Cena individuálne podľa počtu porcií a požiadaviek.",
      vars: [{n: "Trojposchodová", d: "od 45 porcií", p: 250, od: true}, BL4], flav: KORPUSY, note: ""},
    {id: "t-detske", name: "Detské torty", valid: "1. 1. 2025",
      desc: "Veľkosti ako pri jednoposchodových tortách.",
      vars: JEDNO.concat([
        {n: "Zápich alebo medovníček", d: "podľa veľkosti a typu obrázka", p: "5–20 €/ks"},
        {n: "Jedlý obrázok", d: "", p: "cca 5–10 €"}
      ]), flav: "",
      note: "Zápichy a medovníčky objednať aspoň 2 týždne vopred (robia ich externí dodávatelia). Jedlý obrázok sa dá aj na kratší termín.\nTorta s jedlým obrázkom je vždy obtretá maslovým krémom."},
    {id: "t-pavlova", name: "Pavlova torta", valid: "1. 1. 2025", desc: "",
      vars: [
        {n: "Priemer 24 cm", d: "10–15 porcií", p: 55, od: true},
        {n: "Priemer 27 cm", d: "20–25 porcií", p: 65, od: true},
        {n: "Venček 25 cm", d: "10–15 porcií", p: 55, od: true},
        {n: "Srdiečko", d: "10–15 porcií", p: 55, od: true}
      ],
      flav: "celá vanilková; vanilková poprášená kakaom s čokoládovým krémom; vanilková poliata karamelom; vanilková s lemon curd",
      note: "Plní sa hodinu pred odovzdaním, preto treba presný čas odberu."}
  ],
  kolace: [
    {id: "k-cheesecake", name: "Cheesecake", valid: "15. 1. 2026", desc: "",
      vars: [
        {n: "Jedna príchuť, celý, bohato ozdobený", d: "24 cm, 12–14 porcií", p: 55},
        {n: "Jedna príchuť, nakrájaný", d: "24 cm, 12 alebo 14 kúskov", p: 50.4},
        {n: "MIX 3, 4 alebo 6 príchutí, nakrájaný", d: "24 cm, 12 kúskov", p: 50.4},
        {n: "Srdiečko, jedna príchuť, nakrájaný", d: "12–14 porcií", p: 50.4},
        {n: "MIX malá krabička", d: "6 ks", p: ""},
        {n: "Bezlepková verzia", d: "okrem horalky, lotusu a oreo", p: 6, u: "+"}
      ], flav: CHEESE, note: "Príchute v MIXe zostavuje cukráreň, vždy sladšie aj ovocné."},
    {id: "k-minipavlovky", name: "Minipavlovky", valid: "15. 1. 2026", desc: "Priemer cca 8 cm, bezlepkové. Na dlhú prepravu sa neodporúčajú.",
      vars: [ks(3.2, 10)], flav: "celá vanilková, čokoládový krém, karamelový krém, čučoriedkový krém, citrónová", note: ""},
    {id: "k-cheesekocky", name: "Cheesecake kocky", valid: "15. 1. 2026", desc: "4,5 × 4,5 cm",
      vars: [ks(2.5, 15)], flav: CHEESE.replace("slowtella, ", ""), note: ""},
    {id: "k-puncak", name: "Malinový punčák", valid: "15. 1. 2026", desc: "4,5 × 4,5 cm. Rum, malinové pyré, biela čokoláda.",
      vars: [ks(2.5, 10)], flav: "", note: ""},
    {id: "k-brownies", name: "Čokoládový brownies", valid: "15. 1. 2026", desc: "4,5 × 4,5 cm",
      vars: [ks(2.5, 10, "S karamelom a opraženými mandľami"), ks(2.5, 10, "S čokoládovou ganache")], flav: "", note: ""},
    {id: "k-rolady", name: "Rolády", valid: "2. 8. 2026", desc: "",
      vars: [ks(3.5, 10)], flav: "nutellová s jahodami, tiramisu, mrkvová s vanilkovým krémom, pistáciová s malinami", note: ""},
    {id: "k-sacher", name: "Sacher srdiečko", valid: "15. 1. 2026", desc: "Mini tortička: čokoládový korpus, kyslý džem, parížsky krém, čerstvé ovocie.",
      vars: [ks(3.2, 12)], flav: "", note: ""},
    {id: "k-tartaletky", name: "Tartaletky", valid: "15. 1. 2026", desc: "Veľká tartaletka, priemer 6,5 cm",
      vars: [ks(2.5, 10)],
      flav: "tmavá čokoláda s višňami, biela čokoláda s malinami, mliečna čokoláda, tofiffee, slaný karamel, pistácia, mak + citrón, lesné ovocie, malina, čučoriedka, tmavá čokoláda s jahodou, vaječný likér, baileys, snickers, banán v čokoláde, kokos + mango",
      note: ""},
    {id: "k-tartdeluxe", name: "Tartaletka deluxe", valid: "15. 1. 2026", desc: "Hlbšia ako košíky.",
      vars: [ks(2.8, 10)],
      flav: "jahody v tmavej čokoláde s jahodovou penou, raffaello s mliečnou čokoládou a kokosovou penou, banoffee, pistáciová s malinami a malinovou ganache, snickers, extra malina, mango + kokosová ganache, lieskovcová ganache s čokoládovou penou, extra čučoriedková, nutellová s banánom a lieskovcovým praliné, marakujový curd s tmavou ganache, biela čokoláda s malinami, tmavá čokoláda s jahodami, tmavá čokoláda s višňami",
      note: ""},
    {id: "k-makronky", name: "Makronky", valid: "1. 1. 2025", desc: "",
      vars: [
        ks(1.6, 20),
        {n: "Víkendové makronky", d: "6 príchutí každý víkend", p: "", min: 6},
        ks(1.6, 10, "Makronková bonboniéra", "objednať aspoň 1 týždeň vopred, aj s obrázkom a textom")
      ],
      flav: "tmavá čokoláda, mliečna čokoláda, slaný karamel, tofiffee, malina, lesné ovocie, čučoriedka, citrón, mango, marakuja, jahoda, pistácia, lotus keks, oreo keks, škorica, cappuccino, kokos, mak, sezónne príchute",
      note: "Pri víkendových makronkách web cenu neuvádza."},
    {id: "k-poharik", name: "Pohárikové dezerty", valid: "15. 1. 2026", desc: "120 ml, plastové poháriky",
      vars: [ks(3.3, 10, "Jeden druh")], flav: "panna cotta (jahodová, čučoriedková, malinová), tiramisu", note: ""},
    {id: "k-mixvikend", name: "Víkendové MIX krabičky", valid: "1. 3. 2023", desc: "Aspoň 10 druhov, ktoré sa pečú v danom týždni.",
      vars: [
        {n: "10 ks", d: "", p: "individuálne"},
        {n: "16 ks", d: "", p: "individuálne"},
        {n: "25 ks", d: "", p: "individuálne"},
        {n: "Väčší počet", d: "", p: "individuálne"}
      ], flav: "", note: "Cena podľa aktuálneho zloženia."},
    {id: "k-candybar", name: "Sladký bar (Candy bar)", valid: "1. 1. 2023", desc: "",
      vars: [{n: "Dovoz", d: "dovoz, nastretie, zapožičanie a odvoz inventára", p: 70, od: true}],
      flav: "", note: "Odporúčanie: 3–4 ks dezertov na osobu, ak nie sú tradičné zákusky, inak 2–3 ks.\nPrievidza a blízke okolie."},
    {id: "k-vysluzky", name: "Svadobné výslužky", valid: "", desc: "",
      vars: [{n: "Výslužky", d: "počet a druhy podľa zákazníka", p: "individuálne"}], flav: "", note: ""},
    {id: "k-spic", name: "Likérový špic", valid: "", desc: "Väčší ako bežne, 70 % belgická čokoláda, pravý likér.",
      vars: [ks(3.6, 10)], flav: "", note: ""},
    {id: "k-veternik", name: "Veterník", valid: "15. 1. 2026", desc: "",
      vars: [ks(3.3, 10), {n: "Veterníkový venček", d: "jedna príchuť, cca 10 ks", p: 35}],
      flav: "karamelový, pistáciový, čokoládový, malinový, citrónový", note: ""},
    {id: "k-kremes", name: "Medový krémeš", valid: "15. 1. 2026", desc: "", vars: [ks(2.7, 10)], flav: "", note: ""},
    {id: "k-pistrez", name: "Pistáciovo malinový rez", valid: "2. 8. 2026", desc: "",
      vars: [ks(3.3, 10)], flav: "", note: "Na svadby aj ako mini kocky (cena na webe nie je)."},
    {id: "k-profiterolky", name: "Profiterolky", valid: "15. 1. 2026", desc: "Priemer cca 5–6 cm",
      vars: [ks(2.5, 15)], flav: "karamel, nutella, kokos + čokoláda, malina + pistácia, marakuja + biela čokoláda, karamel + čokoláda", note: ""},
    {id: "k-medovyrez", name: "Medový rez", valid: "15. 1. 2026", desc: "", vars: [ks(2.7, 0)], flav: "", note: ""},
    {id: "k-nanuky", name: "Nanuky", valid: "15. 1. 2026", desc: "",
      vars: [ks(2.6, 0)], flav: "karamel, mliečna čokoláda, mak + višňa, malina, čučoriedka, jahoda, marakuja + biela čokoláda, oreo, pistácia + malina, kokos + tmavá čokoláda", note: ""},
    {id: "k-laskonky", name: "Laskonky", valid: "15. 1. 2026", desc: "Priemer cez 6 cm",
      vars: [ks(2.3, 20)], flav: "karamelovo oriešková, čokoládová, pistáciová, jahodová, kokosová, bounty, kávovo čokoládová", note: ""},
    {id: "k-milionar", name: "Milionár", valid: "", desc: "", vars: [ks(2.5, 10)], flav: "", note: ""},
    {id: "k-misa", name: "Míša rez", valid: "15. 1. 2026", desc: "", vars: [ks(2.8, 10)], flav: "", note: ""},
    {id: "k-vianoce26", name: "Vianoce 2026 – krabičky", valid: "", desc: "Zloženie krabíc je nemenné.",
      vars: [
        {n: "Suchá krabička", d: "1 kg, 6 druhov, cca 10 ks z každého", p: 45},
        {n: "Krémová krabička", d: "24 ks, 6 druhov po 4 ks", p: 65},
        {n: "Obe krabičky spolu", d: "", p: 105}
      ], flav: "", note: "Odber 22. 12. poobede alebo 23. 12. doobeda."}
  ]
};

// Nápoje: z nápojového lístka a jesenného menu (fotky od Petra, 16. 11. 2026).
function n(name, p, d, u) { return {n: name, d: d || "", p: p, u: u || ""}; }
CENNIK_WEB.srcNapoje = "nápojového lístka a jesenného menu, prepísané 16. 11. 2026";
CENNIK_WEB.napoje = [
  {id: "n-kava", name: "Káva", desc: "#mlsnacava", valid: "", vars: [
    n("Espresso", 2.1, "8 g"), n("Double espresso", 2.8, "16 g"), n("Cappuccino", 2.7, "8 g"),
    n("Latte macchiato", 2.8, "8 g"), n("Flat white", 4, "16 g"), n("Ľadové latte", 3.2, "16 g"),
    n("Kakao", 1.5, "180 ml"), n("Pohár mlieka", 1, "180 ml"),
    n("Mlieko do kávy", 0.2, "20 ml", "+"), n("Sirup", 1, "vanilka, karamel, kokos, sezónne", "+"),
    n("Alternatíva mlieka", 0.5, "bezlaktózové, ovsené, kokosové, hrachové", "+")
  ], flav: "", note: ""},
  {id: "n-matcha", name: "Matcha", desc: "#obchodčarovňa", valid: "", vars: [
    n("Matcha latte", 4.8, "280 ml, 1,5 g matcha, mlieko"), n("Matcha cappuccino", 4.5, "200 ml, 1,5 g matcha, mlieko"),
    n("Matcha ľadová", 4.9, "350 ml, 3 g matcha, mlieko, ľad")
  ], flav: "", note: ""},
  {id: "n-caj", name: "Čaj", desc: "300 ml", valid: "", vars: [
    n("Mätový čaj", 3.4, "7 g"), n("Zázvorový čaj", 3.4, ""), n("Zelený čaj", 3.4, "4 g"),
    n("Bylinkový čaj", 3.4, "4 g"), n("Ovocný čaj", 3.4, "10 g"), n("Čierny čaj", 3.4, "4 g"),
    n("Med", 0.6, "20 g", "+")
  ], flav: "", note: "Citrón je súčasťou každého čaju."},
  {id: "n-cokolada", name: "Horúca čokoláda", desc: "", valid: "", vars: [
    n("Mliečna belgická čokoláda 35,5 %", 4, "60 g čokolády"), n("Šľahačka", 0.6, "", "+"), n("Mix čerstvého ovocia", 1.5, "", "+")
  ], flav: "", note: ""},
  {id: "n-limonady", name: "Limonády", desc: "#brown&co.syrups", valid: "", vars: [
    n("Citronáda", 1.5, "400 ml"), n("Minerálka rozlievaná", 0.8, "200 ml"), n("Baza & citrón", 4, "400 ml"),
    n("Podľa sezónnej ponuky", "podľa ponuky", "")
  ], flav: "", note: "Všetky limonády okrem citronády sú z minerálky."},
  {id: "n-dzusy", name: "Džúsy a fľaškové nápoje", desc: "", valid: "", vars: [
    n("100 % džús", 2.3, "250 ml"), n("Fľaškové nápoje", "podľa ponuky", "")
  ], flav: "", note: "Príchute džúsov a fľaškové nápoje sa menia (lokálni dodávatelia)."},
  {id: "n-jesen", name: "Jesenné nápoje", desc: "Sezónna ponuka", valid: "", vars: [
    n("Pumpkin spice latte so šľahačkou", 5.5, "tekvicové pyré, sirup, škorica, káva, mlieko, šľahačka"),
    n("Pumpkin spice latte bez šľahačky", 5, "tekvicové pyré, sirup, škorica, káva, mlieko"),
    n("Chai latte", 4.3, "korenie, sirup, mlieko, škorica, čierny čaj"),
    n("Dirty chai latte", 4.3, "korenie, mlieko, škorica, káva"),
    n("Ube milk", 4, "sirup, mlieko; aj pre deti"),
    n("Ube cappuccino", 4.9, "sirup, mlieko, káva"),
    n("Pumpkin cloud matcha", 5.6, "matcha, sirup, smotana, tekvicové pyré, škorica"),
    n("Matcha škorica latte", 4.9, "matcha, sirup, škorica, mlieko"),
    n("Zázvor kurkuma", 4, "zázvor, sirup, citrón, mäta, voda"),
    n("Jablko škorica", 4.5, "jablkové pyré, sirup, škorica, voda")
  ], flav: "", note: ""}
];

// Koláče z papierového cenníka „Ceny a druhy koláčov“ (fotka od Petra, 16. 11. 2026), ktoré na webe nie sú.
// Na papieri: kde nie je napísaný min. odber, platí 15 ks z jednej príchute.
var PAP = "Z papierového cenníka (16. 11. 2026).";
function pk(id, name, p, min) { return {id: id, name: name, desc: "", valid: "", vars: [ks(p, min === undefined ? 15 : min)], flav: "", note: PAP}; }
CENNIK_WEB.kolaceNove = [
  pk("p-veternik-pist", "Veterník pistácia", 3.5),
  {id: "p-miniveternik", name: "Miniveterník", desc: "", valid: "", vars: [ks(2.6, 15, "Klasický"), ks(2.8, 15, "Pistácia")], flav: "", note: PAP},
  pk("p-profit-pist", "Profiterolka pistácia", 2.7),
  pk("p-laskonky-pist", "Laskonky pistácia", 2.5),
  {id: "p-cheese-kus", name: "Cheesecake na kusy", desc: "", valid: "", vars: [ks(4.2, 0, "Kus"), {n: "Celý mix", d: "", p: 50.4}], flav: "", note: PAP + " Bez minimálneho odberu."},
  {id: "p-torta-kus", name: "Torta na kusy", desc: "", valid: "", vars: [ks(4.9, 0, "Kus"), {n: "Celá torta", d: "", p: 58.8}], flav: "", note: PAP + " Bez minimálneho odberu."},
  pk("p-cupcake", "Cupcake", 2.5),
  pk("p-mrkvac", "Mrkváč", 2.5),
  pk("p-jez", "Kokosový jež", 2.5),
  pk("p-lotus-rez", "Orechovo lotusový rez", 2.7),
  pk("p-redvelvet", "Red velvet", 2.8),
  pk("p-misa-pist", "Pistáciový míša rez", 3),
  pk("p-choux", "Choux", 3),
  pk("p-lici", "Malina liči rez", 3.3),
  pk("p-deluxe-coko", "Deluxe čokoládový rez", 3.5),
  pk("p-deluxe-malina", "Deluxe malinový rez", 3.5),
  pk("p-trio", "Trio čoko kocka", 3.5),
  pk("p-parisbrest", "Paris brest", 3.5),
  pk("p-eclair", "Eclair", 3.5),
  pk("p-brownie-kokos", "Brownie kokos", 3.5),
  pk("p-slimak", "Škoricový slimák", 3.5),
  pk("p-tiramisu-rez", "Tiramisu rez", 3.5),
  {id: "p-makovy", name: "Makový rez s višňami", desc: "Bezlepkový", valid: "", vars: [ks(3.5, 15)], flav: "", note: PAP}
];
CENNIK_WEB.kolace = CENNIK_WEB.kolace.concat(CENNIK_WEB.kolaceNove);

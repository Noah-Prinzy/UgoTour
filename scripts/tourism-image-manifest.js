// Curated Phase 8.8 local-asset plan. The downloader resolves each search to a
// specific Wikimedia Commons file and records its creator, source page,
// original dimensions and licence in the generated JSON manifest.

const destinations = [
  ["Kibale National Park","kibale","Kibale National Park Uganda"],
  ["Lake Mburo National Park","lake-mburo","Lake Mburo National Park Uganda"],
  ["Semuliki National Park","semuliki","Semuliki National Park Uganda"],
  ["Mount Elgon National Park","mount-elgon","Mount Elgon Uganda"],
  ["Mgahinga Gorilla National Park","mgahinga","Mgahinga Gorilla National Park Uganda"],
  ["Fort Portal","fort-portal","Fort Portal Uganda"],
  ["Entebbe","entebbe","Entebbe Uganda Lake Victoria"],
  ["Ssese Islands","ssese-islands","Ssese Islands Uganda"],
  ["Lake Mutanda","lake-mutanda","Lake Mutanda Uganda"],
  ["Ziwa Rhino Sanctuary","ziwa-rhino-sanctuary","Ziwa Rhino Sanctuary Uganda"]
];

const attractions = [
  ["Kasubi Royal Tombs","kasubi-royal-tombs","Kasubi Tombs Uganda"],
  ["Uganda National Museum","uganda-national-museum","Uganda Museum Kampala"],
  ["Kabaka's Palace","kabakas-palace","Kabaka Palace Mengo Uganda"],
  ["Bulange and Royal Mile","bulange-royal-mile","Bulange Mengo Uganda"],
  ["Namugongo Martyrs Shrine","namugongo-martyrs-shrine","Namugongo Martyrs Shrine Uganda"],
  ["Ndere Cultural Centre","ndere-cultural-centre","Ndere Cultural Centre Uganda"],
  ["Uganda National Mosque","uganda-national-mosque","Uganda National Mosque Kampala"],
  ["National Theatre and Craft Village","national-theatre-craft-village","Uganda National Theatre Kampala"],
  ["Kabaka's Lake","kabakas-lake","Kabaka Lake Kampala"],
  ["Munyonyo Martyrs Shrine","munyonyo-martyrs-shrine","Munyonyo Martyrs Shrine Uganda"],
  ["Source of the Nile","source-of-the-nile","Source of the Nile Jinja Uganda"],
  ["Itanda Falls","itanda-falls","Itanda Falls Uganda"],
  ["Busowoko Falls","busowoko-falls","Busowoko Falls Uganda"],
  ["Mabira Forest","mabira-forest","Mabira Forest Uganda"],
  ["Kagulu Hill","kagulu-hill","Kagulu Hill Uganda"],
  ["Nalubaale Dam","nalubaale-dam","Nalubaale Owen Falls Dam Uganda"],
  ["Source of the Nile Bridge","source-of-the-nile-bridge","Source of the Nile Bridge Jinja"],
  ["Bishop Hannington Memorial Site","bishop-hannington-site","Bishop Hannington Uganda"],
  ["Ssezibwa Falls","ssezibwa-falls","Ssezibwa Falls Uganda"],
  ["Bigodi Wetland Sanctuary","bigodi-wetland-sanctuary","Bigodi Wetland Sanctuary Uganda"],
  ["Fort Portal Crater Lakes","fort-portal-crater-lakes","Fort Portal crater lakes Uganda"],
  ["Fort Portal Regional Museum","fort-portal-regional-museum","Fort Portal Uganda museum"],
  ["Katoosa Martyrs Site","katoosa-martyrs-site","Katoosa Martyrs Uganda"],
  ["Sempaya Hot Springs","sempaya-hot-springs","Sempaya Hot Springs Uganda"],
  ["Kazinga Channel","kazinga-channel","Kazinga Channel Uganda"],
  ["Ishasha Sector","ishasha-sector","Ishasha Uganda tree climbing lions"],
  ["Lake Katwe","lake-katwe","Lake Katwe Uganda"],
  ["Budongo Forest","budongo-forest","Budongo Forest Uganda"],
  ["Ngamba Island Chimpanzee Sanctuary","ngamba-island","Ngamba Island Uganda"],
  ["Uganda Wildlife Conservation Education Centre","uwec","Uganda Wildlife Education Centre Entebbe"],
  ["Entebbe Botanical Gardens","entebbe-botanical-gardens","Entebbe Botanical Gardens Uganda"],
  ["Mabamba Bay Wetland","mabamba-bay","Mabamba Bay Uganda shoebill"],
  ["Lutembe Bay","lutembe-bay","Lutembe Bay Uganda"],
  ["Nyero Rock Paintings","nyero-rock-paintings","Nyero rock paintings Uganda"],
  ["Fort Patiko / Baker's Fort","fort-patiko","Fort Patiko Uganda"],
  ["Tororo Rock","tororo-rock","Tororo Rock Uganda"],
  ["Aruu Falls","aruu-falls","Aruu Falls Uganda"],
  ["Kabale Regional Museum","kabale-regional-museum","Kabale Uganda museum"],
  ["Soroti Regional Museum","soroti-regional-museum","Soroti Uganda museum"],
  ["Moroto Regional Museum","moroto-regional-museum","Karamoja museum Moroto Uganda"],
  ["Ajai Wildlife Reserve","ajai-wildlife-reserve","Ajai Wildlife Reserve Uganda"]
];

const editorialSources = {
  "Katoosa Martyrs Site": "https://www.tourism.go.ug/single-post/tourism-ministry-delivers-on-pledge-launches-development-of-katoosa-martyrs-site",
  "Lutembe Bay": "https://rsis.ramsar.org/ris/1637",
  "Ajai Wildlife Reserve": "https://ugandawildlife.org/news/uganda-takes-back-rhino-to-ajai-wildlife-reserve/"
};

export const phase88Images = [
  ...destinations.flatMap(([place, slug, commonsQuery]) => [1, 2].map((number, imageIndex) => ({
    place, destination: place, type: "destination", commonsQuery, imageIndex,
    fileName: `destinations/${slug}/${slug}-${String(number).padStart(2, "0")}.jpg`,
    localPath: `frontend/images/destinations/${slug}/${slug}-${String(number).padStart(2, "0")}.jpg`,
    minWidth: 2000, provider: "Wikimedia Commons"
  }))),
  ...attractions.map(([place, slug, commonsQuery]) => {
    const editorialPlaceholder = ["Katoosa Martyrs Site", "Lutembe Bay", "Ajai Wildlife Reserve"].includes(place);
    const extension = editorialPlaceholder ? "svg" : "jpg";
    return {
      place, destination: place, type: "attraction", commonsQuery, imageIndex: 0, editorialPlaceholder,
      fileName: `attractions/${slug}/${slug}-01.${extension}`,
      localPath: `frontend/images/attractions/${slug}/${slug}-01.${extension}`,
      minWidth: editorialPlaceholder ? 1600 : 1400,
      provider: editorialPlaceholder ? "UgoTour editorial" : "Wikimedia Commons",
      sourceUrl: editorialSources[place]
    };
  })
];

// ============================================================
// PHASE 1.15 — DESTINATION EXPERIENCE ENRICHMENT
// ============================================================
// This module improves the catalogue presentation without replacing UgoTour's
// PostgreSQL data. The API remains the source of truth; these researched copy
// and photography choices are a UI enrichment layer and can later move into an
// admin-reviewed database workflow.

const DESTINATIONS = {
  "Murchison Falls": {
    image: "../images/optimized/destinations/murchison-falls/murchison-01.webp",
    description: "Follow the Nile through open savannah to the point where the river is squeezed through a narrow gorge and erupts into Murchison Falls. Pair the viewpoints with a boat journey for wildlife along the riverbanks.",
    cue: "Go for · Nile scenery, game drives & boat experiences"
  },
  "Bwindi Impenetrable National Park": {
    image: "../images/optimized/destinations/bwindi/bwindi-01.webp",
    description: "Enter one of Africa's oldest montane rainforests for a close-to-nature journey shaped by misty ridges, exceptional biodiversity and the chance to track mountain gorillas with trained guides.",
    cue: "Go for · Gorilla trekking, rainforest & community experiences"
  },
  "Jinja": {
    image: "../images/optimized/destinations/jinja/jinja-01.webp",
    description: "Experience Uganda's Nile adventure hub, where river viewpoints, rafting and kayaking meet a lively town atmosphere. It works equally well for a high-energy weekend or a slower riverside escape.",
    cue: "Go for · Source of the Nile, rafting & riverside weekends"
  },
  "Queen Elizabeth National Park": {
    image: "../images/optimized/destinations/queen-elizabeth/queen-elizabeth-01.webp",
    description: "Explore a western Uganda landscape of savannah, crater lakes and wetlands, then take to the Kazinga Channel for a different perspective on the park's abundant wildlife and birdlife.",
    cue: "Go for · Safari, Kazinga Channel & crater landscapes"
  },
  "Kidepo Valley National Park": {
    image: "../images/optimized/destinations/kidepo/kidepo-04.webp",
    description: "Travel deep into Karamoja for vast golden savannah, mountain horizons and a sense of wilderness that feels far removed from Uganda's busier safari circuits. The journey is long, but the landscape is the reward.",
    cue: "Go for · Remote safari, huge landscapes & wildlife"
  },
  "Lake Bunyonyi": {
    image: "../images/optimized/destinations/lake-bunyonyi/lake-bunyonyi-01.webp",
    description: "Slow down among terraced highlands and small islands on one of south-western Uganda's most peaceful lakes. Mornings are made for viewpoints and canoe trips; evenings suit quiet lakeside stays.",
    cue: "Go for · Canoeing, island views & peaceful highlands"
  },
  "Sipi Falls": {
    image: "../images/optimized/destinations/sipi-falls/sipi-falls-01.webp",
    description: "Hike through the green foothills of Mount Elgon to a sequence of dramatic waterfalls, valley viewpoints and coffee-growing communities. Trails can be steep, but each level reveals a different landscape.",
    cue: "Go for · Waterfall hikes, viewpoints & coffee culture"
  },
  "Kampala": {
    image: "../images/optimized/destinations/kampala/kampala-01.webp",
    description: "Discover Uganda through its capital: Buganda royal heritage, museums, markets, faith landmarks, food and contemporary city life spread across Kampala's hills. Plan by neighbourhood to make the most of the city.",
    cue: "Go for · Culture, heritage, food & city energy"
  },
  "Rwenzori Mountains": {
    image: "../images/optimized/destinations/rwenzori/rwenzori-01.webp",
    description: "Step into the legendary Mountains of the Moon for high-altitude trails, giant vegetation and dramatic alpine scenery. Short foothill walks and multi-day summit routes offer very different ways to experience the range.",
    cue: "Go for · Mountain trekking, alpine scenery & photography"
  },
  "Kibale National Park": {
    image: "../images/optimized/destinations/kibale/kibale-01.webp",
    description: "Walk beneath a dense rainforest canopy in one of Uganda's leading primate destinations, best known for chimpanzee tracking, forest birdlife and the rich biodiversity of the western tourism circuit.",
    cue: "Go for · Chimpanzees, primates & rainforest walks"
  },
  "Lake Mburo National Park": {
    image: "../images/optimized/destinations/lake-mburo/lake-mburo-01.webp",
    description: "Choose a compact safari close to the Kampala–western Uganda route, with zebra-filled grasslands, wetlands, birdlife and opportunities to experience wildlife by road, boat or guided walk.",
    cue: "Go for · Zebras, walking safari & a short wildlife escape"
  },
  "Semuliki National Park": {
    image: "../images/optimized/destinations/semuliki/semuliki-01.webp",
    description: "Explore a lowland forest at the edge of the Albertine Rift, where humid trails, exceptional birdlife and the steaming Sempaya Hot Springs create one of Uganda's most unusual nature experiences.",
    cue: "Go for · Hot springs, birding & lowland forest"
  },
  "Mount Elgon National Park": {
    image: "../images/optimized/destinations/mount-elgon/mount-elgon-01.webp",
    description: "Climb into Uganda's eastern highlands for volcanic scenery, caves, waterfalls and long-distance trekking routes around the ancient Mount Elgon massif.",
    cue: "Go for · Hiking, volcanic landscapes & highland waterfalls"
  },
  "Mgahinga Gorilla National Park": {
    image: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Mountain_Gorilla_in_Mgahinga_Gorilla_National_Park_1.jpg",
    credit: "Dylan Walters",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Mountain_Gorilla_in_Mgahinga_Gorilla_National_Park_1.jpg",
    license: "CC BY 2.0",
    description: "Meet the Virunga landscape at Uganda's south-western edge, where bamboo slopes, volcano trails, mountain gorillas and golden monkeys create a compact but intensely scenic primate destination.",
    cue: "Go for · Gorillas, golden monkeys & volcano hiking"
  },
  "Fort Portal": {
    image: "../images/optimized/destinations/fort-portal/fort-portal-01.webp",
    description: "Use this green Tooro city as a gateway to crater lakes, tea country, forests and the western Uganda adventure circuit. It is especially rewarding for road trips that mix culture with scenery.",
    cue: "Go for · Crater lakes, Tooro culture & western road trips"
  },
  "Entebbe": {
    image: "../images/optimized/destinations/entebbe/entebbe-01.webp",
    description: "Ease into or out of Uganda beside Lake Victoria, with botanical walks, wildlife experiences, wetlands and boat trips all within reach of the country's international airport.",
    cue: "Go for · Lake Victoria, birding & relaxed short stays"
  },
  "Ssese Islands": {
    image: "../images/optimized/destinations/ssese-islands/ssese-islands-01.webp",
    description: "Trade the mainland for a slower Lake Victoria rhythm of beaches, forested shorelines, fishing communities and sunset views across Uganda's largest island archipelago.",
    cue: "Go for · Island time, beaches & Lake Victoria sunsets"
  },
  "Lake Mutanda": {
    image: "../images/optimized/destinations/lake-mutanda/lake-mutanda-01.webp",
    description: "Canoe across still water beneath terraced hills with the Virunga volcanoes rising beyond the lake. It is an ideal quiet base between Kisoro's mountain and primate adventures.",
    cue: "Go for · Canoeing, volcano views & quiet nature stays"
  },
  "Ziwa Rhino Sanctuary": {
    image: "../images/optimized/destinations/ziwa-rhino-sanctuary/ziwa-rhino-sanctuary-01.webp",
    description: "Join trained guides for an on-foot conservation experience centred on Uganda's white rhinos, with additional nature walks and birdlife in the sanctuary landscape.",
    cue: "Go for · Guided rhino tracking & conservation"
  }
};

const ATTRACTIONS = {
  "Kasubi Royal Tombs": {
    description: "A UNESCO World Heritage Site and living spiritual centre of the Buganda Kingdom, centred on the monumental thatched royal burial complex and centuries of Ganda architectural tradition.",
    cue: "Experience · Buganda history, living tradition & architecture"
  },
  "Ndere Cultural Centre": {
    description: "A Kampala performance venue where music, dance, storytelling and food bring together traditions from communities across Uganda in one lively cultural evening.",
    cue: "Visitor signal · Performances and cultural variety are frequently praised"
  },
  "National Theatre and Craft Village": {
    description: "Pair Kampala's national performing-arts venue with the neighbouring craft stalls for theatre, live events and locally made Ugandan gifts in one central stop.",
    cue: "Experience · Performing arts, crafts & central Kampala"
  },
  "Ssezibwa Falls": {
    description: "A culturally important riverside waterfall on the Kampala–Jinja corridor, combining rock scenery, rushing water and traditions connected to Buganda heritage.",
    cue: "Experience · Waterfall scenery, culture & a road-trip stop"
  },
  "Uganda National Museum": {
    description: "Uganda's national collection brings together archaeology, ethnography, natural history and musical heritage, offering context for the cultures and landscapes encountered across the country.",
    cue: "Experience · National history, culture & collections"
  },
  "Kabaka's Palace": {
    description: "Explore the historic Mengo palace grounds of the Kabaka for Buganda royal history and important twentieth-century memory in the heart of Kampala.",
    cue: "Experience · Buganda monarchy, history & Mengo"
  },
  "Bulange and Royal Mile": {
    description: "Walk the ceremonial axis between Buganda's parliament building at Bulange and the Kabaka's Palace, one of Kampala's strongest expressions of Buganda civic heritage.",
    cue: "Experience · Civic architecture & Buganda royal heritage"
  },
  "Kabaka's Lake": {
    description: "A historic man-made lake associated with Kabaka Mwanga II, offering a quieter view of Buganda royal history within Kampala's urban landscape.",
    cue: "Experience · Royal history & a calm city-side landscape"
  },
  "Source of the Nile": {
    description: "Stand at the celebrated Lake Victoria outlet where the White Nile begins its northward journey, then experience the river by boat or from the surrounding Jinja viewpoints.",
    cue: "Experience · Nile headwaters, boat trips & Jinja scenery"
  }
};

let enhancementQueued = false;

function enrichDestinationCard(card) {
  if (card.dataset.ugotourEnriched === "true") return;
  const title = card.querySelector("h3")?.textContent?.trim();
  const data = DESTINATIONS[title];
  if (!data) return;

  const image = card.querySelector("img");
  const description = card.querySelector(".destination-card-content > p");
  if (image && data.image) {
    const apiImage = image.currentSrc || image.src;
    image.addEventListener("error", () => {
      if (apiImage && image.src !== apiImage) image.src = apiImage;
    }, { once: true });
    image.src = data.image;
    image.loading = "lazy";
    image.decoding = "async";
    image.alt = `${title} travel experience`;

    if (data.credit && !card.querySelector(".destination-photo-credit")) {
      const media = card.querySelector(".destination-card-media");
      if (media) {
        const credit = document.createElement(data.creditUrl ? "a" : "span");
        credit.className = "destination-photo-credit";
        credit.textContent = `Photo: ${data.credit}${data.license ? ` · ${data.license}` : ""}`;
        if (data.creditUrl) {
          credit.href = data.creditUrl;
          credit.target = "_blank";
          credit.rel = "noopener noreferrer";
          credit.setAttribute("aria-label", `Photo credit for ${title}: ${data.credit}`);
        }
        media.appendChild(credit);
      }
    }
  }
  if (description) description.textContent = data.description;

  const content = card.querySelector(".destination-card-content");
  if (content && !content.querySelector(".destination-experience-cue")) {
    const cue = document.createElement("p");
    cue.className = "destination-experience-cue";
    cue.textContent = data.cue;
    const footer = content.querySelector(".destination-card-footer");
    if (footer) content.insertBefore(cue, footer); else content.appendChild(cue);
  }
  card.dataset.ugotourEnriched = "true";
}

function enrichAttractionCard(card) {
  if (card.dataset.ugotourEnriched === "true") return;
  const title = card.querySelector("h3")?.textContent?.trim();
  const data = ATTRACTIONS[title];
  if (!data) return;

  const copy = card.querySelector(".attraction-discovery-copy");
  const description = copy?.querySelector(":scope > span");
  if (description) description.textContent = data.description;
  if (copy && !copy.querySelector(".attraction-experience-cue")) {
    const cue = document.createElement("em");
    cue.className = "attraction-experience-cue";
    cue.textContent = data.cue;
    const link = copy.querySelector(":scope > strong");
    if (link) copy.insertBefore(cue, link); else copy.appendChild(cue);
  }
  card.dataset.ugotourEnriched = "true";
}


function applyBalancedDestinationLayout() {
  const cards = [...document.querySelectorAll(".destinations-page .destination-card")];
  const pattern = [7, 5, 4, 4, 4, 5, 7, 4, 4, 4, 7, 5, 4, 4, 4, 5, 7];
  cards.forEach((card, index) => {
    card.classList.remove("destination-layout-4", "destination-layout-5", "destination-layout-7");
    const span = pattern[index % pattern.length];
    card.classList.add(`destination-layout-${span}`);
  });
}

function enrichVisibleCatalogue() {
  enhancementQueued = false;
  document.querySelectorAll(".destinations-page .destination-card").forEach(enrichDestinationCard);
  document.querySelectorAll(".destinations-page .attraction-discovery-card").forEach(enrichAttractionCard);
  applyBalancedDestinationLayout();
}

function queueEnhancement() {
  if (enhancementQueued) return;
  enhancementQueued = true;
  requestAnimationFrame(enrichVisibleCatalogue);
}

const observer = new MutationObserver(queueEnhancement);
const destinationList = document.getElementById("destination-list");
const attractionList = document.getElementById("attraction-list");
if (destinationList) observer.observe(destinationList, { childList: true, subtree: true });
if (attractionList) observer.observe(attractionList, { childList: true, subtree: true });
queueEnhancement();

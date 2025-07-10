// === CONSTANTEN EN BASISVARIABELEN ===
const ALL_SCHOOLS = [
  "Antwerpen", "Arnhem", "ATKA", "Brussel", "Den Bosch",
  "Filmacademie", "Gent", "Leuven", "Maastricht",
  "Rotterdam", "Tilburg", "Utrecht"
];

let currentSlideIndex = 0;
let slides = [];
let scoreTotaal = {};
let juryData = [];
let televoteData = {};
let currentJuryIndex = 0;
let schoolVolgorde = [...ALL_SCHOOLS];

// === HULPFUNCTIE: gesorteerde entries voor scoreboardSlide & schoolVolgorde update ===
function getSortedEntries(scoreTotaal, nieuwePunten) {
  return ALL_SCHOOLS.map(school => ({
      school,
      totaal: scoreTotaal[school] || 0,
      nieuw: nieuwePunten[school] || 0
    }))
    .sort((a, b) => b.totaal - a.totaal);
}

// === JURYINFO BLOK TELEVOTE ===
function createTelevoteJuryInfo(school) {
  const juryInfo = document.createElement("div");
  juryInfo.className = "animatieslide1-juryinfo";
  const blok1 = document.createElement("div");
  blok1.className = "animatieslide1-juryblok";
  blok1.textContent = "Televotes";
  const blok2 = document.createElement("div");
  blok2.className = "animatieslide1-juryblok";
  blok2.textContent = school;
  juryInfo.appendChild(blok1);
  juryInfo.appendChild(blok2);
  return juryInfo;
}

// === SLIDES AANMAKEN ===
function setupSlidesFromData(juryData) {
  slides = [
    createStartSlide(1),
    createStartSlide(2)
  ];

  scoreTotaal = {};
  currentJuryIndex = 0;
  schoolVolgorde = [...ALL_SCHOOLS];

  const totaalJury = juryData.length;
  const halfJuryIndex = Math.floor(totaalJury / 2) - 1;

  juryData.forEach((jury, idx) => {
    const jurySchool = jury.school;
    const punten = jury.punten;
    const oudeTotaal = { ...scoreTotaal };
    const naNieuwTotaal = { ...scoreTotaal };
    Object.entries(punten).forEach(([school, p]) => {
      naNieuwTotaal[school] = (naNieuwTotaal[school] || 0) + (p || 0);
    });

    slides.push(createJuryIntroSlide(jurySchool));
    slides.push(createPuntenAnimatieSlide(idx + 1, juryData.length, jurySchool));
    slides.push(createPuntenSlide(punten, idx));

    slides.push(createScoreboardVoor12Slide(oudeTotaal, punten));
    const sbMet12Nieuw = createScoreboardMet12NieuwSlide(oudeTotaal, punten, schoolVolgorde);
    sbMet12Nieuw.classList.add('scoreboard-auto-advance-trigger');
    slides.push(sbMet12Nieuw);

    slides.push(createScoreboardNa12NieuwBlijftSlide(naNieuwTotaal, punten, schoolVolgorde));
    const sortedEntries = getSortedEntries(naNieuwTotaal, punten).map((entry, i) => ({
      ...entry,
      positie: i + 1
    }));
    slides.push(createScoreboardSlide(naNieuwTotaal, punten, sortedEntries));

    Object.entries(punten).forEach(([school, p]) => {
      scoreTotaal[school] = (scoreTotaal[school] || 0) + (p || 0);
    });
    schoolVolgorde = sortedEntries.map(e => e.school);

    if (idx === halfJuryIndex) {
      slides.push(
        createScoreboardSlide(
          scoreTotaal,
          {},
          Object.keys(scoreTotaal)
            .map(school => ({
              school,
              totaal: scoreTotaal[school] || 0,
              nieuw: 0
            }))
            .sort((a, b) => b.totaal - a.totaal)
            .map((entry, i) => ({
              ...entry,
              positie: i + 1
            }))
        )
      );
    }
  });

  // Tussenstand voor televotes
  const televoteTussenstandEntries = Object.keys(scoreTotaal)
    .map(school => ({
      school,
      totaal: scoreTotaal[school] || 0,
      nieuw: 0
    }))
    .sort((a, b) => b.totaal - a.totaal)
    .map((entry, i) => ({
      ...entry,
      positie: i + 1
    }));
  slides.push(createScoreboardSlide(scoreTotaal, {}, televoteTussenstandEntries));

  createTelevoteSlides(televoteData, scoreTotaal, slides);

  console.log("Aantal slides na setup:", slides.length);
}

// --- STARTSLIDE ---
function createStartSlide(number = 1) {
  const slide = document.createElement("div");
  slide.className = "slide start";
  const img = document.createElement("img");
  img.src = "logo.png";
  img.alt = "Theaterscholen Songfestival Logo";
  img.style.maxWidth = "50%";
  img.style.objectFit = "contain";
  if (number === 2) img.style.opacity = "0.999";
  slide.appendChild(img);
  return slide;
}

// --- JURY INTRO SLIDE (MET VIDEO, ZONDER TEKST, AUTOMATISCH DOORSCHAKELEN) ---
function createJuryIntroSlide(jurySchool) {
  const slide = document.createElement("div");
  slide.className = "slide jury-intro-video";
  const video = document.createElement("video");
  video.src = `vlaggenanimaties/${jurySchool}.mp4`;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.controls = false;
  video.setAttribute("preload", "auto");
  video.addEventListener("ended", () => {
    const idx = slides.indexOf(slide);
    if (idx === currentSlideIndex) {
      advanceOrAnimate();
    }
  });
  slide.appendChild(video);
  return slide;
}

// --- PUNTEN ANIMATIE SLIDE (verticale blokken voor animatie) ---
function createPuntenAnimatieSlide(juryNr, juryTotaal, juryNaam) {
  const slide = document.createElement("div");
  slide.className = "slide punten-anim-slide";
  const container = document.createElement("div");
  container.className = "punten-container";
  const kolomLinks = document.createElement("div");
  kolomLinks.className = "punten-kolom";
  const kolomRechts = document.createElement("div");
  kolomRechts.className = "punten-kolom";
  let leftBlocks = [];
  let rightBlocks = [];
  [12, 10, 8, 7, 6].forEach((pt) => {
    const blok = document.createElement("div");
    blok.className = "punten-blok twaalf-only punten-blok-anim";
    blok.innerHTML = `<span class="punten${pt === 12 ? " twaalf" : ""}">${pt}</span>`;
    leftBlocks.push(blok);
  });
  [5, 4, 3, 2, 1].forEach((pt) => {
    const blok = document.createElement("div");
    blok.className = "punten-blok twaalf-only punten-blok-anim";
    blok.innerHTML = `<span class="punten">${pt}</span>`;
    rightBlocks.push(blok);
  });
  leftBlocks.forEach(b => kolomLinks.appendChild(b));
  rightBlocks.forEach(b => kolomRechts.appendChild(b));
  container.appendChild(kolomLinks);
  container.appendChild(kolomRechts);
  slide.appendChild(container);
  const juryInfo = document.createElement("div");
  juryInfo.className = "puntenanimatie-juryinfo";
  const juryBlok1 = document.createElement("div");
  juryBlok1.className = "puntenanimatie-juryblok";
  juryBlok1.textContent = `${juryNr} van ${juryTotaal}`;
  const juryBlok2 = document.createElement("div");
  juryBlok2.className = "puntenanimatie-juryblok";
  juryBlok2.textContent = juryNaam;
  juryInfo.appendChild(juryBlok1);
  juryInfo.appendChild(juryBlok2);
  slide.appendChild(juryInfo);
  slide._animBlokken = [...rightBlocks.reverse(), ...leftBlocks.reverse()];
  return slide;
}

// --- PUNTENSLIDE (jury geeft punten) ---
function createPuntenSlide(punten, juryIndex) {
  const slide = document.createElement("div");
  slide.className = "slide punten-slide";
  const container = document.createElement("div");
  container.className = "punten-container";
  const kolomLinks = document.createElement("div");
  kolomLinks.className = "punten-kolom";
  const kolomRechts = document.createElement("div");
  kolomRechts.className = "punten-kolom";
  const entries = Object.entries(punten).sort((a, b) => b[1] - a[1]);
  const leftPoints = [12, 10, 8, 7, 6];
  const rightPoints = [5, 4, 3, 2, 1];
  entries.forEach(([school, value]) => {
    const item = document.createElement("div");
    item.className = "punten-blok";
    if (value === 12) {
      item.classList.add("twaalf-only");
      item.innerHTML = `<span class='punten twaalf'>${value}</span>`;
    } else {
      item.innerHTML = `
        <span class='school'>
          <img src="vlaggen/${school}.png" class="vlag-icoon">
          ${school}
        </span>
        <span class='punten'>${value}</span>`;
    }
    if (leftPoints.includes(value)) {
      kolomLinks.appendChild(item);
    } else if (rightPoints.includes(value)) {
      kolomRechts.appendChild(item);
    }
  });
  container.appendChild(kolomLinks);
  container.appendChild(kolomRechts);
  slide.appendChild(container);
  const juryInfo = document.createElement("div");
  juryInfo.className = "animatieslide1-juryinfo";
  const juryBlok1 = document.createElement("div");
  juryBlok1.className = "animatieslide1-juryblok";
  juryBlok1.textContent = `${juryIndex + 1} van ${juryData.length}`;
  const juryBlok2 = document.createElement("div");
  juryBlok2.className = "animatieslide1-juryblok";
  juryBlok2.textContent = juryData[juryIndex].school;
  juryInfo.appendChild(juryBlok1);
  juryInfo.appendChild(juryBlok2);
  slide.appendChild(juryInfo);
  return slide;
}

// --- SCOREBOARD SLIDES (deze laat ik onverkort want dat wil je!) ---
function createScoreboardVoor12Slide(totaal, nieuwePunten) {
  const slide = document.createElement("div");
  slide.className = "slide scoreboard-slide scoreboard-voor12";
  const school12 = Object.entries(nieuwePunten).find(([, p]) => p === 12)?.[0];
  const sorted = ALL_SCHOOLS.map(school => ({
    school,
    totaal: totaal[school] || 0,
    nieuw: nieuwePunten[school] || 0
  })).sort((a, b) => b.totaal - a.totaal)
    .map((entry, i) => ({ ...entry, positie: i + 1 }));
  const container = document.createElement("div");
  container.className = "scoreboard-container";
  const kolom1 = document.createElement("div");
  kolom1.className = "score-kolom";
  const kolom2 = document.createElement("div");
  kolom2.className = "score-kolom";
  sorted.forEach((entry, i) => {
    const box = document.createElement("div");
    box.className = "score-box";
    box.innerHTML = `
      <div class="positie">${entry.positie.toString().padStart(2, '0')}</div>
      <div class="schoolblok">
        <span class="schoolnaam">
          <img src="vlaggen/${entry.school}.png" class="vlag-icoon">
          ${entry.school}
        </span>
        <span class="puntentotaal">${entry.totaal}</span>
        ${(entry.nieuw > 0 && entry.school !== school12) ? `<span class="puntennieuw">${entry.nieuw}</span>` : ''}
      </div>`;
    if (i < 6) kolom1.appendChild(box);
    else kolom2.appendChild(box);
  });
  container.appendChild(kolom1);
  container.appendChild(kolom2);
  slide.appendChild(container);
  slide._schoolOrder = sorted.map(e => e.school);
  if (school12) {
    const juryInfoBlokken = document.createElement("div");
    juryInfoBlokken.className = "animatieslide1-juryinfo";
    const blokLinks = document.createElement("div");
    blokLinks.className = "animatieslide1-juryblok twaalf blink";
    blokLinks.textContent = "12 punten";
    juryInfoBlokken.appendChild(blokLinks);
    slide.appendChild(juryInfoBlokken);
  }
  return slide;
}
function createScoreboardMet12NieuwSlide(totaal, nieuwePunten, volgorde) {
  const slide = document.createElement("div");
  slide.className = "slide scoreboard-slide scoreboard-met12nieuw";
  const entries = volgorde.map((school, i) => ({
    school,
    totaal: totaal[school] || 0,
    nieuw: nieuwePunten[school] || 0,
    positie: i + 1
  }));
  const school12 = Object.entries(nieuwePunten).find(([, p]) => p === 12)?.[0];
  const container = document.createElement("div");
  container.className = "scoreboard-container";
  const kolom1 = document.createElement("div");
  kolom1.className = "score-kolom";
  const kolom2 = document.createElement("div");
  kolom2.className = "score-kolom";
  entries.forEach((entry, i) => {
    const box = document.createElement("div");
    box.className = "score-box";
    box.innerHTML = `
      <div class="positie">${entry.positie.toString().padStart(2, '0')}</div>
      <div class="schoolblok">
        <span class="schoolnaam">
          <img src="vlaggen/${entry.school}.png" class="vlag-icoon">
          ${entry.school}
        </span>
        ${entry.nieuw > 0 ? `<span class="puntennieuw ${entry.nieuw === 12 ? 'twaalf' : ''}">${entry.nieuw}</span>` : ''}
        <span class="puntentotaal">${entry.totaal}</span>
      </div>`;
    if (i < 6) kolom1.appendChild(box);
    else kolom2.appendChild(box);
  });
  container.appendChild(kolom1);
  container.appendChild(kolom2);
  slide.appendChild(container);
  slide._schoolOrder = entries.map(e => e.school);
  if (school12) {
    const juryInfoBlokken = document.createElement("div");
    juryInfoBlokken.className = "animatieslide1-juryinfo";
    const blokLinks = document.createElement("div");
    blokLinks.className = "animatieslide1-juryblok twaalf";
    blokLinks.textContent = "12 punten";
    const blokRechts = document.createElement("div");
    blokRechts.className = "animatieslide1-juryblok twaalf";
    blokRechts.textContent = school12;
    juryInfoBlokken.appendChild(blokLinks);
    juryInfoBlokken.appendChild(blokRechts);
    slide.appendChild(juryInfoBlokken);
  }
  return slide;
}
function createScoreboardNa12NieuwBlijftSlide(totaal, punten, volgorde) {
  const slide = document.createElement("div");
  slide.className = "slide scoreboard-slide scoreboard-na12nieuwblijft";
  const entries = volgorde.map((school, i) => ({
    school,
    totaal: totaal[school] || 0,
    nieuw: punten[school] || 0,
    positie: i + 1
  }));
  const school12 = Object.entries(punten).find(([, p]) => p === 12)?.[0];
  const container = document.createElement("div");
  container.className = "scoreboard-container";
  const kolom1 = document.createElement("div");
  kolom1.className = "score-kolom";
  const kolom2 = document.createElement("div");
  kolom2.className = "score-kolom";
  entries.forEach((entry, i) => {
    const box = document.createElement("div");
    box.className = "score-box";
    box.innerHTML = `
      <div class="positie">${entry.positie.toString().padStart(2, '0')}</div>
      <div class="schoolblok">
        <span class="schoolnaam">
          <img src="vlaggen/${entry.school}.png" class="vlag-icoon">
          ${entry.school}
        </span>
        ${entry.nieuw > 0 ? `<span class="puntennieuw ${entry.nieuw === 12 ? 'twaalf' : ''}">${entry.nieuw}</span>` : ''}
        <span class="puntentotaal">${entry.totaal}</span>
      </div>`;
    if (i < 6) kolom1.appendChild(box);
    else kolom2.appendChild(box);
  });
  container.appendChild(kolom1);
  container.appendChild(kolom2);
  slide.appendChild(container);
  slide._schoolOrder = entries.map(e => e.school);
  if (school12) {
    const juryInfoBlokken = document.createElement("div");
    juryInfoBlokken.className = "animatieslide1-juryinfo";
    const blokLinks = document.createElement("div");
    blokLinks.className = "animatieslide1-juryblok twaalf";
    blokLinks.textContent = "12 punten";
    const blokRechts = document.createElement("div");
    blokRechts.className = "animatieslide1-juryblok twaalf";
    blokRechts.textContent = school12;
    juryInfoBlokken.appendChild(blokLinks);
    juryInfoBlokken.appendChild(blokRechts);
    slide.appendChild(juryInfoBlokken);
  }
  return slide;
}

// --- SCOREBOARD SLIDE (hier zit de winnaar-highlight logica!) ---
function createScoreboardSlide(
  totaal,
  nieuwePunten,
  sortedEntries,
  televoteReceivedSchools = [],
  juryInfoElement = null,
  alwaysShowPuntenNieuw = false,
  televoteNextSchool = null,
  winnaarSchool = null // kan nu ook een array zijn!
) {
  const entriesRaw =
    Array.isArray(sortedEntries) &&
    sortedEntries.length === ALL_SCHOOLS.length &&
    typeof sortedEntries[0] === "object" &&
    sortedEntries[0].school
      ? sortedEntries
      : getSortedEntries(totaal, nieuwePunten).map((entry, i) => ({ ...entry, positie: i + 1 }));

  const entries = entriesRaw.map((entry, i) => {
    if (typeof entry === "string") {
      return {
        school: entry,
        totaal: totaal[entry] || 0,
        nieuw: nieuwePunten[entry] || 0,
        positie: i + 1
      };
    }
    return {
      ...entry,
      positie: entry.positie !== undefined ? entry.positie : i + 1
    };
  });

  const slide = document.createElement("div");
  slide.className = "slide scoreboard-slide";
  const container = document.createElement("div");
  container.className = "scoreboard-container";
  const kolom1 = document.createElement("div");
  kolom1.className = "score-kolom";
  const kolom2 = document.createElement("div");
  kolom2.className = "score-kolom";
  entries.forEach((entry, i) => {
    const box = document.createElement("div");
    box.className = "score-box";
    box.innerHTML = `
      <div class="positie">${entry.positie.toString().padStart(2, '0')}</div>
      <div class="schoolblok">
        <span class="schoolnaam">
          <img src="vlaggen/${entry.school}.png" class="vlag-icoon">
          ${entry.school}
        </span>
        ${
          alwaysShowPuntenNieuw && televoteReceivedSchools && televoteReceivedSchools.includes(entry.school)
            ? `<span class="puntennieuw${entry.nieuw === 12 ? ' twaalf' : ''}">${entry.nieuw !== undefined && entry.nieuw !== null ? entry.nieuw : ''}</span>`
            : (!alwaysShowPuntenNieuw && entry.nieuw > 0
                ? `<span class="puntennieuw${entry.nieuw === 12 ? ' twaalf' : ''}">${entry.nieuw}</span>`
                : ''
              )
        }
        <span class="puntentotaal">${entry.totaal}</span>
      </div>`;
    const schoolblok = box.querySelector('.schoolblok');
    if (televoteReceivedSchools.includes(entry.school)) {
      schoolblok.classList.add('televote-received');
    }
    if (televoteNextSchool && entry.school === televoteNextSchool) {
      schoolblok.classList.add('televote-next');
    }
    // HIER: highlight ALLE winnaars als array
    if (winnaarSchool) {
      if (Array.isArray(winnaarSchool)) {
        if (winnaarSchool.includes(entry.school)) {
          schoolblok.classList.add('winnaar-highlight');
        }
      } else if (entry.school === winnaarSchool) {
        schoolblok.classList.add('winnaar-highlight');
      }
    }
    if (i < 6) kolom1.appendChild(box);
    else kolom2.appendChild(box);
  });
  container.appendChild(kolom1);
  container.appendChild(kolom2);
  slide.appendChild(container);
  slide._schoolOrder = entries.map(e => e.school);

  // Juryinfo altijd toevoegen als meegegeven
  if (juryInfoElement) {
    slide.appendChild(juryInfoElement);
  } else if (Object.keys(nieuwePunten).length > 0) {
    // Bestaande code voor 12 punten juryblok
    const ontvanger = Object.entries(nieuwePunten).find(([, p]) => p === 12)?.[0];
    if (ontvanger) {
      const juryInfoBlokken = document.createElement("div");
      juryInfoBlokken.className = "animatieslide1-juryinfo";
      const blokLinks = document.createElement("div");
      blokLinks.className = "animatieslide1-juryblok twaalf";
      blokLinks.textContent = "12 punten";
      const blokRechts = document.createElement("div");
      blokRechts.className = "animatieslide1-juryblok twaalf";
      blokRechts.textContent = ontvanger;
      juryInfoBlokken.appendChild(blokLinks);
      juryInfoBlokken.appendChild(blokRechts);
      slide.appendChild(juryInfoBlokken);
    }
  }
  return slide;
}

function createTelevoteSlides(televoteData, scoreNaJury, slides) {
  const initialEntries = Object.keys(scoreNaJury)
    .map(school => ({
      school,
      totaal: scoreNaJury[school] || 0,
      nieuw: 0
    }))
    .sort((a, b) => b.totaal - a.totaal)
    .map((entry, i) => ({ ...entry, positie: i + 1 }));

  let scoreTotaal = { ...scoreNaJury };
  let puntenNieuw = {};
  let huidigeVolgorde = initialEntries.map(entry => entry.school);

  const televoteVolgorde = Object.keys(scoreTotaal)
    .map(school => ({
      school,
      juryTotaal: scoreTotaal[school] || 0
    }))
    .sort((a, b) => a.juryTotaal - b.juryTotaal)
    .map(entry => entry.school);

  // Houd bij welke scholen hun televotepunten al kregen
  let televoteReceivedSchools = [];

  televoteVolgorde.forEach((school, idx) => {
    // 1. SCOREBOARD VOOR deze school haar punten krijgt (highlight de school die aan de beurt is)
    slides.push(
      createScoreboardSlide(
        scoreTotaal,
        puntenNieuw,
        huidigeVolgorde.map((s, i) => ({
          school: s,
          totaal: scoreTotaal[s] || 0,
          nieuw: puntenNieuw[s] || 0,
          positie: i + 1
        })),
        televoteReceivedSchools,
        createTelevoteJuryInfo(school),
        true,     // altijd puntennieuw-blokje, maar alleen als school haar punten heeft gekregen
        school,   // highlight deze school
        null      // geen winnaar in deze slides
      )
    );

    // 2. SCOREBOARD NA deze school haar punten krijgt
    televoteReceivedSchools = [...televoteReceivedSchools, school];
    let puntenNieuwMetDeze = { ...puntenNieuw, [school]: televoteData[school] || 0 };
    let scoreTotaalMetDeze = { ...scoreTotaal };
    scoreTotaalMetDeze[school] = (scoreTotaalMetDeze[school] || 0) + (televoteData[school] || 0);
    let sortedEntries = getSortedEntries(scoreTotaalMetDeze, puntenNieuwMetDeze).map((entry, i) => ({
      ...entry,
      positie: i + 1
    }));

    slides.push(
      createScoreboardSlide(
        scoreTotaalMetDeze,
        puntenNieuwMetDeze,
        sortedEntries,
        televoteReceivedSchools,
        createTelevoteJuryInfo(school),
        true,     // altijd puntennieuw-blokje, maar alleen als school haar punten heeft gekregen
        null,     // geen highlight meer
        null      // geen winnaar in deze slides
      )
    );

    // Update voor volgende school
    scoreTotaal = scoreTotaalMetDeze;
    puntenNieuw = puntenNieuwMetDeze;
    huidigeVolgorde = sortedEntries.map(e => e.school);
  });

  // Eindscore zonder puntennieuw-blokken!
  const finalNoNieuwEntries = huidigeVolgorde.map((school, i) => ({
    school,
    totaal: scoreTotaal[school] || 0,
    nieuw: 0,
    positie: i + 1
  }));
  // Bepaal alle winnaars (meerdere mogelijk bij gelijke hoogste score)
  const hoogsteScore = Math.max(...huidigeVolgorde.map(school => scoreTotaal[school] || 0));
  const winnaarScholen = huidigeVolgorde.filter(school => (scoreTotaal[school] || 0) === hoogsteScore);

  slides.push(
    createScoreboardSlide(
      scoreTotaal,
      {},
      finalNoNieuwEntries,
      [],          // geen .televote-received meer!
      null,
      false,       // geen puntennieuw-blokken!
      null,        // geen highlight
      winnaarScholen // <-- lijst van winnaars!
    )
  );
}

// === LAAD DATA EN INIT ===
fetch("punten.json")
  .then((response) => response.json())
  .then((data) => {
    juryData = data.jury;
    televoteData = data.televote;
    setupSlidesFromData(juryData);
    showSlide(0);
  });

// --- Tel-animatie helper ---
function animateNumber(element, start, end, duration = 800) {
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(start + (end - start) * progress);
    element.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = end;
    }
  }
  requestAnimationFrame(update);
}

// --- FLIP-animatie detectie helper ---
function arraysEqual(arr1, arr2) {
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;
  return arr1.every((v, i) => v === arr2[i]);
}

function showSlide(index) {
  const slideshow = document.getElementById("slideshow");
  const prev = slides[index - 1];
  const curr = slides[index];

  // FLIP-animatie tussen scoreboards indien nodig
  const isScoreboard = curr && curr.classList.contains('scoreboard-slide');
  const wasScoreboard = prev && prev.classList.contains('scoreboard-slide');
  const hadOrder = prev && prev._schoolOrder;
  const hasOrder = curr && curr._schoolOrder;
  const isFlip = isScoreboard && wasScoreboard && hadOrder && hasOrder &&
    !arraysEqual(prev._schoolOrder, curr._schoolOrder);

  if (isFlip) {
    slideshow.appendChild(prev);
    const oldBoxes = {};
    prev.querySelectorAll('.score-box').forEach(box => {
      const school = box.querySelector('.schoolnaam').innerText.trim();
      const rect = box.getBoundingClientRect();
      oldBoxes[school] = {top: rect.top, left: rect.left};
    });

    slideshow.innerHTML = "";
    slideshow.appendChild(curr);
    const newBoxes = Array.from(curr.querySelectorAll('.score-box'));
    const newRects = {};
    newBoxes.forEach(box => {
      const school = box.querySelector('.schoolnaam').innerText.trim();
      const rect = box.getBoundingClientRect();
      newRects[school] = {top: rect.top, left: rect.left};
    });

    newBoxes.forEach(box => {
      const school = box.querySelector('.schoolnaam').innerText.trim();
      const from = oldBoxes[school] || newRects[school];
      const to = newRects[school];
      const deltaX = from.left - to.left;
      const deltaY = from.top - to.top;
      box.style.transition = "none";
      box.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });

    void curr.offsetWidth;

    newBoxes.forEach(box => {
      box.style.transition = "transform 2s cubic-bezier(.63,0,.25,1), opacity 0.5s";
      box.style.transform = "";
      box.classList.add('in');
    });

    setTimeout(() => {
      newBoxes.forEach(box => {
        box.style.transition = "";
        box.style.transform = "";
      });
    }, 2050);

    return;
  }

  // Fade transitions
  const fadeTransitions = [
    ['punten-anim-slide', 'punten-slide'],
    ['jury-intro-video', 'punten-anim-slide'],
    ['scoreboard-voor12', 'scoreboard-met12nieuw'],
    ['scoreboard-na12nieuwblijft', 'scoreboard-slide'],
    ['scoreboard-slide', 'jury-intro-video'],
    ['slide start', 'jury-intro-video'],
  ];

  const shouldFade = fadeTransitions.some(([from, to]) =>
    prev && prev.classList.contains(from) && curr && curr.classList.contains(to)
  );

  if (shouldFade) {
    curr.classList.add('punten-fade-in');
    curr.style.position = 'absolute';
    curr.style.top = 0;
    curr.style.left = 0;
    curr.style.width = '100vw';
    curr.style.height = '100vh';
    curr.style.zIndex = 10;

    slideshow.appendChild(curr);

    setTimeout(() => {
      curr.classList.remove('punten-fade-in');
      curr.style.position = '';
      curr.style.top = '';
      curr.style.left = '';
      curr.style.width = '';
      curr.style.height = '';
      curr.style.zIndex = '';
      Array.from(slideshow.children).forEach(child => {
        if (child !== curr) slideshow.removeChild(child);
      });
    }, 600);
  } else {
    slideshow.innerHTML = '';
    slideshow.appendChild(curr);
  }

  if (curr.classList.contains("punten-anim-slide") && curr._animBlokken) {
    curr._animBlokken.forEach((blok, i) => {
      setTimeout(() => {
        blok.classList.add("in");
      }, i * 180);
    });
  }

  // Automatisch door naar scoreboard-voor12 na punten-slide (nu 4 seconden)
  if (
    curr.classList.contains('punten-slide')
  ) {
    setTimeout(() => {
      // Alleen als gebruiker niet al handmatig verder is gegaan!
      if (currentSlideIndex === index) {
        advanceOrAnimate(1);
      }
    }, 4000); // <--- 4 seconden wachten
  }

  if (
    curr.classList.contains('scoreboard-slide') &&
    curr.classList.contains('scoreboard-voor12')
  ) {
    const boxes = Array.from(curr.querySelectorAll('.score-box'));
    boxes.reverse().forEach((box, i) => {
      setTimeout(() => {
        box.classList.add('in');
      }, 200 * i);
    });
  }
  else if (curr.classList.contains('scoreboard-slide')) {
    const boxes = Array.from(curr.querySelectorAll('.score-box'));
    boxes.forEach(box => box.classList.add('in'));
  }

  if (
    curr.classList.contains('scoreboard-voor12') &&
    curr.querySelector('.puntennieuw')
  ) {
    curr.querySelectorAll('.puntennieuw').forEach((el, i) => {
      el.classList.remove('in');
      void el.offsetWidth;
      setTimeout(() => el.classList.add('in'), 100 + i * 90);
    });
  }
  else if (
    curr.classList.contains('scoreboard-slide') &&
    curr.querySelector('.puntennieuw')
  ) {
    curr.querySelectorAll('.puntennieuw').forEach(el => el.classList.add('in'));
  }

  if (
    curr.classList.contains('scoreboard-na12nieuwblijft') &&
    prev && prev.classList.contains('scoreboard-met12nieuw')
  ) {
    const currentBoxes = curr.querySelectorAll('.score-box .puntentotaal');
    const prevBoxes = prev.querySelectorAll('.score-box .puntentotaal');
    currentBoxes.forEach((currEl, i) => {
      const start = parseInt(prevBoxes[i]?.textContent ?? currEl.textContent, 10);
      const end = parseInt(currEl.textContent, 10);
      if (start !== end) {
        animateNumber(currEl, start, end, 800);
      }
    });
  }

  // Alleen auto-advance bij jury, niet bij televote!
  if (
    curr.classList.contains('scoreboard-auto-advance-trigger')
  ) {
    const autoSteps = 2;
    const stepTime = 1500;
    for (let i = 1; i <= autoSteps; i++) {
      setTimeout(() => {
        if (currentSlideIndex === index + i - 1) {
          advanceOrAnimate(1);
        }
      }, stepTime * i);
    }
  }
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowRight") {
    if (!document.fullscreenElement && document.body.requestFullscreen) {
      document.body.requestFullscreen().then(() => {
        advanceOrAnimate(1);
      });
    } else {
      advanceOrAnimate(1);
    }
  } else if (e.code === "ArrowLeft") {
    advanceOrAnimate(-1);
  }
});

function advanceOrAnimate(direction = 1) {
  currentSlideIndex += direction;

  if (currentSlideIndex >= slides.length) {
    setupSlidesFromData(juryData);
    currentSlideIndex = 0;
  } else if (currentSlideIndex < 0) {
    currentSlideIndex = slides.length - 1;
  }
  showSlide(currentSlideIndex);
}
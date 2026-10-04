const frameCount = 300;
const mobileViewportMedia = window.matchMedia(
  "(max-width: 767px), (orientation: landscape) and (max-width: 950px) and (max-height: 500px)",
);
const portraitFramesMedia = window.matchMedia("(max-width: 767px) and (orientation: portrait)");
let usesMobileViewport = mobileViewportMedia.matches;
let usesPortraitFrames = portraitFramesMedia.matches;

function createFrameSequence(usePortraitFrames) {
  const folder = usePortraitFrames ? "frames" : "frames-16x9";
  return Array.from({ length: frameCount }, (_, index) => {
    const image = new Image();
    image.decoding = "async";
    image.src = `./assets/${folder}/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`;
    image.addEventListener("load", requestDraw, { once: true });
    return image;
  });
}

let frames = createFrameSequence(usesPortraitFrames);

const canvas = document.querySelector("#sequence");
const context = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 576;
let targetFrame = 0;
let displayedFrame = 0;
let animationRequested = false;

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;

  if (usesMobileViewport) {
    const bitmapWidth = Math.round(width * pixelRatio);
    const bitmapHeight = Math.round(height * pixelRatio);
    if (canvas.width === bitmapWidth && canvas.height === bitmapHeight) return;

    canvas.width = bitmapWidth;
    canvas.height = bitmapHeight;
    requestDraw();
    return;
  }

  const frameScale = Math.floor(Math.min((width * pixelRatio) / 16, (height * pixelRatio) / 9));
  const bitmapWidth = Math.max(16, frameScale * 16);
  const bitmapHeight = Math.max(9, frameScale * 9);
  if (canvas.width === bitmapWidth && canvas.height === bitmapHeight) return;

  canvas.width = bitmapWidth;
  canvas.height = bitmapHeight;
  requestDraw();
}

function drawFrame(frameIndex) {
  const image = frames[frameIndex];
  if (!image.complete || image.naturalWidth === 0) return;

  const scale = usesMobileViewport
    ? Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
    : Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const left = (canvas.width - width) / 2;
  const top = (canvas.height - height) / 2;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, left, top, width, height);
}

function animate() {
  const difference = targetFrame - displayedFrame;
  displayedFrame += difference * 0.18;

  const frameIndex = Math.round(displayedFrame);
  if (frames[frameIndex]?.complete && frames[frameIndex].naturalWidth > 0) {
    drawFrame(frameIndex);
  } else {
    const nearestLoadedFrame = frames.findIndex(
      (image, index) => image.complete && image.naturalWidth > 0 && index >= frameIndex,
    );
    if (nearestLoadedFrame !== -1) drawFrame(nearestLoadedFrame);
  }

  if (Math.abs(difference) > 0.01) {
    requestAnimationFrame(animate);
  } else {
    displayedFrame = targetFrame;
    animationRequested = false;
  }
}

function requestDraw() {
  if (animationRequested) return;
  animationRequested = true;
  requestAnimationFrame(animate);
}

function updateTargetFrame() {
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? window.scrollY / scrollRange : 0;
  targetFrame = Math.min(frameCount - 1, Math.max(0, progress * (frameCount - 1)));
  requestDraw();
}

function syncAnimationViewport() {
  usesMobileViewport = mobileViewportMedia.matches;
  const shouldUsePortraitFrames = portraitFramesMedia.matches;
  if (shouldUsePortraitFrames !== usesPortraitFrames) {
    usesPortraitFrames = shouldUsePortraitFrames;
    frames = createFrameSequence(usesPortraitFrames);
  }

  resizeCanvas();
  requestDraw();
}

window.addEventListener("resize", syncAnimationViewport);
mobileViewportMedia.addEventListener("change", syncAnimationViewport);
portraitFramesMedia.addEventListener("change", syncAnimationViewport);
window.addEventListener("scroll", updateTargetFrame, { passive: true });
const canvasResizeObserver = new ResizeObserver(resizeCanvas);
canvasResizeObserver.observe(canvas);

if ("IntersectionObserver" in window) {
  document.body.classList.add("has-js");
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12 },
  );

  document.querySelectorAll(".reveal").forEach((section) => {
    revealObserver.observe(section);
  });
}

const techDescriptions = {
  JavaScript: "The programming language used to build interactive web experiences.",
  React: "A JavaScript library for building component-based user interfaces.",
  Python: "A versatile programming language used here to explore AI and machine learning.",
  "Node.js": "A JavaScript runtime for building server-side applications and tools.",
  Git: "A version control system for tracking changes to code.",
  HTML: "The markup language that gives web pages their structure.",
  CSS: "The style language used to shape and lay out web pages.",
  "Next.js": "A React framework for building full-stack web applications.",
  "UI/UX": "Designing useful interfaces and clear user experiences.",
  Express: "A lightweight Node.js framework for building web servers and APIs.",
  MongoDB: "A document database for storing application data.",
  Firebase: "A platform providing app services such as hosting and data storage.",
  APIs: "Interfaces that let applications communicate and share data.",
  "AI/ML": "Exploring artificial intelligence and machine learning concepts.",
  GitHub: "A platform for hosting code and collaborating with Git.",
  Deployment: "Publishing an application so people can use it online.",
};

function positionTechTooltip(item) {
  const tooltip = item.querySelector(".tech-tooltip");
  if (!tooltip) return;

  const itemBounds = item.getBoundingClientRect();
  const tooltipWidth = tooltip.getBoundingClientRect().width;
  const margin = 12;
  const left = Math.max(
    margin,
    Math.min(
      itemBounds.left + (itemBounds.width - tooltipWidth) / 2,
      window.innerWidth - tooltipWidth - margin,
    ),
  );

  tooltip.style.left = `${left - itemBounds.left}px`;
}

const techItems = document.querySelectorAll(".skill-list li, .client-names > span");
techItems.forEach((item, index) => {
  const description = techDescriptions[item.textContent.trim()];
  if (!description) return;

  const tooltip = document.createElement("span");
  tooltip.className = "tech-tooltip";
  tooltip.id = `tech-tooltip-${index}`;
  tooltip.setAttribute("role", "tooltip");
  tooltip.textContent = description;

  item.tabIndex = 0;
  item.setAttribute("aria-describedby", tooltip.id);
  item.append(tooltip);
  positionTechTooltip(item);
});

window.addEventListener("resize", () => {
  techItems.forEach(positionTechTooltip);
});

const achievementDetails = {
  hackathons: {
    title: "Hackathons & Ideathons",
    description:
      "Winner and runner-up across multiple hackathons and ideathons, building practical solutions focused on AI, web development, and real-world problems.",
    image: "./assets/hackathons-ideathons.png",
    imageAlt: "Hackathon and ideathon event collage showing participants, presentations, and award ceremonies.",
    imageCaption: "Hackathons & Ideathons · Achievement photo",
    items: [
      {
        title: "Ideathon Winner",
        event: "HIET Ghaziabad",
        result: "Winner",
        description: "Recognized as the winning idea at the HIET Ghaziabad ideathon.",
      },
      {
        title: "Hackathon Runner-Up",
        event: "Christ University Hack Genesis",
        result: "Runner-Up",
        description: "Placed runner-up at Christ University Hack Genesis.",
      },
      {
        title: "Innovation Ignite Winner",
        event: "TechnoHack / Inmantech",
        result: "Winner",
        description: "Won the Innovation Ignite competition.",
      },
      {
        title: "Eureka Innovation Challenge",
        event: "Eureka Innovation Challenge",
        result: "Finalist",
        description: "Selected as a finalist in the Eureka Innovation Challenge.",
      },
    ],
  },
  innovation: {
    title: "Innovation & Project Competitions",
    description:
      "Recognized for developing innovative technology solutions and presenting projects at institutional and innovation competitions.",
    image: "./assets/innovation-competitions.png",
    imageAlt: "Innovation competition photo collage showing project presentations, awards, certificates, and teams.",
    imageCaption: "Innovation & Project Competitions · Achievement photo",
    items: [
      {
        title: "SDHT — Street Dog Health Twin",
        event: "Project",
        result: "Innovation project",
        description: "An AI-assisted digital health monitoring concept for street dogs.",
      },
      {
        title: "Innovation Ignite",
        event: "Innovation Ignite",
        result: "1st Prize",
        description: "Recognized with first prize at Innovation Ignite.",
      },
      {
        title: "Ideathon",
        event: "Ideathon",
        result: "Winner",
        description: "Recognized as an ideathon winner.",
      },
      {
        title: "Vision to Prototype",
        event: "Vision to Prototype",
        result: "1st Prize",
        description: "Recognized with first prize at Vision to Prototype.",
      },
      {
        title: "Academic Excellence Award",
        event: "Academic Excellence Award",
        result: "Award",
        description: "Received an academic excellence award.",
      },
    ],
  },
  certifications: {
    title: "Certifications & Technical Learning",
    description:
      "Continuously building skills across web development, AI/ML, programming, UI/UX, and modern AI-assisted development.",
    image: "./assets/certifications-learning.png",
    imageAlt: "Certification and achievement collage showing certificates, awards, and trophies.",
    imageCaption: "Certifications & Technical Learning · Achievement collage",
    items: [],
    note: "Certification and learning collage.",
  },
};

const achievementModal = document.querySelector(".achievement-modal");
const achievementModalTitle = document.querySelector("#achievement-modal-title");
const achievementModalDescription = document.querySelector("#achievement-modal-description");
const achievementModalContent = document.querySelector(".achievement-modal-content");
const achievementModalClose = document.querySelector(".achievement-modal-close");

function openAchievementModal(achievement) {
  const details = achievementDetails[achievement];
  if (!details) return;

  achievementModalTitle.textContent = details.title;
  achievementModalDescription.textContent = details.description;
  achievementModalContent.replaceChildren();

  const gallery = document.createElement("figure");
  gallery.className = "achievement-modal-gallery";
  const image = document.createElement("img");
  image.src = details.image;
  image.alt = details.imageAlt;
  const caption = document.createElement("figcaption");
  caption.textContent = details.imageCaption;
  gallery.append(image, caption);
  achievementModalContent.append(gallery);

  if (details.items.length > 0) {
    for (const item of details.items) {
      const card = document.createElement("article");
      card.className = "achievement-detail";

      const title = document.createElement("h3");
      title.textContent = item.title;

      const result = document.createElement("span");
      result.className = "achievement-detail-result";
      result.textContent = item.result;

      const meta = document.createElement("p");
      meta.textContent = `${item.event} · Year not provided`;

      const description = document.createElement("p");
      description.textContent = item.description;

      card.append(title, result, meta, description);
      achievementModalContent.append(card);
    }
  } else {
    const note = document.createElement("p");
    note.className = "achievement-modal-note";
    note.textContent = details.note;
    achievementModalContent.append(note);
  }

  achievementModal.showModal();
}

document.querySelectorAll(".achievement-row").forEach((row) => {
  row.addEventListener("click", () => {
    openAchievementModal(row.dataset.achievement);
  });
});

achievementModalClose.addEventListener("click", () => achievementModal.close());
achievementModal.addEventListener("click", (event) => {
  if (event.target === achievementModal) achievementModal.close();
});
achievementModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  achievementModal.close();
});
achievementModal.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  achievementModal.close();
});

resizeCanvas();
updateTargetFrame();

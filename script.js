

const bounceSound = new Audio("sounds/click.wav");
const profileLinksArr = Array.from(document.querySelectorAll('.profilepic-link')).map(el => {
  const rect = el.getBoundingClientRect();
  let dx = 3;
  let dy = 3;
  const w = el.offsetWidth || rect.width || 100;
  const h = el.offsetHeight || rect.height || 100;
  let sx = el.offsetLeft || rect.left;
  let sy = el.offsetTop || rect.top;
  el.style.zIndex = 14;
  el.style.pointerEvents = "auto";
  return {
    el: el,
    x: sx,
    y: sy,
    dx: dx,
    dy: dy,
    hue: 0 
  };
});

function handleProjectButtonLink(e) {
  let url = e.currentTarget.getAttribute('data-url');
  if (
    url && 
    e.currentTarget.tagName === 'BUTTON' &&
    e.currentTarget.getAttribute('type') !== 'submit' &&
    (!e.currentTarget.hasAttribute("onclick") || e.currentTarget.id === "fun-project-btn")
  ) {
    if (e.type === 'click' || e.key === "Enter" || e.key === " ") {
      window.open(url, "_blank");
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  Array.from(document.getElementsByClassName('project-link')).forEach(btn => {
    if (btn.id !== "fun-project-btn") {
      btn.addEventListener('click', handleProjectButtonLink);
      btn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleProjectButtonLink(e);
        }
      });
    }
  });
});

const allProjectLinks = document.getElementsByClassName("project-link");
const projectSearchInput = document.getElementById("project-search-input");
const projectsToggleBtn = document.getElementById("projects-toggle-btn");
const projectListSection = document.getElementById("project-list-section");
const projectListGrid = projectListSection.querySelector('.project-list-grid');

Array.from(allProjectLinks).forEach(btn => {
  btn.style.transform = "none";
  btn.removeAttribute('data-base-transform');
});

let areProjectsVisible = false;

let isProjectsToggleOnCooldown = false;
let projectBtnCooldownTimeout = null;

function startProjectsToggleCooldown() {
  isProjectsToggleOnCooldown = true;
  projectsToggleBtn.classList.add('cooldown');
  projectsToggleBtn.disabled = true;
  projectBtnCooldownTimeout = setTimeout(() => {
    isProjectsToggleOnCooldown = false;
    projectsToggleBtn.classList.remove('cooldown');
    projectsToggleBtn.disabled = false;
  }, 3000);
}

function toggleProjectsSection() {
  if (isProjectsToggleOnCooldown) return; 
  startProjectsToggleCooldown();

  const links = projectListGrid.querySelectorAll('.project-link');
  if (!areProjectsVisible) {
    projectListSection.classList.add("visible");
    projectListSection.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      projectSearchInput.classList.add("visible");
    }, 200);

    links.forEach((el, idx) => {
      setTimeout(() => {
        el.classList.add("visible");
      }, idx * 45 + 320);
    });

    setTimeout(() => {
      projectSearchInput.focus();
    }, 420);

    projectsToggleBtn.textContent = "Hide projects";
    areProjectsVisible = true;
  } else {
    let total = links.length;

    links.forEach((el, i) => {
      setTimeout(() => {
        el.classList.remove("visible");
      }, (total - 1 - i) * 45 + 80);
    });

    setTimeout(() => {
      projectSearchInput.classList.remove("visible"); 
    }, total * 45 + 120);

    setTimeout(() => {
      projectListSection.classList.remove("visible");
      projectListSection.setAttribute('aria-hidden', 'true');
      projectsToggleBtn.textContent = "See all projects";
    }, total * 45 + 520);

    areProjectsVisible = false;
  }
}

projectsToggleBtn.addEventListener('click', toggleProjectsSection);

projectsToggleBtn.addEventListener("keydown", function(e) {
  if (isProjectsToggleOnCooldown) {
    e.preventDefault();
    return;
  }
  if (e.key === "Enter" || e.keyCode === 13 || e.key === " " || e.keyCode === 32) {
    e.preventDefault();
    toggleProjectsSection();
  }
});

projectSearchInput.addEventListener("input", function(event) {
  const searchStr = projectSearchInput.value.toLowerCase().trim();
  let prefixMatches = [];
  let otherMatches = [];

  for (let i = 0; i < allProjectLinks.length; i++) {
    const el = allProjectLinks[i];
    const content = el.textContent.toLowerCase();
    const keywords = (el.getAttribute('data-keywords') || '').toLowerCase();
    const combined = content + ' ' + keywords;

    if (!searchStr || combined.includes(searchStr)) {
      if (content.startsWith(searchStr) && searchStr !== "") {
        prefixMatches.push(el);
      } else if (keywords.startsWith(searchStr) && searchStr !== "") {
        prefixMatches.push(el);
      } else {
        otherMatches.push(el);
      }
    }
  }

  for (let i = 0; i < allProjectLinks.length; i++) {
    allProjectLinks[i].style.display = "none";
  }

  let shown = 0;
  prefixMatches.forEach(el => {
    el.style.display = "";
    el.style.order = -1;
    shown++;
  });
  otherMatches.forEach((el, idx) => {
    el.style.display = "";
    el.style.order = ""; 
    shown++;
  });
});


let dvdAnimating = false;
function updateProfileLinksDVD() {
  const scrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  profileLinksArr.forEach(obj => {
    let {el, x, y, dx, dy} = obj;
    const w = el.offsetWidth || 100;
    const h = el.offsetHeight || 100;
    const maxX = (window.innerWidth || document.documentElement.clientWidth) + scrollX - w;
    const maxY = (window.innerHeight || document.documentElement.clientHeight) + scrollY - h - 10;
    let bounced = false;
    x += dx;
    y += dy;
    if (x >= maxX) {
      dx = -Math.abs(dx);
      obj.hue += 37;
      bounced = true;
      x = maxX;
    }
    if (x <= scrollX) {
      dx = Math.abs(dx);
      obj.hue += 47;
      bounced = true;
      x = scrollX;
    }
    if (y >= maxY) {
      dy = -Math.abs(dy);
      obj.hue += 59;
      bounced = true;
      y = maxY;
    }
    if (y <= scrollY) {
      dy = Math.abs(dy);
      obj.hue += 41;
      bounced = true;
      y = scrollY;
    }
    obj.x = x;
    obj.y = y;
    obj.dx = dx;
    obj.dy = dy;
    el.style.position = window.innerWidth > 700 ? "absolute" : "fixed";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.margin = "0"; 
    if (bounced) {
      try {
        bounceSound.currentTime = 0;
        bounceSound.play();
      } catch (e) {}
      el.style.filter = `hue-rotate(${obj.hue}deg)`;
    }
  });
  if (dvdAnimating) {
    requestAnimationFrame(updateProfileLinksDVD);
  }
}
let t = 0;
const pi = Math.PI;
const funProjectBtn = document.getElementById("fun-project-btn");
const golProjectBtn = document.getElementById("project-gol");
const coreballProjectBtn = document.getElementById("project-coreball");
const ag2ProjectBtn = document.getElementById("project-ag2");
const sortingAlgosProjectBtn = document.getElementById("project-sorting-algos");
const hackingProjectBtn = document.getElementById("project-hacking");
const hackingBitsSpan = document.getElementById("project-hacking-bits");
const aboutSection = document.getElementById("about-section");
const backgroundOverlay = document.getElementById("overlay-background");
const welcomeHeading = document.getElementById("welcome-heading");

let funBtnClicked = false;
const buttonOriginalTransformMap = new WeakMap();
function getBaseTransform(el) {
  const style = window.getComputedStyle(el);
  let tf = style.transform;
  if (el.hasAttribute('data-base-transform')) {
    return el.getAttribute('data-base-transform') || "";
  } else {
    el.setAttribute('data-base-transform', tf === "none" ? "" : tf);
    return tf === "none" ? "" : tf;
  }
}

function randomRotate() {
  return Math.random() * 10 - 5; 
}

document.addEventListener('DOMContentLoaded', function() {
  const buttons = document.querySelectorAll('.project-button');
  const projectListSectionInner = document.getElementById('project-list-section');
  buttons.forEach(function(btn) {
    btn.addEventListener('mouseenter', function() {
      let base = getBaseTransform(btn);
      const deg = randomRotate();
      btn.style.transform = (base ? base + " " : "") + `rotate(${deg}deg) scale(1.05)`;
      btn.style.transition = "transform 0.28s cubic-bezier(0.23,1.3,0.32,1)";
    });
    btn.addEventListener('mouseleave', function() {
      let base = btn.getAttribute('data-base-transform') || "";
      btn.style.transform = base;
    });
    btn.addEventListener('focus', function(e) {
      if (projectListSectionInner && projectListSectionInner.getAttribute('aria-hidden') === "true") {
        btn.blur();
        document.getElementById("profile-links-row").focus();
        return;
      }
      const deg = randomRotate();
      let base = getBaseTransform(btn);
      btn.style.transform = (base ? base + " " : "") + `rotate(${deg}deg) scale(1.05)`;
      btn.style.transition = "transform 0.28s cubic-bezier(0.23,1.3,0.32,1)";
    });
    btn.addEventListener('blur', function() {
      let base = btn.getAttribute('data-base-transform') || "";
      btn.style.transform = base;
    });
  });

  function adjustProfileLinksRowGrid() {
    const linksRow = document.getElementById('profile-links-row');
    const minPfpWidth = 140 * 2 + 20 * 2;
    if (window.innerWidth <= minPfpWidth + 20) {
      linksRow.style.flexDirection = "column";
      Array.from(linksRow.children).forEach(el => el.style.width = "100%");
    } else if (window.innerWidth <= 450) {
      linksRow.style.flexDirection = "row";
      Array.from(linksRow.children).forEach(el => el.style.width = "45%");
    } else {
      linksRow.style.flexDirection = "row";
      Array.from(linksRow.children).forEach(el => el.style.width = "");
    }
  }
  adjustProfileLinksRowGrid();
  window.addEventListener('resize', adjustProfileLinksRowGrid);

  const searchBar = document.getElementById("project-search-input");

  searchBar.addEventListener("focus", () => {
    if (projectListSectionInner && projectListSectionInner.getAttribute('aria-hidden') === "true") {
      searchBar.blur();
      document.getElementById("profile-links-row").focus();
    }
  })
});

function randomDxDy() {
  let dx = 0, dy = 0;
  while (Math.abs(dx) < 1.5) {
    dx = Math.random() * 10 - 5;
  }
  while (Math.abs(dy) < 1.5) {
    dy = Math.random() * 10 - 5;
  }
  return { dx, dy };
}

function movestuff() {
  if (!funBtnClicked) {
    profileLinksArr.forEach(obj => {
      const {dx, dy} = randomDxDy();
      obj.dx = dx;
      obj.dy = dy;
    });
    if (profileLinksArr.length > 0 && !dvdAnimating) {
      profileLinksArr.forEach(obj => {
        const el = obj.el;
        el.style.position = window.innerWidth > 700 ? 'absolute' : 'fixed';
        el.style.left = `${obj.x}px`;
        el.style.top = `${obj.y}px`;
        el.style.margin = "0"; 
        el.style.zIndex = 14;
      });
      dvdAnimating = true;
      requestAnimationFrame(updateProfileLinksDVD);
    }
  } 
  funBtnClicked = true;
  const texts = document.getElementsByClassName("site-text");
  for (let i = 0; i < texts.length; i++) {
    texts[i].style.color = `hsl(${t * 100 % 360}, 50%, 70%)`;
    texts[i].style.transform = `rotate(${Math.sin(t + i) * 10}deg) scale(${Math.sin(t*2+i)*0.1+1})`;
  }

  backgroundOverlay.style.backgroundColor = `hsla(${(t*30)%360},50%,50%,0.3)`

  requestAnimationFrame(movestuff);
}

function tick() {
  t += 0.1;
  if (funProjectBtn)
    funProjectBtn.style.borderColor = `hsl(${(t * 50) % 360},50%,80%)`;
  if (golProjectBtn) {
    golProjectBtn.style.color = `hsl(0,0%,${(Math.sin(t)) * 10 + 85}%)`;

    const glowSpread = 18 + Math.sin(t*2) * 6;
    const hue = (t * 10) % 360;
    golProjectBtn.style.boxShadow = `
      0 0 ${glowSpread}px 4px hsl(${hue},95%,70%, 0.72), 
      0 0 35px 2px hsl(${hue},100%,90%, 0.18)
    `;

    golProjectBtn.style.textShadow = `
      0 0 ${(4 + Math.abs(Math.sin(t)) * 10).toFixed(1)}px hsl(${(hue+60)%360},100%,92%)
    `;
  }

  if (coreballProjectBtn) 
    coreballProjectBtn.style.textShadow = `0px 0px ${Math.sin(t/4)*2+3}px #ffff`
  if (ag2ProjectBtn)
    ag2ProjectBtn.style.color = `hsl(200,50%,${(Math.sin(t)) * 8 + 85}%)`;
  if (sortingAlgosProjectBtn) {
    sortingAlgosProjectBtn.style.color = `hsl(${(t*30)%360},50%,90%)`;
  }
  if (hackingBitsSpan) {
    let temp = "";
    for (let i = 0; i < 10; i++) {
      temp += Math.floor(Math.random() * 2);
    }
    hackingBitsSpan.textContent = temp;
  }

  requestAnimationFrame(tick);
}
tick();

const API_KEY = 'AIzaSyC7gEwjzOTKn_YFqGN6Hd79c64wJDGmqI0'; 
const CHANNEL_ID = 'UChg4Ht2VjZOlNpYepy7LTDw';

const uploadPlaylistId = CHANNEL_ID.replace(/^UC/, 'UU');

const apiChunk = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadPlaylistId}&maxResults=1&key=${API_KEY}`;

async function fetchLatestVideo() {
    try {
        const response = await fetch(apiChunk);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const video = data.items[0].snippet;
            const videoId = video.resourceId.videoId;

            document.getElementById('youtube-player-container').innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            `;
        } 
    } catch (error) {
        console.error("Error fetching YouTube video:", error);
       
    }
}

fetchLatestVideo();

const focus = `Improving existing projects and scripts`;
async function loadConfigAndSetAboutSection() {
  try {
    const mod = await import("https://parkes-codes.github.io/website2/js/config.js");
    window.configData = mod.someData;
    aboutSection.innerHTML = `
      <div style="font-weight: bold; margin-bottom: -10px;">About this page:</div><br><br>
      Projects: ${document.querySelectorAll(".project-button").length} <br><br>
      Latest Update: ${window.configData.lastUpdated} <br><br>
      Current focus: ${focus}
    </div>
    `;
  } catch (err) {
    aboutSection.innerHTML = `
      <div style="font-weight: bold; margin-bottom: -10px;">About this page:</div><br><br>
      Projects: ${document.querySelectorAll(".project-button").length} <br><br>
      Latest Update: (data fetch failed) <br><br>
      Current focus: ${focus}
    </div>
    `;
    console.error("Failed to load remote config.js", err);
  }
}
loadConfigAndSetAboutSection();
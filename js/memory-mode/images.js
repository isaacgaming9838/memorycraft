const MOB_RENDER_BASE = "https://mc-heads.net/mob";
const MOB_HEAD_BASE = "https://mc-heads.net/head";
const LOCAL_MOB_BASE = "assets/mobs";

function getMobImageCandidates(mob) {
  const variants = [mob.head, mob.name.replace(/\s+/g, "_"), mob.head.replace(/_/g, "")];
  const urls = [];
  if (mob.spriteOverride) {
    urls.push(mob.spriteOverride);
  }

  variants.forEach((key) => {
    urls.push(`${LOCAL_MOB_BASE}/${key}.png`);
    urls.push(`${MOB_RENDER_BASE}/${key}.png`);
    urls.push(`${MOB_RENDER_BASE}/${key}`);
    urls.push(`${MOB_RENDER_BASE}/${key}/160`);
  });

  urls.push(`${MOB_HEAD_BASE}/${mob.head}/160`);
  urls.push(`${MOB_HEAD_BASE}/${mob.head}`);
  return [...new Set(urls)];
}

function makeFallbackImage(mob) {
  const label = mob.name.toUpperCase().slice(0, 14);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#f3f4f6"/><rect x="4" y="4" width="88" height="88" fill="#ffffff" stroke="#111" stroke-width="4"/><text x="48" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#111">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function setMobImage(img, mob) {
  const candidates = getMobImageCandidates(mob);
  let index = 0;

  function loadNext() {
    if (index >= candidates.length) {
      img.onerror = null;
      img.src = makeFallbackImage(mob);
      img.alt = `${mob.name} image fallback`;
      return;
    }
    img.src = candidates[index];
    index += 1;
  }

  img.onerror = loadNext;
  loadNext();
}

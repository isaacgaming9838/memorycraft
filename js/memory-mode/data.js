const MOB_RENDER_BASE = "https://mc-heads.net/mob";

export const FILTER_OPTIONS = ["mobs", "blocks", "nether", "overworld", "end", "neutral", "passive", "hostile", "structures", "test", "desert", "ocean", "forest", "plains", "mountains", "swamp", "jungle", "taiga", "savanna", "badlands", "snowy"];

export function getDefaultFilters() {
  return ["mobs", "nether", "overworld", "end", "neutral", "passive", "hostile"];
}

export function getMobTags(name) {
  const nether = new Set(["blaze", "ghast", "magma cube", "hoglin", "piglin", "piglin brute", "strider", "zoglin", "zombified piglin", "wither skeleton"]);
  const end = new Set(["ender dragon", "enderman", "endermite", "shulker"]);
  const passive = new Set(["allay", "armadillo", "axolotl", "bat", "camel", "cat", "chicken", "cod", "cow", "donkey", "fox", "frog", "glow squid", "goat", "horse", "llama", "mooshroom", "mule", "ocelot", "panda", "parrot", "pig", "pufferfish", "rabbit", "salmon", "sheep", "skeleton horse", "sniffer", "squid", "strider", "tadpole", "tropical fish", "turtle", "villager", "wandering trader", "wolf", "zombie horse"]);
  const neutral = new Set(["bee", "cave spider", "dolphin", "enderman", "goat", "iron golem", "llama", "piglin", "polar bear", "spider", "trader llama", "wolf", "zombified piglin"]);

  const tags = [];
  if (nether.has(name)) tags.push("nether");
  else if (end.has(name)) tags.push("end");
  else tags.push("overworld");
  if (passive.has(name)) tags.push("passive");
  if (neutral.has(name)) tags.push("neutral");
  if (!passive.has(name) && !neutral.has(name)) tags.push("hostile");
  if (name === "pig") tags.push("test");
  return tags;
}

export function getStructureTags(name) {
  const nether = new Set(["bastion remnant", "nether fortress", "nether fossil"]);
  const end = new Set(["end city"]);

  const tags = ["structures"];
  if (nether.has(name)) tags.push("nether");
  else if (end.has(name)) tags.push("end");
  else tags.push("overworld");
  return tags;
}

const NETHER_BLOCK_HINTS = [
  "nether",
  "netherrack",
  "blackstone",
  "basalt",
  "crimson",
  "warped",
  "soul_",
  "shroomlight",
  "nylium",
  "quartz",
  "glowstone",
  "magma",
  "ancient_debris",
  "gilded_blackstone",
  "weeping_vines",
  "twisting_vines",
  "netherite",
  "respawn_anchor",
  "lodestone"
];

const END_BLOCK_HINTS = [
  "end_",
  "purpur",
  "chorus",
  "dragon_egg"
];

const BIOME_BLOCK_MAP = {
  desert: ["sand", "sandstone", "cactus", "dead bush", "terracotta"],
  ocean: ["prismarine", "sea lantern", "kelp", "seagrass", "coral", "sponge", "wet sponge"],
  forest: ["oak", "birch", "dark oak", "mushroom", "podzol"],
  plains: ["grass", "dandelion", "poppy", "sunflower"],
  mountains: ["stone", "emerald", "snow", "ice", "packed ice", "goat horn"],
  swamp: ["lily pad", "slime", "clay", "mangrove", "mud"],
  jungle: ["jungle", "bamboo", "cocoa", "melon", "panda"],
  taiga: ["spruce", "fern", "sweet berry", "fox"],
  savanna: ["acacia", "tall grass"],
  badlands: ["red sand", "terracotta", "gold"],
  snowy: ["snow", "ice", "packed ice", "blue ice", "powder snow", "igloo"]
};

function toBlockId(name) {
  return String(name).toLowerCase().trim().replace(/\s+/g, "_");
}

export function getBlockTags(name) {
  const id = toBlockId(name);

  const hasNetherHint = NETHER_BLOCK_HINTS.some((hint) => id.includes(hint));
  const hasEndHint = END_BLOCK_HINTS.some((hint) => id.includes(hint));

  const tags = ["blocks"];

  if (hasNetherHint) tags.push("nether");
  if (hasEndHint) tags.push("end");

  if (!hasNetherHint && !hasEndHint) {
    tags.push("overworld");
  }

  // Add biome tags
  for (const [biome, hints] of Object.entries(BIOME_BLOCK_MAP)) {
    if (hints.some((hint) => id.includes(hint) || name.toLowerCase().includes(hint))) {
      tags.push(biome);
    }
  }

  return [...new Set(tags)];
}

function parseVersion(version) {
  return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersionsDesc(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i += 1) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return db - da;
  }

  return 0;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error("Failed to fetch " + url);
  return response.json();
}

const EXCLUDED_BLOCK_NAMES = new Set([
  "leaf litter",
  "fire",
  "soul fire",
  "moving piston",
  "void air",
  "cave air"
]);

const EXCLUDED_BLOCK_HINTS = [
  "potted ",
  " wall",
  "banner",
  "head",
  "skull",
  "wall ",
  "_wall",
  "command block",
  "jigsaw",
  "structure block",
  "structure void",
  "candle",
  "carpet",
  "pressure plate",
  "button",
  "door",
  "trapdoor",
  "fence",
  "slab",
  "stairs",
  "sign",
  "coral",
  "sapling",
  "leaves",
  "wood",
  "log",
  "stem",
  "hyphae",
  "stripped",
  "infested",
  "spawner",
  "piston",
  "redstone",
  "repeater",
  "comparator",
  "observer",
  "dispenser",
  "dropper",
  "hopper",
  "rail",
  "torch",
  "lantern",
  "campfire",
  "brewing stand",
  "cauldron",
  "composter",
  "lectern",
  "loom",
  "smoker",
  "blast furnace",
  "grindstone",
  "stonecutter",
  "smithing table",
  "cartography table",
  "fletching table",
  "barrel",
  "bell",
  "bed",
  "cake",
  "conduit",
  "beacon",
  "anvil",
  "enchanting table",
  "ender chest",
  "shulker box",
  "respawn anchor",
  "lodestone",
  "target",
  "honey block",
  "slime block",
  "tnt",
  "pumpkin",
  "melon",
  "hay block",
  "dried kelp block",
  "bone block",
  "nether wart block",
  "warped wart block",
  "shroomlight",
  "sea pickle",
  "turtle egg",
  "sniffer egg",
  "froglight",
  "sculk sensor",
  "sculk shrieker",
  "sculk catalyst",
  "calibrated sculk sensor",
  "reinforced deepslate",
  "crafter",
  "trial spawner",
  "vault",
  "heavy core",
  "decorated pot",
  "suspicious",
  "budding amethyst",
  "amethyst cluster",
  "amethyst bud",
  "pointed dripstone",
  "big dripleaf",
  "small dripleaf",
  "spore blossom",
  "azalea",
  "flowering azalea",
  "moss carpet",
  "glow lichen",
  "hanging roots",
  "rooted dirt",
  "powder snow",
  "lightning rod",
  "copper bulb",
  "copper grate",
  "copper trapdoor",
  "copper door",
  "chiseled copper",
  "cut copper",
  "exposed",
  "weathered",
  "oxidized",
  "waxed"
];

function isAllowedBlockName(name) {
  if (EXCLUDED_BLOCK_NAMES.has(name)) return false;
  return !EXCLUDED_BLOCK_HINTS.some((hint) => name.includes(hint));
}

export async function loadLatestBlocks() {
  const base = "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data";
  const fallbackVersions = ["1.21.4", "1.21.3", "1.21.1", "1.21"];

  let versions = [];
  try {
    const dataPaths = await fetchJson(`${base}/dataPaths.json`);
    versions = Object.keys(dataPaths.pc || {})
      .filter((version) => /^\d+\.\d+(\.\d+)?$/.test(version))
      .sort(compareVersionsDesc)
      .slice(0, 8);
  } catch {
    versions = [];
  }

  const candidates = [...new Set([...versions, ...fallbackVersions])]
    .map((version) => `${base}/pc/${version}/blocks.json`);

  for (const url of candidates) {
    try {
      const rawBlocks = await fetchJson(url);
      if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) continue;

      const names = rawBlocks
        .map((entry) => String(entry.name || "").trim())
        .filter(Boolean)
        .map((name) => name.replace(/_/g, " "))
        .filter(isAllowedBlockName);

      const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b));
      if (unique.length > 0) {
        return unique.map((blockName) => ({ name: blockName, head: "stone", sprite: "" }));
      }
    } catch {
      // Try next source/version.
    }
  }

  return blocks;
}
const baseMobs = [
  { name: "allay", head: "allay" },
  { name: "armadillo", head: "armadillo" },
  { name: "axolotl", head: "axolotl" },
  { name: "bat", head: "bat" },
  { name: "bee", head: "bee" },
  { name: "blaze", head: "blaze" },
  { name: "bogged", head: "bogged" },
  { name: "breeze", head: "breeze" },
  { name: "camel", head: "camel" },
  { name: "cat", head: "cat" },
  { name: "cave spider", head: "cave_spider" },
  { name: "chicken", head: "chicken" },
  { name: "cod", head: "cod" },
  { name: "cow", head: "cow" },
  { name: "creeper", head: "creeper" },
  { name: "dolphin", head: "dolphin" },
  { name: "donkey", head: "donkey" },
  { name: "drowned", head: "drowned" },
  { name: "elder guardian", head: "elder_guardian" },
  { name: "ender dragon", head: "ender_dragon" },
  { name: "enderman", head: "enderman" },
  { name: "endermite", head: "endermite" },
  { name: "evoker", head: "evoker" },
  { name: "fox", head: "fox" },
  { name: "frog", head: "frog" },
  { name: "ghast", head: "ghast" },
  { name: "glow squid", head: "glow_squid" },
  { name: "goat", head: "goat" },
  { name: "guardian", head: "guardian" },
  { name: "hoglin", head: "hoglin" },
  { name: "horse", head: "horse" },
  { name: "husk", head: "husk" },
  { name: "iron golem", head: "iron_golem" },
  { name: "llama", head: "llama" },
  { name: "magma cube", head: "magma_cube" },
  { name: "mooshroom", head: "mooshroom" },
  { name: "mule", head: "mule" },
  { name: "ocelot", head: "ocelot" },
  { name: "panda", head: "panda" },
  { name: "parrot", head: "parrot" },
  { name: "phantom", head: "phantom" },
  { name: "pig", head: "pig" },
  { name: "piglin", head: "piglin" },
  { name: "piglin brute", head: "piglin_brute" },
  { name: "pillager", head: "pillager" },
  { name: "polar bear", head: "polar_bear" },
  { name: "pufferfish", head: "pufferfish" },
  { name: "rabbit", head: "rabbit" },
  { name: "ravager", head: "ravager" },
  { name: "salmon", head: "salmon" },
  { name: "sheep", head: "sheep" },
  { name: "shulker", head: "shulker" },
  { name: "silverfish", head: "silverfish" },
  { name: "skeleton", head: "skeleton" },
  { name: "skeleton horse", head: "skeleton_horse" },
  { name: "slime", head: "slime" },
  { name: "sniffer", head: "sniffer", spriteOverride: "https://mcasset.cloud/1.20.4/assets/minecraft/textures/item/sniffer_spawn_egg.png" },
  { name: "snow golem", head: "snow_golem" },
  { name: "spider", head: "spider" },
  { name: "squid", head: "squid" },
  { name: "stray", head: "stray" },
  { name: "strider", head: "strider" },
  { name: "tadpole", head: "tadpole" },
  { name: "trader llama", head: "trader_llama" },
  { name: "tropical fish", head: "tropical_fish" },
  { name: "turtle", head: "turtle" },
  { name: "vex", head: "vex" },
  { name: "villager", head: "villager" },
  { name: "vindicator", head: "vindicator" },
  { name: "wandering trader", head: "wandering_trader" },
  { name: "warden", head: "warden" },
  { name: "witch", head: "witch" },
  { name: "wither", head: "wither" },
  { name: "wither skeleton", head: "wither_skeleton" },
  { name: "wolf", head: "wolf" },
  { name: "zoglin", head: "zoglin" },
  { name: "zombie", head: "zombie" },
  { name: "zombie horse", head: "zombie_horse" },
  { name: "zombie villager", head: "zombie_villager" },
  { name: "zombified piglin", head: "zombified_piglin" }
].map((mob) => ({
  ...mob,
  sprite: `${MOB_RENDER_BASE}/${mob.head}/160`
}));

const releaseOrder = [
  "pig", "sheep", "cow", "chicken", "squid", "zombie", "skeleton", "spider",
  "creeper", "slime", "ghast", "zombified piglin", "blaze", "magma cube", "wolf",
  "enderman", "silverfish", "cave spider", "villager", "iron golem", "snow golem",
  "mooshroom", "ocelot", "ender dragon", "wither skeleton", "wither", "witch", "bat",
  "horse", "donkey", "mule", "skeleton horse", "zombie horse", "rabbit", "endermite",
  "guardian", "elder guardian", "shulker", "polar bear", "husk", "stray", "llama",
  "vex", "vindicator", "evoker", "parrot", "dolphin", "cod", "salmon", "pufferfish",
  "tropical fish", "drowned", "turtle", "phantom", "pillager", "ravager",
  "wandering trader", "trader llama", "cat", "fox", "panda", "bee", "zoglin",
  "hoglin", "piglin", "piglin brute", "strider", "axolotl", "glow squid", "goat",
  "allay", "frog", "tadpole", "warden", "camel", "sniffer", "breeze", "bogged",
  "armadillo"
];

const releaseRank = new Map(releaseOrder.map((name, index) => [name, index]));

export const mobs = [...baseMobs].sort(
  (a, b) => (releaseRank.get(a.name) ?? Number.MAX_SAFE_INTEGER) - (releaseRank.get(b.name) ?? Number.MAX_SAFE_INTEGER)
);

const structureNames = [
  "ancient city",
  "bastion remnant",
  "buried treasure",
  "desert pyramid",
  "end city",
  "igloo",
  "jungle temple",
  "mineshaft",
  "nether fortress",
  "nether fossil",
  "ocean monument",
  "pillager outpost",
  "ruined portal",
  "shipwreck",
  "stronghold",
  "swamp hut",
  "trail ruins",
  "trial chambers",
  "village",
  "woodland mansion"
];

export const structures = structureNames.map((name) => ({
  name,
  head: "chest",
  sprite: ""
}));

const blockNames = [
  "ancient debris",
  "basalt",
  "blackstone",
  "cobblestone",
  "crimson nylium",
  "dirt",
  "end stone",
  "glowstone",
  "magma block",
  "nether bricks",
  "nether gold ore",
  "netherrack",
  "oak planks",
  "purpur block",
  "quartz ore",
  "soul sand",
  "stone",
  "warped nylium",
  "andesite",
  "calcite",
  "clay",
  "coal ore",
  "copper ore",
  "deepslate",
  "diamond ore",
  "diorite",
  "emerald ore",
  "granite",
  "grass block",
  "gravel",
  "iron ore",
  "lapis ore",
  "moss block",
  "mud",
  "obsidian",
  "redstone ore",
  "sand",
  "sandstone",
  "spruce planks",
  "tuff"
];

export const blocks = blockNames.map((name) => ({
  name,
  head: "stone",
  sprite: ""
}));

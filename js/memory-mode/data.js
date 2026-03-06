const MOB_RENDER_BASE = "https://mc-heads.net/mob";

export const FILTER_OPTIONS = ["mobs", "nether", "overworld", "end", "neutral", "passive", "hostile", "structures", "test"];

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

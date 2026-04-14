const { generateRankCard } = require('./rankCard');

async function renderLevelCard({ username, avatarUrl, level, totalXp = 0, xpIntoLevel, xpNeeded, rank = 0, accent = null, theme = 'default', tierLabel = null, tierValue = 0 }) {
  const fakeUser = {
    displayName: username || 'Unknown',
    displayAvatarURL: () => avatarUrl,
  };
  return generateRankCard({
    userOrMember: fakeUser,
    rank,
    level,
    xpIntoLevel: xpIntoLevel ?? totalXp,
    xpNeeded: xpNeeded || Math.max(1, totalXp || 1),
    accent,
    theme,
    tierLabel,
    tierValue,
  });
}

module.exports = { renderLevelCard, generateRankCard };

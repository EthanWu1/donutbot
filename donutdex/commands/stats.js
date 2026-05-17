const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const api = require('../lib/api');
const db = require('../lib/db');
const config = require('../config');
const { statsEmbed, errorEmbed } = require('../lib/embeds');

// Resolves the target IGN from the interaction options / linked account.
function resolveIgn(interaction) {
  const username = interaction.options.getString('username');
  if (username) return username.trim();
  const member = interaction.options.getUser('user');
  if (member) {
    const linked = db.getLink(member.id);
    if (!linked) return { error: `${member.username} has no linked DonutSMP account.` };
    return linked;
  }
  const own = db.getLink(interaction.user.id);
  if (!own) return { error: 'Provide a `username`, or `/link` your account first.' };
  return own;
}

async function buildStatsReply(ign) {
  const [{ stats }, lookup] = await Promise.all([
    api.getStats(ign),
    api.getLookup(ign).catch(() => null),
  ]);
  db.trackPlayer(ign);
  db.addSnapshot(ign, stats);

  const prevRow = db.snapshotBefore(ign, Date.now() - 24 * 3600_000);
  const prev = prevRow && prevRow.ts <= Date.now() - 60_000 ? prevRow : null;
  const playtimeSeconds = stats.playtime * config.playtimeUnitSeconds;

  const embed = statsEmbed(ign, stats, prev, lookup, playtimeSeconds);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`stats:history:${ign}:7d`).setLabel('Stats History').setStyle(ButtonStyle.Primary).setEmoji('📈'),
    new ButtonBuilder().setCustomId(`stats:sells:${ign}:1`).setLabel('Auction Sells').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
  );
  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show DonutSMP stats for a player')
    .addStringOption((o) => o.setName('username').setDescription('Minecraft IGN').setMaxLength(16))
    .addUserOption((o) => o.setName('user').setDescription('A linked Discord user')),

  async execute(interaction) {
    await interaction.deferReply();
    const resolved = resolveIgn(interaction);
    if (resolved && resolved.error) {
      return interaction.editReply({ embeds: [errorEmbed(resolved.error)] });
    }
    try {
      const reply = await buildStatsReply(resolved);
      return interaction.editReply(reply);
    } catch (err) {
      if (err instanceof api.NotFoundError) {
        return interaction.editReply({ embeds: [errorEmbed(`No DonutSMP player named \`${resolved}\` was found.`)] });
      }
      if (err instanceof api.RateLimitedError) {
        return interaction.editReply({ embeds: [errorEmbed('DonutSMP API is rate-limited right now — try again shortly.')] });
      }
      throw err;
    }
  },

  // Button handler — `stats:history:<ign>:<range>` and `stats:sells:<ign>:<page>`.
  // The history chart is wired in Task 12; sells in this step.
  async button(interaction) {
    const [, action, ign, arg] = interaction.customId.split(':');
    if (action === 'sells') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const page = Number(arg) || 1;
      const txns = await api.getAuctionTransactions(page).catch(() => []);
      const list = Array.isArray(txns) ? txns : txns.transactions || [];
      const mine = list.filter((t) => (t.seller || '').toLowerCase() === ign.toLowerCase());
      const { formatNumber } = require('../lib/format');
      const lines = mine.map((t) => `**${t.item || t.name}** — \`${formatNumber(t.price)}\``);
      return interaction.editReply({
        content: mine.length
          ? `**${ign}** — recent auction sells (page ${page}):\n${lines.join('\n')}`
          : `No auction sells found for **${ign}** on page ${page}.`,
      });
    }
    // action === 'history' handled in Task 12.
  },

  _buildStatsReply: buildStatsReply,
};

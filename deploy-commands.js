require('dotenv').config();
const C = require('./config');

const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// CLIENT_ID=1467522345861251258  GUILD_ID=1483225250698105063  (set in .env)
const APP_TOKEN = String(process.env.BOT_TOKEN || process.env.TOKEN || '').trim();
if (!APP_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error('❌ Error: Missing environment variables BOT_TOKEN/TOKEN, CLIENT_ID, or GUILD_ID.');
  process.exit(1);
}

const commands = [
  // --- LEVELING ---
  new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check rank and level')
    .addSubcommand(s => s
      .setName('check')
      .setDescription("Check a user's level")
      .addUserOption(o => o.setName('user').setDescription('Target user')))
    .addSubcommand(s => s
      .setName('add')
      .setDescription('Add levels to a user')
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Levels to add').setRequired(true)))
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Set a user to an exact level')
      .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true))
      .addIntegerOption(o => o.setName('level').setDescription('Exact level').setRequired(true)))
    .addSubcommand(s => s
      .setName('multiplier')
      .setDescription('Set the global XP multiplier')
      .addNumberOption(o => o.setName('value').setDescription('XP multiplier, e.g. 1, 1.5, 2').setRequired(true))),


  // --- MODERATION ---
  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of recent messages (up to 100)')
    .addIntegerOption(o => o.setName('amount').setDescription('How many messages to delete (1-100)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  // --- UTILITY ---
  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Server information'),

  // --- LITEMATIC RENDER ---
  new SlashCommandBuilder()
    .setName('render')
    .setDescription('Render a .litematic schematic with size and volume')
    .addAttachmentOption(o => o.setName('litematic').setDescription('Litematic file to render').setRequired(true)),

  // --- AFK ---
  new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status')
    .addStringOption(o => o.setName('reason').setDescription('Reason (optional)').setRequired(false)),

  // --- SUGGESTION ---
  new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Submit a suggestion')
    .addStringOption(o => o.setName('suggestion').setDescription('Your suggestion').setRequired(true)),

  // --- STICKY MESSAGES ---
  new SlashCommandBuilder()
    .setName('sticky')
    .setDescription('Manage sticky messages')
    .addSubcommand(s => s.setName('create').setDescription('Create a sticky message in this channel'))
    .addSubcommand(s => s.setName('edit').setDescription('Edit a sticky message in this channel (dropdown)'))
    .addSubcommand(s => s.setName('delete').setDescription('Clear ALL sticky messages in this channel'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // --- SAY ---
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send a plain message in the current channel')
    .addStringOption(o => o.setName('message').setDescription('Message content').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // --- EMBED BUILDER ---
  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create or edit an embed in the current channel')
    .addSubcommand(s => s.setName('create').setDescription('Create an embed'))
    .addSubcommand(s => s.setName('edit').setDescription('Edit an existing embed in this channel (dropdown)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // --- ROLE MANAGEMENT ---
  new SlashCommandBuilder()
    .setName('role')
    .setDescription('Grant or remove roles')
    .addSubcommand(s => s.setName('grant').setDescription('Grant a role to a member')
      .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role to grant').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Optional duration, e.g. 2h, 7d').setRequired(false)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a role from a member')
      .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role to remove').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),


  // --- VOUCH ---
  new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Vouch management (vouches auto-detected in vouch channel)')
    .addSubcommand(s => s.setName('add').setDescription('Manually add vouches to a user')
      .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('How many vouches to add').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason (optional)').setRequired(false)))
    .addSubcommand(s => s.setName('remove').setDescription('Manually remove vouches from a user')
      .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('How many vouches to remove').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason (optional)').setRequired(false)))
    .addSubcommand(s => s.setName('check').setDescription('Check vouch count for a user')
      .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))),

  // --- GIVEAWAY ---
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .addSubcommand(s => s.setName('create').setDescription('Start a new giveaway')
      .addStringOption(o => o.setName('prize').setDescription('Prize').setRequired(true))
      .addIntegerOption(o => o.setName('winners').setDescription('Winner count').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Time (e.g. 30m, 1h). Leave empty if using goals.').setRequired(false))
      .addIntegerOption(o => o.setName('entries_goal').setDescription('End when X people join').setRequired(false))
      .addIntegerOption(o => o.setName('member_goal').setDescription('End when server reaches X members').setRequired(false))
      .addStringOption(o => o.setName('note').setDescription('Optional note').setRequired(false)))
    .addSubcommand(s => s.setName('end').setDescription('End a giveaway early')
      .addStringOption(o => o.setName('message_id').setDescription('Message ID').setRequired(true)))
    .addSubcommand(s => s.setName('delete').setDescription('Delete a giveaway')
      .addStringOption(o => o.setName('message_id').setDescription('Message ID').setRequired(true)))
    .addSubcommand(s => s.setName('reroll').setDescription('Reroll a winner')
      .addStringOption(o => o.setName('message_id').setDescription('Message ID (Optional, defaults to last ended)').setRequired(false))),



  // --- PANELS (consolidated) ---
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Publish or list configurable panels')
    .addSubcommand(s => s.setName('list').setDescription('List available panels'))
    .addSubcommand(s => s.setName('send').setDescription('Send / refresh a panel')
      .addStringOption(o => o.setName('type').setDescription('Panel to publish').setRequired(true)
        .addChoices(
          { name: 'Ticket Center', value: 'ticket_center' },
          { name: 'Building Services', value: 'building_services' },
          { name: 'Applications', value: 'applications' },
          { name: 'Spawner Prices', value: 'spawner_prices' },
        )))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket tools')
    .addSubcommand(s => s.setName('add').setDescription('Add a user to this ticket')
      .addUserOption(o => o.setName('user').setDescription('User to add').setRequired(true)))
    .addSubcommand(s => s.setName('rename').setDescription('Rename this ticket channel')
      .addStringOption(o => o.setName('name').setDescription('New channel name').setRequired(true)))
    
    .addSubcommand(s => s.setName('requestclose').setDescription('Ask the ticket creator to confirm close')
    .addStringOption(o => o.setName('reason').setDescription('Optional reason shown to the user').setRequired(false))
  )
    .addSubcommand(s => s.setName('close').setDescription('Close this ticket instantly')
      .addStringOption(o => o.setName('reason').setDescription('Reason for closing (logged)').setRequired(false)))
    .addSubcommand(s => s.setName('claim').setDescription('Claim this ticket (locks it to you)'))
    .addSubcommand(s => s.setName('unclaim').setDescription('Unclaim this ticket (allows another staff to claim)')),

  // --- LEADERBOARDS (consolidated) ---
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show staff or builder leaderboard')
    .addStringOption(o => o.setName('type').setDescription('Which leaderboard').setRequired(true)
      .addChoices(
        { name: 'Staff', value: 'staff' },
        { name: 'Builder', value: 'builder' },
      )),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show staff and builder stats for a member')
    .addUserOption(o => o.setName('staff').setDescription('Member to view').setRequired(false)),

  new SlashCommandBuilder()
    .setName('stafflist')
    .setDescription('Manage staff list IGNs and alts')
    .addSubcommand(s => s.setName('edit').setDescription('Edit a saved staff-list IGN and alt list')
      .addUserOption(o => o.setName('person').setDescription('Member to edit').setRequired(true))
      .addStringOption(o => o.setName('type').setDescription('Which staff list to edit').setRequired(true).addChoices(
        { name: 'Support Staff', value: 'support' },
        { name: 'Builder', value: 'builder' },
      ))
      .addStringOption(o => o.setName('ign').setDescription('Main IGN').setRequired(false))
      .addStringOption(o => o.setName('alts').setDescription('Comma-separated alts, or 0/none to clear').setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  // --- EMBED SEARCH ---
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search embed content in a channel (Discord cannot search embeds natively)')
    .addSubcommand(s => s.setName('embeds').setDescription('Search embed text/mentions in a channel')
      .addStringOption(o => o.setName('query').setDescription('Text to search for (or @mention a user)').setRequired(true))
      .addChannelOption(o => o.setName('channel').setDescription('Channel to search (defaults to current)').setRequired(false))
      .addIntegerOption(o => o.setName('limit').setDescription('Max messages to scan (default 500, max 2000)').setRequired(false))),


  // --- BUILD START ---
  new SlashCommandBuilder()
    .setName('build')
    .setDescription('Build tracking tools')
    .addSubcommand(s => s.setName('start').setDescription('Start tracking a new build')
      .addStringOption(o => o.setName('build_name').setDescription('Name of the build (e.g. Witch Farm, Cobblestone Base)').setRequired(true))
      .addStringOption(o => o.setName('customer_ign').setDescription('Customer IGN').setRequired(true))
      .addStringOption(o => o.setName('builder_ign').setDescription('Builder IGN (your IGN)').setRequired(true))
      .addUserOption(o => o.setName('customer_discord').setDescription('Customer Discord user').setRequired(true))
      .addStringOption(o => o.setName('price').setDescription('Total build price (e.g. 5m, 500k)').setRequired(true)))
    .addSubcommand(s => s.setName('edit').setDescription('Edit an active build job (price, builder, IGNs, build name)')
      .addStringOption(o => o.setName('build_id').setDescription('Build ID to edit (shown in embed footer)').setRequired(true))
      .addStringOption(o => o.setName('price').setDescription('New total price — creates additional paywatch for the difference').setRequired(false))
      .addUserOption(o => o.setName('builder').setDescription('New builder Discord user').setRequired(false))
      .addStringOption(o => o.setName('builder_ign').setDescription('New builder IGN').setRequired(false))
      .addStringOption(o => o.setName('customer_ign').setDescription('New customer IGN').setRequired(false))
      .addStringOption(o => o.setName('build_name').setDescription('New build/farm name').setRequired(false)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove an open build from tracking'))
    .addSubcommand(s => s.setName('history').setDescription('Show completed build history for a builder')
      .addUserOption(o => o.setName('person').setDescription('The builder to view history for').setRequired(true))),

  
// --- PAYWATCH ---
  new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Track DonutSMP payments')
    .addSubcommand(sc => sc.setName('start').setDescription('Start watching a payment')
      .addUserOption(o => o.setName('payer').setDescription('Discord User').setRequired(true))
      .addStringOption(o => o.setName('payer_ign').setDescription('Payer Minecraft IGN').setRequired(true))
      .addStringOption(o => o.setName('amount').setDescription('Amount (e.g. 1m, 500k)').setRequired(true))
      .addStringOption(o => o.setName('receiver').setDescription('Receiver IGN').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason / label for this payment (default: Payment)').setRequired(false))
      .addStringOption(o => o.setName('note').setDescription('Internal staff note').setRequired(false)))
    .addSubcommand(sc => sc.setName('history').setDescription('Show payment history')
      .addIntegerOption(o => o.setName('limit').setDescription('Limit').setRequired(false)))
    .addSubcommand(sc => sc.setName('complete').setDescription('Force-complete a paywatch (admin only)')
      .addStringOption(o => o.setName('watch_id').setDescription('Watch ID to force-complete').setRequired(true))),

// --- LIST ROLE MEMBERS ---
new SlashCommandBuilder()
  .setName('list')
  .setDescription('List all members with a specific role (max 50 members)')
  .addRoleOption(o => o.setName('role').setDescription('Role to list members of').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

// --- SPAWNER PRICES ---
new SlashCommandBuilder()
  .setName('spawner')
  .setDescription('Manage spawner buy/sell prices and panel')
  .addSubcommand(s => s.setName('buy').setDescription('Set the BUY price for a spawner type')
    .addStringOption(o => o.setName('type').setDescription('Spawner type').setRequired(true)
      .addChoices(
        { name: 'Skeleton', value: 'skeleton' },
        { name: 'Creeper', value: 'creeper' },
        { name: 'Zombified Piglin', value: 'zombified_piglin' },
        { name: 'Cow', value: 'cow' },
        { name: 'Pig', value: 'pig' },
        { name: 'Spider', value: 'spider' },
        { name: 'Zombie', value: 'zombie' },
        { name: 'Iron Golem', value: 'iron_golem' },
        { name: 'Blaze', value: 'blaze' },
      ))
    .addStringOption(o => o.setName('price').setDescription('Price each (e.g. 4.1m, 530000, 5.3m)').setRequired(true)))
  .addSubcommand(s => s.setName('sell').setDescription('Set the SELL price for a spawner type')
    .addStringOption(o => o.setName('type').setDescription('Spawner type').setRequired(true)
      .addChoices(
        { name: 'Skeleton', value: 'skeleton' },
        { name: 'Creeper', value: 'creeper' },
        { name: 'Zombified Piglin', value: 'zombified_piglin' },
        { name: 'Cow', value: 'cow' },
        { name: 'Pig', value: 'pig' },
        { name: 'Spider', value: 'spider' },
        { name: 'Zombie', value: 'zombie' },
        { name: 'Iron Golem', value: 'iron_golem' },
        { name: 'Blaze', value: 'blaze' },
      ))
    .addStringOption(o => o.setName('price').setDescription('Price each').setRequired(true)))
  .addSubcommand(s => s.setName('remove').setDescription('Remove a spawner price (mark as not buying/selling)')
    .addStringOption(o => o.setName('action').setDescription('Buy or Sell').setRequired(true)
      .addChoices({ name: 'Buy', value: 'buy' }, { name: 'Sell', value: 'sell' }))
    .addStringOption(o => o.setName('type').setDescription('Spawner type').setRequired(true)
      .addChoices(
        { name: 'Skeleton', value: 'skeleton' },
        { name: 'Creeper', value: 'creeper' },
        { name: 'Zombified Piglin', value: 'zombified_piglin' },
        { name: 'Cow', value: 'cow' },
        { name: 'Pig', value: 'pig' },
        { name: 'Spider', value: 'spider' },
        { name: 'Zombie', value: 'zombie' },
        { name: 'Iron Golem', value: 'iron_golem' },
        { name: 'Blaze', value: 'blaze' },
      )))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

// --- APPLICATION OPEN/CLOSE ---
new SlashCommandBuilder()
  .setName('application')
  .setDescription('Open or close application buttons')
  .addStringOption(o => o.setName('type').setDescription('Application type').setRequired(true)
    .addChoices(
      { name: 'Builder', value: 'builder' },
      { name: 'Staff', value: 'staff' },
    ))
  .addStringOption(o => o.setName('state').setDescription('Open or close').setRequired(true)
    .addChoices(
      { name: 'Open', value: 'open' },
      { name: 'Close', value: 'close' },
    ))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

// --- PUBLISH SCHEMATIC ---
new SlashCommandBuilder()
  .setName('publish')
  .setDescription('Manage a schematic submission in this Publish Schematic ticket')
  .addSubcommand(s => s.setName('render').setDescription('Force a fresh render from the latest .litematic'))
  .addSubcommand(s => s.setName('image').setDescription('Override the render with a custom image')
    .addAttachmentOption(o => o.setName('attachment').setDescription('PNG/JPG to use instead of the auto-render').setRequired(true)))
  .addSubcommand(s => s.setName('post').setDescription('Publish — or update — this submission in the schematic forum'))
  .addSubcommand(s => s.setName('unpost').setDescription('Delete the forum thread and flip the submission back to DRAFT'))
  .addSubcommand(s => s.setName('reject').setDescription('Reject this submission and DM the submitter')
    .addStringOption(o => o.setName('reason').setDescription('Why the submission is being rejected').setRequired(true))),

// --- KELP FARM CATALOG ---
new SlashCommandBuilder()
  .setName('kelp')
  .setDescription('Kelp farm catalog')
  // ── public ──
  .addSubcommand(s => s.setName('panel').setDescription('Browse the kelp farm catalog'))
  // ── staff only (enforced in handler) ──
  .addSubcommand(s => s.setName('add').setDescription('Add a kelp farm')
    .addStringOption(o => o.setName('name').setDescription('Farm name').setRequired(true))
    .addIntegerOption(o => o.setName('blaze_loaders').setDescription('Blaze loader count').setRequired(true))
    .addIntegerOption(o => o.setName('bone_loaders').setDescription('Bone loader count').setRequired(true))
    .addIntegerOption(o => o.setName('smokers').setDescription('Smoker count').setRequired(true))
    .addStringOption(o => o.setName('kelp_per_hour').setDescription('Kelp/hr e.g. 1.32m, 500k').setRequired(true))
    .addStringOption(o => o.setName('size').setDescription('Farm size e.g. 32x32').setRequired(true))
    .addStringOption(o => o.setName('bone_input').setDescription('Input type').setRequired(true)
      .addChoices(
        { name: 'Bones', value: 'bones' },
        { name: 'Bone Blocks', value: 'bone_blocks' },
        { name: 'Both', value: 'both' }
      )
    )
    .addIntegerOption(o => o.setName('bone_storage_items').setDescription('Bone/block storage capacity in items').setRequired(true))
    .addIntegerOption(o => o.setName('blaze_storage_items').setDescription('Blaze storage capacity in items').setRequired(true))
    .addBooleanOption(o => o.setName('tested').setDescription('Tested?').setRequired(true))
    .addUserOption(o => o.setName('designer').setDescription('Designer').setRequired(true))
    .addAttachmentOption(o => o.setName('schematic').setDescription('.schem/.nbt file').setRequired(true))
    .addAttachmentOption(o => o.setName('image').setDescription('Preview image').setRequired(false))
  )
  .addSubcommand(s => s.setName('edit').setDescription('Edit an existing kelp farm')
    .addStringOption(o => o.setName('id').setDescription('Farm ID from embed footer').setRequired(true))
    .addStringOption(o => o.setName('name').setDescription('New name').setRequired(false))
    .addIntegerOption(o => o.setName('blaze_loaders').setDescription('New blaze loader count').setRequired(false))
    .addIntegerOption(o => o.setName('bone_loaders').setDescription('New bone loader count').setRequired(false))
    .addIntegerOption(o => o.setName('smokers').setDescription('New smoker count').setRequired(false))
    .addStringOption(o => o.setName('kelp_per_hour').setDescription('New kelp/hr').setRequired(false))
    .addStringOption(o => o.setName('size').setDescription('New size').setRequired(false))
    .addStringOption(o => o.setName('bone_input').setDescription('New input type').setRequired(false)
      .addChoices(
        { name: 'Bones', value: 'bones' },
        { name: 'Bone Blocks', value: 'bone_blocks' },
        { name: 'Both', value: 'both' }
      )
    )
    .addIntegerOption(o => o.setName('bone_storage_items').setDescription('New bone/block storage').setRequired(false))
    .addIntegerOption(o => o.setName('blaze_storage_items').setDescription('New blaze storage').setRequired(false))
    .addBooleanOption(o => o.setName('tested').setDescription('Tested?').setRequired(false))
    .addUserOption(o => o.setName('designer').setDescription('New designer').setRequired(false))
    .addAttachmentOption(o => o.setName('schematic').setDescription('Replace schematic').setRequired(false))
    .addAttachmentOption(o => o.setName('image').setDescription('Replace image').setRequired(false))
  )
  .addSubcommand(s => s.setName('remove').setDescription('Remove a kelp farm')
    .addStringOption(o => o.setName('id').setDescription('Farm ID').setRequired(true))
  )
  .addSubcommand(s => s.setName('setprice').setDescription('Set commodity price for calculations')
    .addStringOption(o => o.setName('item').setDescription('Item').setRequired(true)
      .addChoices(
        { name: 'Dried Kelp Block', value: 'dried_kelp_block' },
        { name: 'Bone', value: 'bone' },
        { name: 'Bone Block', value: 'bone_block' },
        { name: 'Blaze Rod', value: 'blaze_rod' }
      )
    )
    .addNumberOption(o => o.setName('price').setDescription('Price per item').setRequired(true))
  ),
];

const rest = new REST({ version: '10' }).setToken(APP_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands.map(c => c.toJSON()) }
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

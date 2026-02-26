// index.js
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const TOKEN = process.env.MTQ3NTg4MjIyNDc0NTMxNjQzNA.Gejzam.GIWST3plN4rpRLFhao5gemhy-qmAr0JZ1YI3MA;
const CLIENT_ID = process.env.1475882224745316434;
const GUILD_ID = 1474447026061185075;

let data = {};
if (fs.existsSync('./data.json')) {
  data = JSON.parse(fs.readFileSync('./data.json'));
} else {
  fs.writeFileSync('./data.json', JSON.stringify({}));
}

function saveData() {
  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

function ensureUser(id) {
  if (!data[id]) data[id] = { balance: 1000, daily: 0 };
  saveData();
}

function getEmbed(title, desc, color='Blue') {
  return new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const commands = [
  {
    name: 'balance',
    description: 'Show your balance'
  },
  {
    name: 'daily',
    description: 'Claim your daily reward'
  },
  {
    name: 'coinflip',
    description: 'Play coinflip',
    options: [{ name: 'bet', type: 4, required: true }]
  },
  {
    name: 'dice',
    description: 'Play dice',
    options: [{ name: 'bet', type: 4, required: true }]
  },
  {
    name: 'slots',
    description: 'Play slots',
    options: [{ name: 'bet', type: 4, required: true }]
  },
  {
    name: 'blackjack',
    description: 'Play blackjack',
    options: [{ name: 'bet', type: 4, required: true }]
  },
  {
    name: 'roulette',
    description: 'Play roulette',
    options: [{ name: 'bet', type: 4, required: true }]
  },
  {
    name: 'mines',
    description: 'Play mines',
    options: [{ name: 'bet', type: 4, required: true }]
  },
  {
    name: 'tower',
    description: 'Play tower',
    options: [{ name: 'bet', type: 4, required: true }]
  },
  {
    name: 'limbo',
    description: 'Play limbo',
    options: [{ name: 'bet', type: 4, required: true }]
  },
  {
    name: 'deposit',
    description: 'Request deposit',
    options: [{ name: 'amount', type: 4, required: true }]
  },
  {
    name: 'withdraw',
    description: 'Withdraw your balance',
    options: [{ name: 'amount', type: 4, required: true }]
  },
  {
    name: 'leaderboard',
    description: 'Show top balances'
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  } catch (err) {
    console.error(err);
  }
})();

client.on('ready', () => console.log(`${client.user.tag} is online!`));

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user } = interaction;
  ensureUser(user.id);

  if (commandName === 'balance') {
    await interaction.reply({ embeds: [getEmbed('Balance', `Your balance is $${data[user.id].balance}`)] });
  }

  else if (commandName === 'daily') {
    const now = Date.now();
    if (data[user.id].daily && (now - data[user.id].daily) < 86400000) {
      const rem = 86400000 - (now - data[user.id].daily);
      await interaction.reply({ embeds: [getEmbed('Daily', `Wait ${Math.floor(rem/3600000)}h remaining`, 'Red')] });
    } else {
      data[user.id].balance += 500;
      data[user.id].daily = Date.now();
      saveData();
      await interaction.reply({ embeds: [getEmbed('Daily', `You claimed $500!`, 'Green')] });
    }
  }

  else if (['coinflip','dice','slots','blackjack','roulette','mines','tower','limbo'].includes(commandName)) {
    const bet = options.getInteger('bet');
    if (bet > data[user.id].balance) return interaction.reply({ embeds: [getEmbed(commandName, 'Not enough balance', 'Red')] });
    const win = Math.random() < 0.5;
    let result;
    if (win) {
      const wonAmount = Math.floor(bet * (Math.random() * 2 + 1));
      data[user.id].balance += wonAmount;
      result = `You won $${wonAmount}!`;
    } else {
      data[user.id].balance -= bet;
      result = `You lost $${bet}!`;
    }
    saveData();
    await interaction.reply({ embeds: [getEmbed(commandName, result)] });
  }

  else if (commandName === 'withdraw') {
    const amount = options.getInteger('amount');
    if (amount > data[user.id].balance) return interaction.reply({ embeds: [getEmbed('Withdraw', 'Not enough balance', 'Red')] });
    data[user.id].balance -= amount;
    saveData();
    await interaction.reply({ embeds: [getEmbed('Withdraw', `You withdrew $${amount}`, 'Green')] });
  }

  else if (commandName === 'deposit') {
    const amount = options.getInteger('amount');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_${user.id}_${amount}`).setLabel('Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`deny_${user.id}_${amount}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
    );
    await interaction.reply({ embeds: [getEmbed('Deposit', `Requested $${amount}, wait for admin approval`)], components: [row] });
  }

  else if (commandName === 'leaderboard') {
    const sorted = Object.entries(data).sort((a,b) => b[1].balance - a[1].balance);
    const text = sorted.slice(0,10).map(([id, d], i) => `${i+1}. <@${id}> - $${d.balance}`).join('\n');
    await interaction.reply({ embeds: [getEmbed('Leaderboard', text)] });
  }
});

client.on('interactionCreate', async btn => {
  if (!btn.isButton()) return;
  const [action, uid, amt] = btn.customId.split('_');
  if (!btn.member.permissions.has('Administrator')) return btn.reply({ content:'Admins only!', ephemeral:true });
  const amount = parseInt(amt);
  ensureUser(uid);
  if (action === 'approve') {
    data[uid].balance += amount;
    saveData();
    btn.update({ embeds: [getEmbed('Deposit Approved', `<@${uid}> got $${amount}`, 'Green')], components: [] });
  } else {
    btn.update({ embeds: [getEmbed('Deposit Denied', `<@${uid}> denied`, 'Red')], components: [] });
  }
});

client.login(MTQ3NTg4MjIyNDc0NTMxNjQzNA.Gejzam.GIWST3plN4rpRLFhao5gemhy-qmAr0JZ1YI3MA);

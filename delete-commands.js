const { REST, Routes } = require('discord.js');
const fs = require('fs');
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('بدء حذف جميع الأوامر...');

    // حذف أوامر السيرفر
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: [] },
    );

    console.log('✅ تم حذف جميع الأوامر بنجاح!');
    console.log('الآن شغل: node deploy-commands.js');
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
})();

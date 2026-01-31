const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { generateWheelGIF, generateStaticWheel } = require('./wheelRenderer');

// قراءة الملفات
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// دوال لقراءة وكتابة البيانات
function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`خطأ في قراءة ${filePath}:`, error);
    return null;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`خطأ في الكتابة إلى ${filePath}:`, error);
    return false;
  }
}

// إنشاء الكلاينت
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

// دالة للتحقق من الصلاحيات
function isAuthorized(userId) {
  const authData = readJSON('./data/authorized.json');
  return authData && authData.authorizedUsers.includes(userId);
}

// دالة للحصول على نقاط المستخدم
function getUserPoints(userId) {
  const usersData = readJSON('./data/users.json');
  if (!usersData) return 0;
  return usersData.users[userId] || 0;
}

// دالة لتحديث نقاط المستخدم
function setUserPoints(userId, points) {
  const usersData = readJSON('./data/users.json');
  if (!usersData) return false;
  usersData.users[userId] = points;
  return writeJSON('./data/users.json', usersData);
}

// دالة لاختيار عشوائي حسب النسب
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.percentage, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.percentage;
    if (random <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1];
}

// عند جاهزية البوت
client.once('ready', () => {
  console.log(`تم تسجيل الدخول كـ ${client.user.tag}`);
});

// معالجة الأوامر
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // التحقق من الصلاحيات
  if (!isAuthorized(interaction.user.id)) {
    // لا ترد على غير المصرح لهم
    return;
  }

  const { commandName } = interaction;

  try {
    // أمر إنشاء عجلة
    if (commandName === 'انشاء-عجلة') {
      await interaction.reply({ content: '⏳ جارٍ إنشاء العجلة...', ephemeral: true });

      const name = interaction.options.getString('اسم');
      const cost = interaction.options.getInteger('تكلفة');
      const image = interaction.options.getString('صورة') || null;

      const wheelsData = readJSON('./data/wheels.json');
      if (!wheelsData) {
        await interaction.editReply({ content: '❌ خطأ في قراءة بيانات العجلات' });
        return;
      }

      if (wheelsData.wheels[name]) {
        await interaction.editReply({ content: `❌ العجلة "${name}" موجودة بالفعل` });
        return;
      }

      wheelsData.wheels[name] = {
        image: image,
        cost: cost,
        items: []
      };

      if (writeJSON('./data/wheels.json', wheelsData)) {
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ تم إنشاء العجلة')
          .setDescription(`**اسم العجلة:** ${name}\n**التكلفة:** ${cost} نقطة`)
          .setFooter({ text: 'استخدم /اضافة-ايتم لإضافة أيتمات للعجلة' })
          .setTimestamp();

        if (image) {
          embed.addFields({ name: '📷 الصورة', value: 'تم الحفظ ✅' });
          embed.setThumbnail(image);
        }

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل حفظ العجلة' });
      }
    }

    // أمر إضافة أيتم
    else if (commandName === 'اضافة-ايتم') {
      await interaction.reply({ content: '⏳ جارٍ إضافة الأيتم...', ephemeral: true });

      const wheelName = interaction.options.getString('عجلة');
      const itemName = interaction.options.getString('اسم');
      const quantity = interaction.options.getInteger('كمية');
      const percentage = interaction.options.getInteger('نسبة');
      const itemImage = interaction.options.getString('صورة') || null;

      if (percentage < 0 || percentage > 100) {
        await interaction.editReply({ content: '❌ النسبة يجب أن تكون بين 0 و 100' });
        return;
      }

      const wheelsData = readJSON('./data/wheels.json');
      if (!wheelsData) {
        await interaction.editReply({ content: '❌ خطأ في قراءة بيانات العجلات' });
        return;
      }

      if (!wheelsData.wheels[wheelName]) {
        await interaction.editReply({ content: `❌ العجلة "${wheelName}" غير موجودة` });
        return;
      }

      wheelsData.wheels[wheelName].items.push({
        name: itemName,
        quantity: quantity,
        percentage: percentage,
        image: itemImage
      });

      if (writeJSON('./data/wheels.json', wheelsData)) {
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ تم إضافة الأيتم')
          .setDescription(`**العجلة:** ${wheelName}\n**الأيتم:** ${itemName}\n**الكمية:** ${quantity}\n**النسبة:** ${percentage}%`)
          .setTimestamp();

        if (itemImage) {
          embed.setThumbnail(itemImage);
        }

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل حفظ الأيتم' });
      }
    }

    // أمر إضافة نقاط
    else if (commandName === 'اضافة-نقاط') {
      await interaction.reply({ content: '⏳ جارٍ إضافة النقاط...', ephemeral: true });

      const user = interaction.options.getUser('مستخدم');
      const amount = interaction.options.getInteger('عدد');

      const currentPoints = getUserPoints(user.id);
      const newPoints = currentPoints + amount;

      if (setUserPoints(user.id, newPoints)) {
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ تم إضافة النقاط')
          .setDescription(`**المستخدم:** ${user}\n**النقاط المضافة:** ${amount}\n**النقاط السابقة:** ${currentPoints}\n**النقاط الحالية:** ${newPoints}`)
          .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل إضافة النقاط' });
      }
    }

    // أمر حذف نقاط
    else if (commandName === 'حذف-نقاط') {
      await interaction.reply({ content: '⏳ جارٍ حذف النقاط...', ephemeral: true });

      const user = interaction.options.getUser('مستخدم');
      const amount = interaction.options.getInteger('عدد');

      const currentPoints = getUserPoints(user.id);
      const newPoints = Math.max(0, currentPoints - amount);

      if (setUserPoints(user.id, newPoints)) {
        const embed = new EmbedBuilder()
          .setColor('#FF9900')
          .setTitle('✅ تم حذف النقاط')
          .setDescription(`**المستخدم:** ${user}\n**النقاط المحذوفة:** ${amount}\n**النقاط السابقة:** ${currentPoints}\n**النقاط الحالية:** ${newPoints}`)
          .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل حذف النقاط' });
      }
    }

    // أمر تعيين نقاط
    else if (commandName === 'تعيين-نقاط') {
      await interaction.reply({ content: '⏳ جارٍ تعيين النقاط...', ephemeral: true });

      const user = interaction.options.getUser('مستخدم');
      const amount = interaction.options.getInteger('عدد');

      if (setUserPoints(user.id, amount)) {
        const embed = new EmbedBuilder()
          .setColor('#0099FF')
          .setTitle('✅ تم تعيين النقاط')
          .setDescription(`**المستخدم:** ${user}\n**النقاط الجديدة:** ${amount}`)
          .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل تعيين النقاط' });
      }
    }

    // أمر لف العجلة
    else if (commandName === 'لف') {
      const wheelName = interaction.options.getString('عجلة');
      const user = interaction.options.getUser('مستخدم');

      const wheelsData = readJSON('./data/wheels.json');
      if (!wheelsData || !wheelsData.wheels[wheelName]) {
        await interaction.reply({ content: `❌ العجلة "${wheelName}" غير موجودة`, ephemeral: true });
        return;
      }

      const wheel = wheelsData.wheels[wheelName];
      
      if (wheel.items.length === 0) {
        await interaction.reply({ content: '❌ العجلة فارغة! لا توجد أيتمات', ephemeral: true });
        return;
      }

      const userPoints = getUserPoints(user.id);
      
      if (userPoints < wheel.cost) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ نقاط غير كافية')
.setDescription(`${user.username} ليس لديه نقاط كافية!\n\n**النقاط المطلوبة:** ${wheel.cost}\n**النقاط الحالية:** ${userPoints}`)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // رسالة انتظار
      await interaction.deferReply();

      try {
        // خصم النقاط
        setUserPoints(user.id, userPoints - wheel.cost);

        // إنشاء العجلة المتحركة
        const gifPath = path.join(__dirname, 'wheel.gif');
        
        const spinEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🎰 جارٍ لف العجلة...')
          .setDescription(`${user} يقوم بلف عجلة **${wheelName}**!\n\n⏳ **انتظر النتيجة...**`)
          .setTimestamp();

        await interaction.editReply({ 
          content: `${user}`,
          embeds: [spinEmbed]
        });

const result = await generateWheelGIF(wheel.items, gifPath);
const winningPrize = result.winningPrize;

const finalEmbed = new EmbedBuilder()
  .setColor('#00FF00')
  .setTitle('🎉 العجلة تدور!')
  .setDescription(
    `${user} قام بلف عجلة **${wheelName}**!\n\n` +
    `🎁 **الجائزة:** ${winningPrize.name}\n` +
    `📦 **الكمية:** ${winningPrize.quantity}\n\n` +
    `💰 **النقاط المتبقية:** ${userPoints - wheel.cost}`
  )
  .setImage('attachment://wheel.gif')
  .setFooter({ text: `العجلة: ${wheelName}` })
  .setTimestamp();

const gifAttachment = new AttachmentBuilder(gifPath);

await interaction.editReply({
  content: `${user}`,
  embeds: [finalEmbed],
  files: [gifAttachment]
});


        // حذف الملف المؤقت
        if (fs.existsSync(gifPath)) {
          setTimeout(() => {
            try {
              fs.unlinkSync(gifPath);
            } catch (err) {
              console.error('خطأ في حذف الملف المؤقت:', err);
            }
          }, 1000);
        }

      } catch (error) {
        console.error('خطأ في رسم العجلة:', error);
        await interaction.editReply({ 
          content: `${user} ❌ حدث خطأ أثناء رسم العجلة. الرجاء المحاولة مرة أخرى.`,
          embeds: []
        });
      }
    }

    // أمر نقاطي
    else if (commandName === 'نقاطي') {
      const points = getUserPoints(interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('💰 نقاطك')
        .setDescription(`لديك **${points}** نقطة`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // أمر سجل النقاط
    else if (commandName === 'سجل-النقاط') {
      const usersData = readJSON('./data/users.json');
      if (!usersData || Object.keys(usersData.users).length === 0) {
        await interaction.reply({ content: '📋 لا توجد نقاط مسجلة حتى الآن', ephemeral: true });
        return;
      }

      // ترتيب المستخدمين حسب النقاط
      const sortedUsers = Object.entries(usersData.users)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // أول 10 مستخدمين

      let description = '';
      for (let i = 0; i < sortedUsers.length; i++) {
        const [userId, points] = sortedUsers[i];
        description += `**${i + 1}.** <@${userId}> - ${points} نقطة\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('📊 سجل النقاط')
        .setDescription(description)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    // أمر العجلات
    else if (commandName === 'العجلات') {
      const wheelsData = readJSON('./data/wheels.json');
      if (!wheelsData || Object.keys(wheelsData.wheels).length === 0) {
        await interaction.reply({ content: '🎰 لا توجد عجلات متاحة حتى الآن', ephemeral: true });
        return;
      }

      let description = '';
      for (const [name, wheel] of Object.entries(wheelsData.wheels)) {
        description += `**${name}**\n`;
        description += `💰 التكلفة: ${wheel.cost} نقطة\n`;
        description += `🎁 عدد الأيتمات: ${wheel.items.length}\n`;
        description += `📷 الصورة: ${wheel.image}\n\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('🎰 العجلات المتاحة')
        .setDescription(description)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    // أمر حذف عجلة
    else if (commandName === 'حذف-عجلة') {
      await interaction.reply({ content: '⏳ جارٍ حذف العجلة...', ephemeral: true });

      const name = interaction.options.getString('اسم');

      const wheelsData = readJSON('./data/wheels.json');
      if (!wheelsData || !wheelsData.wheels[name]) {
        await interaction.editReply({ content: `❌ العجلة "${name}" غير موجودة` });
        return;
      }

      delete wheelsData.wheels[name];

      if (writeJSON('./data/wheels.json', wheelsData)) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🗑️ تم حذف العجلة')
          .setDescription(`تم حذف العجلة **${name}** بنجاح`)
          .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل حذف العجلة' });
      }
    }

    // أمر حذف أيتم
    else if (commandName === 'حذف-ايتم') {
      await interaction.reply({ content: '⏳ جارٍ حذف الأيتم...', ephemeral: true });

      const wheelName = interaction.options.getString('عجلة');
      const itemName = interaction.options.getString('ايتم');

      const wheelsData = readJSON('./data/wheels.json');
      if (!wheelsData || !wheelsData.wheels[wheelName]) {
        await interaction.editReply({ content: `❌ العجلة "${wheelName}" غير موجودة` });
        return;
      }

      const wheel = wheelsData.wheels[wheelName];
      const itemIndex = wheel.items.findIndex(item => item.name === itemName);

      if (itemIndex === -1) {
        await interaction.editReply({ content: `❌ الأيتم "${itemName}" غير موجود في العجلة` });
        return;
      }

      wheel.items.splice(itemIndex, 1);

      if (writeJSON('./data/wheels.json', wheelsData)) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🗑️ تم حذف الأيتم')
          .setDescription(`تم حذف الأيتم **${itemName}** من العجلة **${wheelName}**`)
          .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل حذف الأيتم' });
      }
    }

    // أمر إضافة مصرح
    else if (commandName === 'اضافة-مصرح') {
      await interaction.reply({ content: '⏳ جارٍ إضافة المستخدم...', ephemeral: true });

      const userId = interaction.options.getString('ايدي');

      const authData = readJSON('./data/authorized.json');
      if (!authData) {
        await interaction.editReply({ content: '❌ خطأ في قراءة بيانات التصريح' });
        return;
      }

      if (authData.authorizedUsers.includes(userId)) {
        await interaction.editReply({ content: '❌ المستخدم مصرح له بالفعل' });
        return;
      }

      authData.authorizedUsers.push(userId);

      if (writeJSON('./data/authorized.json', authData)) {
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ تم إضافة مستخدم مصرح')
          .setDescription(`تم إضافة المستخدم بـ ID: \`${userId}\` للقائمة المصرح لها`)
          .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل إضافة المستخدم' });
      }
    }

    // أمر حذف مصرح
    else if (commandName === 'حذف-مصرح') {
      await interaction.reply({ content: '⏳ جارٍ حذف المستخدم...', ephemeral: true });

      const userId = interaction.options.getString('ايدي');

      const authData = readJSON('./data/authorized.json');
      if (!authData) {
        await interaction.editReply({ content: '❌ خطأ في قراءة بيانات التصريح' });
        return;
      }

      const index = authData.authorizedUsers.indexOf(userId);
      if (index === -1) {
        await interaction.editReply({ content: '❌ المستخدم غير موجود في القائمة' });
        return;
      }

      authData.authorizedUsers.splice(index, 1);

      if (writeJSON('./data/authorized.json', authData)) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🗑️ تم حذف مستخدم مصرح')
          .setDescription(`تم إزالة المستخدم بـ ID: \`${userId}\` من القائمة المصرح لها`)
          .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
      } else {
        await interaction.editReply({ content: '❌ فشل حذف المستخدم' });
      }
    }

    // أمر عرض عجلة
    else if (commandName === 'عرض-عجلة') {
      await interaction.reply({ content: '⏳ جارٍ تحميل العجلة...', ephemeral: true });

      const name = interaction.options.getString('اسم');

      const wheelsData = readJSON('./data/wheels.json');
      if (!wheelsData || !wheelsData.wheels[name]) {
        await interaction.editReply({ content: `❌ العجلة "${name}" غير موجودة` });
        return;
      }

      const wheel = wheelsData.wheels[name];
      
      let itemsList = '';
      for (const item of wheel.items) {
        const hasImage = item.image ? '🖼️' : '📄';
        itemsList += `${hasImage} **${item.name}** - الكمية: ${item.quantity} - النسبة: ${item.percentage}%\n`;
      }

      if (itemsList === '') {
        itemsList = 'لا توجد أيتمات في هذه العجلة';
      }

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle(`🎰 تفاصيل العجلة: ${name}`)
        .addFields(
          { name: '💰 التكلفة', value: `${wheel.cost} نقطة`, inline: true },
          { name: '🎁 عدد الأيتمات', value: `${wheel.items.length}`, inline: true },
          { name: '📋 قائمة الأيتمات', value: itemsList }
        )
        .setTimestamp();

      // إنشاء معاينة مرسومة للعجلة
      if (wheel.items.length > 0) {
        try {
          const previewPath = path.join(__dirname, 'wheel_preview.png');
          await generateStaticWheel(wheel.items, previewPath);
          
          embed.setImage('attachment://wheel_preview.png');
          const attachment = new AttachmentBuilder(previewPath);
          
          await interaction.editReply({ content: '', embeds: [embed], files: [attachment] });
          
          // حذف الملف المؤقت
          setTimeout(() => {
            if (fs.existsSync(previewPath)) {
              try {
                fs.unlinkSync(previewPath);
              } catch (err) {
                console.error('خطأ في حذف الملف المؤقت:', err);
              }
            }
          }, 1000);
        } catch (error) {
          console.error('خطأ في رسم معاينة العجلة:', error);
          if (wheel.image) {
            embed.setImage(wheel.image);
          }
          await interaction.editReply({ content: '', embeds: [embed] });
        }
      } else {
        if (wheel.image) {
          embed.setImage(wheel.image);
        }
        await interaction.editReply({ content: '', embeds: [embed] });
      }
    }

  } catch (error) {
    console.error('خطأ في معالجة الأمر:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ حدث خطأ أثناء تنفيذ الأمر', ephemeral: true });
    }
  }
});

// تسجيل الدخول
client.login(process.env.TOKEN);

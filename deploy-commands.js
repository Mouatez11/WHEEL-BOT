const { REST, Routes } = require('discord.js');
const fs = require('fs');
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [
  {
    name: 'انشاء-عجلة',
    description: 'إنشاء عجلة حظ جديدة',
    options: [
      {
        name: 'اسم',
        description: 'اسم العجلة',
        type: 3,
        required: true
      },
      {
        name: 'تكلفة',
        description: 'تكلفة لف العجلة بالنقاط',
        type: 4,
        required: true
      },
      {
        name: 'صورة',
        description: 'رابط صورة العجلة (اختياري)',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'اضافة-ايتم',
    description: 'إضافة أيتم لعجلة',
    options: [
      {
        name: 'عجلة',
        description: 'اسم العجلة',
        type: 3,
        required: true
      },
      {
        name: 'اسم',
        description: 'اسم الأيتم',
        type: 3,
        required: true
      },
      {
        name: 'كمية',
        description: 'كمية الأيتم',
        type: 4,
        required: true
      },
      {
        name: 'نسبة',
        description: 'نسبة ظهور الأيتم (0-100)',
        type: 4,
        required: true
      },
      {
        name: 'صورة',
        description: 'رابط صورة الأيتم (اختياري)',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'اضافة-نقاط',
    description: 'إضافة نقاط لمستخدم',
    options: [
      {
        name: 'مستخدم',
        description: 'المستخدم',
        type: 6,
        required: true
      },
      {
        name: 'عدد',
        description: 'عدد النقاط',
        type: 4,
        required: true
      }
    ]
  },
  {
    name: 'حذف-نقاط',
    description: 'حذف نقاط من مستخدم',
    options: [
      {
        name: 'مستخدم',
        description: 'المستخدم',
        type: 6,
        required: true
      },
      {
        name: 'عدد',
        description: 'عدد النقاط',
        type: 4,
        required: true
      }
    ]
  },
  {
    name: 'تعيين-نقاط',
    description: 'تعيين نقاط محددة لمستخدم',
    options: [
      {
        name: 'مستخدم',
        description: 'المستخدم',
        type: 6,
        required: true
      },
      {
        name: 'عدد',
        description: 'عدد النقاط',
        type: 4,
        required: true
      }
    ]
  },
  {
    name: 'لف',
    description: 'لف عجلة الحظ',
    options: [
      {
        name: 'عجلة',
        description: 'اسم العجلة',
        type: 3,
        required: true
      },
      {
        name: 'مستخدم',
        description: 'المستخدم الذي سيلف',
        type: 6,
        required: true
      }
    ]
  },
  {
    name: 'نقاطي',
    description: 'عرض نقاطك'
  },
  {
    name: 'سجل-النقاط',
    description: 'عرض نقاط جميع المستخدمين'
  },
  {
    name: 'العجلات',
    description: 'عرض قائمة العجلات المتاحة'
  },
  {
    name: 'حذف-عجلة',
    description: 'حذف عجلة',
    options: [
      {
        name: 'اسم',
        description: 'اسم العجلة',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'حذف-ايتم',
    description: 'حذف أيتم من عجلة',
    options: [
      {
        name: 'عجلة',
        description: 'اسم العجلة',
        type: 3,
        required: true
      },
      {
        name: 'ايتم',
        description: 'اسم الأيتم',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'اضافة-مصرح',
    description: 'إضافة مستخدم للقائمة المصرح لها',
    options: [
      {
        name: 'ايدي',
        description: 'Discord User ID',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'حذف-مصرح',
    description: 'إزالة مستخدم من القائمة المصرح لها',
    options: [
      {
        name: 'ايدي',
        description: 'Discord User ID',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'عرض-عجلة',
    description: 'عرض تفاصيل عجلة معينة',
    options: [
      {
        name: 'اسم',
        description: 'اسم العجلة',
        type: 3,
        required: true
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('بدء تسجيل الأوامر...');

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );

    console.log('تم تسجيل الأوامر بنجاح!');
  } catch (error) {
    console.error(error);
  }
})();

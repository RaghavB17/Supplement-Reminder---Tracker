const config = {
  appId: 'com.dailydose.supplementtracker',
  appName: 'Daily Dose',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_dailydose',
      iconColor: '#346e57'
    }
  }
};

module.exports = config;

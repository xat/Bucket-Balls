module.exports.rulesets = {
  imac: [
    {
      points: 100,
      assert: function(src) {
        return (src.lastContact === 'right');
      }
    }
  ],
  desktop: [
    {
      points: 100,
      assert: function(src) {
        return (src.lastContact === 'left');
      }
    }
  ],
  laptop: [
    {
      points: 200,
      assert: function(src) {
        return src.hasDeviceorientation;
      }
    }
  ],
  android: []
};

// clientId => ruleset mapping
module.exports.mappings = {
  1: 'laptop',
  2: 'imac',
  3: 'desktop',
  4: 'android'
};
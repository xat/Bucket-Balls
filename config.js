module.exports.rulesets = {
  imac: [
    {
      points: 100,
      assert: function(src) {
        // the src object has these properties:
        // lastContact (can be 'right' or 'left'... the side on which the ball left a bucket)
        // hasDeviceorientation (true if source bucket has deviceorientation)
        // clientId (the id of the client which droped the ball)
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

module.exports.port = 3100;
module.exports.host = 'localhost';
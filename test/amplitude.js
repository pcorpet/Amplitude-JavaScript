describe('Amplitude', function() {
  var Amplitude = require('../src/amplitude.js');
  var localStorage = require('../src/localstorage.js');
  var Base64 = require('../src/base64.js');
  var cookie = require('../src/cookie.js');
  var querystring = require('querystring');
  var JSON = require('json');
  var apiKey = '000000';
  var userId = 'user';
  var amplitude;
  var server;

  beforeEach(function() {
    amplitude = new Amplitude();
    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
  });

  it('amplitude object should exist', function() {
    assert.isObject(amplitude);
  });

  describe('init', function() {
    beforeEach(function() {
    });

    afterEach(function() {
      localStorage.clear();
      cookie.remove(amplitude.options.cookieName, amplitude.options.domain);
    });

    it('should set cookie', function() {
      amplitude.init(apiKey, userId);
      var stored = JSON.parse(Base64.decode(cookie.get(amplitude.options.cookieName)));
      assert.property(stored, 'deviceId');
      assert.propertyVal(stored, 'userId', userId);
      assert.lengthOf(stored.deviceId, 36);
    });

    it('should accept userId', function() {
      amplitude.init(apiKey, userId);
      assert.equal(amplitude.options.userId, userId);
    });
  });

  describe('logEvent', function() {

    beforeEach(function() {
      amplitude.init(apiKey);
    });

    afterEach(function() {
      localStorage.clear();
      cookie.remove(amplitude.options.cookieName, amplitude.options.domain);
    });

    it('should send request', function() {
      amplitude.logEvent('Event Type 1');
      assert.lengthOf(server.requests, 1);
      assert.equal(server.requests[0].url, 'http://api.amplitude.com/');
      assert.equal(server.requests[0].method, 'POST');
      assert.equal(server.requests[0].async, true);
    });

    it('should reject empty event types', function() {
      amplitude.logEvent();
      assert.lengthOf(server.requests, 0);
    });

    it('should send api key', function() {
      amplitude.logEvent('Event Type 2');
      assert.lengthOf(server.requests, 1);
      assert.equal(querystring.parse(server.requests[0].requestBody).client, apiKey);
    });

    it('should send api version', function() {
      amplitude.logEvent('Event Type 3');
      assert.lengthOf(server.requests, 1);
      assert.equal(querystring.parse(server.requests[0].requestBody).v, '2');
    });

    it('should send event JSON', function() {
      amplitude.logEvent('Event Type 4');
      assert.lengthOf(server.requests, 1);
      var events = JSON.parse(querystring.parse(server.requests[0].requestBody).e);
      assert.equal(events.length, 1);
      assert.equal(events[0].event_type, 'Event Type 4');
    });

    it('should accept properties', function() {
      amplitude.logEvent('Event Type 5', {prop: true});
      assert.lengthOf(server.requests, 1);
      var events = JSON.parse(querystring.parse(server.requests[0].requestBody).e);
      assert.deepEqual(events[0].event_properties, {prop: true});
    });
  });
});

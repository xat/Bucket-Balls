(function (io) {

  // Init som useful stuff for easier access (don't need 'em all)
  var b2Vec2 = Box2D.Common.Math.b2Vec2
    , b2AABB = Box2D.Collision.b2AABB
    , b2BodyDef = Box2D.Dynamics.b2BodyDef
    , b2Body = Box2D.Dynamics.b2Body
    , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
    , b2Fixture = Box2D.Dynamics.b2Fixture
    , b2World = Box2D.Dynamics.b2World
    , b2MassData = Box2D.Collision.Shapes.b2MassData
    , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
    , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
    , b2DebugDraw = Box2D.Dynamics.b2DebugDraw
    , b2ContactListener = Box2D.Dynamics.b2ContactListener
    , b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
    , b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;

  // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (/* function */ callback, /* DOMElement */ element) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  var SCALE,
      canvas,
      socket,
      ctx,
      world,
      fixDef,
      worldWidth,
      worldHeight,
      walls = {},
      gravity = {},
      gamma,
      beta,
      shapes = {};

  var debug = false;

  var init = {
    start:function (id) {
      this.defaultProperties();
      this.canvas(id);

      box2d.create.world();
      box2d.create.defaultFixture();
      box2d.detectCollisions();

      worldWidth = window.innerWidth;
      worldHeight = window.innerHeight;

      socket = io.connect('http://node.soped.lan:3100');

      socket.on('connect', function() {
        socket.emit('create', {
          'clientId': window.clientId,
          'ua': window.navigator.userAgent
        });
      });

      socket.on('addballs', function(num) {
        console.log('adding balls: %s', num);
        while(num--) {
          setTimeout(function () {
            add.circle();
          }, num*200);
        }
      });

      socket.on('addball', function(options) {
        add.circle(options);
      });

      rebuild();

      // On my signal: Unleash hell.
      (function hell() {
        loop.step();
        loop.update();
        if (debug) {
          world.DrawDebugData();
        }
        loop.draw();
        requestAnimFrame(hell);
      })();
    },
    defaultProperties:function () {
      SCALE = 30;
    },
    canvas:function (id) {
      canvas = document.getElementById(id);
      ctx = canvas.getContext("2d");
    },
    surroundings:{
      rightWall:function () {
        if (!!walls.right) {
          box2d.removeFromWorld(walls.right);
        }
        walls.right = add.box({
          x:worldWidth / SCALE + 1.1, // 740 / 30 + 1.1
          y:(worldHeight / SCALE) / 2, // 380px / 30 / 2
          height:(worldHeight / SCALE), // 380px / 30
          width:2,
          isStatic:true,
          type: 'right'
        });
      },
      ground:function () {
        if (!!walls.ground) {
          box2d.removeFromWorld(walls.ground);
        }
        walls.ground = add.box({
          x:(worldWidth / SCALE) / 2, // 740 / 30 / 2
          y:(worldHeight / SCALE)+1,
          height:2,
          width:(worldWidth / SCALE), // 740 / 30
          isStatic:true,
          type: 'ground'
        });
      },
      leftWall:function () {
        if (!!walls.left) {
          box2d.removeFromWorld(walls.left);
        }
        walls.left = add.box({
          x:-1,
          y:(worldHeight / SCALE) / 2, // 380px / 30 / 2
          height:(worldHeight / SCALE), // 380px / 30
          width:2,
          isStatic:true,
          type: 'left'
        });
      }
    },
    callbacks:function () {
      canvas.addEventListener('click', function (e) {
        var shapeOptions = {
          x:(canvas.width / SCALE) * (e.offsetX / canvas.width),
          y:0
        };
        add.random(shapeOptions);
      }, false);
    }
  };


  var add = {
    random:function (options) {
      options = options || {};
      if (Math.random() < 0.5) {
        this.circle(options);
      } else {
        this.box(options);
      }
    },
    circle:function (options) {
      options = options || {};
      if (!options.radius) {
        options.radius = 0.5 + Math.random() * 0.5;
      }
      var shape = new Circle(options);
      shapes[shape.id] = shape;
      box2d.addToWorld(shape);
    },
    box:function (options) {
      options = options || {};
      options.width = options.width || 0.5 + Math.random() * 2;
      options.height = options.height || 0.5 + Math.random() * 2;
      var shape = new Box(options);
      shapes[shape.id] = shape;
      return box2d.addToWorld(shape);
    }
  };

  var box2d = {
    addToWorld:function (shape) {
      var bodyDef = this.create.bodyDef(shape);
      var body = world.CreateBody(bodyDef);
      if (shape.radius) {
        fixDef.shape = new b2CircleShape(shape.radius);
      } else {
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(shape.width / 2, shape.height / 2);
      }
      body.CreateFixture(fixDef);
      // create a back reference..
      shape.b2meta = {
        body: body
      };
      return shape;
    },
    removeFromWorld:function (shape) {
      world.DestroyBody(shape.b2meta.body);
      delete shapes[shape.id];
    },
    detectCollisions: function() {
      var listener = new b2ContactListener;
      listener.BeginContact = function(contact) {
        var shapeIdA = contact.GetFixtureA().GetBody().GetUserData();
        var shapeIdB = contact.GetFixtureB().GetBody().GetUserData();
        if (shapes[shapeIdA].isStatic !== shapes[shapeIdB].isStatic) {
          // circle to wall collision
          if (shapes[shapeIdA].isStatic) {
            shapes[shapeIdB].lastContact = shapes[shapeIdA].type;
          } else {
            shapes[shapeIdA].lastContact = shapes[shapeIdB].type;
          }
        }
      };
      world.SetContactListener(listener);
    },
    create:{
      world:function () {
        world = new b2World(
          new b2Vec2(0, 10)    //gravity
          , false                 //allow sleep
        );

        if (debug) {
          var debugDraw = new b2DebugDraw();
          debugDraw.SetSprite(ctx);
          debugDraw.SetDrawScale(30.0);
          debugDraw.SetFillAlpha(0.3);
          debugDraw.SetLineThickness(1.0);
          debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
          world.SetDebugDraw(debugDraw);
        }
      },
      defaultFixture:function () {
        fixDef = new b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;
      },
      bodyDef:function (shape) {
        var bodyDef = new b2BodyDef;

        if (shape.isStatic == true) {
          bodyDef.type = b2Body.b2_staticBody;
        } else {
          bodyDef.type = b2Body.b2_dynamicBody;
        }
        bodyDef.position.x = shape.x;
        bodyDef.position.y = shape.y;
        bodyDef.userData = shape.id;
        bodyDef.angle = shape.angle;

        return bodyDef;
      }
    },
    get:{
      bodySpec:function (b) {
        return {
          x:b.GetPosition().x,
          y:b.GetPosition().y,
          angle:b.GetAngle(),
          center:{
            x:b.GetWorldCenter().x,
            y:b.GetWorldCenter().y
          }
        };
      }
    }
  };


  var loop = {
    step:function () {
      var stepRate = 1 / 25;
      world.Step(stepRate, 10, 10);
      world.ClearForces();
    },
    update:function () {
      for (var b = world.GetBodyList(); b; b = b.m_next) {
        if (b.IsActive() && typeof b.GetUserData() !== 'undefined' && b.GetUserData() != null) {
          shapes[b.GetUserData()].update(box2d.get.bodySpec(b));
        }
      }
    },
    draw:function () {
      if (!debug) ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i in shapes) {
        shapes[i].draw();
      }
    }
  };

  var helpers = {
    randomColor:function () {
      var letters = '0123456789ABCDEF'.split(''),
        color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 15)];
      }
      return color;
    }
  };

  /* Shapes down here */

  var Shape = function (v) {
    this.id = Math.round(Math.random() * 1000000);
    this.x = v.x || ((worldWidth / SCALE / 2) + Math.random());
    this.y = v.y || 0;
    this.angle = 0;
    if (!v.color) {
      this.color = helpers.randomColor();
    } else {
      this.color = v.color;
    }
    this.center = { x:null, y:null };
    this.isStatic = v.isStatic || false;
    if (this.isStatic) {
      this.type = v.type;
    }

    this.update = function (options) {
      this.angle = options.angle;
      this.center = options.center;
      this.x = options.x;
      this.y = options.y;
    };
  };

  var Circle = function (options) {
    Shape.call(this, options);
    this.radius = options.radius || 1;
    var that = this;

    this.draw = function () {
      ctx.save();
      ctx.translate(this.x * SCALE, this.y * SCALE);
      ctx.rotate(this.angle);
      ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x * SCALE, this.y * SCALE, this.radius * SCALE, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    this.update = function (options) {
      this.angle = options.angle;
      this.center = options.center;
      this.x = options.x;
      this.y = options.y;

      if (this.y < 0 && that.lastContact) {
        delete options.x;
        delete options.y;
        options.color = this.color;
        box2d.removeFromWorld(that);
        socket.emit('removeball', {
          circleMeta: options,
          lastContact: that.lastContact,
          clientId: window.clientId,
          hasDeviceorientation: !!window.DeviceOrientationEvent
        });
      }
    };
  };
  Circle.prototype = Shape;

  var Box = function (options) {
    Shape.call(this, options);
    this.width = options.width || Math.random() * 2 + 0.5;
    this.height = options.height || Math.random() * 2 + 0.5;

    this.draw = function () {
      ctx.save();
      ctx.translate(this.x * SCALE, this.y * SCALE);
      ctx.rotate(this.angle);
      ctx.translate(-(this.x) * SCALE, -(this.y) * SCALE);
      ctx.fillStyle = this.color;
      ctx.fillRect(
        (this.x - (this.width / 2)) * SCALE,
        (this.y - (this.height / 2)) * SCALE,
        this.width * SCALE,
        this.height * SCALE
      );
      ctx.restore();
    };
  };
  Box.prototype = Shape;

  window.addEventListener('load', function() {
    init.start('canvas');
  });

  var rebuild = function() {
    // rebuild the walls
    init.surroundings.leftWall();
    init.surroundings.rightWall();
    init.surroundings.ground();
    canvas.width = worldWidth;
    canvas.height = worldHeight;
  };

  window.addEventListener('deviceorientation', function(e) {
    if (!!world) {
      // this is code that mr. doob used in his ball pool demo
      gravity.x = Math.sin( e.gamma * Math.PI / 180 );
      gravity.y = Math.sin( ( Math.PI / 4 ) + e.beta * Math.PI / 180 );
      gamma = e.gamma;
      beta = e.beta;
      world.m_gravity.x = gravity.x * 60;
      world.m_gravity.y = gravity.y * 6;
    }
  });
})(io);
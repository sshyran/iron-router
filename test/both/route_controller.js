var createRouter = function () {
  return new IronRouter({
    autoRender: false,
    autoStart: false
  });
};

Tinytest.add('RouteController - inheritance', function (test) {
  var Router = createRouter();
  var route = new Route(Router, 'test', {});

  var Parent = RouteController.extend({
    parentMethod: function () {}
  });

  var Child = Parent.extend({
    childMethod: function () {}
  });

  var inst = new Child(Router, route);

  test.isTrue(_.isFunction(inst.childMethod), 'child method not defined');
  test.isTrue(_.isFunction(inst.parentMethod), 'parent method not defined');
});

Tinytest.add('RouteController - lookupProperty', function (test) {
  var Router = createRouter();
  var route = new Route(Router, 'test', {});
  var inst = new RouteController(Router, route, {});
  var value;

  // undefined
  value = inst.lookupProperty('myProperty');
  test.isUndefined(value, 'property should be undefined');

  // router options
  Router.options.myProperty = 'myRouterValue';
  value = inst.lookupProperty('myProperty');
  test.equal(value, 'myRouterValue', 'property should be on router options');

  // route options
  route.options.myProperty = 'myRouteValue';
  value = inst.lookupProperty('myProperty');
  test.equal(value, 'myRouteValue', 'property should be on route options');

  // route controller instance
  inst.myProperty = 'myInstanceValue';
  value = inst.lookupProperty('myProperty');
  test.equal(value, 'myInstanceValue', 'property should be on instance');

  // route controller options
  inst.options.myProperty = 'myOptionsValue';
  value = inst.lookupProperty('myProperty');
  test.equal(value, 'myOptionsValue', 'property should be on instance options');
});

Tinytest.add('RouteController - _runHook run order', function (test) {
  var Router = createRouter();
  var route = new Route(Router, 'test', {});

  var calls = [];

  var Parent = RouteController.extend({
    onRun: function () {
      calls.push('parent');
    }
  });

  var Child = Parent.extend({
    onRun: function () {
      calls.push('child');
    }
  });

  var inst = new Child(Router, route, {});

  Router.getHooks = function (name, type) {
    if (name !== 'onRun')
      return [];

    return [
      function () {
        calls.push('router');
      }
    ]
  };

  route.options.onRun = function () {
    calls.push('route options');
  };

  inst.options.onRun = function () {
    calls.push('options');
  };

  inst.onRun = function () {
    calls.push('instance');
  };

  var more = function () {
    calls.push('more');
  };

  inst._runHook('onRun', more);

  test.equal(calls, ["router", "route options", "options", "parent", "child", "instance", "more"], '_runHook run order is wrong');
});

Tinytest.add('RouteController - _runHook pause', function (test) {
  var Router = createRouter();
  var route = new Route(Router, 'test', {});
  var inst = new RouteController(Router, route, {});

  var calls = [];

  inst.onRun = [
    function (pause) {
      calls.push('1');
      pause();
    },

    function (pause) {
      calls.push('2');
    }
  ];

  var isPaused = inst._runHook('onRun');

  test.equal(calls, ['1'], 'looks like a downstream hook ran even though we were paused');
  test.isTrue(isPaused, "looks like _runHook didn't return the paused value");
});

Tinytest.add('RouteController - _runHook stop', function (test) {
  var Router = createRouter();
  var route = new Route(Router, 'test', {});
  var inst = new RouteController(Router, route, {});

  var calls = [];

  inst.onRun = [
    function (pause) {
      calls.push('1');
      inst._stopController();
    },

    function (pause) {
      calls.push('2');
    }
  ];

  inst._runHook('onRun');
  test.equal(calls, ['1'], 'looks like a downstream hook ran even though we were stopped');
});

Tinytest.add('RouteController - runHooks', function (test) {
  var Router = createRouter();
  var route = new Route(Router, 'test', {});
  var inst = new RouteController(Router, route, {});
  var calls = [];

  inst.onRun = function () {
    calls.push('onRun');
  };

  inst.load = function () {
    calls.push('load');
  };

  var cb = function () {
    calls.push('cb');
  };

  var more = function () {
    calls.push('more');
  };

  inst.runHooks(['onRun', 'load'], more, cb);
  test.equal(calls, [
    'onRun',
    'more',
    'load',
    'more', //XXX this is a mistake
    'cb'
  ]);
});

Tinytest.add('RouteController - stop', function (test) {
  var Router = createRouter();
  var route = new Route(Router, 'test', {});
  var inst = new RouteController(Router, route, {});

  var calls = [];
  inst.onStop = function () {
    calls.push('onStop');
  };

  inst.unload = function () {
    calls.push('unload');
  };

  inst.stop();

  test.isFalse(inst.isRunning, 'isRunning should be false');
  test.isTrue(inst.isStopped, 'isStopped should be true');
  test.equal(calls, ['onStop', 'unload'], 'stop hooks not called');
});

var QueQue = (function() {
	function each(obj, fn, scope) {
		var i = 0, p;
		for(p in obj) if(obj.hasOwnProperty(p)) {
			// value, key, index, obj
			fn.call(scope, obj[p], p, i++, obj);
		}
	}
	
	function override(target, source) {
		each(source, function(value, key) {
			target[key] = value;
		});
		return target;
	}
	
	function Constructor(config) {	
		this._tasks = [];
		this._handlers = [];
		override(this, config || {});		
	}
	
	var EVENTS = {
		'start': 'onStart',
		'end': 'onEnd',
		'add': 'onAdd',
		'remove': 'onRemove',
		'flush': 'onFlush',
		'exception': 'onException',
		'stepComplete': 'onStepComplete'
	};
	
	Constructor.prototype = {
		add: function(fn, opts) {
			var step = override({
			
			}, opts || {});
			
			this._tasks.push(step);
			
			return this;
		},
		remove: function(fn) {
            var tasks = this._tasks;

            tasks.splice(tasks.indexOf(fn), 1);

            return this;
		},
		step: function() {
			var
                    step;

            this._proxy = {};

			try {
				step.fn.call(step.scope || this, this._proxy);
			} catch(e) {
				if(step.onException) {
					step.onException.call(this, e, this);
				}
			}
		},
		stop: function() {
            this._running = false;
            return this;
        },
		start: function() {
            this._running = true;
            return this.step();
        },
		clear: function() {
			this._tasks = [];
			return this.stop();
		},
		on: function(event, handler) {
			var ev = this._handlers[event] = this._handlers[event] || [];
			
			ev.push(handler);
			
			return this;
		},
		trigger: function(ev, args, scope) {
		
			return this;
		}
	};
	
	each(EVENTS, function(fn, event) {
		//console.log(event, fn);
		this[fn] = function(handler) {
			return this.on(event, handler);
		}
	}, Constructor.prototype);
	
	return Constructor;
})();

var q = new Queue;

q.onStepComplete(alert);
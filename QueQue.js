/**
 * @author Valentin Starck (@aijoona)
 * @see http://blog.aijoona.com/2011/05/25/queque-colas-de-ejecucion/
 * 
 * QueQue is freely distributable under the terms of an MIT-style license.
 ********************************************************************************/
var QueQue = (function() {
	function each(obj, fn, scope) {	
		var i = 0, p;
		
		if(Object.prototype.toString.call(obj) != '[object Array]') {
			for(p in obj) if(obj.hasOwnProperty(p)) {
				// value, key, index, obj
				fn.call(scope, obj[p], p, i++, obj);
			}			
			return;
		} 
		
		if(Array.prototype.forEach) {
			Array.prototype.forEach.call(obj, fn);
			return;
		}
		
		for(i = 0, p = obj.length; i < p; i++) {
			// value, index, obj
			fn.call(scope, obj[i], i, obj);
		}
	}
	
	function override(target, source) {
		each(source, function(value, key) {
			target[key] = value;
		});
		return target;
	}
	
	/**
	 * Utility method
	 *
	 * 	eventize("foo") //"onFoo"
	 *
	 * @param {String} str
	 * @return {String}
	 */
	function eventize(str) {
		return str.replace(/^[a-z]/i, function(c) {
			return 'on' + c.toUpperCase();
		});
	}
	/**
	 * @constructor
	 * @param {Object} config
	 */
	function QueQue(config) {
		// allow QueQue().add() syntax
		if(!(this instanceof QueQue)) {
			return new QueQue(config);
		}
	
		this._tasks = [];
		this._handlers = [];

		override(this, config || {});		
	}

    	// Queue events
	var exceptionEVENTS = [
		'start',
		'stop',
		'complete',
		'add',
		'exception'
	];
	
	QueQue.prototype = {
		/**
		 * @param {Function} fn
		 * @param {Object} opts
		 */
		add: function(fn, opts) {	
			var step = override({
				async: true,
				scope: this,
				fn: fn
			}, opts || {});
			
			
			this.trigger('add', [step]);
			
			if(step) {
				this._tasks.push(step);
			}
			
			return this;
		},
		/**
		 * @param {Object} lastResult
		 * @param {Object} error
		 * @return {QueQue}
		 */
		step: function(lastResult, error) {
			var 
					self = this, 
					step, 
					proxy;		
			
			if(!this._running) {
				return this;
			}

			if(!this._tasks.length) {
				return this.end();
			}

            // Next step is...
			step = this._tasks.shift();
			
			proxy = {
				qq: this,
				memo: lastResult,
				error: error
			};

			if(step.async) {
				proxy.ready = function(data, error) {
					return self.step(data, error);
				}
			}
			
			try {
				lastResult = step.fn.call(step.scope || this, proxy);
			} catch(e) {
				if(step.onException) {
					step.onException.call(this, e);
				} else {				
					if(this._handlers['exception'] && this._handlers['exception'].lenght) {
						this.trigger('exception', [e]);					
					}
					error = e;
				}
			}
			
			if(!step.async) {
				this.step(lastResult, error);
			}
			
			return this;
		},
		/**
		 * @return {QueQue}
		 */
		end: function() {
            this
				.trigger('complete')
				.clear()
				._running = false;			

            return this;		
		},
		/**
		 * @return {QueQue}
		 */
		stop: function() {
			this
				.trigger('stop')
				._running = false;
				
            return this;
        },
		/**
		 * @param {Object}obj
		 * @return {QueQue}
		 */
		start: function(obj) {
			this
				.trigger('start')
				._running = true;
				
            return this.step(obj);
        },
		/**
		 * @return {QueQue}
		 */
		clear: function() {
			this._tasks = [];
			return this;
		},
		/**
		 * @param {String} event
		 * @param {Function} Handler
		 * @return {QueQue}
		 */
		on: function(event, handler) {	
			(this._handlers[event] = this._handlers[event] || []).push(handler);
			
			return this;
		},
		/**
		 * @param {String} event
		 * @param {Array} scope
		 * @param {Object} args
		 * @return {QueQue}
		 */
		trigger: function(event, args, scope) {
			var handlers = this._handlers[event] || [];
			
			each(handlers, function(h) {
				h.apply(args);
			});
			
			return this;
		}
	};
	
	// Events shorthands 
	// QueQue().on('complete',fn) -> QueQue().onComplete(fn)
	each(EVENTS, function(e) {
		QueQue.prototype[eventize(e)] = function(handler) {
			return this.on(e, handler);
		}		
	});
	
	return QueQue;
})();

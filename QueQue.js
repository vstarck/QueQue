/**
 * @author Valentin Starck (@aijoona)
 * @see
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
	
	var EVENTS = [
		'start',
		'stop',
		'complete',
		'add',
		'remove',
		'clear',
		'exception'
	];
	
	QueQue.prototype = {
		/**
		 * @param {Function} fn
		 * @param {Object} opts
		 */
		add: function(fn, opts) {	
			var step = override({
				async: false,
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
		 * @param {Function} fn
		 * @param {Number} limit
		 */
		remove: function(fn, limit) {
            var tasks = this._tasks;

            //tasks.splice(tasks.indexOf(fn), 1);

            return this;
		},
		/**
		 * @param {Object} lastResult
		 * @return {QueQue}
		 */
		step: function(lastResult) {
			var 
					self = this, 
					step, 
					proxy = {};		
			
			if(!this._running) {
				return this;
			}

			if(!this._tasks.length) {
				this.trigger('complete');
				return this.end();
			}			

			step = this._tasks.shift();
			
			proxy.qq = this;
			proxy.memo = lastResult;

			if(step.async) {
				proxy.end = function(data) {
					return self.step(data);
				}
			}
			
			try {
				proxy.memo = step.fn.call(step.scope || this, proxy);
			} catch(e) {
				if(step.onException) {
					step.onException.call(this, e, this);
				} else {
					throw e;
				}
			}
			
			if(!step.async) {
				this.step(proxy.memo);		
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
//-----------------------------------------------------------------------------------------------------------------

// Pipeline
var q = new QueQue;

//q.onStepComplete(alert);
/*
q

.add(function(proxy) {
	var value = {};
	
	value['s1'] = true;
	console.log('s1 ready');
	return value;
})

.add(function(proxy) {
	var value = proxy.memo;
	
	value['s2'] = true;
	console.log('s2 ready');
	
	return value;
})

.add(function(proxy) {
	var value = proxy.memo;
	
	value['s3'] = true;
	
	setTimeout(function() {
		console.log('s3 ready');
		proxy.end(value);	
	}, 1500);	
	
}, { async: true })

.add(function(proxy) {
	var value = proxy.memo;
	
	value['s4'] = true;
	
	console.log(value);
	
	return value;	
})

.start();
*/
//-----------------------------------------------------------------------------------------------------------------
// Events



var qq = QueQue()
	.onComplete(function() {
		console.log('Complete I');
	})
	.on('complete', function() {
		console.log('Complete II');
	})
	.add(function(proxy) {
		setTimeout(function() {
			console.log('Ready 1');
			proxy.end();
		},1500);
	}, { async: true})
	.add(function(proxy) {
		setTimeout(function() {
			console.log('Ready 2');
			proxy.end();
		},1500);
	}, { async: true})
	.start();

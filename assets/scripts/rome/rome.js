/**
 * rome - Customizable date (and time) picker. Opt-in UI, no jQuery!
 * @version v1.1.6
 * @link https://github.com/bevacqua/rome
 * @license MIT
 */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.rome=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
		var canSetImmediate = typeof window !== 'undefined'
		&& window.setImmediate;
		var canPost = typeof window !== 'undefined'
		&& window.postMessage && window.addEventListener
		;

		if (canSetImmediate) {
				return function (f) { return window.setImmediate(f) };
		}

		if (canPost) {
				var queue = [];
				window.addEventListener('message', function (ev) {
						var source = ev.source;
						if ((source === window || source === null) && ev.data === 'process-tick') {
								ev.stopPropagation();
								if (queue.length > 0) {
										var fn = queue.shift();
										fn();
								}
						}
				}, true);

				return function nextTick(fn) {
						queue.push(fn);
						window.postMessage('process-tick', '*');
				};
		}

		return function nextTick(fn) {
				setTimeout(fn, 0);
		};
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
		throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
		throw new Error('process.chdir is not supported');
};

},{}],2:[function(_dereq_,module,exports){
module.exports = _dereq_('./src/contra.emitter.js');

},{"./src/contra.emitter.js":3}],3:[function(_dereq_,module,exports){
(function (process){
(function (root, undefined) {
	'use strict';

	var undef = '' + undefined;
	function atoa (a, n) { return Array.prototype.slice.call(a, n); }
	function debounce (fn, args, ctx) { if (!fn) { return; } tick(function run () { fn.apply(ctx || null, args || []); }); }

	// cross-platform ticker
	var si = typeof setImmediate === 'function', tick;
	if (si) {
		tick = function (fn) { setImmediate(fn); };
	} else if (typeof process !== undef && process.nextTick) {
		tick = process.nextTick;
	} else {
		tick = function (fn) { setTimeout(fn, 0); };
	}

	function _emitter (thing, options) {
		var opts = options || {};
		var evt = {};
		if (thing === undefined) { thing = {}; }
		thing.on = function (type, fn) {
			if (!evt[type]) {
				evt[type] = [fn];
			} else {
				evt[type].push(fn);
			}
			return thing;
		};
		thing.once = function (type, fn) {
			fn._once = true; // thing.off(fn) still works!
			thing.on(type, fn);
			return thing;
		};
		thing.off = function (type, fn) {
			var c = arguments.length;
			if (c === 1) {
				delete evt[type];
			} else if (c === 0) {
				evt = {};
			} else {
				var et = evt[type];
				if (!et) { return thing; }
				et.splice(et.indexOf(fn), 1);
			}
			return thing;
		};
		thing.emit = function () {
			var args = atoa(arguments);
			var type = args.shift();
			var et = evt[type];
			if (type === 'error' && opts.throws !== false && !et) { throw args.length === 1 ? args[0] : args; }
			if (!et) { return thing; }
			evt[type] = et.filter(function emitter (listen) {
				if (opts.async) { debounce(listen, args, thing); } else { listen.apply(thing, args); }
				return !listen._once;
			});
			return thing;
		};
		return thing;
	}

	// cross-platform export
	if (typeof module !== undef && module.exports) {
		module.exports = _emitter;
	} else {
		root.contra = root.contra || {};
		root.contra.emitter = _emitter;
	}
})(this);

}).call(this,_dereq_("FWaASH"))
},{"FWaASH":1}],4:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var debounce = _dereq_('lodash.debounce'),
		isFunction = _dereq_('lodash.isfunction'),
		isObject = _dereq_('lodash.isobject');

/** Used as an internal `_.debounce` options object */
var debounceOptions = {
	'leading': false,
	'maxWait': 0,
	'trailing': false
};

/**
 * Creates a function that, when executed, will only call the `func` function
 * at most once per every `wait` milliseconds. Provide an options object to
 * indicate that `func` should be invoked on the leading and/or trailing edge
 * of the `wait` timeout. Subsequent calls to the throttled function will
 * return the result of the last `func` call.
 *
 * Note: If `leading` and `trailing` options are `true` `func` will be called
 * on the trailing edge of the timeout only if the the throttled function is
 * invoked more than once during the `wait` timeout.
 *
 * @static
 * @memberOf _
 * @category Functions
 * @param {Function} func The function to throttle.
 * @param {number} wait The number of milliseconds to throttle executions to.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // avoid excessively updating the position while scrolling
 * var throttled = _.throttle(updatePosition, 100);
 * jQuery(window).on('scroll', throttled);
 *
 * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
 * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
 *   'trailing': false
 * }));
 */
function throttle(func, wait, options) {
	var leading = true,
			trailing = true;

	if (!isFunction(func)) {
		throw new TypeError;
	}
	if (options === false) {
		leading = false;
	} else if (isObject(options)) {
		leading = 'leading' in options ? options.leading : leading;
		trailing = 'trailing' in options ? options.trailing : trailing;
	}
	debounceOptions.leading = leading;
	debounceOptions.maxWait = wait;
	debounceOptions.trailing = trailing;

	return debounce(func, wait, debounceOptions);
}

module.exports = throttle;

},{"lodash.debounce":5,"lodash.isfunction":8,"lodash.isobject":9}],5:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isFunction = _dereq_('lodash.isfunction'),
		isObject = _dereq_('lodash.isobject'),
		now = _dereq_('lodash.now');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeMax = Math.max;

/**
 * Creates a function that will delay the execution of `func` until after
 * `wait` milliseconds have elapsed since the last time it was invoked.
 * Provide an options object to indicate that `func` should be invoked on
 * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
 * to the debounced function will return the result of the last `func` call.
 *
 * Note: If `leading` and `trailing` options are `true` `func` will be called
 * on the trailing edge of the timeout only if the the debounced function is
 * invoked more than once during the `wait` timeout.
 *
 * @static
 * @memberOf _
 * @category Functions
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
 * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
 * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // avoid costly calculations while the window size is in flux
 * var lazyLayout = _.debounce(calculateLayout, 150);
 * jQuery(window).on('resize', lazyLayout);
 *
 * // execute `sendMail` when the click event is fired, debouncing subsequent calls
 * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * });
 *
 * // ensure `batchLog` is executed once after 1 second of debounced calls
 * var source = new EventSource('/stream');
 * source.addEventListener('message', _.debounce(batchLog, 250, {
 *   'maxWait': 1000
 * }, false);
 */
function debounce(func, wait, options) {
	var args,
			maxTimeoutId,
			result,
			stamp,
			thisArg,
			timeoutId,
			trailingCall,
			lastCalled = 0,
			maxWait = false,
			trailing = true;

	if (!isFunction(func)) {
		throw new TypeError;
	}
	wait = nativeMax(0, wait) || 0;
	if (options === true) {
		var leading = true;
		trailing = false;
	} else if (isObject(options)) {
		leading = options.leading;
		maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
		trailing = 'trailing' in options ? options.trailing : trailing;
	}
	var delayed = function() {
		var remaining = wait - (now() - stamp);
		if (remaining <= 0) {
			if (maxTimeoutId) {
				clearTimeout(maxTimeoutId);
			}
			var isCalled = trailingCall;
			maxTimeoutId = timeoutId = trailingCall = undefined;
			if (isCalled) {
				lastCalled = now();
				result = func.apply(thisArg, args);
				if (!timeoutId && !maxTimeoutId) {
					args = thisArg = null;
				}
			}
		} else {
			timeoutId = setTimeout(delayed, remaining);
		}
	};

	var maxDelayed = function() {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		maxTimeoutId = timeoutId = trailingCall = undefined;
		if (trailing || (maxWait !== wait)) {
			lastCalled = now();
			result = func.apply(thisArg, args);
			if (!timeoutId && !maxTimeoutId) {
				args = thisArg = null;
			}
		}
	};

	return function() {
		args = arguments;
		stamp = now();
		thisArg = this;
		trailingCall = trailing && (timeoutId || !leading);

		if (maxWait === false) {
			var leadingCall = leading && !timeoutId;
		} else {
			if (!maxTimeoutId && !leading) {
				lastCalled = stamp;
			}
			var remaining = maxWait - (stamp - lastCalled),
					isCalled = remaining <= 0;

			if (isCalled) {
				if (maxTimeoutId) {
					maxTimeoutId = clearTimeout(maxTimeoutId);
				}
				lastCalled = stamp;
				result = func.apply(thisArg, args);
			}
			else if (!maxTimeoutId) {
				maxTimeoutId = setTimeout(maxDelayed, remaining);
			}
		}
		if (isCalled && timeoutId) {
			timeoutId = clearTimeout(timeoutId);
		}
		else if (!timeoutId && wait !== maxWait) {
			timeoutId = setTimeout(delayed, wait);
		}
		if (leadingCall) {
			isCalled = true;
			result = func.apply(thisArg, args);
		}
		if (isCalled && !timeoutId && !maxTimeoutId) {
			args = thisArg = null;
		}
		return result;
	};
}

module.exports = debounce;

},{"lodash.isfunction":8,"lodash.isobject":9,"lodash.now":6}],6:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative');

/**
 * Gets the number of milliseconds that have elapsed since the Unix epoch
 * (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @example
 *
 * var stamp = _.now();
 * _.defer(function() { console.log(_.now() - stamp); });
 * // => logs the number of milliseconds it took for the deferred function to be called
 */
var now = isNative(now = Date.now) && now || function() {
	return new Date().getTime();
};

module.exports = now;

},{"lodash._isnative":7}],7:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/** Used to detect if a method is native */
var reNative = RegExp('^' +
	String(toString)
		.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		.replace(/toString| for [^\]]+/g, '.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
 */
function isNative(value) {
	return typeof value == 'function' && reNative.test(value);
}

module.exports = isNative;

},{}],8:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Checks if `value` is a function.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 */
function isFunction(value) {
	return typeof value == 'function';
}

module.exports = isFunction;

},{}],9:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = _dereq_('lodash._objecttypes');

/**
 * Checks if `value` is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
	// check if the value is the ECMAScript language type of Object
	// http://es5.github.io/#x8
	// and avoid a V8 bug
	// http://code.google.com/p/v8/issues/detail?id=2291
	return !!(value && objectTypes[typeof value]);
}

module.exports = isObject;

},{"lodash._objecttypes":10}],10:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to determine if values are of the language type Object */
var objectTypes = {
	'boolean': false,
	'function': true,
	'object': true,
	'number': false,
	'string': false,
	'undefined': false
};

module.exports = objectTypes;

},{}],11:[function(_dereq_,module,exports){
(function (global){
//! moment.js
//! version : 2.8.2
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
		/************************************
				Constants
		************************************/

		var moment,
				VERSION = '2.8.2',
				// the global-scope this is NOT the global object in Node.js
				globalScope = typeof global !== 'undefined' ? global : this,
				oldGlobalMoment,
				round = Math.round,
				hasOwnProperty = Object.prototype.hasOwnProperty,
				i,

				YEAR = 0,
				MONTH = 1,
				DATE = 2,
				HOUR = 3,
				MINUTE = 4,
				SECOND = 5,
				MILLISECOND = 6,

				// internal storage for locale config files
				locales = {},

				// extra moment internal properties (plugins register props here)
				momentProperties = [],

				// check for nodeJS
				hasModule = (typeof module !== 'undefined' && module.exports),

				// ASP.NET json date format regex
				aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
				aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

				// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
				// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
				isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

				// format tokens
				formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
				localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

				// parsing token regexes
				parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
				parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
				parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
				parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
				parseTokenDigits = /\d+/, // nonzero number of digits
				parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
				parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
				parseTokenT = /T/i, // T (ISO separator)
				parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
				parseTokenOrdinal = /\d{1,2}/,

				//strict parsing regexes
				parseTokenOneDigit = /\d/, // 0 - 9
				parseTokenTwoDigits = /\d\d/, // 00 - 99
				parseTokenThreeDigits = /\d{3}/, // 000 - 999
				parseTokenFourDigits = /\d{4}/, // 0000 - 9999
				parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
				parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

				// iso 8601 regex
				// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
				isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

				isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

				isoDates = [
						['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
						['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
						['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
						['GGGG-[W]WW', /\d{4}-W\d{2}/],
						['YYYY-DDD', /\d{4}-\d{3}/]
				],

				// iso time formats and regexes
				isoTimes = [
						['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
						['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
						['HH:mm', /(T| )\d\d:\d\d/],
						['HH', /(T| )\d\d/]
				],

				// timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-15', '30']
				parseTimezoneChunker = /([\+\-]|\d\d)/gi,

				// getter and setter names
				proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
				unitMillisecondFactors = {
						'Milliseconds' : 1,
						'Seconds' : 1e3,
						'Minutes' : 6e4,
						'Hours' : 36e5,
						'Days' : 864e5,
						'Months' : 2592e6,
						'Years' : 31536e6
				},

				unitAliases = {
						ms : 'millisecond',
						s : 'second',
						m : 'minute',
						h : 'hour',
						d : 'day',
						D : 'date',
						w : 'week',
						W : 'isoWeek',
						M : 'month',
						Q : 'quarter',
						y : 'year',
						DDD : 'dayOfYear',
						e : 'weekday',
						E : 'isoWeekday',
						gg: 'weekYear',
						GG: 'isoWeekYear'
				},

				camelFunctions = {
						dayofyear : 'dayOfYear',
						isoweekday : 'isoWeekday',
						isoweek : 'isoWeek',
						weekyear : 'weekYear',
						isoweekyear : 'isoWeekYear'
				},

				// format function strings
				formatFunctions = {},

				// default relative time thresholds
				relativeTimeThresholds = {
						s: 45,  // seconds to minute
						m: 45,  // minutes to hour
						h: 22,  // hours to day
						d: 26,  // days to month
						M: 11   // months to year
				},

				// tokens to ordinalize and pad
				ordinalizeTokens = 'DDD w W M D d'.split(' '),
				paddedTokens = 'M D H h m s w W'.split(' '),

				formatTokenFunctions = {
						M    : function () {
								return this.month() + 1;
						},
						MMM  : function (format) {
								return this.localeData().monthsShort(this, format);
						},
						MMMM : function (format) {
								return this.localeData().months(this, format);
						},
						D    : function () {
								return this.date();
						},
						DDD  : function () {
								return this.dayOfYear();
						},
						d    : function () {
								return this.day();
						},
						dd   : function (format) {
								return this.localeData().weekdaysMin(this, format);
						},
						ddd  : function (format) {
								return this.localeData().weekdaysShort(this, format);
						},
						dddd : function (format) {
								return this.localeData().weekdays(this, format);
						},
						w    : function () {
								return this.week();
						},
						W    : function () {
								return this.isoWeek();
						},
						YY   : function () {
								return leftZeroFill(this.year() % 100, 2);
						},
						YYYY : function () {
								return leftZeroFill(this.year(), 4);
						},
						YYYYY : function () {
								return leftZeroFill(this.year(), 5);
						},
						YYYYYY : function () {
								var y = this.year(), sign = y >= 0 ? '+' : '-';
								return sign + leftZeroFill(Math.abs(y), 6);
						},
						gg   : function () {
								return leftZeroFill(this.weekYear() % 100, 2);
						},
						gggg : function () {
								return leftZeroFill(this.weekYear(), 4);
						},
						ggggg : function () {
								return leftZeroFill(this.weekYear(), 5);
						},
						GG   : function () {
								return leftZeroFill(this.isoWeekYear() % 100, 2);
						},
						GGGG : function () {
								return leftZeroFill(this.isoWeekYear(), 4);
						},
						GGGGG : function () {
								return leftZeroFill(this.isoWeekYear(), 5);
						},
						e : function () {
								return this.weekday();
						},
						E : function () {
								return this.isoWeekday();
						},
						a    : function () {
								return this.localeData().meridiem(this.hours(), this.minutes(), true);
						},
						A    : function () {
								return this.localeData().meridiem(this.hours(), this.minutes(), false);
						},
						H    : function () {
								return this.hours();
						},
						h    : function () {
								return this.hours() % 12 || 12;
						},
						m    : function () {
								return this.minutes();
						},
						s    : function () {
								return this.seconds();
						},
						S    : function () {
								return toInt(this.milliseconds() / 100);
						},
						SS   : function () {
								return leftZeroFill(toInt(this.milliseconds() / 10), 2);
						},
						SSS  : function () {
								return leftZeroFill(this.milliseconds(), 3);
						},
						SSSS : function () {
								return leftZeroFill(this.milliseconds(), 3);
						},
						Z    : function () {
								var a = -this.zone(),
										b = '+';
								if (a < 0) {
										a = -a;
										b = '-';
								}
								return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
						},
						ZZ   : function () {
								var a = -this.zone(),
										b = '+';
								if (a < 0) {
										a = -a;
										b = '-';
								}
								return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
						},
						z : function () {
								return this.zoneAbbr();
						},
						zz : function () {
								return this.zoneName();
						},
						X    : function () {
								return this.unix();
						},
						Q : function () {
								return this.quarter();
						}
				},

				deprecations = {},

				lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

		// Pick the first defined of two or three arguments. dfl comes from
		// default.
		function dfl(a, b, c) {
				switch (arguments.length) {
						case 2: return a != null ? a : b;
						case 3: return a != null ? a : b != null ? b : c;
						default: throw new Error('Implement me');
				}
		}

		function hasOwnProp(a, b) {
				return hasOwnProperty.call(a, b);
		}

		function defaultParsingFlags() {
				// We need to deep clone this object, and es5 standard is not very
				// helpful.
				return {
						empty : false,
						unusedTokens : [],
						unusedInput : [],
						overflow : -2,
						charsLeftOver : 0,
						nullInput : false,
						invalidMonth : null,
						invalidFormat : false,
						userInvalidated : false,
						iso: false
				};
		}

		function printMsg(msg) {
				if (moment.suppressDeprecationWarnings === false &&
								typeof console !== 'undefined' && console.warn) {
						console.warn('Deprecation warning: ' + msg);
				}
		}

		function deprecate(msg, fn) {
				var firstTime = true;
				return extend(function () {
						if (firstTime) {
								printMsg(msg);
								firstTime = false;
						}
						return fn.apply(this, arguments);
				}, fn);
		}

		function deprecateSimple(name, msg) {
				if (!deprecations[name]) {
						printMsg(msg);
						deprecations[name] = true;
				}
		}

		function padToken(func, count) {
				return function (a) {
						return leftZeroFill(func.call(this, a), count);
				};
		}
		function ordinalizeToken(func, period) {
				return function (a) {
						return this.localeData().ordinal(func.call(this, a), period);
				};
		}

		while (ordinalizeTokens.length) {
				i = ordinalizeTokens.pop();
				formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
		}
		while (paddedTokens.length) {
				i = paddedTokens.pop();
				formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
		}
		formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


		/************************************
				Constructors
		************************************/

		function Locale() {
		}

		// Moment prototype object
		function Moment(config, skipOverflow) {
				if (skipOverflow !== false) {
						checkOverflow(config);
				}
				copyConfig(this, config);
				this._d = new Date(+config._d);
		}

		// Duration Constructor
		function Duration(duration) {
				var normalizedInput = normalizeObjectUnits(duration),
						years = normalizedInput.year || 0,
						quarters = normalizedInput.quarter || 0,
						months = normalizedInput.month || 0,
						weeks = normalizedInput.week || 0,
						days = normalizedInput.day || 0,
						hours = normalizedInput.hour || 0,
						minutes = normalizedInput.minute || 0,
						seconds = normalizedInput.second || 0,
						milliseconds = normalizedInput.millisecond || 0;

				// representation for dateAddRemove
				this._milliseconds = +milliseconds +
						seconds * 1e3 + // 1000
						minutes * 6e4 + // 1000 * 60
						hours * 36e5; // 1000 * 60 * 60
				// Because of dateAddRemove treats 24 hours as different from a
				// day when working around DST, we need to store them separately
				this._days = +days +
						weeks * 7;
				// It is impossible translate months into days without knowing
				// which months you are are talking about, so we have to store
				// it separately.
				this._months = +months +
						quarters * 3 +
						years * 12;

				this._data = {};

				this._locale = moment.localeData();

				this._bubble();
		}

		/************************************
				Helpers
		************************************/


		function extend(a, b) {
				for (var i in b) {
						if (hasOwnProp(b, i)) {
								a[i] = b[i];
						}
				}

				if (hasOwnProp(b, 'toString')) {
						a.toString = b.toString;
				}

				if (hasOwnProp(b, 'valueOf')) {
						a.valueOf = b.valueOf;
				}

				return a;
		}

		function copyConfig(to, from) {
				var i, prop, val;

				if (typeof from._isAMomentObject !== 'undefined') {
						to._isAMomentObject = from._isAMomentObject;
				}
				if (typeof from._i !== 'undefined') {
						to._i = from._i;
				}
				if (typeof from._f !== 'undefined') {
						to._f = from._f;
				}
				if (typeof from._l !== 'undefined') {
						to._l = from._l;
				}
				if (typeof from._strict !== 'undefined') {
						to._strict = from._strict;
				}
				if (typeof from._tzm !== 'undefined') {
						to._tzm = from._tzm;
				}
				if (typeof from._isUTC !== 'undefined') {
						to._isUTC = from._isUTC;
				}
				if (typeof from._offset !== 'undefined') {
						to._offset = from._offset;
				}
				if (typeof from._pf !== 'undefined') {
						to._pf = from._pf;
				}
				if (typeof from._locale !== 'undefined') {
						to._locale = from._locale;
				}

				if (momentProperties.length > 0) {
						for (i in momentProperties) {
								prop = momentProperties[i];
								val = from[prop];
								if (typeof val !== 'undefined') {
										to[prop] = val;
								}
						}
				}

				return to;
		}

		function absRound(number) {
				if (number < 0) {
						return Math.ceil(number);
				} else {
						return Math.floor(number);
				}
		}

		// left zero fill a number
		// see http://jsperf.com/left-zero-filling for performance comparison
		function leftZeroFill(number, targetLength, forceSign) {
				var output = '' + Math.abs(number),
						sign = number >= 0;

				while (output.length < targetLength) {
						output = '0' + output;
				}
				return (sign ? (forceSign ? '+' : '') : '-') + output;
		}

		function positiveMomentsDifference(base, other) {
				var res = {milliseconds: 0, months: 0};

				res.months = other.month() - base.month() +
						(other.year() - base.year()) * 12;
				if (base.clone().add(res.months, 'M').isAfter(other)) {
						--res.months;
				}

				res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

				return res;
		}

		function momentsDifference(base, other) {
				var res;
				other = makeAs(other, base);
				if (base.isBefore(other)) {
						res = positiveMomentsDifference(base, other);
				} else {
						res = positiveMomentsDifference(other, base);
						res.milliseconds = -res.milliseconds;
						res.months = -res.months;
				}

				return res;
		}

		// TODO: remove 'name' arg after deprecation is removed
		function createAdder(direction, name) {
				return function (val, period) {
						var dur, tmp;
						//invert the arguments, but complain about it
						if (period !== null && !isNaN(+period)) {
								deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
								tmp = val; val = period; period = tmp;
						}

						val = typeof val === 'string' ? +val : val;
						dur = moment.duration(val, period);
						addOrSubtractDurationFromMoment(this, dur, direction);
						return this;
				};
		}

		function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
				var milliseconds = duration._milliseconds,
						days = duration._days,
						months = duration._months;
				updateOffset = updateOffset == null ? true : updateOffset;

				if (milliseconds) {
						mom._d.setTime(+mom._d + milliseconds * isAdding);
				}
				if (days) {
						rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
				}
				if (months) {
						rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
				}
				if (updateOffset) {
						moment.updateOffset(mom, days || months);
				}
		}

		// check if is an array
		function isArray(input) {
				return Object.prototype.toString.call(input) === '[object Array]';
		}

		function isDate(input) {
				return Object.prototype.toString.call(input) === '[object Date]' ||
						input instanceof Date;
		}

		// compare two arrays, return the number of differences
		function compareArrays(array1, array2, dontConvert) {
				var len = Math.min(array1.length, array2.length),
						lengthDiff = Math.abs(array1.length - array2.length),
						diffs = 0,
						i;
				for (i = 0; i < len; i++) {
						if ((dontConvert && array1[i] !== array2[i]) ||
								(!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
								diffs++;
						}
				}
				return diffs + lengthDiff;
		}

		function normalizeUnits(units) {
				if (units) {
						var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
						units = unitAliases[units] || camelFunctions[lowered] || lowered;
				}
				return units;
		}

		function normalizeObjectUnits(inputObject) {
				var normalizedInput = {},
						normalizedProp,
						prop;

				for (prop in inputObject) {
						if (hasOwnProp(inputObject, prop)) {
								normalizedProp = normalizeUnits(prop);
								if (normalizedProp) {
										normalizedInput[normalizedProp] = inputObject[prop];
								}
						}
				}

				return normalizedInput;
		}

		function makeList(field) {
				var count, setter;

				if (field.indexOf('week') === 0) {
						count = 7;
						setter = 'day';
				}
				else if (field.indexOf('month') === 0) {
						count = 12;
						setter = 'month';
				}
				else {
						return;
				}

				moment[field] = function (format, index) {
						var i, getter,
								method = moment._locale[field],
								results = [];

						if (typeof format === 'number') {
								index = format;
								format = undefined;
						}

						getter = function (i) {
								var m = moment().utc().set(setter, i);
								return method.call(moment._locale, m, format || '');
						};

						if (index != null) {
								return getter(index);
						}
						else {
								for (i = 0; i < count; i++) {
										results.push(getter(i));
								}
								return results;
						}
				};
		}

		function toInt(argumentForCoercion) {
				var coercedNumber = +argumentForCoercion,
						value = 0;

				if (coercedNumber !== 0 && isFinite(coercedNumber)) {
						if (coercedNumber >= 0) {
								value = Math.floor(coercedNumber);
						} else {
								value = Math.ceil(coercedNumber);
						}
				}

				return value;
		}

		function daysInMonth(year, month) {
				return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
		}

		function weeksInYear(year, dow, doy) {
				return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
		}

		function daysInYear(year) {
				return isLeapYear(year) ? 366 : 365;
		}

		function isLeapYear(year) {
				return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
		}

		function checkOverflow(m) {
				var overflow;
				if (m._a && m._pf.overflow === -2) {
						overflow =
								m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
								m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
								m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
								m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
								m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
								m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
								-1;

						if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
								overflow = DATE;
						}

						m._pf.overflow = overflow;
				}
		}

		function isValid(m) {
				if (m._isValid == null) {
						m._isValid = !isNaN(m._d.getTime()) &&
								m._pf.overflow < 0 &&
								!m._pf.empty &&
								!m._pf.invalidMonth &&
								!m._pf.nullInput &&
								!m._pf.invalidFormat &&
								!m._pf.userInvalidated;

						if (m._strict) {
								m._isValid = m._isValid &&
										m._pf.charsLeftOver === 0 &&
										m._pf.unusedTokens.length === 0;
						}
				}
				return m._isValid;
		}

		function normalizeLocale(key) {
				return key ? key.toLowerCase().replace('_', '-') : key;
		}

		// pick the locale from the array
		// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
		// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
		function chooseLocale(names) {
				var i = 0, j, next, locale, split;

				while (i < names.length) {
						split = normalizeLocale(names[i]).split('-');
						j = split.length;
						next = normalizeLocale(names[i + 1]);
						next = next ? next.split('-') : null;
						while (j > 0) {
								locale = loadLocale(split.slice(0, j).join('-'));
								if (locale) {
										return locale;
								}
								if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
										//the next array item is better than a shallower substring of this one
										break;
								}
								j--;
						}
						i++;
				}
				return null;
		}

		function loadLocale(name) {
				var oldLocale = null;
				if (!locales[name] && hasModule) {
						try {
								oldLocale = moment.locale();
								_dereq_('./locale/' + name);
								// because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
								moment.locale(oldLocale);
						} catch (e) { }
				}
				return locales[name];
		}

		// Return a moment from input, that is local/utc/zone equivalent to model.
		function makeAs(input, model) {
				return model._isUTC ? moment(input).zone(model._offset || 0) :
						moment(input).local();
		}

		/************************************
				Locale
		************************************/


		extend(Locale.prototype, {

				set : function (config) {
						var prop, i;
						for (i in config) {
								prop = config[i];
								if (typeof prop === 'function') {
										this[i] = prop;
								} else {
										this['_' + i] = prop;
								}
						}
				},

				_months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
				months : function (m) {
						return this._months[m.month()];
				},

				_monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
				monthsShort : function (m) {
						return this._monthsShort[m.month()];
				},

				monthsParse : function (monthName) {
						var i, mom, regex;

						if (!this._monthsParse) {
								this._monthsParse = [];
						}

						for (i = 0; i < 12; i++) {
								// make the regex if we don't have it already
								if (!this._monthsParse[i]) {
										mom = moment.utc([2000, i]);
										regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
										this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
								}
								// test the regex
								if (this._monthsParse[i].test(monthName)) {
										return i;
								}
						}
				},

				_weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
				weekdays : function (m) {
						return this._weekdays[m.day()];
				},

				_weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
				weekdaysShort : function (m) {
						return this._weekdaysShort[m.day()];
				},

				_weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
				weekdaysMin : function (m) {
						return this._weekdaysMin[m.day()];
				},

				weekdaysParse : function (weekdayName) {
						var i, mom, regex;

						if (!this._weekdaysParse) {
								this._weekdaysParse = [];
						}

						for (i = 0; i < 7; i++) {
								// make the regex if we don't have it already
								if (!this._weekdaysParse[i]) {
										mom = moment([2000, 1]).day(i);
										regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
										this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
								}
								// test the regex
								if (this._weekdaysParse[i].test(weekdayName)) {
										return i;
								}
						}
				},

				_longDateFormat : {
						LT : 'h:mm A',
						L : 'MM/DD/YYYY',
						LL : 'MMMM D, YYYY',
						LLL : 'MMMM D, YYYY LT',
						LLLL : 'dddd, MMMM D, YYYY LT'
				},
				longDateFormat : function (key) {
						var output = this._longDateFormat[key];
						if (!output && this._longDateFormat[key.toUpperCase()]) {
								output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
										return val.slice(1);
								});
								this._longDateFormat[key] = output;
						}
						return output;
				},

				isPM : function (input) {
						// IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
						// Using charAt should be more compatible.
						return ((input + '').toLowerCase().charAt(0) === 'p');
				},

				_meridiemParse : /[ap]\.?m?\.?/i,
				meridiem : function (hours, minutes, isLower) {
						if (hours > 11) {
								return isLower ? 'pm' : 'PM';
						} else {
								return isLower ? 'am' : 'AM';
						}
				},

				_calendar : {
						sameDay : '[Today at] LT',
						nextDay : '[Tomorrow at] LT',
						nextWeek : 'dddd [at] LT',
						lastDay : '[Yesterday at] LT',
						lastWeek : '[Last] dddd [at] LT',
						sameElse : 'L'
				},
				calendar : function (key, mom) {
						var output = this._calendar[key];
						return typeof output === 'function' ? output.apply(mom) : output;
				},

				_relativeTime : {
						future : 'in %s',
						past : '%s ago',
						s : 'a few seconds',
						m : 'a minute',
						mm : '%d minutes',
						h : 'an hour',
						hh : '%d hours',
						d : 'a day',
						dd : '%d days',
						M : 'a month',
						MM : '%d months',
						y : 'a year',
						yy : '%d years'
				},

				relativeTime : function (number, withoutSuffix, string, isFuture) {
						var output = this._relativeTime[string];
						return (typeof output === 'function') ?
								output(number, withoutSuffix, string, isFuture) :
								output.replace(/%d/i, number);
				},

				pastFuture : function (diff, output) {
						var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
						return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
				},

				ordinal : function (number) {
						return this._ordinal.replace('%d', number);
				},
				_ordinal : '%d',

				preparse : function (string) {
						return string;
				},

				postformat : function (string) {
						return string;
				},

				week : function (mom) {
						return weekOfYear(mom, this._week.dow, this._week.doy).week;
				},

				_week : {
						dow : 0, // Sunday is the first day of the week.
						doy : 6  // The week that contains Jan 1st is the first week of the year.
				},

				_invalidDate: 'Invalid date',
				invalidDate: function () {
						return this._invalidDate;
				}
		});

		/************************************
				Formatting
		************************************/


		function removeFormattingTokens(input) {
				if (input.match(/\[[\s\S]/)) {
						return input.replace(/^\[|\]$/g, '');
				}
				return input.replace(/\\/g, '');
		}

		function makeFormatFunction(format) {
				var array = format.match(formattingTokens), i, length;

				for (i = 0, length = array.length; i < length; i++) {
						if (formatTokenFunctions[array[i]]) {
								array[i] = formatTokenFunctions[array[i]];
						} else {
								array[i] = removeFormattingTokens(array[i]);
						}
				}

				return function (mom) {
						var output = '';
						for (i = 0; i < length; i++) {
								output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
						}
						return output;
				};
		}

		// format date using native date object
		function formatMoment(m, format) {
				if (!m.isValid()) {
						return m.localeData().invalidDate();
				}

				format = expandFormat(format, m.localeData());

				if (!formatFunctions[format]) {
						formatFunctions[format] = makeFormatFunction(format);
				}

				return formatFunctions[format](m);
		}

		function expandFormat(format, locale) {
				var i = 5;

				function replaceLongDateFormatTokens(input) {
						return locale.longDateFormat(input) || input;
				}

				localFormattingTokens.lastIndex = 0;
				while (i >= 0 && localFormattingTokens.test(format)) {
						format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
						localFormattingTokens.lastIndex = 0;
						i -= 1;
				}

				return format;
		}


		/************************************
				Parsing
		************************************/


		// get the regex to find the next token
		function getParseRegexForToken(token, config) {
				var a, strict = config._strict;
				switch (token) {
				case 'Q':
						return parseTokenOneDigit;
				case 'DDDD':
						return parseTokenThreeDigits;
				case 'YYYY':
				case 'GGGG':
				case 'gggg':
						return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
				case 'Y':
				case 'G':
				case 'g':
						return parseTokenSignedNumber;
				case 'YYYYYY':
				case 'YYYYY':
				case 'GGGGG':
				case 'ggggg':
						return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
				case 'S':
						if (strict) {
								return parseTokenOneDigit;
						}
						/* falls through */
				case 'SS':
						if (strict) {
								return parseTokenTwoDigits;
						}
						/* falls through */
				case 'SSS':
						if (strict) {
								return parseTokenThreeDigits;
						}
						/* falls through */
				case 'DDD':
						return parseTokenOneToThreeDigits;
				case 'MMM':
				case 'MMMM':
				case 'dd':
				case 'ddd':
				case 'dddd':
						return parseTokenWord;
				case 'a':
				case 'A':
						return config._locale._meridiemParse;
				case 'X':
						return parseTokenTimestampMs;
				case 'Z':
				case 'ZZ':
						return parseTokenTimezone;
				case 'T':
						return parseTokenT;
				case 'SSSS':
						return parseTokenDigits;
				case 'MM':
				case 'DD':
				case 'YY':
				case 'GG':
				case 'gg':
				case 'HH':
				case 'hh':
				case 'mm':
				case 'ss':
				case 'ww':
				case 'WW':
						return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
				case 'M':
				case 'D':
				case 'd':
				case 'H':
				case 'h':
				case 'm':
				case 's':
				case 'w':
				case 'W':
				case 'e':
				case 'E':
						return parseTokenOneOrTwoDigits;
				case 'Do':
						return parseTokenOrdinal;
				default :
						a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
						return a;
				}
		}

		function timezoneMinutesFromString(string) {
				string = string || '';
				var possibleTzMatches = (string.match(parseTokenTimezone) || []),
						tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
						parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
						minutes = +(parts[1] * 60) + toInt(parts[2]);

				return parts[0] === '+' ? -minutes : minutes;
		}

		// function to convert string input to date
		function addTimeToArrayFromToken(token, input, config) {
				var a, datePartArray = config._a;

				switch (token) {
				// QUARTER
				case 'Q':
						if (input != null) {
								datePartArray[MONTH] = (toInt(input) - 1) * 3;
						}
						break;
				// MONTH
				case 'M' : // fall through to MM
				case 'MM' :
						if (input != null) {
								datePartArray[MONTH] = toInt(input) - 1;
						}
						break;
				case 'MMM' : // fall through to MMMM
				case 'MMMM' :
						a = config._locale.monthsParse(input);
						// if we didn't find a month name, mark the date as invalid.
						if (a != null) {
								datePartArray[MONTH] = a;
						} else {
								config._pf.invalidMonth = input;
						}
						break;
				// DAY OF MONTH
				case 'D' : // fall through to DD
				case 'DD' :
						if (input != null) {
								datePartArray[DATE] = toInt(input);
						}
						break;
				case 'Do' :
						if (input != null) {
								datePartArray[DATE] = toInt(parseInt(input, 10));
						}
						break;
				// DAY OF YEAR
				case 'DDD' : // fall through to DDDD
				case 'DDDD' :
						if (input != null) {
								config._dayOfYear = toInt(input);
						}

						break;
				// YEAR
				case 'YY' :
						datePartArray[YEAR] = moment.parseTwoDigitYear(input);
						break;
				case 'YYYY' :
				case 'YYYYY' :
				case 'YYYYYY' :
						datePartArray[YEAR] = toInt(input);
						break;
				// AM / PM
				case 'a' : // fall through to A
				case 'A' :
						config._isPm = config._locale.isPM(input);
						break;
				// 24 HOUR
				case 'H' : // fall through to hh
				case 'HH' : // fall through to hh
				case 'h' : // fall through to hh
				case 'hh' :
						datePartArray[HOUR] = toInt(input);
						break;
				// MINUTE
				case 'm' : // fall through to mm
				case 'mm' :
						datePartArray[MINUTE] = toInt(input);
						break;
				// SECOND
				case 's' : // fall through to ss
				case 'ss' :
						datePartArray[SECOND] = toInt(input);
						break;
				// MILLISECOND
				case 'S' :
				case 'SS' :
				case 'SSS' :
				case 'SSSS' :
						datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
						break;
				// UNIX TIMESTAMP WITH MS
				case 'X':
						config._d = new Date(parseFloat(input) * 1000);
						break;
				// TIMEZONE
				case 'Z' : // fall through to ZZ
				case 'ZZ' :
						config._useUTC = true;
						config._tzm = timezoneMinutesFromString(input);
						break;
				// WEEKDAY - human
				case 'dd':
				case 'ddd':
				case 'dddd':
						a = config._locale.weekdaysParse(input);
						// if we didn't get a weekday name, mark the date as invalid
						if (a != null) {
								config._w = config._w || {};
								config._w['d'] = a;
						} else {
								config._pf.invalidWeekday = input;
						}
						break;
				// WEEK, WEEK DAY - numeric
				case 'w':
				case 'ww':
				case 'W':
				case 'WW':
				case 'd':
				case 'e':
				case 'E':
						token = token.substr(0, 1);
						/* falls through */
				case 'gggg':
				case 'GGGG':
				case 'GGGGG':
						token = token.substr(0, 2);
						if (input) {
								config._w = config._w || {};
								config._w[token] = toInt(input);
						}
						break;
				case 'gg':
				case 'GG':
						config._w = config._w || {};
						config._w[token] = moment.parseTwoDigitYear(input);
				}
		}

		function dayOfYearFromWeekInfo(config) {
				var w, weekYear, week, weekday, dow, doy, temp;

				w = config._w;
				if (w.GG != null || w.W != null || w.E != null) {
						dow = 1;
						doy = 4;

						// TODO: We need to take the current isoWeekYear, but that depends on
						// how we interpret now (local, utc, fixed offset). So create
						// a now version of current config (take local/utc/offset flags, and
						// create now).
						weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
						week = dfl(w.W, 1);
						weekday = dfl(w.E, 1);
				} else {
						dow = config._locale._week.dow;
						doy = config._locale._week.doy;

						weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
						week = dfl(w.w, 1);

						if (w.d != null) {
								// weekday -- low day numbers are considered next week
								weekday = w.d;
								if (weekday < dow) {
										++week;
								}
						} else if (w.e != null) {
								// local weekday -- counting starts from begining of week
								weekday = w.e + dow;
						} else {
								// default to begining of week
								weekday = dow;
						}
				}
				temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

				config._a[YEAR] = temp.year;
				config._dayOfYear = temp.dayOfYear;
		}

		// convert an array to a date.
		// the array should mirror the parameters below
		// note: all values past the year are optional and will default to the lowest possible value.
		// [year, month, day , hour, minute, second, millisecond]
		function dateFromConfig(config) {
				var i, date, input = [], currentDate, yearToUse;

				if (config._d) {
						return;
				}

				currentDate = currentDateArray(config);

				//compute day of the year from weeks and weekdays
				if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
						dayOfYearFromWeekInfo(config);
				}

				//if the day of the year is set, figure out what it is
				if (config._dayOfYear) {
						yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

						if (config._dayOfYear > daysInYear(yearToUse)) {
								config._pf._overflowDayOfYear = true;
						}

						date = makeUTCDate(yearToUse, 0, config._dayOfYear);
						config._a[MONTH] = date.getUTCMonth();
						config._a[DATE] = date.getUTCDate();
				}

				// Default to current date.
				// * if no year, month, day of month are given, default to today
				// * if day of month is given, default month and year
				// * if month is given, default only year
				// * if year is given, don't default anything
				for (i = 0; i < 3 && config._a[i] == null; ++i) {
						config._a[i] = input[i] = currentDate[i];
				}

				// Zero out whatever was not defaulted, including time
				for (; i < 7; i++) {
						config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
				}

				config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
				// Apply timezone offset from input. The actual zone can be changed
				// with parseZone.
				if (config._tzm != null) {
						config._d.setUTCMinutes(config._d.getUTCMinutes() + config._tzm);
				}
		}

		function dateFromObject(config) {
				var normalizedInput;

				if (config._d) {
						return;
				}

				normalizedInput = normalizeObjectUnits(config._i);
				config._a = [
						normalizedInput.year,
						normalizedInput.month,
						normalizedInput.day,
						normalizedInput.hour,
						normalizedInput.minute,
						normalizedInput.second,
						normalizedInput.millisecond
				];

				dateFromConfig(config);
		}

		function currentDateArray(config) {
				var now = new Date();
				if (config._useUTC) {
						return [
								now.getUTCFullYear(),
								now.getUTCMonth(),
								now.getUTCDate()
						];
				} else {
						return [now.getFullYear(), now.getMonth(), now.getDate()];
				}
		}

		// date from string and format string
		function makeDateFromStringAndFormat(config) {
				if (config._f === moment.ISO_8601) {
						parseISO(config);
						return;
				}

				config._a = [];
				config._pf.empty = true;

				// This array is used to make a Date, either with `new Date` or `Date.UTC`
				var string = '' + config._i,
						i, parsedInput, tokens, token, skipped,
						stringLength = string.length,
						totalParsedInputLength = 0;

				tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

				for (i = 0; i < tokens.length; i++) {
						token = tokens[i];
						parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
						if (parsedInput) {
								skipped = string.substr(0, string.indexOf(parsedInput));
								if (skipped.length > 0) {
										config._pf.unusedInput.push(skipped);
								}
								string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
								totalParsedInputLength += parsedInput.length;
						}
						// don't parse if it's not a known token
						if (formatTokenFunctions[token]) {
								if (parsedInput) {
										config._pf.empty = false;
								}
								else {
										config._pf.unusedTokens.push(token);
								}
								addTimeToArrayFromToken(token, parsedInput, config);
						}
						else if (config._strict && !parsedInput) {
								config._pf.unusedTokens.push(token);
						}
				}

				// add remaining unparsed input length to the string
				config._pf.charsLeftOver = stringLength - totalParsedInputLength;
				if (string.length > 0) {
						config._pf.unusedInput.push(string);
				}

				// handle am pm
				if (config._isPm && config._a[HOUR] < 12) {
						config._a[HOUR] += 12;
				}
				// if is 12 am, change hours to 0
				if (config._isPm === false && config._a[HOUR] === 12) {
						config._a[HOUR] = 0;
				}

				dateFromConfig(config);
				checkOverflow(config);
		}

		function unescapeFormat(s) {
				return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
						return p1 || p2 || p3 || p4;
				});
		}

		// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
		function regexpEscape(s) {
				return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		}

		// date from string and array of format strings
		function makeDateFromStringAndArray(config) {
				var tempConfig,
						bestMoment,

						scoreToBeat,
						i,
						currentScore;

				if (config._f.length === 0) {
						config._pf.invalidFormat = true;
						config._d = new Date(NaN);
						return;
				}

				for (i = 0; i < config._f.length; i++) {
						currentScore = 0;
						tempConfig = copyConfig({}, config);
						tempConfig._pf = defaultParsingFlags();
						tempConfig._f = config._f[i];
						makeDateFromStringAndFormat(tempConfig);

						if (!isValid(tempConfig)) {
								continue;
						}

						// if there is any input that was not parsed add a penalty for that format
						currentScore += tempConfig._pf.charsLeftOver;

						//or tokens
						currentScore += tempConfig._pf.unusedTokens.length * 10;

						tempConfig._pf.score = currentScore;

						if (scoreToBeat == null || currentScore < scoreToBeat) {
								scoreToBeat = currentScore;
								bestMoment = tempConfig;
						}
				}

				extend(config, bestMoment || tempConfig);
		}

		// date from iso format
		function parseISO(config) {
				var i, l,
						string = config._i,
						match = isoRegex.exec(string);

				if (match) {
						config._pf.iso = true;
						for (i = 0, l = isoDates.length; i < l; i++) {
								if (isoDates[i][1].exec(string)) {
										// match[5] should be 'T' or undefined
										config._f = isoDates[i][0] + (match[6] || ' ');
										break;
								}
						}
						for (i = 0, l = isoTimes.length; i < l; i++) {
								if (isoTimes[i][1].exec(string)) {
										config._f += isoTimes[i][0];
										break;
								}
						}
						if (string.match(parseTokenTimezone)) {
								config._f += 'Z';
						}
						makeDateFromStringAndFormat(config);
				} else {
						config._isValid = false;
				}
		}

		// date from iso format or fallback
		function makeDateFromString(config) {
				parseISO(config);
				if (config._isValid === false) {
						delete config._isValid;
						moment.createFromInputFallback(config);
				}
		}

		function makeDateFromInput(config) {
				var input = config._i, matched;
				if (input === undefined) {
						config._d = new Date();
				} else if (isDate(input)) {
						config._d = new Date(+input);
				} else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
						config._d = new Date(+matched[1]);
				} else if (typeof input === 'string') {
						makeDateFromString(config);
				} else if (isArray(input)) {
						config._a = input.slice(0);
						dateFromConfig(config);
				} else if (typeof(input) === 'object') {
						dateFromObject(config);
				} else if (typeof(input) === 'number') {
						// from milliseconds
						config._d = new Date(input);
				} else {
						moment.createFromInputFallback(config);
				}
		}

		function makeDate(y, m, d, h, M, s, ms) {
				//can't just apply() to create a date:
				//http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
				var date = new Date(y, m, d, h, M, s, ms);

				//the date constructor doesn't accept years < 1970
				if (y < 1970) {
						date.setFullYear(y);
				}
				return date;
		}

		function makeUTCDate(y) {
				var date = new Date(Date.UTC.apply(null, arguments));
				if (y < 1970) {
						date.setUTCFullYear(y);
				}
				return date;
		}

		function parseWeekday(input, locale) {
				if (typeof input === 'string') {
						if (!isNaN(input)) {
								input = parseInt(input, 10);
						}
						else {
								input = locale.weekdaysParse(input);
								if (typeof input !== 'number') {
										return null;
								}
						}
				}
				return input;
		}

		/************************************
				Relative Time
		************************************/


		// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
		function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
				return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
		}

		function relativeTime(posNegDuration, withoutSuffix, locale) {
				var duration = moment.duration(posNegDuration).abs(),
						seconds = round(duration.as('s')),
						minutes = round(duration.as('m')),
						hours = round(duration.as('h')),
						days = round(duration.as('d')),
						months = round(duration.as('M')),
						years = round(duration.as('y')),

						args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
								minutes === 1 && ['m'] ||
								minutes < relativeTimeThresholds.m && ['mm', minutes] ||
								hours === 1 && ['h'] ||
								hours < relativeTimeThresholds.h && ['hh', hours] ||
								days === 1 && ['d'] ||
								days < relativeTimeThresholds.d && ['dd', days] ||
								months === 1 && ['M'] ||
								months < relativeTimeThresholds.M && ['MM', months] ||
								years === 1 && ['y'] || ['yy', years];

				args[2] = withoutSuffix;
				args[3] = +posNegDuration > 0;
				args[4] = locale;
				return substituteTimeAgo.apply({}, args);
		}


		/************************************
				Week of Year
		************************************/


		// firstDayOfWeek       0 = sun, 6 = sat
		//                      the day of the week that starts the week
		//                      (usually sunday or monday)
		// firstDayOfWeekOfYear 0 = sun, 6 = sat
		//                      the first week is the week that contains the first
		//                      of this day of the week
		//                      (eg. ISO weeks use thursday (4))
		function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
				var end = firstDayOfWeekOfYear - firstDayOfWeek,
						daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
						adjustedMoment;


				if (daysToDayOfWeek > end) {
						daysToDayOfWeek -= 7;
				}

				if (daysToDayOfWeek < end - 7) {
						daysToDayOfWeek += 7;
				}

				adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
				return {
						week: Math.ceil(adjustedMoment.dayOfYear() / 7),
						year: adjustedMoment.year()
				};
		}

		//http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
		function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
				var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

				d = d === 0 ? 7 : d;
				weekday = weekday != null ? weekday : firstDayOfWeek;
				daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
				dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

				return {
						year: dayOfYear > 0 ? year : year - 1,
						dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
				};
		}

		/************************************
				Top Level Functions
		************************************/

		function makeMoment(config) {
				var input = config._i,
						format = config._f;

				config._locale = config._locale || moment.localeData(config._l);

				if (input === null || (format === undefined && input === '')) {
						return moment.invalid({nullInput: true});
				}

				if (typeof input === 'string') {
						config._i = input = config._locale.preparse(input);
				}

				if (moment.isMoment(input)) {
						return new Moment(input, true);
				} else if (format) {
						if (isArray(format)) {
								makeDateFromStringAndArray(config);
						} else {
								makeDateFromStringAndFormat(config);
						}
				} else {
						makeDateFromInput(config);
				}

				return new Moment(config);
		}

		moment = function (input, format, locale, strict) {
				var c;

				if (typeof(locale) === 'boolean') {
						strict = locale;
						locale = undefined;
				}
				// object construction must be done this way.
				// https://github.com/moment/moment/issues/1423
				c = {};
				c._isAMomentObject = true;
				c._i = input;
				c._f = format;
				c._l = locale;
				c._strict = strict;
				c._isUTC = false;
				c._pf = defaultParsingFlags();

				return makeMoment(c);
		};

		moment.suppressDeprecationWarnings = false;

		moment.createFromInputFallback = deprecate(
				'moment construction falls back to js Date. This is ' +
				'discouraged and will be removed in upcoming major ' +
				'release. Please refer to ' +
				'https://github.com/moment/moment/issues/1407 for more info.',
				function (config) {
						config._d = new Date(config._i);
				}
		);

		// Pick a moment m from moments so that m[fn](other) is true for all
		// other. This relies on the function fn to be transitive.
		//
		// moments should either be an array of moment objects or an array, whose
		// first element is an array of moment objects.
		function pickBy(fn, moments) {
				var res, i;
				if (moments.length === 1 && isArray(moments[0])) {
						moments = moments[0];
				}
				if (!moments.length) {
						return moment();
				}
				res = moments[0];
				for (i = 1; i < moments.length; ++i) {
						if (moments[i][fn](res)) {
								res = moments[i];
						}
				}
				return res;
		}

		moment.min = function () {
				var args = [].slice.call(arguments, 0);

				return pickBy('isBefore', args);
		};

		moment.max = function () {
				var args = [].slice.call(arguments, 0);

				return pickBy('isAfter', args);
		};

		// creating with utc
		moment.utc = function (input, format, locale, strict) {
				var c;

				if (typeof(locale) === 'boolean') {
						strict = locale;
						locale = undefined;
				}
				// object construction must be done this way.
				// https://github.com/moment/moment/issues/1423
				c = {};
				c._isAMomentObject = true;
				c._useUTC = true;
				c._isUTC = true;
				c._l = locale;
				c._i = input;
				c._f = format;
				c._strict = strict;
				c._pf = defaultParsingFlags();

				return makeMoment(c).utc();
		};

		// creating with unix timestamp (in seconds)
		moment.unix = function (input) {
				return moment(input * 1000);
		};

		// duration
		moment.duration = function (input, key) {
				var duration = input,
						// matching against regexp is expensive, do it on demand
						match = null,
						sign,
						ret,
						parseIso,
						diffRes;

				if (moment.isDuration(input)) {
						duration = {
								ms: input._milliseconds,
								d: input._days,
								M: input._months
						};
				} else if (typeof input === 'number') {
						duration = {};
						if (key) {
								duration[key] = input;
						} else {
								duration.milliseconds = input;
						}
				} else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
						sign = (match[1] === '-') ? -1 : 1;
						duration = {
								y: 0,
								d: toInt(match[DATE]) * sign,
								h: toInt(match[HOUR]) * sign,
								m: toInt(match[MINUTE]) * sign,
								s: toInt(match[SECOND]) * sign,
								ms: toInt(match[MILLISECOND]) * sign
						};
				} else if (!!(match = isoDurationRegex.exec(input))) {
						sign = (match[1] === '-') ? -1 : 1;
						parseIso = function (inp) {
								// We'd normally use ~~inp for this, but unfortunately it also
								// converts floats to ints.
								// inp may be undefined, so careful calling replace on it.
								var res = inp && parseFloat(inp.replace(',', '.'));
								// apply sign while we're at it
								return (isNaN(res) ? 0 : res) * sign;
						};
						duration = {
								y: parseIso(match[2]),
								M: parseIso(match[3]),
								d: parseIso(match[4]),
								h: parseIso(match[5]),
								m: parseIso(match[6]),
								s: parseIso(match[7]),
								w: parseIso(match[8])
						};
				} else if (typeof duration === 'object' &&
								('from' in duration || 'to' in duration)) {
						diffRes = momentsDifference(moment(duration.from), moment(duration.to));

						duration = {};
						duration.ms = diffRes.milliseconds;
						duration.M = diffRes.months;
				}

				ret = new Duration(duration);

				if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
						ret._locale = input._locale;
				}

				return ret;
		};

		// version number
		moment.version = VERSION;

		// default format
		moment.defaultFormat = isoFormat;

		// constant that refers to the ISO standard
		moment.ISO_8601 = function () {};

		// Plugins that add properties should also add the key here (null value),
		// so we can properly clone ourselves.
		moment.momentProperties = momentProperties;

		// This function will be called whenever a moment is mutated.
		// It is intended to keep the offset in sync with the timezone.
		moment.updateOffset = function () {};

		// This function allows you to set a threshold for relative time strings
		moment.relativeTimeThreshold = function (threshold, limit) {
				if (relativeTimeThresholds[threshold] === undefined) {
						return false;
				}
				if (limit === undefined) {
						return relativeTimeThresholds[threshold];
				}
				relativeTimeThresholds[threshold] = limit;
				return true;
		};

		moment.lang = deprecate(
				'moment.lang is deprecated. Use moment.locale instead.',
				function (key, value) {
						return moment.locale(key, value);
				}
		);

		// This function will load locale and then set the global locale.  If
		// no arguments are passed in, it will simply return the current global
		// locale key.
		moment.locale = function (key, values) {
				var data;
				if (key) {
						if (typeof(values) !== 'undefined') {
								data = moment.defineLocale(key, values);
						}
						else {
								data = moment.localeData(key);
						}

						if (data) {
								moment.duration._locale = moment._locale = data;
						}
				}

				return moment._locale._abbr;
		};

		moment.defineLocale = function (name, values) {
				if (values !== null) {
						values.abbr = name;
						if (!locales[name]) {
								locales[name] = new Locale();
						}
						locales[name].set(values);

						// backwards compat for now: also set the locale
						moment.locale(name);

						return locales[name];
				} else {
						// useful for testing
						delete locales[name];
						return null;
				}
		};

		moment.langData = deprecate(
				'moment.langData is deprecated. Use moment.localeData instead.',
				function (key) {
						return moment.localeData(key);
				}
		);

		// returns locale data
		moment.localeData = function (key) {
				var locale;

				if (key && key._locale && key._locale._abbr) {
						key = key._locale._abbr;
				}

				if (!key) {
						return moment._locale;
				}

				if (!isArray(key)) {
						//short-circuit everything else
						locale = loadLocale(key);
						if (locale) {
								return locale;
						}
						key = [key];
				}

				return chooseLocale(key);
		};

		// compare moment object
		moment.isMoment = function (obj) {
				return obj instanceof Moment ||
						(obj != null && hasOwnProp(obj, '_isAMomentObject'));
		};

		// for typechecking Duration objects
		moment.isDuration = function (obj) {
				return obj instanceof Duration;
		};

		for (i = lists.length - 1; i >= 0; --i) {
				makeList(lists[i]);
		}

		moment.normalizeUnits = function (units) {
				return normalizeUnits(units);
		};

		moment.invalid = function (flags) {
				var m = moment.utc(NaN);
				if (flags != null) {
						extend(m._pf, flags);
				}
				else {
						m._pf.userInvalidated = true;
				}

				return m;
		};

		moment.parseZone = function () {
				return moment.apply(null, arguments).parseZone();
		};

		moment.parseTwoDigitYear = function (input) {
				return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
		};

		/************************************
				Moment Prototype
		************************************/


		extend(moment.fn = Moment.prototype, {

				clone : function () {
						return moment(this);
				},

				valueOf : function () {
						return +this._d + ((this._offset || 0) * 60000);
				},

				unix : function () {
						return Math.floor(+this / 1000);
				},

				toString : function () {
						return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
				},

				toDate : function () {
						return this._offset ? new Date(+this) : this._d;
				},

				toISOString : function () {
						var m = moment(this).utc();
						if (0 < m.year() && m.year() <= 9999) {
								return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
						} else {
								return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
						}
				},

				toArray : function () {
						var m = this;
						return [
								m.year(),
								m.month(),
								m.date(),
								m.hours(),
								m.minutes(),
								m.seconds(),
								m.milliseconds()
						];
				},

				isValid : function () {
						return isValid(this);
				},

				isDSTShifted : function () {
						if (this._a) {
								return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
						}

						return false;
				},

				parsingFlags : function () {
						return extend({}, this._pf);
				},

				invalidAt: function () {
						return this._pf.overflow;
				},

				utc : function (keepLocalTime) {
						return this.zone(0, keepLocalTime);
				},

				local : function (keepLocalTime) {
						if (this._isUTC) {
								this.zone(0, keepLocalTime);
								this._isUTC = false;

								if (keepLocalTime) {
										this.add(this._d.getTimezoneOffset(), 'm');
								}
						}
						return this;
				},

				format : function (inputString) {
						var output = formatMoment(this, inputString || moment.defaultFormat);
						return this.localeData().postformat(output);
				},

				add : createAdder(1, 'add'),

				subtract : createAdder(-1, 'subtract'),

				diff : function (input, units, asFloat) {
						var that = makeAs(input, this),
								zoneDiff = (this.zone() - that.zone()) * 6e4,
								diff, output;

						units = normalizeUnits(units);

						if (units === 'year' || units === 'month') {
								// average number of days in the months in the given dates
								diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
								// difference in months
								output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
								// adjust by taking difference in days, average number of days
								// and dst in the given months.
								output += ((this - moment(this).startOf('month')) -
												(that - moment(that).startOf('month'))) / diff;
								// same as above but with zones, to negate all dst
								output -= ((this.zone() - moment(this).startOf('month').zone()) -
												(that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
								if (units === 'year') {
										output = output / 12;
								}
						} else {
								diff = (this - that);
								output = units === 'second' ? diff / 1e3 : // 1000
										units === 'minute' ? diff / 6e4 : // 1000 * 60
										units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
										units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
										units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
										diff;
						}
						return asFloat ? output : absRound(output);
				},

				from : function (time, withoutSuffix) {
						return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
				},

				fromNow : function (withoutSuffix) {
						return this.from(moment(), withoutSuffix);
				},

				calendar : function (time) {
						// We want to compare the start of today, vs this.
						// Getting start-of-today depends on whether we're zone'd or not.
						var now = time || moment(),
								sod = makeAs(now, this).startOf('day'),
								diff = this.diff(sod, 'days', true),
								format = diff < -6 ? 'sameElse' :
										diff < -1 ? 'lastWeek' :
										diff < 0 ? 'lastDay' :
										diff < 1 ? 'sameDay' :
										diff < 2 ? 'nextDay' :
										diff < 7 ? 'nextWeek' : 'sameElse';
						return this.format(this.localeData().calendar(format, this));
				},

				isLeapYear : function () {
						return isLeapYear(this.year());
				},

				isDST : function () {
						return (this.zone() < this.clone().month(0).zone() ||
								this.zone() < this.clone().month(5).zone());
				},

				day : function (input) {
						var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
						if (input != null) {
								input = parseWeekday(input, this.localeData());
								return this.add(input - day, 'd');
						} else {
								return day;
						}
				},

				month : makeAccessor('Month', true),

				startOf : function (units) {
						units = normalizeUnits(units);
						// the following switch intentionally omits break keywords
						// to utilize falling through the cases.
						switch (units) {
						case 'year':
								this.month(0);
								/* falls through */
						case 'quarter':
						case 'month':
								this.date(1);
								/* falls through */
						case 'week':
						case 'isoWeek':
						case 'day':
								this.hours(0);
								/* falls through */
						case 'hour':
								this.minutes(0);
								/* falls through */
						case 'minute':
								this.seconds(0);
								/* falls through */
						case 'second':
								this.milliseconds(0);
								/* falls through */
						}

						// weeks are a special case
						if (units === 'week') {
								this.weekday(0);
						} else if (units === 'isoWeek') {
								this.isoWeekday(1);
						}

						// quarters are also special
						if (units === 'quarter') {
								this.month(Math.floor(this.month() / 3) * 3);
						}

						return this;
				},

				endOf: function (units) {
						units = normalizeUnits(units);
						return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
				},

				isAfter: function (input, units) {
						units = typeof units !== 'undefined' ? units : 'millisecond';
						return +this.clone().startOf(units) > +moment(input).startOf(units);
				},

				isBefore: function (input, units) {
						units = typeof units !== 'undefined' ? units : 'millisecond';
						return +this.clone().startOf(units) < +moment(input).startOf(units);
				},

				isSame: function (input, units) {
						units = units || 'ms';
						return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
				},

				min: deprecate(
								 'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
								 function (other) {
										 other = moment.apply(null, arguments);
										 return other < this ? this : other;
								 }
				 ),

				max: deprecate(
								'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
								function (other) {
										other = moment.apply(null, arguments);
										return other > this ? this : other;
								}
				),

				// keepLocalTime = true means only change the timezone, without
				// affecting the local hour. So 5:31:26 +0300 --[zone(2, true)]-->
				// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist int zone
				// +0200, so we adjust the time as needed, to be valid.
				//
				// Keeping the time actually adds/subtracts (one hour)
				// from the actual represented time. That is why we call updateOffset
				// a second time. In case it wants us to change the offset again
				// _changeInProgress == true case, then we have to adjust, because
				// there is no such time in the given timezone.
				zone : function (input, keepLocalTime) {
						var offset = this._offset || 0,
								localAdjust;
						if (input != null) {
								if (typeof input === 'string') {
										input = timezoneMinutesFromString(input);
								}
								if (Math.abs(input) < 16) {
										input = input * 60;
								}
								if (!this._isUTC && keepLocalTime) {
										localAdjust = this._d.getTimezoneOffset();
								}
								this._offset = input;
								this._isUTC = true;
								if (localAdjust != null) {
										this.subtract(localAdjust, 'm');
								}
								if (offset !== input) {
										if (!keepLocalTime || this._changeInProgress) {
												addOrSubtractDurationFromMoment(this,
																moment.duration(offset - input, 'm'), 1, false);
										} else if (!this._changeInProgress) {
												this._changeInProgress = true;
												moment.updateOffset(this, true);
												this._changeInProgress = null;
										}
								}
						} else {
								return this._isUTC ? offset : this._d.getTimezoneOffset();
						}
						return this;
				},

				zoneAbbr : function () {
						return this._isUTC ? 'UTC' : '';
				},

				zoneName : function () {
						return this._isUTC ? 'Coordinated Universal Time' : '';
				},

				parseZone : function () {
						if (this._tzm) {
								this.zone(this._tzm);
						} else if (typeof this._i === 'string') {
								this.zone(this._i);
						}
						return this;
				},

				hasAlignedHourOffset : function (input) {
						if (!input) {
								input = 0;
						}
						else {
								input = moment(input).zone();
						}

						return (this.zone() - input) % 60 === 0;
				},

				daysInMonth : function () {
						return daysInMonth(this.year(), this.month());
				},

				dayOfYear : function (input) {
						var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
						return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
				},

				quarter : function (input) {
						return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
				},

				weekYear : function (input) {
						var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
						return input == null ? year : this.add((input - year), 'y');
				},

				isoWeekYear : function (input) {
						var year = weekOfYear(this, 1, 4).year;
						return input == null ? year : this.add((input - year), 'y');
				},

				week : function (input) {
						var week = this.localeData().week(this);
						return input == null ? week : this.add((input - week) * 7, 'd');
				},

				isoWeek : function (input) {
						var week = weekOfYear(this, 1, 4).week;
						return input == null ? week : this.add((input - week) * 7, 'd');
				},

				weekday : function (input) {
						var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
						return input == null ? weekday : this.add(input - weekday, 'd');
				},

				isoWeekday : function (input) {
						// behaves the same as moment#day except
						// as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
						// as a setter, sunday should belong to the previous week.
						return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
				},

				isoWeeksInYear : function () {
						return weeksInYear(this.year(), 1, 4);
				},

				weeksInYear : function () {
						var weekInfo = this.localeData()._week;
						return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
				},

				get : function (units) {
						units = normalizeUnits(units);
						return this[units]();
				},

				set : function (units, value) {
						units = normalizeUnits(units);
						if (typeof this[units] === 'function') {
								this[units](value);
						}
						return this;
				},

				// If passed a locale key, it will set the locale for this
				// instance.  Otherwise, it will return the locale configuration
				// variables for this instance.
				locale : function (key) {
						if (key === undefined) {
								return this._locale._abbr;
						} else {
								this._locale = moment.localeData(key);
								return this;
						}
				},

				lang : deprecate(
						'moment().lang() is deprecated. Use moment().localeData() instead.',
						function (key) {
								if (key === undefined) {
										return this.localeData();
								} else {
										this._locale = moment.localeData(key);
										return this;
								}
						}
				),

				localeData : function () {
						return this._locale;
				}
		});

		function rawMonthSetter(mom, value) {
				var dayOfMonth;

				// TODO: Move this out of here!
				if (typeof value === 'string') {
						value = mom.localeData().monthsParse(value);
						// TODO: Another silent failure?
						if (typeof value !== 'number') {
								return mom;
						}
				}

				dayOfMonth = Math.min(mom.date(),
								daysInMonth(mom.year(), value));
				mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
				return mom;
		}

		function rawGetter(mom, unit) {
				return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
		}

		function rawSetter(mom, unit, value) {
				if (unit === 'Month') {
						return rawMonthSetter(mom, value);
				} else {
						return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
				}
		}

		function makeAccessor(unit, keepTime) {
				return function (value) {
						if (value != null) {
								rawSetter(this, unit, value);
								moment.updateOffset(this, keepTime);
								return this;
						} else {
								return rawGetter(this, unit);
						}
				};
		}

		moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
		moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
		moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
		// Setting the hour should keep the time, because the user explicitly
		// specified which hour he wants. So trying to maintain the same hour (in
		// a new timezone) makes sense. Adding/subtracting hours does not follow
		// this rule.
		moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
		// moment.fn.month is defined separately
		moment.fn.date = makeAccessor('Date', true);
		moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
		moment.fn.year = makeAccessor('FullYear', true);
		moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

		// add plural methods
		moment.fn.days = moment.fn.day;
		moment.fn.months = moment.fn.month;
		moment.fn.weeks = moment.fn.week;
		moment.fn.isoWeeks = moment.fn.isoWeek;
		moment.fn.quarters = moment.fn.quarter;

		// add aliased format methods
		moment.fn.toJSON = moment.fn.toISOString;

		/************************************
				Duration Prototype
		************************************/


		function daysToYears (days) {
				// 400 years have 146097 days (taking into account leap year rules)
				return days * 400 / 146097;
		}

		function yearsToDays (years) {
				// years * 365 + absRound(years / 4) -
				//     absRound(years / 100) + absRound(years / 400);
				return years * 146097 / 400;
		}

		extend(moment.duration.fn = Duration.prototype, {

				_bubble : function () {
						var milliseconds = this._milliseconds,
								days = this._days,
								months = this._months,
								data = this._data,
								seconds, minutes, hours, years = 0;

						// The following code bubbles up values, see the tests for
						// examples of what that means.
						data.milliseconds = milliseconds % 1000;

						seconds = absRound(milliseconds / 1000);
						data.seconds = seconds % 60;

						minutes = absRound(seconds / 60);
						data.minutes = minutes % 60;

						hours = absRound(minutes / 60);
						data.hours = hours % 24;

						days += absRound(hours / 24);

						// Accurately convert days to years, assume start from year 0.
						years = absRound(daysToYears(days));
						days -= absRound(yearsToDays(years));

						// 30 days to a month
						// TODO (iskren): Use anchor date (like 1st Jan) to compute this.
						months += absRound(days / 30);
						days %= 30;

						// 12 months -> 1 year
						years += absRound(months / 12);
						months %= 12;

						data.days = days;
						data.months = months;
						data.years = years;
				},

				abs : function () {
						this._milliseconds = Math.abs(this._milliseconds);
						this._days = Math.abs(this._days);
						this._months = Math.abs(this._months);

						this._data.milliseconds = Math.abs(this._data.milliseconds);
						this._data.seconds = Math.abs(this._data.seconds);
						this._data.minutes = Math.abs(this._data.minutes);
						this._data.hours = Math.abs(this._data.hours);
						this._data.months = Math.abs(this._data.months);
						this._data.years = Math.abs(this._data.years);

						return this;
				},

				weeks : function () {
						return absRound(this.days() / 7);
				},

				valueOf : function () {
						return this._milliseconds +
							this._days * 864e5 +
							(this._months % 12) * 2592e6 +
							toInt(this._months / 12) * 31536e6;
				},

				humanize : function (withSuffix) {
						var output = relativeTime(this, !withSuffix, this.localeData());

						if (withSuffix) {
								output = this.localeData().pastFuture(+this, output);
						}

						return this.localeData().postformat(output);
				},

				add : function (input, val) {
						// supports only 2.0-style add(1, 's') or add(moment)
						var dur = moment.duration(input, val);

						this._milliseconds += dur._milliseconds;
						this._days += dur._days;
						this._months += dur._months;

						this._bubble();

						return this;
				},

				subtract : function (input, val) {
						var dur = moment.duration(input, val);

						this._milliseconds -= dur._milliseconds;
						this._days -= dur._days;
						this._months -= dur._months;

						this._bubble();

						return this;
				},

				get : function (units) {
						units = normalizeUnits(units);
						return this[units.toLowerCase() + 's']();
				},

				as : function (units) {
						var days, months;
						units = normalizeUnits(units);

						days = this._days + this._milliseconds / 864e5;
						if (units === 'month' || units === 'year') {
								months = this._months + daysToYears(days) * 12;
								return units === 'month' ? months : months / 12;
						} else {
								days += yearsToDays(this._months / 12);
								switch (units) {
										case 'week': return days / 7;
										case 'day': return days;
										case 'hour': return days * 24;
										case 'minute': return days * 24 * 60;
										case 'second': return days * 24 * 60 * 60;
										case 'millisecond': return days * 24 * 60 * 60 * 1000;
										default: throw new Error('Unknown unit ' + units);
								}
						}
				},

				lang : moment.fn.lang,
				locale : moment.fn.locale,

				toIsoString : deprecate(
						'toIsoString() is deprecated. Please use toISOString() instead ' +
						'(notice the capitals)',
						function () {
								return this.toISOString();
						}
				),

				toISOString : function () {
						// inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
						var years = Math.abs(this.years()),
								months = Math.abs(this.months()),
								days = Math.abs(this.days()),
								hours = Math.abs(this.hours()),
								minutes = Math.abs(this.minutes()),
								seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

						if (!this.asSeconds()) {
								// this is the same as C#'s (Noda) and python (isodate)...
								// but not other JS (goog.date)
								return 'P0D';
						}

						return (this.asSeconds() < 0 ? '-' : '') +
								'P' +
								(years ? years + 'Y' : '') +
								(months ? months + 'M' : '') +
								(days ? days + 'D' : '') +
								((hours || minutes || seconds) ? 'T' : '') +
								(hours ? hours + 'H' : '') +
								(minutes ? minutes + 'M' : '') +
								(seconds ? seconds + 'S' : '');
				},

				localeData : function () {
						return this._locale;
				}
		});

		moment.duration.fn.toString = moment.duration.fn.toISOString;

		function makeDurationGetter(name) {
				moment.duration.fn[name] = function () {
						return this._data[name];
				};
		}

		for (i in unitMillisecondFactors) {
				if (hasOwnProp(unitMillisecondFactors, i)) {
						makeDurationGetter(i.toLowerCase());
				}
		}

		moment.duration.fn.asMilliseconds = function () {
				return this.as('ms');
		};
		moment.duration.fn.asSeconds = function () {
				return this.as('s');
		};
		moment.duration.fn.asMinutes = function () {
				return this.as('m');
		};
		moment.duration.fn.asHours = function () {
				return this.as('h');
		};
		moment.duration.fn.asDays = function () {
				return this.as('d');
		};
		moment.duration.fn.asWeeks = function () {
				return this.as('weeks');
		};
		moment.duration.fn.asMonths = function () {
				return this.as('M');
		};
		moment.duration.fn.asYears = function () {
				return this.as('y');
		};

		/************************************
				Default Locale
		************************************/


		// Set default locale, other locale will inherit from English.
		moment.locale('en', {
				ordinal : function (number) {
						var b = number % 10,
								output = (toInt(number % 100 / 10) === 1) ? 'th' :
								(b === 1) ? 'st' :
								(b === 2) ? 'nd' :
								(b === 3) ? 'rd' : 'th';
						return number + output;
				}
		});

		/* EMBED_LOCALES */

		/************************************
				Exposing Moment
		************************************/

		function makeGlobal(shouldDeprecate) {
				/*global ender:false */
				if (typeof ender !== 'undefined') {
						return;
				}
				oldGlobalMoment = globalScope.moment;
				if (shouldDeprecate) {
						globalScope.moment = deprecate(
										'Accessing Moment through the global scope is ' +
										'deprecated, and will be removed in an upcoming ' +
										'release.',
										moment);
				} else {
						globalScope.moment = moment;
				}
		}

		// CommonJS module is defined
		if (hasModule) {
				module.exports = moment;
		} else if (typeof define === 'function' && define.amd) {
				define('moment', function (_dereq_, exports, module) {
						if (module.config && module.config() && module.config().noGlobal === true) {
								// release the global variable
								globalScope.moment = oldGlobalMoment;
						}

						return moment;
				});
				makeGlobal(true);
		} else {
				makeGlobal();
		}
}).call(this);

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(_dereq_,module,exports){
var now = _dereq_('performance-now')
	, global = typeof window === 'undefined' ? {} : window
	, vendors = ['moz', 'webkit']
	, suffix = 'AnimationFrame'
	, raf = global['request' + suffix]
	, caf = global['cancel' + suffix] || global['cancelRequest' + suffix]

for(var i = 0; i < vendors.length && !raf; i++) {
	raf = global[vendors[i] + 'Request' + suffix]
	caf = global[vendors[i] + 'Cancel' + suffix]
			|| global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
	var last = 0
		, id = 0
		, queue = []
		, frameDuration = 1000 / 60

	raf = function(callback) {
		if(queue.length === 0) {
			var _now = now()
				, next = Math.max(0, frameDuration - (_now - last))
			last = next + _now
			setTimeout(function() {
				var cp = queue.slice(0)
				// Clear queue here to prevent
				// callbacks from appending listeners
				// to the current frame's queue
				queue.length = 0
				for (var i = 0; i < cp.length; i++) {
					if (!cp[i].cancelled) {
						cp[i].callback(last)
					}
				}
			}, next)
		}
		queue.push({
			handle: ++id,
			callback: callback,
			cancelled: false
		})
		return id
	}

	caf = function(handle) {
		for(var i = 0; i < queue.length; i++) {
			if(queue[i].handle === handle) {
				queue[i].cancelled = true
			}
		}
	}
}

module.exports = function() {
	// Wrap in a new function to prevent
	// `cancel` potentially being assigned
	// to the native rAF function
	return raf.apply(global, arguments)
}
module.exports.cancel = function() {
	caf.apply(global, arguments)
}

},{"performance-now":13}],13:[function(_dereq_,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
	var getNanoSeconds, hrtime, loadTime;

	if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
		module.exports = function() {
			return performance.now();
		};
	} else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
		module.exports = function() {
			return (getNanoSeconds() - loadTime) / 1e6;
		};
		hrtime = process.hrtime;
		getNanoSeconds = function() {
			var hr;
			hr = hrtime();
			return hr[0] * 1e9 + hr[1];
		};
		loadTime = getNanoSeconds();
	} else if (Date.now) {
		module.exports = function() {
			return Date.now() - loadTime;
		};
		loadTime = Date.now();
	} else {
		module.exports = function() {
			return new Date().getTime() - loadTime;
		};
		loadTime = new Date().getTime();
	}

}).call(this);

/*
//@ sourceMappingURL=performance-now.map
*/

}).call(this,_dereq_("FWaASH"))
},{"FWaASH":1}],14:[function(_dereq_,module,exports){
'use strict';

var isInput = _dereq_('./isInput');
var bindings = {};

function has (source, target) {
	var binding = bindings[source.id];
	return binding && binding[target.id];
}

function insert (source, target) {
	var binding = bindings[source.id];
	if (!binding) {
		binding = bindings[source.id] = {};
	}
	var invalidate = invalidator(target);
	binding[target.id] = invalidate;
	source.on('data', invalidate);
	source.on('destroyed', remove.bind(null, source, target));
}

function remove (source, target) {
	var binding = bindings[source.id];
	if (!binding) {
		return;
	}
	var invalidate = binding[target.id];
	source.off('data', invalidate);
	delete binding[target.id];
}

function invalidator (target) {
	return function invalidate () {
		target.refresh();
	};
}

function add (source, target) {
	if (isInput(target.associated) || has(source, target)) {
		return;
	}
	insert(source, target);
}

module.exports = {
	add: add,
	remove: remove
};

},{"./isInput":25}],15:[function(_dereq_,module,exports){
'use strict';

var emitter = _dereq_('contra.emitter');
var raf = _dereq_('raf');
var dom = _dereq_('./dom');
var text = _dereq_('./text');
var parse = _dereq_('./parse');
var clone = _dereq_('./clone');
var defaults = _dereq_('./defaults');
var momentum = _dereq_('./momentum');
var classes = _dereq_('./classes');
var events = _dereq_('./events');
var noop = _dereq_('./noop');
var no;

function calendar (calendarOptions) {
	var o;
	var api = emitter({});
	var ref;
	var refCal;
	var container;
	var rendered = false;

	// date variables
	var monthOffsetAttribute = 'data-rome-offset';
	var weekdays = momentum.moment.weekdaysMin();
	var weekdayCount = weekdays.length;
	var calendarMonths = [];
	var lastYear;
	var lastMonth;
	var lastDay;
	var lastDayElement;
	var datewrapper;
	var back;
	var next;

	// time variables
	var secondsInDay = 60 * 60 * 24;
	var time;
	var timelist;

	destroy(true);

	raf(function () {
		init();
	});

	function napi () { return api; }

	function init (initOptions) {
		o = defaults(initOptions || calendarOptions, api);
		if (!container) { container = dom({ className: o.styles.container }); }
		lastMonth = no;
		lastYear = no;
		lastDay = no;
		lastDayElement = no;
		o.appendTo.appendChild(container);

		removeChildren(container);
		rendered = false;
		ref = o.initialValue ? o.initialValue : momentum.moment();
		refCal = ref.clone();

		api.container = container;
		api.destroyed = false;
		api.destroy = destroy.bind(api, false);
		api.emitValues = emitValues;
		api.getDate = getDate;
		api.getDateString = getDateString;
		api.getMoment = getMoment;
		api.hide = hide;
		api.options = changeOptions;
		api.options.reset = resetOptions;
		api.refresh = refresh;
		api.restore = napi;
		api.setValue = setValue;
		api.show = show;

		hideCalendar();
		eventListening();

		api.emit('ready', clone(o));

		return api;
	}

	function destroy (silent) {
		if (container) {
			container.parentNode.removeChild(container);
		}

		if (o) {
			eventListening(true);
		}

		api.destroyed = true;
		api.destroy = napi;
		api.emitValues = napi;
		api.getDate = noop;
		api.getDateString = noop;
		api.getMoment = noop;
		api.hide = napi;
		api.options = napi;
		api.options.reset = napi;
		api.refresh = napi;
		api.restore = init;
		api.setValue = napi;
		api.show = napi;

		if (silent !== true) {
			api.emit('destroyed');
		}
		api.off();

		return api;
	}

	function eventListening (remove) {
		var op = remove ? 'remove' : 'add';
		if (o.autoHideOnBlur) { events[op](document, 'focusin', hideOnBlur); }
		if (o.autoHideOnClick) { events[op](document, 'click', hideOnClick); }
	}

	function changeOptions (options) {
		if (arguments.length === 0) {
			return clone(o);
		}
		destroy();
		init(options);
		return api;
	}

	function resetOptions () {
		return changeOptions({});
	}

	function render () {
		if (rendered) {
			return;
		}
		rendered = true;
		renderDates();
		renderTime();
		api.emit('render');
	}

	function renderDates () {
		if (!o.date) {
			return;
		}
		var i;
		calendarMonths = [];

		datewrapper = dom({ className: o.styles.date, parent: container });

		for (i = 0; i < o.monthsInCalendar; i++) {
			renderMonth(i);
		}

		events.add(back, 'click', subtractMonth);
		events.add(next, 'click', addMonth);
		events.add(datewrapper, 'click', pickDay);

		function renderMonth (i) {
			var month = dom({ className: o.styles.month, parent: datewrapper });
			if (i === 0) {
				back = dom({ type: 'button', className: o.styles.back, parent: month });
			}
			if (i === o.monthsInCalendar -1) {
				next = dom({ type: 'button', className: o.styles.next, parent: month });
			}
			var label = dom({ className: o.styles.monthLabel, parent: month });
			var date = dom({ type: 'table', className: o.styles.dayTable, parent: month });
			var datehead = dom({ type: 'thead', className: o.styles.dayHead, parent: date });
			var dateheadrow = dom({ type: 'tr', className: o.styles.dayRow, parent: datehead });
			var datebody = dom({ type: 'tbody', className: o.styles.dayBody, parent: date });
			var j;

			for (j = 0; j < weekdayCount; j++) {
				dom({ type: 'th', className: o.styles.dayHeadElem, parent: dateheadrow, text: weekdays[weekday(j)] });
			}

			datebody.setAttribute(monthOffsetAttribute, i);
			calendarMonths.push({
				label: label,
				body: datebody
			});
		}
	}

	function renderTime () {
		if (!o.time || !o.timeInterval) {
			return;
		}
		var timewrapper = dom({ className: o.styles.time, parent: container });
		time = dom({ className: o.styles.selectedTime, parent: timewrapper, text: ref.format(o.timeFormat) });
		events.add(time, 'click', toggleTimeList);
		timelist = dom({ className: o.styles.timeList, parent: timewrapper });
		events.add(timelist, 'click', pickTime);
		var next = momentum.moment('00:00:00', 'HH:mm:ss');
		var latest = next.clone().add(1, 'days');
		while (next.isBefore(latest)) {
			dom({ className: o.styles.timeOption, parent: timelist, text: next.format(o.timeFormat) });
			next.add(o.timeInterval, 'seconds');
		}
	}

	function weekday (index, backwards) {
		var factor = backwards ? -1 : 1;
		var offset = index + o.weekStart * factor;
		if (offset >= weekdayCount || offset < 0) {
			offset += weekdayCount * -factor;
		}
		return offset;
	}

	function displayValidTimesOnly () {
		if (!o.time || !rendered) {
			return;
		}
		var times = timelist.children;
		var length = times.length;
		var date;
		var time;
		var item;
		var i;
		for (i = 0; i < length; i++) {
			item = times[i];
			time = momentum.moment(text(item), o.timeFormat);
			date = setTime(ref.clone(), time);
			item.style.display = isInRange(date, false, o.timeValidator) ? 'block' : 'none';
		}
	}

	function toggleTimeList (show) {
		var display = typeof show === 'boolean' ? show : timelist.style.display === 'none';
		if (display) {
			showTimeList();
		} else {
			hideTimeList();
		}
	}

	function showTimeList () { if (timelist) { timelist.style.display = 'block'; } }
	function hideTimeList () { if (timelist) { timelist.style.display = 'none'; } }
	function showCalendar () { container.style.display = 'inline-block'; api.emit('show'); }
	function hideCalendar () { container.style.display = 'none'; api.emit('hide'); }

	function show () {
		render();
		refresh();
		toggleTimeList(!o.date);
		showCalendar();
		return api;
	}

	function hide () {
		hideTimeList();
		raf(hideCalendar);
		return api;
	}

	function hideConditionally () {
		hideTimeList();

		var pos = classes.contains(container, o.styles.positioned);
		if (pos) {
			raf(hideCalendar);
		}
		return api;
	}

	function calendarEventTarget (e) {
		var target = e.target;
		if (target === api.associated) {
			return true;
		}
		while (target) {
			if (target === container) {
				return true;
			}
			target = target.parentNode;
		}
	}

	function hideOnBlur (e) {
		if (calendarEventTarget(e)) {
			return;
		}
		hideConditionally();
	}

	var last;

	function hideOnClick (e) {

		var check = e.x + '-' + e.y;

		if (last == check) {
			return;
		}

		if (calendarEventTarget(e)) {
			last = check;
			return;
		}
		hideConditionally();
	}

	function subtractMonth () { changeMonth('subtract'); }
	function addMonth () { changeMonth('add'); }
	function changeMonth (op) {
		var bound;
		var direction = op === 'add' ? -1 : 1;
		var offset = o.monthsInCalendar + direction * getMonthOffset(lastDayElement);
		refCal[op]('months', offset);
		bound = inRange(refCal.clone());
		ref = bound || ref;
		if (bound) { refCal = bound.clone(); }
		update();
	}

	function update (silent) {
		updateCalendar();
		updateTime();
		if (silent !== true) { emitValues(); }
		displayValidTimesOnly();
	}

	function updateCalendar () {
		if (!o.date || !rendered) {
			return;
		}
		var y = refCal.year();
		var m = refCal.month();
		var d = refCal.date();
		if (d === lastDay && m === lastMonth && y === lastYear) {
			return;
		}
		var canStay = isDisplayed();
		lastDay = refCal.date();
		lastMonth = refCal.month();
		lastYear = refCal.year();
		if (canStay) { updateCalendarSelection(); return; }
		calendarMonths.forEach(updateMonth);
		renderAllDays();

		function updateMonth (month, i) {
			var offsetCal = refCal.clone().add(i, 'months');
			text(month.label, offsetCal.format(o.monthFormat));
			removeChildren(month.body);
		}
	}

	function updateCalendarSelection () {
		var day = refCal.date() - 1;
		selectDayElement(false);
		calendarMonths.forEach(function (cal) {
			var days;
			if (sameCalendarMonth(cal.date, refCal)) {
				days = cast(cal.body.children).map(aggregate);
				days = Array.prototype.concat.apply([], days).filter(inside);
				selectDayElement(days[day]);
			}
		});

		function cast (like) {
			var dest = [];
			var i;
			for (i = 0; i < like.length; i++) {
				dest.push(like[i]);
			}
			return dest;
		}

		function aggregate (child) {
			return cast(child.children);
		}

		function inside (child) {
			return !classes.contains(child, o.styles.dayPrevMonth) &&
						 !classes.contains(child, o.styles.dayNextMonth);
		}
	}

	function isDisplayed () {
		return calendarMonths.some(matches);

		function matches (cal) {
			if (!lastYear) { return false; }
			return sameCalendarMonth(cal.date, refCal);
		}
	}

	function sameCalendarMonth (left, right) {
		return left && right && left.year() === right.year() && left.month() === right.month();
	}

	function updateTime () {
		if (!o.time || !rendered) {
			return;
		}
		text(time, ref.format(o.timeFormat));
	}

	function emitValues () {
		api.emit('data', getDateString());
		api.emit('year', ref.year());
		api.emit('month', ref.month());
		api.emit('day', ref.day());
		api.emit('time', ref.format(o.timeFormat));
		return api;
	}

	function refresh () {
		lastYear = false;
		lastMonth = false;
		lastDay = false;
		update(true);
		return api;
	}

	function setValue (value) {
		var date = parse(value, o.inputFormat);
		if (date === null) {
			return;
		}
		ref = inRange(date) || ref;
		refCal = ref.clone();
		update(true);

		return api;
	}

	function removeChildren (elem, self) {
		while (elem && elem.firstChild) {
			elem.removeChild(elem.firstChild);
		}
		if (self === true) {
			elem.parentNode.removeChild(elem);
		}
	}

	function renderAllDays () {
		var i;
		for (i = 0; i < o.monthsInCalendar; i++) {
			renderDays(i);
		}
	}

	function renderDays (offset) {
		var month = calendarMonths[offset];
		var offsetCal = refCal.clone().add(offset, 'months');
		var total = offsetCal.daysInMonth();
		var current = offsetCal.month() !== ref.month() ? -1 : ref.date(); // -1 : 1..31
		var first = offsetCal.clone().date(1);
		var firstDay = weekday(first.day(), true); // 0..6
		var tr = dom({ type: 'tr', className: o.styles.dayRow, parent: month.body });
		var prevMonth = hiddenWhen(offset !== 0, [o.styles.dayBodyElem, o.styles.dayPrevMonth]);
		var nextMonth = hiddenWhen(offset !== o.monthsInCalendar - 1, [o.styles.dayBodyElem, o.styles.dayNextMonth]);
		var disabled = o.styles.dayDisabled;
		var lastDay;

		part({
			base: first.clone().subtract(firstDay, 'days'),
			length: firstDay,
			cell: prevMonth
		});

		part({
			base: first.clone(),
			length: total,
			cell: [o.styles.dayBodyElem],
			selectable: true
		});

		lastDay = first.clone().add(total, 'days');

		part({
			base: lastDay,
			length: weekdayCount - tr.children.length,
			cell: nextMonth
		});

		back.disabled = !isInRange(first, true);
		next.disabled = !isInRange(lastDay, true);
		month.date = offsetCal.clone();

		function part (data) {
			var i, day, node;
			for (i = 0; i < data.length; i++) {
				if (tr.children.length === weekdayCount) {
					tr = dom({ type: 'tr', className: o.styles.dayRow, parent: month.body });
				}
				day = data.base.clone().add(i, 'days');
				node = dom({
					type: 'td',
					parent: tr,
					text: day.format(o.dayFormat),
					className: validationTest(day, data.cell.join(' ').split(' ')).join(' ')
				});
				if (data.selectable && day.date() === current) {
					selectDayElement(node);
				}
			}
		}

		function validationTest (day, cell) {
			if (!isInRange(day, true, o.dateValidator)) { cell.push(disabled); }
			return cell;
		}

		function hiddenWhen (value, cell) {
			if (value) { cell.push(o.styles.dayConcealed); }
			return cell;
		}
	}

	function isInRange (date, allday, validator) {
		var min = !o.min ? false : (allday ? o.min.clone().startOf('day') : o.min);
		var max = !o.max ? false : (allday ? o.max.clone().endOf('day') : o.max);
		if (min && date.isBefore(min)) {
			return false;
		}
		if (max && date.isAfter(max)) {
			return false;
		}
		var valid = (validator || Function.prototype).call(api, date.toDate());
		return valid !== false;
	}

	function inRange (date) {
		if (o.min && date.isBefore(o.min)) {
			return inRange(o.min.clone());
		} else if (o.max && date.isAfter(o.max)) {
			return inRange(o.max.clone());
		}
		var value = date.clone().subtract(1, 'days');
		if (validateTowards(value, date, 'add')) {
			return inTimeRange(value);
		}
		value = date.clone();
		if (validateTowards(value, date, 'subtract')) {
			return inTimeRange(value);
		}
	}

	function inTimeRange (value) {
		var copy = value.clone().subtract(o.timeInterval, 'seconds');
		var times = Math.ceil(secondsInDay / o.timeInterval);
		var i;
		for (i = 0; i < times; i++) {
			copy.add(o.timeInterval, 'seconds');
			if (copy.date() > value.date()) {
				copy.subtract(1, 'days');
			}
			if (o.timeValidator.call(api, copy.toDate()) !== false) {
				return copy;
			}
		}
	}

	function validateTowards (value, date, op) {
		var valid = false;
		while (valid === false) {
			value[op](1, 'days');
			if (value.month() !== date.month()) {
				break;
			}
			valid = o.dateValidator.call(api, value.toDate());
		}
		return valid !== false;
	}

	function pickDay (e) {
		var target = e.target;
		if (classes.contains(target, o.styles.dayDisabled) || !classes.contains(target, o.styles.dayBodyElem)) {
			return;
		}
		var day = parseInt(text(target), 10);
		var prev = classes.contains(target, o.styles.dayPrevMonth);
		var next = classes.contains(target, o.styles.dayNextMonth);
		var offset = getMonthOffset(target) - getMonthOffset(lastDayElement);
		ref.add(offset, 'months');
		if (prev || next) {
			ref.add(prev ? -1 : 1, 'months');
		}
		selectDayElement(target);
		ref.date(day); // must run after setting the month
		setTime(ref, inRange(ref) || ref);
		refCal = ref.clone();
		if (o.autoClose) { hideConditionally(); }
		update();
	}

	function selectDayElement (node) {
		if (lastDayElement) {
			classes.remove(lastDayElement, o.styles.selectedDay);
		}
		if (node) {
			classes.add(node, o.styles.selectedDay);
		}
		lastDayElement = node;
	}

	function getMonthOffset (elem) {
		var offset;
		while (elem && elem.getAttribute) {
			offset = elem.getAttribute(monthOffsetAttribute);
			if (typeof offset === 'string') {
				return parseInt(offset, 10);
			}
			elem = elem.parentNode;
		}
		return 0;
	}

	function setTime (to, from) {
		to.hour(from.hour()).minute(from.minute()).second(from.second());
		return to;
	}

	function pickTime (e) {
		var target = e.target;
		if (!classes.contains(target, o.styles.timeOption)) {
			return;
		}
		var value = momentum.moment(text(target), o.timeFormat);
		setTime(ref, value);
		refCal = ref.clone();
		emitValues();
		updateTime();
		if (!o.date && o.autoClose) {
			hideConditionally();
		} else {
			hideTimeList();
		}
	}

	function getDate () {
		return ref.toDate();
	}

	function getDateString (format) {
		return ref.format(format || o.inputFormat);
	}

	function getMoment () {
		return ref.clone();
	}

	return api;
}

module.exports = calendar;

},{"./classes":16,"./clone":17,"./defaults":19,"./dom":20,"./events":21,"./momentum":26,"./noop":27,"./parse":28,"./text":40,"contra.emitter":2,"raf":12}],16:[function(_dereq_,module,exports){
'use strict';

var trim = /^\s+|\s+$/g;
var whitespace = /\s+/;

function classes (node) {
	return node.className.replace(trim, '').split(whitespace);
}

function set (node, value) {
	node.className = value.join(' ');
}

function add (node, value) {
	var values = remove(node, value);
	values.push(value);
	set(node, values);
}

function remove (node, value) {
	var values = classes(node);
	var i = values.indexOf(value);
	if (i !== -1) {
		values.splice(i, 1);
		set(node, values);
	}
	return values;
}

function contains (node, value) {
	return classes(node).indexOf(value) !== -1;
}

module.exports = {
	add: add,
	remove: remove,
	contains: contains
};

},{}],17:[function(_dereq_,module,exports){
'use strict';

var momentum = _dereq_('./momentum');

// naïve implementation, specifically meant to clone `options` objects
function clone (thing) {
	var copy = {};
	var value;

	for (var key in thing) {
		value = thing[key];

		if (!value) {
			copy[key] = value;
		} else if (momentum.isMoment(value)) {
			copy[key] = value.clone();
		} else if (value._isStylesConfiguration) {
			copy[key] = clone(value);
		} else {
			copy[key] = value;
		}
	}

	return copy;
}

module.exports = clone;

},{"./momentum":26}],18:[function(_dereq_,module,exports){
'use strict';

var index = _dereq_('./index');
var input = _dereq_('./input');
var inline = _dereq_('./inline');
var isInput = _dereq_('./isInput');

function core (elem, options) {
	var cal;
	var existing = index.find(elem);
	if (existing) {
		return existing;
	}

	if (isInput(elem)) {
		cal = input(elem, options);
	} else {
		cal = inline(elem, options);
	}
	cal.associated = elem;
	index.assign(elem, cal);

	return cal;
}

module.exports = core;

},{"./index":22,"./inline":23,"./input":24,"./isInput":25}],19:[function(_dereq_,module,exports){
'use strict';

var parse = _dereq_('./parse');
var isInput = _dereq_('./isInput');

function defaults (options, cal) {
	var temp;
	var no;
	var o = options || {};
	if (o.autoHideOnClick === no) { o.autoHideOnClick = true; }
	if (o.autoHideOnBlur === no) { o.autoHideOnBlur = true; }
	if (o.autoClose === no) { o.autoClose = true; }
	if (o.appendTo === no) { o.appendTo = document.body; }
	if (o.appendTo === 'parent') {
		if (isInput(cal.associated)) {
			o.appendTo = cal.associated.parentNode;
		} else {
			throw new Error('Inline calendars must be appended to a parent node explicitly.');
		}
	}
	if (o.invalidate === no) { o.invalidate = true; }
	if (o.required === no) { o.required = false; }
	if (o.date === no) { o.date = true; }
	if (o.time === no) { o.time = true; }
	if (o.date === false && o.time === false) { throw new Error('At least one of `date` or `time` must be `true`.'); }
	if (o.inputFormat === no) {
		if (o.date && o.time) {
			o.inputFormat = 'YYYY-MM-DD HH:mm';
		} else if (o.date) {
			o.inputFormat = 'YYYY-MM-DD';
		} else {
			o.inputFormat = 'HH:mm';
		}
	}
	if (o.initialValue === no) {
		o.initialValue = null;
	} else {
		o.initialValue = parse(o.initialValue, o.inputFormat);
	}
	if (o.min === no) { o.min = null; } else { o.min = parse(o.min, o.inputFormat); }
	if (o.max === no) { o.max = null; } else { o.max = parse(o.max, o.inputFormat); }
	if (o.timeInterval === no) { o.timeInterval = 60 * 30; } // 30 minutes by default
	if (o.min && o.max) {
		if (o.max.isBefore(o.min)) {
			temp = o.max;
			o.max = o.min;
			o.min = temp;
		}
		if (o.date === true) {
			if (o.max.clone().subtract(1, 'days').isBefore(o.min)) {
				throw new Error('`max` must be at least one day after `min`');
			}
		} else if (o.timeInterval * 1000 - o.min % (o.timeInterval * 1000) > o.max - o.min) {
			throw new Error('`min` to `max` range must allow for at least one time option that matches `timeInterval`');
		}
	}
	if (o.dateValidator === no) { o.dateValidator = Function.prototype; }
	if (o.timeValidator === no) { o.timeValidator = Function.prototype; }
	if (o.timeFormat === no) { o.timeFormat = 'HH:mm'; }
	if (o.weekStart === no) { o.weekStart = 0; }
	if (o.monthsInCalendar === no) { o.monthsInCalendar = 1; }
	if (o.monthFormat === no) { o.monthFormat = 'MMMM YYYY'; }
	if (o.dayFormat === no) { o.dayFormat = 'DD'; }
	if (o.styles === no) { o.styles = {}; }

	o.styles._isStylesConfiguration = true;

	var styl = o.styles;
	if (styl.back === no) { styl.back = 'rd-back'; }
	if (styl.container === no) { styl.container = 'rd-container'; }
	if (styl.positioned === no) { styl.positioned = 'rd-container-attachment'; }
	if (styl.date === no) { styl.date = 'rd-date'; }
	if (styl.dayBody === no) { styl.dayBody = 'rd-days-body'; }
	if (styl.dayBodyElem === no) { styl.dayBodyElem = 'rd-day-body'; }
	if (styl.dayPrevMonth === no) { styl.dayPrevMonth = 'rd-day-prev-month'; }
	if (styl.dayNextMonth === no) { styl.dayNextMonth = 'rd-day-next-month'; }
	if (styl.dayDisabled === no) { styl.dayDisabled = 'rd-day-disabled'; }
	if (styl.dayConcealed === no) { styl.dayConcealed = 'rd-day-concealed'; }
	if (styl.dayHead === no) { styl.dayHead = 'rd-days-head'; }
	if (styl.dayHeadElem === no) { styl.dayHeadElem = 'rd-day-head'; }
	if (styl.dayRow === no) { styl.dayRow = 'rd-days-row'; }
	if (styl.dayTable === no) { styl.dayTable = 'rd-days'; }
	if (styl.month === no) { styl.month = 'rd-month'; }
	if (styl.monthLabel === no) { styl.monthLabel = 'rd-month-label'; }
	if (styl.next === no) { styl.next = 'rd-next'; }
	if (styl.selectedDay === no) { styl.selectedDay = 'rd-day-selected'; }
	if (styl.selectedTime === no) { styl.selectedTime = 'rd-time-selected'; }
	if (styl.time === no) { styl.time = 'rd-time'; }
	if (styl.timeList === no) { styl.timeList = 'rd-time-list'; }
	if (styl.timeOption === no) { styl.timeOption = 'rd-time-option'; }

	return o;
}

module.exports = defaults;

},{"./isInput":25,"./parse":28}],20:[function(_dereq_,module,exports){
'use strict';

function dom (options) {
	var o = options || {};
	if (!o.type) { o.type = 'div'; }
	var elem = document.createElement(o.type);
	if (o.className) { elem.className = o.className; }
	if (o.text) { elem.innerText = elem.textContent = o.text; }
	if (o.parent) { o.parent.appendChild(elem); }
	return elem;
}

module.exports = dom;

},{}],21:[function(_dereq_,module,exports){
'use strict';

var addEvent = addEventEasy;
var removeEvent = removeEventEasy;

if (!window.addEventListener) {
	addEvent = addEventHard;
}

if (!window.removeEventListener) {
	removeEvent = removeEventHard;
}

function addEventEasy (element, evt, fn) {
	return element.addEventListener(evt, fn);
}

function addEventHard (element, evt, fn) {
	return element.attachEvent('on' + evt, function (ae) {
		var e = ae || window.event;
		e.target = e.target || e.srcElement;
		e.preventDefault  = e.preventDefault || function preventDefault () { e.returnValue = false; };
		e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
		fn.call(element, e);
	});
}

function removeEventEasy (element, evt, fn) {
	return element.removeEventListener(evt, fn);
}

function removeEventHard (element, evt, fn) {
	return element.detachEvent('on' + evt, fn);
}

module.exports = {
	add: addEvent,
	remove: removeEvent
};

},{}],22:[function(_dereq_,module,exports){
'use strict';
var no;
var ikey = 'data-rome-id';
var index = [];

function find (thing) { // can be a DOM element or a number
	if (typeof thing !== 'number' && thing && thing.getAttribute) {
		return find(thing.getAttribute(ikey));
	}
	var existing = index[thing];
	if (existing !== no) {
		return existing;
	}
	return null;
}

function assign (elem, instance) {
	elem.setAttribute(ikey, instance.id = index.push(instance) - 1);
}

module.exports = {
	find: find,
	assign: assign
};

},{}],23:[function(_dereq_,module,exports){
'use strict';

var raf = _dereq_('raf');
var calendar = _dereq_('./calendar');

function inline (elem, calendarOptions) {
	var o = calendarOptions || {};

	o.appendTo = elem;

	var api = calendar(o)
		.on('ready', ready);

	function ready () {
		raf(api.show);
	}

	return api;
}

module.exports = inline;

},{"./calendar":15,"raf":12}],24:[function(_dereq_,module,exports){
'use strict';

var throttle = _dereq_('lodash.throttle');
var raf = _dereq_('raf');
var clone = _dereq_('./clone');
var calendar = _dereq_('./calendar');
var momentum = _dereq_('./momentum');
var classes = _dereq_('./classes');
var events = _dereq_('./events');

function inputCalendar (input, calendarOptions) {
	var o;
	var api = calendar(calendarOptions);
	var throttledTakeInput = throttle(takeInput, 50);
	var throttledPosition = throttle(position, 30);
	var ignoreInvalidation;
	var ignoreShow;

	bindEvents();

	function init (superOptions) {
		o = clone(superOptions);

		classes.add(api.container, o.styles.positioned);
		events.add(api.container, 'mousedown', containerMouseDown);
		events.add(api.container, 'click', containerClick);

		api.getDate = unrequire(api.getDate);
		api.getDateString = unrequire(api.getDateString);
		api.getMoment = unrequire(api.getMoment);

		if (o.initialValue) {
			input.value = o.initialValue.format(o.inputFormat);
		}

		api.on('data', updateInput);
		api.on('show', throttledPosition);

		eventListening();
		throttledTakeInput();
	}

	function destroy () {
		eventListening(true);
		raf(bindEvents);
	}

	function bindEvents () {
		api.once('ready', init);
		api.once('destroyed', destroy);
	}

	function eventListening (remove) {
		var op = remove ? 'remove' : 'add';
		events[op](input, 'click', show);
		events[op](input, 'touchend', show);
		events[op](input, 'focusin', show);
		events[op](input, 'change', throttledTakeInput);
		events[op](input, 'keypress', throttledTakeInput);
		events[op](input, 'keydown', throttledTakeInput);
		events[op](input, 'input', throttledTakeInput);
		if (o.invalidate) { events[op](input, 'blur', invalidateInput); }
		events[op](window, 'resize', throttledPosition);
	}

	function containerClick () {
		ignoreShow = true;
		input.focus();
		ignoreShow = false;
	}

	function containerMouseDown () {
		ignoreInvalidation = true;
		raf(unignore);

		function unignore () {
			ignoreInvalidation = false;
		}
	}

	function invalidateInput () {
		if (!ignoreInvalidation && !isEmpty()) {
			api.emitValues();
		}
	}

	function show () {
		if (ignoreShow) {
			return;
		}
		api.show();
	}

	function position () {
		var bounds = input.getBoundingClientRect();
		var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
		api.container.style.top  = bounds.top + scrollTop + input.offsetHeight + 'px';
		api.container.style.left = bounds.left + 'px';
	}

	function takeInput () {
		var value = input.value.trim();
		if (isEmpty()) {
			return;
		}
		var date = momentum.moment(value, o.inputFormat);
		api.setValue(date);
	}

	function updateInput (data) {
		input.value = data;
	}

	function isEmpty () {
		return o.required === false && input.value.trim() === '';
	}

	function unrequire (fn) {
		return function maybe () {
			return isEmpty() ? null : fn.apply(this, arguments);
		};
	}

	return api;
}

module.exports = inputCalendar;

},{"./calendar":15,"./classes":16,"./clone":17,"./events":21,"./momentum":26,"lodash.throttle":4,"raf":12}],25:[function(_dereq_,module,exports){
'use strict';

function isInput (elem) {
	return elem && elem.nodeName && elem.nodeName.toLowerCase() === 'input';
}

module.exports = isInput;

},{}],26:[function(_dereq_,module,exports){
'use strict';

function isMoment (value) {
	return value && Object.prototype.hasOwnProperty.call(value, '_isAMomentObject');
}

var api = {
	moment: null,
	isMoment: isMoment
};

module.exports = api;

},{}],27:[function(_dereq_,module,exports){
'use strict';

function noop () {}

module.exports = noop;

},{}],28:[function(_dereq_,module,exports){
'use strict';

var momentum = _dereq_('./momentum');

function raw (date, format) {
	if (typeof date === 'string') {
		return momentum.moment(date, format);
	}
	if (Object.prototype.toString.call(date) === '[object Date]') {
		return momentum.moment(date);
	}
	if (momentum.isMoment(date)) {
		return date.clone();
	}
}

function parse (date, format) {
	var m = raw(date, typeof format === 'string' ? format : null);
	return m && m.isValid() ? m : null;
}

module.exports = parse;

},{"./momentum":26}],29:[function(_dereq_,module,exports){
if (!Array.prototype.every) {
	Array.prototype.every = function (fn, ctx) {
		var context, i;

		if (this == null) {
			throw new TypeError('this is null or not defined');
		}

		var source = Object(this);
		var len = source.length >>> 0;

		if (typeof fn !== 'function') {
			throw new TypeError(fn + ' is not a function');
		}

		if (arguments.length > 1) {
			context = ctx;
		}

		i = 0;

		while (i < len) {
			if (i in source) {
				var test = fn.call(context, source[i], i, source);
				if (!test) {
					return false;
				}
			}
			i++;
		}
		return true;
	};
}

},{}],30:[function(_dereq_,module,exports){
if (!Array.prototype.filter) {
	Array.prototype.filter = function (fn, ctx) {
		var f = [];
		this.forEach(function (v, i, t) {
			if (fn.call(ctx, v, i, t)) { f.push(v); }
		}, ctx);
		return f;
	};
}

},{}],31:[function(_dereq_,module,exports){
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function (fn, ctx) {
		if (this === void 0 || this === null || typeof fn !== 'function') {
			throw new TypeError();
		}
		var t = this;
		var len = t.length;
		for (var i = 0; i < len; i++) {
			if (i in t) { fn.call(ctx, t[i], i, t); }
		}
	};
}

},{}],32:[function(_dereq_,module,exports){
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (what, start) {
		if (this === undefined || this === null) {
			throw new TypeError();
		}
		var length = this.length;
		start = +start || 0;
		if (Math.abs(start) === Infinity) {
			start = 0;
		} else if (start < 0) {
			start += length;
			if (start < 0) { start = 0; }
		}
		for (; start < length; start++) {
			if (this[start] === what) {
				return start;
			}
		}
		return -1;
	};
}

},{}],33:[function(_dereq_,module,exports){
Array.isArray || (Array.isArray = function (a) {
	return '' + a !== a && Object.prototype.toString.call(a) === '[object Array]';
});

},{}],34:[function(_dereq_,module,exports){
if (!Array.prototype.map) {
	Array.prototype.map = function (fn, ctx) {
		var context, result, i;

		if (this == null) {
			throw new TypeError('this is null or not defined');
		}

		var source = Object(this);
		var len = source.length >>> 0;

		if (typeof fn !== 'function') {
			throw new TypeError(fn + ' is not a function');
		}

		if (arguments.length > 1) {
			context = ctx;
		}

		result = new Array(len);
		i = 0;

		while (i < len) {
			if (i in source) {
				result[i] = fn.call(context, source[i], i, source);
			}
			i++;
		}
		return result;
	};
}

},{}],35:[function(_dereq_,module,exports){
if (!Array.prototype.some) {
	Array.prototype.some = function (fn, ctx) {
		var context, i;

		if (this == null) {
			throw new TypeError('this is null or not defined');
		}

		var source = Object(this);
		var len = source.length >>> 0;

		if (typeof fn !== 'function') {
			throw new TypeError(fn + ' is not a function');
		}

		if (arguments.length > 1) {
			context = ctx;
		}

		i = 0;

		while (i < len) {
			if (i in source) {
				var test = fn.call(context, source[i], i, source);
				if (test) {
					return true;
				}
			}
			i++;
		}
		return false;
	};
}

},{}],36:[function(_dereq_,module,exports){
if (!Function.prototype.bind) {
	Function.prototype.bind = function (context) {
		if (typeof this !== 'function') {
			throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
		}
		var curried = Array.prototype.slice.call(arguments, 1);
		var original = this;
		var NoOp = function () {};
		var bound = function () {
			var ctx = this instanceof NoOp && context ? this : context;
			var args = curried.concat(Array.prototype.slice.call(arguments));
			return original.apply(ctx, args);
		};
		NoOp.prototype = this.prototype;
		bound.prototype = new NoOp();
		return bound;
	};
}

},{}],37:[function(_dereq_,module,exports){
if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/g, '');
	};
}

},{}],38:[function(_dereq_,module,exports){
'use strict';

// these are only required for IE < 9
// maybe move to IE-specific distro?
_dereq_('./polyfills/function.bind');
_dereq_('./polyfills/array.foreach');
_dereq_('./polyfills/array.map');
_dereq_('./polyfills/array.filter');
_dereq_('./polyfills/array.isarray');
_dereq_('./polyfills/array.indexof');
_dereq_('./polyfills/array.every');
_dereq_('./polyfills/array.some');
_dereq_('./polyfills/string.trim');

var core = _dereq_('./core');
var index = _dereq_('./index');
var use = _dereq_('./use');

core.use = use.bind(core);
core.find = index.find;
core.val = _dereq_('./validators');

module.exports = core;

},{"./core":18,"./index":22,"./polyfills/array.every":29,"./polyfills/array.filter":30,"./polyfills/array.foreach":31,"./polyfills/array.indexof":32,"./polyfills/array.isarray":33,"./polyfills/array.map":34,"./polyfills/array.some":35,"./polyfills/function.bind":36,"./polyfills/string.trim":37,"./use":41,"./validators":42}],39:[function(_dereq_,module,exports){
'use strict';

var moment = _dereq_('moment');
var rome = _dereq_('./rome');

rome.use(moment);

module.exports = rome;

},{"./rome":38,"moment":11}],40:[function(_dereq_,module,exports){
'use strict';

function text (elem, value) {
	if (arguments.length === 2) {
		elem.innerText = elem.textContent = value;
	}
	return elem.innerText || elem.textContent;
}

module.exports = text;

},{}],41:[function(_dereq_,module,exports){
'use strict';

var momentum = _dereq_('./momentum');

function use (moment) {
	this.moment = momentum.moment = moment;
}

module.exports = use;

},{"./momentum":26}],42:[function(_dereq_,module,exports){
'use strict';

var index = _dereq_('./index');
var parse = _dereq_('./parse');
var association = _dereq_('./association');

function compareBuilder (compare) {
	return function factory (value) {
		var fixed = parse(value);

		return function validate (date) {
			var cal = index.find(value);
			var left = parse(date);
			var right = fixed || cal && cal.getMoment();
			if (!right) {
				return true;
			}
			if (cal) {
				association.add(this, cal);
			}
			return compare(left, right);
		};
	};
}

function rangeBuilder (how, compare) {
	return function factory (start, end) {
		var dates;
		var len = arguments.length;

		if (Array.isArray(start)) {
			dates = start;
		} else {
			if (len === 1) {
				dates = [start];
			} else if (len === 2) {
				dates = [[start, end]];
			}
		}

		return function validate (date) {
			return dates.map(expand.bind(this))[how](compare.bind(this, date));
		};

		function expand (value) {
			var start, end;
			var cal = index.find(value);
			if (cal) {
				start = end = cal.getMoment();
			} else if (Array.isArray(value)) {
				start = value[0]; end = value[1];
			} else {
				start = end = value;
			}
			if (cal) {
				association.add(cal, this);
			}
			return {
				start: parse(start).startOf('day').toDate(),
				end: parse(end).endOf('day').toDate()
			};
		}
	};
}

var afterEq  = compareBuilder(function (left, right) { return left >= right; });
var after    = compareBuilder(function (left, right) { return left  > right; });
var beforeEq = compareBuilder(function (left, right) { return left <= right; });
var before   = compareBuilder(function (left, right) { return left  < right; });

var except   = rangeBuilder('every', function (left, right) { return right.start  > left || right.end  < left; });
var only     = rangeBuilder('some',  function (left, right) { return right.start <= left && right.end >= left; });

module.exports = {
	afterEq: afterEq,
	after: after,
	beforeEq: beforeEq,
	before: before,
	except: except,
	only: only
};

},{"./association":14,"./index":22,"./parse":28}]},{},[39])
(39)
});
import debounce from 'lodash.debounce';
const LOG = false;

function log(...args) {
  if (LOG) console.log('js-utils.js', ...args);
}

export class CachedMap extends Map {
  #dirtyArrayValues = true;
  #cachedArrayValues;
  clear() {
    this.#dirtyArrayValues = true;
    super.clear();
    return;
  }
  delete(key) {
    this.#dirtyArrayValues = true;
    return super.delete(key);
  }
  get(key) {
    return super.get(key);
  }
  has(key) {
    return super.has(key);
  }
  set(key, value) {
    this.#dirtyArrayValues = true;
    super.set(key, value);
    return this;
  }
  arrayValues() {
    if (this.#dirtyArrayValues) {
      this.#cachedArrayValues = [...super.values()];
      this.#dirtyArrayValues = false;
    }
    return this.#cachedArrayValues;
  }
}

export function arrayify(x) {
  if (x == null) {
    throw new Error('undefined value passed');
  }
  return Array.isArray(x) ? x : [x];
}

export function rafWrap(cb) {
  return (...args) => {
    requestAnimationFrame(() => cb(...args));
  };
}

// simple higher order compose
export function compose(func, ...funcs) {
  const allFuncs = [func, ...funcs];
  return function composed(raw) {
    return allFuncs.reduceRight((prev, func) => func(prev), raw);
  };
}

/**
 * Runs matchAll and gives range of strings that matched and didnt match
 *
 * @param {*} regexp
 * @param {*} str
 */
export function matchAllPlus(regexp, str) {
  const matches = [...str.matchAll(regexp)];
  if (matches.length === 0) {
    return [
      {
        start: 0,
        end: str.length,
        match: false,
        matchedStr: str,
      },
    ];
  }

  let result = [];
  let prevElementEnd = 0;
  for (let i = 0; i < matches.length; i++) {
    let cur = matches[i];
    let curStart = cur.index;
    let curEnd = curStart + cur[0].length;

    if (prevElementEnd !== curStart) {
      result.push({
        start: prevElementEnd,
        end: curStart,
        match: false,
      });
    }
    result.push({
      start: curStart,
      end: curEnd,
      match: true,
    });
    prevElementEnd = curEnd;
  }

  const lastItemEnd = result[result.length - 1]?.end;

  if (lastItemEnd && lastItemEnd !== str.length) {
    result.push({
      start: lastItemEnd + 1,
      end: str.length,
      match: false,
    });
  }

  result = result.map((r) => ({ ...r, matchedStr: str.slice(r.start, r.end) }));
  return result;
}

export function uuid(len = 10) {
  return Math.random().toString(36).substring(2, 15).slice(0, len);
}

export function getIdleCallback(cb) {
  if (window.requestIdleCallback) {
    return window.requestIdleCallback(cb);
  }
  var t = Date.now();
  return setTimeout(function () {
    cb({
      didTimeout: !1,
      timeRemaining: function () {
        return Math.max(0, 50 - (Date.now() - t));
      },
    });
  }, 1);
}

/**
 * A debounce function which tries to avoid debouncing a function unless it violates
 * the maximum times it can be called during a coolTime period
 * @param {*} cb
 * @param {*} violationMax - The number of calls allowed within a cool time to be not debounced
 * @param {*} coolTime - The time period which it checks for violations, if exceeded it will start debouncing the function
 * @param  {...any} debounceOpts - lodash debounce options
 */
export function smartDebounce(
  cb,
  violationMax = 100,
  coolTime,
  ...debounceOpts
) {
  const debouncedCb = debounce(cb, ...debounceOpts);
  let lastCalled = Date.now();
  let violations = 0;
  return (arg) => {
    const current = Date.now();
    if (current - lastCalled < coolTime) {
      if (violations > violationMax) {
        lastCalled = current;
        log('debouncing call');
        return debouncedCb(arg);
      }
      log('increasing violations', violations);
      violations++;
    } else {
      log('resetting violations', violations);
      violations = 0;
    }
    log('directly calling');
    lastCalled = current;
    return cb(arg);
  };
}

export function cancelablePromise(promise) {
  let hasCanceled = false;

  const wrappedPromise = new Promise((resolve, reject) =>
    promise
      .then((val) =>
        hasCanceled ? reject({ isCanceled: true }) : resolve(val),
      )
      .catch((error) =>
        hasCanceled ? reject({ isCanceled: true }) : reject(error),
      ),
  );
  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled = true;
    },
  };
}

export function sleep(t = 20) {
  return new Promise((res) => setTimeout(res, t));
}

export function objectMapValues(obj, map) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      return [key, map([key, value])];
    }),
  );
}

export function handleAsyncError(fn, onError) {
  return async (...args) => {
    return Promise.resolve(fn(...args)).catch(onError);
  };
}

export function serialExecuteQueue() {
  let prev = Promise.resolve();
  return {
    add: (cb) => {
      return new Promise((resolve, reject) => {
        prev = prev.then(() => {
          return Promise.resolve(cb()).then(
            (resultCb) => {
              resolve(resultCb);
            },
            (err) => {
              reject(err);
            },
          );
        });
      });
    },
  };
}

export function simpleLRU(size) {
  let array = [];
  let clear = () => {
    while (array.length > size) {
      log('removing', array.shift());
    }
  };
  return {
    entries: () => array.slice(0),
    get: (key) => {
      clear();
      let result = array.find((item) => item.key === key);
      if (result) {
        return result.value;
      }
    },
    set: (key, value) => {
      clear();
      array = array.filter((item) => item.key !== key);
      array.push({ key, value });
    },
  };
}
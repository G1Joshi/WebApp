// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(
      await _compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

let _isCompileStreamingSupported;
async function _compileStreaming(source, builtins) {
  _isCompileStreamingSupported ??= WebAssembly.compileStreaming(
    new Response(
      new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,2,23,1,14,119,97,115,109,58,106,115,45,115,116,114,105,110,103,4,99,97,115,116,0,0]),
      {headers: {'Content-Type': 'application/wasm'}},
    ),
    builtins,
  ).then(() => false, (e) => e instanceof WebAssembly.CompileError);
  if (await _isCompileStreamingSupported) {
    return WebAssembly.compileStreaming(source, builtins);
  }
  return WebAssembly.compile(await (await source).arrayBuffer(), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      AD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      AE: o => o.length,
      AF: x0 => x0.length,
      AG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      AH: x0 => x0.data,
      AI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      AJ: x0 => x0.altKey,
      AK: x0 => x0.value,
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      BD: (x0,x1) => x0.closest(x1),
      BE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      BF: (x0,x1) => x0.exec(x1),
      BG: x0 => x0.v8BreakIterator,
      BH: (x0,x1) => x0.removeAttribute(x1),
      BI: (a, s, e) => a.slice(s, e),
      BJ: x0 => x0.ctrlKey,
      BK: x0 => x0.done,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Int32Array(x0),
      CC: (x0,x1) => x0.querySelector(x1),
      CD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      CE: x0 => x0.language,
      CF: x0 => x0.flags,
      CG: () => globalThis.Intl,
      CH: (x0,x1) => { x0.value = x1 },
      CI: x0 => x0.pop(),
      CJ: x0 => x0.isComposing,
      CK: x0 => x0.read(),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      DC: (x0,x1) => x0.item(x1),
      DD: (handle) => clearTimeout(handle),
      DE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      DF: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      DG: (x0,x1) => x0.segment(x1),
      DH: (x0,x1) => { x0.value = x1 },
      DI: x0 => x0.abort(),
      DJ: x0 => x0.code,
      DK: x0 => x0.body,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => new Uint32Array(x0),
      EC: x0 => x0.length,
      ED: x0 => x0.maxTouchPoints,
      EE: () => globalThis.window.FinalizationRegistry,
      EF: o => o instanceof RegExp,
      EG: x0 => x0.index,
      EH: x0 => x0.value,
      EI: () => new AbortController(),
      EJ: x0 => x0.repeat,
      EK: (x0,x1) => new OffscreenCanvas(x0,x1),
      F: () => new Error().stack,
      FB: x0 => new Float32Array(x0),
      FC: (x0,x1) => x0.querySelectorAll(x1),
      FD: x0 => x0.platform,
      FE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      FF: (a, s) => a.join(s),
      FG: x0 => x0.next(),
      FH: x0 => x0.selectionDirection,
      FI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      FJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      FK: x0 => x0.assetBase,
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      GC: (x0,x1) => x0.getAttribute(x1),
      GD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      GE: x0 => new window.FinalizationRegistry(x0),
      GF: (x0,x1) => x0.error(x1),
      GG: x0 => x0.value,
      GH: x0 => x0.selectionStart,
      GI: (x0,x1) => globalThis.fetch(x0,x1),
      GJ: (x0,x1) => x0.getItem(x1),
      GK: x0 => x0.loader,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => new Float64Array(x0),
      HC: x0 => x0.remove(),
      HD: Date.now,
      HE: (x0,x1) => x0.unregister(x1),
      HF: () => globalThis.console,
      HG: x0 => x0.done,
      HH: x0 => x0.selectionEnd,
      HI: (x0,x1) => x0.get(x1),
      HJ: x0 => x0.localStorage,
      HK: () => globalThis._flutter,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      IC: (x0,x1) => x0.appendChild(x1),
      ID: (x0,x1) => x0.contains(x1),
      IE: x0 => x0.preventDefault(),
      IF: s => s.trimRight(),
      IG: (o, m, a) => o[m].apply(o, a),
      IH: x0 => x0.value,
      II: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      IJ: () => globalThis.window,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => new ArrayBuffer(x0),
      JC: (x0,x1) => x0.append(x1),
      JD: (decoder, codeUnits) => decoder.decode(codeUnits),
      JE: x0 => x0.parent,
      JF: x0 => x0.blur(),
      JG: x0 => x0.iterator,
      JH: x0 => x0.selectionDirection,
      JI: (x0,x1) => x0.forEach(x1),
      JJ: (x0,x1) => x0.key(x1),
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      KC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      KD: () => new TextDecoder("utf-8", {fatal: true}),
      KE: x0 => x0.timeStamp,
      KF: x0 => x0.button,
      KG: () => globalThis.Symbol,
      KH: x0 => x0.selectionStart,
      KI: x0 => x0.name,
      KJ: x0 => x0.length,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new DataView(x0,x1,x2),
      LC: x0 => x0.style,
      LD: () => new TextDecoder("utf-8", {fatal: false}),
      LE: (x0,x1) => x0.hasAttribute(x1),
      LF: (x0,x1) => x0.prepend(x1),
      LG: (x0,x1) => new Intl.Segmenter(x0,x1),
      LH: x0 => x0.selectionEnd,
      LI: x0 => x0.statusText,
      LJ: (x0,x1) => x0.removeItem(x1),
      M: o => String(o),
      MB: (o, p) => o[p],
      MC: x0 => x0.debugShowSemanticsNodes,
      MD: (a, i, v) => a[i] = v,
      ME: x0 => x0.type,
      MF: x0 => x0.parentElement,
      MG: x0 => x0.Segmenter,
      MH: (x0,x1) => { x0.name = x1 },
      MI: x0 => x0.url,
      MJ: (x0,x1,x2) => x0.setItem(x1,x2),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      NC: o => o,
      ND: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      NE: (x0,x1) => x0.getModifierState(x1),
      NF: x0 => x0.innerHeight,
      NG: x0 => x0.buffer,
      NH: (x0,x1) => { x0.placeholder = x1 },
      NI: x0 => x0.status,
      NJ: () => globalThis.removeSplashFromWeb(),
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      OC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      OD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      OE: x0 => x0.buttons,
      OF: x0 => x0.innerWidth,
      OG: x0 => x0.wasmMemory,
      OH: (x0,x1) => { x0.autocomplete = x1 },
      OI: x0 => x0.cancel(),
      OJ: x0 => x0.close(),
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: o => o.byteOffset,
      PC: (x0,x1) => x0.warn(x1),
      PD: (s) => +s,
      PE: x0 => x0.ctrlKey,
      PF: x0 => x0.height,
      PG: () => globalThis.window._flutter_skwasmInstance,
      PH: (x0,x1) => { x0.type = x1 },
      PI: x0 => x0.getReader(),
      PJ: x0 => x0.disconnect(),
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.buffer,
      QC: x0 => x0.console,
      QD: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      QE: x0 => x0.getBoundingClientRect(),
      QF: x0 => x0.width,
      QG: () => new TextDecoder(),
      QH: (x0,x1) => { x0.name = x1 },
      QI: x0 => x0.read(),
      QJ: x0 => x0.remove(),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: Function.prototype.call.bind(DataView.prototype.getUint8),
      RC: () => globalThis.window,
      RD: s => s.trim(),
      RE: x0 => x0.y,
      RF: x0 => x0.clientHeight,
      RG: (map, o, v) => map.set(o, v),
      RH: (x0,x1) => { x0.placeholder = x1 },
      RI: x0 => x0.value,
      RJ: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (b, o) => new DataView(b, o),
      SC: (o, c) => o instanceof c,
      SD: x0 => x0.classList,
      SE: x0 => x0.x,
      SF: x0 => x0.clientWidth,
      SG: (map, o) => map.get(o),
      SH: (x0,x1) => { x0.scrollTop = x1 },
      SI: x0 => x0.done,
      SJ: (x0,x1) => { x0.src = x1 },
      T: x0 => new Promise(x0),
      TB: (b, o, l) => new DataView(b, o, l),
      TC: (string, token) => string.split(token),
      TD: x0 => x0.relatedTarget,
      TE: x0 => x0.top,
      TF: x0 => x0.isConnected,
      TG: () => new WeakMap(),
      TH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      TI: x0 => x0.body,
      TJ: x0 => x0.pause(),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      UC: o => o instanceof Array,
      UD: x0 => x0.hasFocus(),
      UE: x0 => x0.left,
      UF: x0 => x0.unicode,
      UG: x0 => x0.debugSkipFontRetryDelay,
      UH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      UI: x0 => x0.headers,
      UJ: x0 => x0.currentTime,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      VC: (a, i) => a[i],
      VD: x0 => x0.shiftKey,
      VE: x0 => x0.scrollTop,
      VF: x0 => x0.index,
      VG: x0 => x0.status,
      VH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      VI: x0 => x0.signal,
      VJ: (x0,x1) => { x0.loop = x1 },
      W: x0 => new Array(x0),
      WB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      WC: a => a.length,
      WD: x0 => x0.body,
      WE: x0 => x0.offsetTop,
      WF: (x0,x1) => { x0.lastIndex = x1 },
      WG: (x0,x1,x2) => x0.set(x1,x2),
      WH: x0 => x0.keyCode,
      WI: (x0,x1,x2) => x0.insertBefore(x1,x2),
      WJ: (x0,x1) => { x0.value = x1 },
      X: o => [o],
      XB: (t, s) => t.set(s),
      XC: x0 => x0.userAgent,
      XD: x0 => x0.visibilityState,
      XE: x0 => x0.scrollLeft,
      XF: x0 => x0.dotAll,
      XG: x0 => x0.arrayBuffer(),
      XH: (x0,x1) => x0.scrollIntoView(x1),
      XI: x0 => x0.id,
      XJ: x0 => x0.gain,
      Y: (o0, o1) => [o0, o1],
      YB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      YC: x0 => x0.navigator,
      YD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      YE: x0 => x0.offsetLeft,
      YF: x0 => x0.ignoreCase,
      YG: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      YH: x0 => x0.multiViewEnabled,
      YI: x0 => x0.offsetHeight,
      YJ: x0 => x0.resume(),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ZC: Function.prototype.call.bind(String.prototype.toLowerCase),
      ZD: x0 => x0.disconnect(),
      ZE: x0 => x0.offsetParent,
      ZF: x0 => x0.multiline,
      ZG: (x0,x1) => x0.fetch(x1),
      ZH: (x0,x1) => x0.replaceWith(x1),
      ZI: x0 => x0.offsetWidth,
      ZJ: x0 => x0.play(),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      aC: Object.is,
      aD: x0 => new Intl.Locale(x0),
      aE: x0 => x0.offsetY,
      aF: x0 => x0.head,
      aG: x0 => x0.fontFallbackBaseUrl,
      aH: (x0,x1) => { x0.className = x1 },
      aI: x0 => x0.stopPropagation(),
      aJ: (x0,x1) => { x0.currentTime = x1 },
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: Function.prototype.call.bind(DataView.prototype.getUint32),
      bC: x0 => x0.vendor,
      bD: x0 => x0.region,
      bE: x0 => x0.offsetX,
      bF: (x0,x1) => { x0.content = x1 },
      bG: (handle) => clearInterval(handle),
      bH: (x0,x1) => { x0.tabIndex = x1 },
      bI: x0 => x0.disabled,
      bJ: x0 => x0.state,
      c: o => o,
      cB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      cC: (x0,x1) => x0.createTextNode(x1),
      cD: x0 => x0.script,
      cE: (o, p, r) => o.replaceAll(p, () => r),
      cF: (x0,x1) => { x0.name = x1 },
      cG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      cH: (x0,x1) => { x0.action = x1 },
      cI: (x0,x1) => { x0.min = x1 },
      cJ: () => new AudioContext(),
      d: (o, p) => o[p],
      dB: Function.prototype.call.bind(DataView.prototype.getInt32),
      dC: (x0,x1) => { x0.id = x1 },
      dD: x0 => x0.language,
      dE: x0 => x0.deltaMode,
      dF: (x0,x1) => x0.removeChild(x1),
      dG: () => Date.now(),
      dH: (x0,x1) => { x0.method = x1 },
      dI: (x0,x1) => { x0.max = x1 },
      dJ: (x0,x1) => x0.createMediaElementSource(x1),
      e: () => globalThis,
      eB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      eC: (x0,x1) => { x0.nonce = x1 },
      eD: x0 => x0.languages,
      eE: x0 => x0.deltaY,
      eF: x0 => x0.firstChild,
      eG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      eH: (x0,x1) => { x0.noValidate = x1 },
      eI: (x0,x1) => { x0.disabled = x1 },
      eJ: x0 => x0.createGain(),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => o instanceof Uint16Array,
      fC: x0 => x0.nonce,
      fD: (x0,x1) => x0.observe(x1),
      fE: x0 => x0.deltaX,
      fF: x0 => x0.viewConstraints,
      fG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      fH: x0 => x0.click(),
      fI: (x0,x1) => { x0.scrollLeft = x1 },
      fJ: x0 => x0.createStereoPanner(),
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: Function.prototype.call.bind(DataView.prototype.getUint16),
      gC: () => globalThis.window.flutterConfiguration,
      gD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      gE: x0 => x0.wheelDeltaY,
      gF: x0 => x0.hostElement,
      gG: (d, digits) => d.toFixed(digits),
      gH: (x0,x1) => x0.getElementsByClassName(x1),
      gI: (x0,x1) => { x0.spellcheck = x1 },
      gJ: (x0,x1) => x0.connect(x1),
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: o => o instanceof Int16Array,
      hC: (x0,x1) => x0.attachShadow(x1),
      hD: x0 => new ResizeObserver(x0),
      hE: x0 => x0.wheelDeltaX,
      hF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      hH: (x0,x1) => x0.dispatchEvent(x1),
      hI: (x0,x1) => { x0.disabled = x1 },
      hJ: x0 => x0.load(),
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(DataView.prototype.getInt16),
      iC: (x0,x1) => x0.createElement(x1),
      iD: (x0,x1) => x0.getPropertyValue(x1),
      iE: x0 => x0.bottom,
      iF: x0 => ({runApp: x0}),
      iG: x0 => x0.history,
      iH: (x0,x1) => x0.createEvent(x1),
      iI: (x0,x1) => x0.getRandomValues(x1),
      iJ: x0 => x0.destination,
      j: x0 => x0.random(),
      jB: o => o instanceof Uint8ClampedArray,
      jC: x0 => x0.scale,
      jD: x0 => globalThis.parseFloat(x0),
      jE: x0 => x0.right,
      jF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      jG: x0 => x0.search,
      jH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      jI: () => globalThis.crypto,
      jJ: x0 => x0.code,
      k: o => o,
      kB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      kC: x0 => x0.visualViewport,
      kD: (x0,x1) => x0.getComputedStyle(x1),
      kE: x0 => x0.clientY,
      kF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      kG: x0 => x0.location,
      kH: x0 => x0.readText(),
      kI: l => new DataView(new ArrayBuffer(l)),
      kJ: x0 => x0.message,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: Function.prototype.call.bind(DataView.prototype.setInt32),
      lC: x0 => x0.devicePixelRatio,
      lD: x0 => x0.documentElement,
      lE: x0 => x0.clientX,
      lF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      lG: x0 => x0.pathname,
      lH: x0 => x0.clipboard,
      lI: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => x0.drawImage(x1,x2,x3,x4,x5,x6,x7,x8,x9),
      lJ: x0 => x0.error,
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setUint32),
      mC: x0 => x0.height,
      mD: x0 => x0.computedStyleMap(),
      mE: x0 => x0.changedTouches,
      mF: () => typeof dartUseDateNowForTicks !== "undefined",
      mG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      mH: (x0,x1) => x0.writeText(x1),
      mI: (x0,x1) => x0.getContext(x1),
      mJ: x0 => x0.duration,
      n: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      nB: Function.prototype.call.bind(DataView.prototype.setInt16),
      nC: x0 => x0.width,
      nD: (x0,x1) => x0.get(x1),
      nE: x0 => x0.key,
      nF: () => Date.now(),
      nG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      nH: x0 => x0.unlock(),
      nI: (x0,x1) => { x0.height = x1 },
      nJ: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      o: b => !!b,
      oB: Function.prototype.call.bind(DataView.prototype.setUint16),
      oC: x0 => x0.screen,
      oD: (o, p) => p in o,
      oE: x0 => x0.identifier,
      oF: () => 1000 * performance.now(),
      oG: o => Object.keys(o),
      oH: (x0,x1) => x0.lock(x1),
      oI: (x0,x1) => { x0.width = x1 },
      oJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      p: () => globalThis.document,
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: (string, times) => string.repeat(times),
      pD: (x0,x1) => { x0.textContent = x1 },
      pE: x0 => x0.touches,
      pF: (x0,x1) => x0.requestAnimationFrame(x1),
      pG: x0 => x0.state,
      pH: x0 => x0.orientation,
      pI: (x0,x1) => x0.transferFromImageBitmap(x1),
      pJ: (x0,x1) => { x0.playbackRate = x1 },
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setInt8),
      qC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      qD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qE: x0 => x0.pressure,
      qF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qG: x0 => x0.hash,
      qH: (x0,x1) => x0.querySelector(x1),
      qI: x0 => x0.height,
      qJ: (x0,x1) => { x0.crossOrigin = x1 },
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.getInt8),
      rC: x0 => x0.tabIndex,
      rD: x0 => x0.matches,
      rE: x0 => x0.tiltY,
      rF: x0 => x0.now(),
      rG: x0 => x0.state,
      rH: (x0,x1) => { x0.title = x1 },
      rI: x0 => x0.width,
      rJ: (x0,x1) => { x0.preload = x1 },
      s: () => ({}),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      sC: (x0,x1) => x0.contains(x1),
      sD: (x0,x1) => x0.matchMedia(x1),
      sE: x0 => x0.tiltX,
      sF: x0 => x0.performance,
      sG: (x0,x1) => x0.go(x1),
      sH: (x0,x1) => x0.vibrate(x1),
      sI: x0 => x0.rasterEndMilliseconds,
      sJ: (x0,x1) => x0.createElement(x1),
      t: (o, p, v) => o[p] = v,
      tB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      tC: x0 => x0.activeElement,
      tD: x0 => x0.matches,
      tE: x0 => x0.pointerType,
      tF: x0 => new Uint8Array(x0),
      tG: (x0,x1) => x0.querySelectorAll(x1),
      tH: x0 => x0.content,
      tI: x0 => x0.rasterStartMilliseconds,
      tJ: () => globalThis.document,
      u: () => [],
      uB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      uC: x0 => x0.parentNode,
      uD: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      uE: x0 => x0.pointerId,
      uF: (x0,x1,x2) => x0.slice(x1,x2),
      uG: x0 => x0.maxHeight,
      uH: x0 => x0.document,
      uI: x0 => x0.imageBitmaps,
      uJ: x0 => x0.extraAssets,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.tagName,
      vD: f => f.dartFunction,
      vE: x0 => x0.getCoalescedEvents(),
      vF: (x0,x1) => x0.decode(x1),
      vG: x0 => x0.maxWidth,
      vH: (a, i) => a.splice(i, 1),
      vI: x0 => x0.canvasKitMaximumSurfaces,
      vJ: x0 => x0.fontManifest,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.target,
      wD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      wE: s => s.trimLeft(),
      wF: (x0,x1) => x0.adoptText(x1),
      wG: x0 => x0.minHeight,
      wH: a => a.pop(),
      wI: x0 => x0.hostElement,
      wJ: x0 => x0.assetManifest,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.clientY,
      xD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      xE: s => s.toUpperCase(),
      xF: x0 => x0.first(),
      xG: x0 => x0.minWidth,
      xH: x0 => new WeakRef(x0),
      xI: x0 => x0.location,
      xJ: x0 => x0.buildConfig,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.clientX,
      yD: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      yE: (x0,x1) => x0.test(x1),
      yF: x0 => x0.next(),
      yG: (x0,x1) => x0.removeProperty(x1),
      yH: x0 => x0.deref(),
      yI: (x0,x1) => x0.getModifierState(x1),
      yJ: x0 => x0.length,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      zC: (x0,x1,x2) => x0.addEventListener(x1,x2),
      zD: (o, i) => o[i],
      zE: (x0,x1) => x0[x1],
      zF: x0 => x0.current(),
      zG: (x0,x1) => x0.add(x1),
      zH: () => globalThis.WeakRef,
      zI: x0 => x0.metaKey,
      zJ: x0 => x0.getReader(),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}

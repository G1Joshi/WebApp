// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
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
            AB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      AC: o => o.buffer,
      AD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      AE: x0 => x0.debugShowSemanticsNodes,
      AF: x0 => x0.isConnected,
      AG: x0 => x0.type,
      AH: x0 => x0.innerWidth,
      AI: () => globalThis.WeakRef,
      AJ: x0 => x0.imageBitmaps,
      B: s => printToConsole(s),
      BB: Function.prototype.call.bind(String.prototype.toLowerCase),
      BC: (b, o) => new DataView(b, o),
      BD: (x0,x1) => x0.go(x1),
      BE: (o, c) => o instanceof c,
      BF: x0 => x0.click(),
      BG: x0 => x0.hasFocus(),
      BH: x0 => x0.width,
      BI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      BJ: x0 => x0.canvasKitMaximumSurfaces,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (o, p, r) => o.replace(p, () => r),
      CC: (b, o, l) => new DataView(b, o, l),
      CD: x0 => x0.hash,
      CE: x0 => x0.vendor,
      CF: (x0,x1) => x0.getElementsByClassName(x1),
      CG: x0 => x0.shiftKey,
      CH: x0 => x0.clientWidth,
      CI: (a, s, e) => a.slice(s, e),
      CJ: x0 => x0.hostElement,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (x0,x1) => { x0.lastIndex = x1 },
      DC: Function.prototype.call.bind(DataView.prototype.getUint8),
      DD: x0 => x0.location,
      DE: (x0,x1) => x0.createTextNode(x1),
      DF: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      DG: x0 => x0.visibilityState,
      DH: (x0,x1) => x0.removeChild(x1),
      DI: (x0,x1) => x0.revokeObjectURL(x1),
      DJ: x0 => x0.location,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      EC: Function.prototype.call.bind(DataView.prototype.setUint8),
      ED: x0 => x0.search,
      EE: (x0,x1) => { x0.nonce = x1 },
      EF: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      EG: x0 => x0.disconnect(),
      EH: x0 => x0.firstChild,
      EI: (x0,x1) => { x0.src = x1 },
      EJ: (x0,x1) => x0.getModifierState(x1),
      F: () => new Error().stack,
      FB: o => o instanceof RegExp,
      FC: Function.prototype.call.bind(DataView.prototype.getFloat64),
      FD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      FE: x0 => x0.nonce,
      FF: (x0,x1) => x0.contains(x1),
      FG: x0 => new Intl.Locale(x0),
      FH: x0 => x0.viewConstraints,
      FI: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      FJ: x0 => x0.metaKey,
      G: s => JSON.stringify(s),
      GB: x0 => x0.dotAll,
      GC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      GD: x0 => x0.pathname,
      GE: () => globalThis.window.flutterConfiguration,
      GF: (s) => +s,
      GG: x0 => x0.region,
      GH: x0 => x0.hostElement,
      GI: x0 => x0.naturalHeight,
      GJ: x0 => x0.altKey,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => x0.unicode,
      HC: (t, s) => t.set(s),
      HD: (x0,x1) => x0.append(x1),
      HE: (x0,x1) => x0.attachShadow(x1),
      HF: x0 => x0.target,
      HG: x0 => x0.script,
      HH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      HI: x0 => x0.naturalWidth,
      HJ: x0 => x0.ctrlKey,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => x0.ignoreCase,
      IC: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ID: (x0,x1) => { x0.textContent = x1 },
      IE: x0 => x0.preventDefault(),
      IF: (x0,x1) => x0.dispatchEvent(x1),
      IG: x0 => x0.language,
      IH: x0 => ({runApp: x0}),
      II: x0 => x0.decode(),
      IJ: x0 => x0.isComposing,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => x0.multiline,
      JC: Function.prototype.call.bind(DataView.prototype.getFloat32),
      JD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      JE: (x0,x1) => x0.contains(x1),
      JF: (x0,x1) => x0.createEvent(x1),
      JG: x0 => x0.languages,
      JH: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      JI: (x0,x1) => { x0.decoding = x1 },
      JJ: x0 => x0.code,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (o, p, r) => o.replaceAll(p, () => r),
      KC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      KD: x0 => x0.parentElement,
      KE: (x0,x1) => x0.focus(x1),
      KF: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      KG: (x0,x1) => x0.observe(x1),
      KH: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      KI: (x0,x1) => { x0.crossOrigin = x1 },
      KJ: x0 => x0.repeat,
      L: o => o === undefined,
      LB: (x0,x1) => x0[x1],
      LC: Function.prototype.call.bind(DataView.prototype.getUint32),
      LD: (x0,x1) => x0.querySelectorAll(x1),
      LE: (x0,x1) => x0.closest(x1),
      LF: () => globalThis.window,
      LG: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      LH: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      LI: (x0,x1) => x0.createObjectURL(x1),
      LJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      M: o => String(o),
      MB: x0 => x0.length,
      MC: Function.prototype.call.bind(DataView.prototype.setUint32),
      MD: x0 => x0.length,
      ME: (x0,x1) => x0.getAttribute(x1),
      MF: x0 => x0.readText(),
      MG: x0 => new ResizeObserver(x0),
      MH: () => typeof dartUseDateNowForTicks !== "undefined",
      MI: x0 => x0.URL,
      MJ: (x0,x1) => x0.getItem(x1),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: o => o,
      NC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      ND: (x0,x1) => x0.item(x1),
      NE: x0 => x0.activeElement,
      NF: x0 => x0.clipboard,
      NG: x0 => globalThis.parseFloat(x0),
      NH: () => Date.now(),
      NI: x0 => new Blob(x0),
      NJ: x0 => x0.localStorage,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      OC: Function.prototype.call.bind(DataView.prototype.getInt32),
      OD: x0 => x0.userAgent,
      OE: (x0,x1) => x0.add(x1),
      OF: (x0,x1) => x0.writeText(x1),
      OG: (x0,x1) => x0.getComputedStyle(x1),
      OH: () => 1000 * performance.now(),
      OI: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      OJ: () => globalThis.window,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: (x0,x1) => x0.exec(x1),
      PC: Function.prototype.call.bind(DataView.prototype.setInt32),
      PD: x0 => x0.maxTouchPoints,
      PE: x0 => x0.classList,
      PF: x0 => x0.unlock(),
      PG: x0 => x0.documentElement,
      PH: x0 => new Uint8Array(x0),
      PI: x0 => new window.ImageDecoder(x0),
      PJ: (x0,x1) => x0.key(x1),
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: x0 => x0.index,
      QC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      QD: x0 => x0.platform,
      QE: x0 => x0.data,
      QF: (x0,x1) => x0.lock(x1),
      QG: x0 => x0.computedStyleMap(),
      QH: (x0,x1,x2) => x0.slice(x1,x2),
      QI: x0 => x0.name,
      QJ: x0 => x0.length,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: x0 => x0.flags,
      RC: o => o instanceof Uint16Array,
      RD: x0 => x0.navigator,
      RE: x0 => x0.scrollTop,
      RF: x0 => x0.orientation,
      RG: (x0,x1) => x0.get(x1),
      RH: (x0,x1) => x0.decode(x1),
      RI: x0 => x0.repetitionCount,
      RJ: (x0,x1,x2) => x0.setItem(x1,x2),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: s => s.trim(),
      SC: Function.prototype.call.bind(DataView.prototype.getUint16),
      SD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      SE: (handle) => clearTimeout(handle),
      SF: (x0,x1) => x0.querySelector(x1),
      SG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      SH: (x0,x1) => x0.adoptText(x1),
      SI: x0 => x0.frameCount,
      SJ: x0 => x0.length,
      T: x0 => new Promise(x0),
      TB: (a, s) => a.join(s),
      TC: Function.prototype.call.bind(DataView.prototype.setUint16),
      TD: Date.now,
      TE: (x0,x1) => { x0.scrollTop = x1 },
      TF: (x0,x1) => { x0.content = x1 },
      TG: x0 => x0.matches,
      TH: x0 => x0.first(),
      TI: x0 => x0.selectedTrack,
      TJ: x0 => x0.getReader(),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: x0 => x0.random(),
      UC: o => o instanceof Int16Array,
      UD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      UE: x0 => x0.tagName,
      UF: x0 => x0.head,
      UG: (x0,x1) => x0.matchMedia(x1),
      UH: x0 => x0.next(),
      UI: x0 => x0.completed,
      UJ: x0 => x0.value,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: () => globalThis.Math,
      VC: Function.prototype.call.bind(DataView.prototype.getInt16),
      VD: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      VE: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      VF: (x0,x1) => { x0.name = x1 },
      VG: x0 => x0.matches,
      VH: x0 => x0.current(),
      VI: x0 => x0.ready,
      VJ: x0 => x0.done,
      W: x0 => new Array(x0),
      WB: (x0,x1) => x0.error(x1),
      WC: Function.prototype.call.bind(DataView.prototype.setInt16),
      WD: x0 => x0.style,
      WE: (x0,x1) => { x0.value = x1 },
      WF: (x0,x1) => { x0.title = x1 },
      WG: x0 => x0.timeStamp,
      WH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      WI: x0 => x0.tracks,
      WJ: x0 => x0.read(),
      X: o => [o],
      XB: () => globalThis.console,
      XC: o => o instanceof Uint8ClampedArray,
      XD: (x0,x1) => x0.createElement(x1),
      XE: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      XF: () => globalThis.document,
      XG: (x0,x1) => x0.hasAttribute(x1),
      XH: x0 => x0.v8BreakIterator,
      XI: x0 => x0.close(),
      XJ: x0 => x0.body,
      Y: (o0, o1) => [o0, o1],
      YB: s => s.trimRight(),
      YC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      YD: x0 => x0.body,
      YE: (x0,x1) => { x0.value = x1 },
      YF: (x0,x1) => x0.vibrate(x1),
      YG: x0 => x0.buttons,
      YH: () => globalThis.Intl,
      YI: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      YJ: (x0,x1) => new OffscreenCanvas(x0,x1),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      ZC: Function.prototype.call.bind(DataView.prototype.setInt8),
      ZD: x0 => x0.remove(),
      ZE: x0 => x0.relatedTarget,
      ZF: (o, p) => p in o,
      ZG: x0 => x0.ctrlKey,
      ZH: (x0,x1) => x0.segment(x1),
      ZI: (x0,x1) => x0.decode(x1),
      ZJ: x0 => x0.assetBase,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: () => ({}),
      aC: Function.prototype.call.bind(DataView.prototype.getInt8),
      aD: (x0,x1) => x0.getPropertyValue(x1),
      aE: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      aF: x0 => x0.arrayBuffer(),
      aG: x0 => x0.y,
      aH: x0 => x0.index,
      aI: x0 => x0.displayHeight,
      aJ: x0 => x0.loader,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: (o, p, v) => o[p] = v,
      bC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      bD: (x0,x1) => x0.warn(x1),
      bE: x0 => x0.value,
      bF: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      bG: x0 => x0.x,
      bH: x0 => x0.next(),
      bI: x0 => x0.displayWidth,
      bJ: () => globalThis._flutter,
      c: o => o,
      cB: () => [],
      cC: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      cD: x0 => x0.console,
      cE: x0 => x0.selectionDirection,
      cF: x0 => x0.status,
      cG: x0 => x0.offsetTop,
      cH: x0 => x0.value,
      cI: x0 => x0.duration,
      d: (o, p) => o[p],
      dB: (a, i) => a.push(i),
      dC: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      dD: (x0,x1) => { x0.id = x1 },
      dE: x0 => x0.selectionStart,
      dF: (x0,x1) => x0.fetch(x1),
      dG: x0 => x0.scrollLeft,
      dH: x0 => x0.done,
      dI: x0 => x0.image,
      e: () => globalThis,
      eB: b => !!b,
      eC: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      eD: (x0,x1) => x0.requestAnimationFrame(x1),
      eE: x0 => x0.selectionEnd,
      eF: x0 => x0.content,
      eG: x0 => x0.offsetLeft,
      eH: (o, m, a) => o[m].apply(o, a),
      eI: () => globalThis.window.ImageDecoder,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: x0 => new Int8Array(x0),
      fC: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      fD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fE: x0 => x0.value,
      fF: x0 => x0.document,
      fG: x0 => x0.offsetParent,
      fH: x0 => x0.iterator,
      fI: (x0,x1,x2) => x0.insertBefore(x1,x2),
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      gC: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      gD: x0 => x0.now(),
      gE: x0 => x0.selectionDirection,
      gF: x0 => x0.language,
      gG: x0 => x0.deltaMode,
      gH: () => globalThis.Symbol,
      gI: x0 => x0.id,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: x0 => new Uint8Array(x0),
      hC: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      hD: x0 => x0.performance,
      hE: x0 => x0.selectionStart,
      hF: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      hG: x0 => x0.deltaY,
      hH: (x0,x1) => new Intl.Segmenter(x0,x1),
      hI: x0 => x0.offsetHeight,
      i: (string, token) => string.split(token),
      iB: x0 => new Uint8ClampedArray(x0),
      iC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      iD: (x0,x1) => x0.unregister(x1),
      iE: x0 => x0.selectionEnd,
      iF: (x0,x1) => x0.prepend(x1),
      iG: x0 => x0.deltaX,
      iH: x0 => x0.Segmenter,
      iI: x0 => x0.offsetWidth,
      j: o => o instanceof Array,
      jB: x0 => new Int16Array(x0),
      jC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      jD: () => globalThis.window.FinalizationRegistry,
      jE: x0 => x0.keyCode,
      jF: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      jG: x0 => x0.wheelDeltaY,
      jH: x0 => x0.buffer,
      jI: x0 => x0.stopPropagation(),
      k: (a, i) => a[i],
      kB: x0 => new Uint16Array(x0),
      kC: x0 => x0.history,
      kD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kE: (x0,x1) => x0.scrollIntoView(x1),
      kF: (x0,x1) => x0.querySelector(x1),
      kG: x0 => x0.wheelDeltaX,
      kH: x0 => x0.wasmMemory,
      kI: x0 => x0.disabled,
      l: a => a.length,
      lB: x0 => new Int32Array(x0),
      lC: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      lD: x0 => new window.FinalizationRegistry(x0),
      lE: x0 => x0.multiViewEnabled,
      lF: (x0,x1) => x0.querySelectorAll(x1),
      lG: x0 => x0.key,
      lH: () => globalThis.window._flutter_skwasmInstance,
      lI: (x0,x1) => { x0.min = x1 },
      m: (string, times) => string.repeat(times),
      mB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      mC: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      mD: x0 => x0.scale,
      mE: x0 => x0.parent,
      mF: x0 => x0.tabIndex,
      mG: x0 => x0.identifier,
      mH: () => new TextDecoder(),
      mI: (x0,x1) => { x0.max = x1 },
      n: (decoder, codeUnits) => decoder.decode(codeUnits),
      nB: x0 => new Uint32Array(x0),
      nC: o => Object.keys(o),
      nD: x0 => x0.visualViewport,
      nE: (x0,x1) => x0.replaceWith(x1),
      nF: x0 => x0.parentNode,
      nG: x0 => x0.touches,
      nH: (a, i) => a.splice(i, 1),
      nI: (x0,x1) => { x0.disabled = x1 },
      o: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      oB: x0 => new Float32Array(x0),
      oC: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      oD: x0 => x0.devicePixelRatio,
      oE: (x0,x1) => { x0.type = x1 },
      oF: x0 => x0.clientY,
      oG: x0 => x0.pressure,
      oH: a => a.pop(),
      oI: (x0,x1) => { x0.scrollLeft = x1 },
      p: () => new TextDecoder("utf-8", {fatal: true}),
      pB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      pC: f => f.dartFunction,
      pD: (d, digits) => d.toFixed(digits),
      pE: (x0,x1) => { x0.className = x1 },
      pF: x0 => x0.clientX,
      pG: x0 => x0.tiltY,
      pH: (map, o, v) => map.set(o, v),
      pI: (x0,x1) => { x0.spellcheck = x1 },
      q: () => new TextDecoder("utf-8", {fatal: false}),
      qB: x0 => new Float64Array(x0),
      qC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qD: x0 => x0.maxHeight,
      qE: (x0,x1) => { x0.tabIndex = x1 },
      qF: x0 => x0.getBoundingClientRect(),
      qG: x0 => x0.tiltX,
      qH: (map, o) => map.get(o),
      qI: (x0,x1) => { x0.disabled = x1 },
      r: s => s.trimLeft(),
      rB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      rC: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      rD: x0 => x0.maxWidth,
      rE: (x0,x1) => { x0.name = x1 },
      rF: x0 => x0.bottom,
      rG: x0 => x0.pointerType,
      rH: () => new WeakMap(),
      rI: x0 => x0.baseURI,
      s: (l, r) => l === r,
      sB: x0 => new ArrayBuffer(x0),
      sC: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      sD: x0 => x0.minHeight,
      sE: (x0,x1) => { x0.placeholder = x1 },
      sF: x0 => x0.top,
      sG: x0 => x0.pointerId,
      sH: x0 => x0.debugSkipFontRetryDelay,
      sI: (x0,x1) => x0.transferFromImageBitmap(x1),
      t: s => s.toUpperCase(),
      tB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      tC: (o, i) => o[i],
      tD: x0 => x0.minWidth,
      tE: (x0,x1) => { x0.autocomplete = x1 },
      tF: x0 => x0.right,
      tG: x0 => x0.getCoalescedEvents(),
      tH: (x0,x1,x2) => x0.set(x1,x2),
      tI: (x0,x1) => x0.getContext(x1),
      u: Object.is,
      uB: (x0,x1,x2) => new DataView(x0,x1,x2),
      uC: o => o.length,
      uD: x0 => x0.height,
      uE: (x0,x1) => { x0.name = x1 },
      uF: x0 => x0.left,
      uG: (x0,x1) => x0.getModifierState(x1),
      uH: x0 => x0.fontFallbackBaseUrl,
      uI: (x0,x1) => { x0.height = x1 },
      v: (x0,x1) => x0.test(x1),
      vB: (o, p) => o[p],
      vC: o => {
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
      vD: x0 => x0.width,
      vE: (x0,x1) => { x0.placeholder = x1 },
      vF: x0 => x0.clientY,
      vG: x0 => x0.blur(),
      vH: (handle) => clearInterval(handle),
      vI: (x0,x1) => { x0.width = x1 },
      w: o => o,
      wB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      wC: x0 => x0.state,
      wD: x0 => x0.screen,
      wE: (x0,x1) => { x0.action = x1 },
      wF: x0 => x0.clientX,
      wG: x0 => x0.button,
      wH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      wI: x0 => x0.height,
      x: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      xB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      xC: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      xD: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      xE: (x0,x1) => { x0.method = x1 },
      xF: x0 => x0.changedTouches,
      xG: x0 => x0.innerHeight,
      xH: () => Date.now(),
      xI: x0 => x0.width,
      y: (a, i, v) => a[i] = v,
      yB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      yC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      yD: (x0,x1) => x0.removeProperty(x1),
      yE: (x0,x1) => { x0.noValidate = x1 },
      yF: x0 => x0.offsetY,
      yG: x0 => x0.height,
      yH: x0 => new WeakRef(x0),
      yI: x0 => x0.rasterEndMilliseconds,
      z: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      zB: o => o.byteOffset,
      zC: x0 => x0.state,
      zD: (x0,x1) => x0.appendChild(x1),
      zE: (x0,x1) => x0.removeAttribute(x1),
      zF: x0 => x0.offsetX,
      zG: x0 => x0.clientHeight,
      zH: x0 => x0.deref(),
      zI: x0 => x0.rasterStartMilliseconds,

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

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
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

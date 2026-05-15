(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/crypt/crypt.js
  var require_crypt = __commonJS({
    "node_modules/crypt/crypt.js"(exports, module) {
      (function() {
        var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", crypt = {
          // Bit-wise rotation left
          rotl: function(n, b) {
            return n << b | n >>> 32 - b;
          },
          // Bit-wise rotation right
          rotr: function(n, b) {
            return n << 32 - b | n >>> b;
          },
          // Swap big-endian to little-endian and vice versa
          endian: function(n) {
            if (n.constructor == Number) {
              return crypt.rotl(n, 8) & 16711935 | crypt.rotl(n, 24) & 4278255360;
            }
            for (var i = 0; i < n.length; i++)
              n[i] = crypt.endian(n[i]);
            return n;
          },
          // Generate an array of any length of random bytes
          randomBytes: function(n) {
            for (var bytes = []; n > 0; n--)
              bytes.push(Math.floor(Math.random() * 256));
            return bytes;
          },
          // Convert a byte array to big-endian 32-bit words
          bytesToWords: function(bytes) {
            for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
              words[b >>> 5] |= bytes[i] << 24 - b % 32;
            return words;
          },
          // Convert big-endian 32-bit words to a byte array
          wordsToBytes: function(words) {
            for (var bytes = [], b = 0; b < words.length * 32; b += 8)
              bytes.push(words[b >>> 5] >>> 24 - b % 32 & 255);
            return bytes;
          },
          // Convert a byte array to a hex string
          bytesToHex: function(bytes) {
            for (var hex = [], i = 0; i < bytes.length; i++) {
              hex.push((bytes[i] >>> 4).toString(16));
              hex.push((bytes[i] & 15).toString(16));
            }
            return hex.join("");
          },
          // Convert a hex string to a byte array
          hexToBytes: function(hex) {
            for (var bytes = [], c = 0; c < hex.length; c += 2)
              bytes.push(parseInt(hex.substr(c, 2), 16));
            return bytes;
          },
          // Convert a byte array to a base-64 string
          bytesToBase64: function(bytes) {
            for (var base64 = [], i = 0; i < bytes.length; i += 3) {
              var triplet = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
              for (var j = 0; j < 4; j++)
                if (i * 8 + j * 6 <= bytes.length * 8)
                  base64.push(base64map.charAt(triplet >>> 6 * (3 - j) & 63));
                else
                  base64.push("=");
            }
            return base64.join("");
          },
          // Convert a base-64 string to a byte array
          base64ToBytes: function(base64) {
            base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");
            for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
              if (imod4 == 0) continue;
              bytes.push((base64map.indexOf(base64.charAt(i - 1)) & Math.pow(2, -2 * imod4 + 8) - 1) << imod4 * 2 | base64map.indexOf(base64.charAt(i)) >>> 6 - imod4 * 2);
            }
            return bytes;
          }
        };
        module.exports = crypt;
      })();
    }
  });

  // node_modules/charenc/charenc.js
  var require_charenc = __commonJS({
    "node_modules/charenc/charenc.js"(exports, module) {
      var charenc = {
        // UTF-8 encoding
        utf8: {
          // Convert a string to a byte array
          stringToBytes: function(str4) {
            return charenc.bin.stringToBytes(unescape(encodeURIComponent(str4)));
          },
          // Convert a byte array to a string
          bytesToString: function(bytes) {
            return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
          }
        },
        // Binary encoding
        bin: {
          // Convert a string to a byte array
          stringToBytes: function(str4) {
            for (var bytes = [], i = 0; i < str4.length; i++)
              bytes.push(str4.charCodeAt(i) & 255);
            return bytes;
          },
          // Convert a byte array to a string
          bytesToString: function(bytes) {
            for (var str4 = [], i = 0; i < bytes.length; i++)
              str4.push(String.fromCharCode(bytes[i]));
            return str4.join("");
          }
        }
      };
      module.exports = charenc;
    }
  });

  // node_modules/is-buffer/index.js
  var require_is_buffer = __commonJS({
    "node_modules/is-buffer/index.js"(exports, module) {
      module.exports = function(obj) {
        return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
      };
      function isBuffer(obj) {
        return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
      }
      function isSlowBuffer(obj) {
        return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isBuffer(obj.slice(0, 0));
      }
    }
  });

  // node_modules/md5/md5.js
  var require_md5 = __commonJS({
    "node_modules/md5/md5.js"(exports, module) {
      (function() {
        var crypt = require_crypt(), utf8 = require_charenc().utf8, isBuffer = require_is_buffer(), bin = require_charenc().bin, md53 = function(message, options) {
          if (message.constructor == String)
            if (options && options.encoding === "binary")
              message = bin.stringToBytes(message);
            else
              message = utf8.stringToBytes(message);
          else if (isBuffer(message))
            message = Array.prototype.slice.call(message, 0);
          else if (!Array.isArray(message) && message.constructor !== Uint8Array)
            message = message.toString();
          var m = crypt.bytesToWords(message), l = message.length * 8, a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
          for (var i = 0; i < m.length; i++) {
            m[i] = (m[i] << 8 | m[i] >>> 24) & 16711935 | (m[i] << 24 | m[i] >>> 8) & 4278255360;
          }
          m[l >>> 5] |= 128 << l % 32;
          m[(l + 64 >>> 9 << 4) + 14] = l;
          var FF = md53._ff, GG = md53._gg, HH = md53._hh, II = md53._ii;
          for (var i = 0; i < m.length; i += 16) {
            var aa = a, bb = b, cc = c, dd = d;
            a = FF(a, b, c, d, m[i + 0], 7, -680876936);
            d = FF(d, a, b, c, m[i + 1], 12, -389564586);
            c = FF(c, d, a, b, m[i + 2], 17, 606105819);
            b = FF(b, c, d, a, m[i + 3], 22, -1044525330);
            a = FF(a, b, c, d, m[i + 4], 7, -176418897);
            d = FF(d, a, b, c, m[i + 5], 12, 1200080426);
            c = FF(c, d, a, b, m[i + 6], 17, -1473231341);
            b = FF(b, c, d, a, m[i + 7], 22, -45705983);
            a = FF(a, b, c, d, m[i + 8], 7, 1770035416);
            d = FF(d, a, b, c, m[i + 9], 12, -1958414417);
            c = FF(c, d, a, b, m[i + 10], 17, -42063);
            b = FF(b, c, d, a, m[i + 11], 22, -1990404162);
            a = FF(a, b, c, d, m[i + 12], 7, 1804603682);
            d = FF(d, a, b, c, m[i + 13], 12, -40341101);
            c = FF(c, d, a, b, m[i + 14], 17, -1502002290);
            b = FF(b, c, d, a, m[i + 15], 22, 1236535329);
            a = GG(a, b, c, d, m[i + 1], 5, -165796510);
            d = GG(d, a, b, c, m[i + 6], 9, -1069501632);
            c = GG(c, d, a, b, m[i + 11], 14, 643717713);
            b = GG(b, c, d, a, m[i + 0], 20, -373897302);
            a = GG(a, b, c, d, m[i + 5], 5, -701558691);
            d = GG(d, a, b, c, m[i + 10], 9, 38016083);
            c = GG(c, d, a, b, m[i + 15], 14, -660478335);
            b = GG(b, c, d, a, m[i + 4], 20, -405537848);
            a = GG(a, b, c, d, m[i + 9], 5, 568446438);
            d = GG(d, a, b, c, m[i + 14], 9, -1019803690);
            c = GG(c, d, a, b, m[i + 3], 14, -187363961);
            b = GG(b, c, d, a, m[i + 8], 20, 1163531501);
            a = GG(a, b, c, d, m[i + 13], 5, -1444681467);
            d = GG(d, a, b, c, m[i + 2], 9, -51403784);
            c = GG(c, d, a, b, m[i + 7], 14, 1735328473);
            b = GG(b, c, d, a, m[i + 12], 20, -1926607734);
            a = HH(a, b, c, d, m[i + 5], 4, -378558);
            d = HH(d, a, b, c, m[i + 8], 11, -2022574463);
            c = HH(c, d, a, b, m[i + 11], 16, 1839030562);
            b = HH(b, c, d, a, m[i + 14], 23, -35309556);
            a = HH(a, b, c, d, m[i + 1], 4, -1530992060);
            d = HH(d, a, b, c, m[i + 4], 11, 1272893353);
            c = HH(c, d, a, b, m[i + 7], 16, -155497632);
            b = HH(b, c, d, a, m[i + 10], 23, -1094730640);
            a = HH(a, b, c, d, m[i + 13], 4, 681279174);
            d = HH(d, a, b, c, m[i + 0], 11, -358537222);
            c = HH(c, d, a, b, m[i + 3], 16, -722521979);
            b = HH(b, c, d, a, m[i + 6], 23, 76029189);
            a = HH(a, b, c, d, m[i + 9], 4, -640364487);
            d = HH(d, a, b, c, m[i + 12], 11, -421815835);
            c = HH(c, d, a, b, m[i + 15], 16, 530742520);
            b = HH(b, c, d, a, m[i + 2], 23, -995338651);
            a = II(a, b, c, d, m[i + 0], 6, -198630844);
            d = II(d, a, b, c, m[i + 7], 10, 1126891415);
            c = II(c, d, a, b, m[i + 14], 15, -1416354905);
            b = II(b, c, d, a, m[i + 5], 21, -57434055);
            a = II(a, b, c, d, m[i + 12], 6, 1700485571);
            d = II(d, a, b, c, m[i + 3], 10, -1894986606);
            c = II(c, d, a, b, m[i + 10], 15, -1051523);
            b = II(b, c, d, a, m[i + 1], 21, -2054922799);
            a = II(a, b, c, d, m[i + 8], 6, 1873313359);
            d = II(d, a, b, c, m[i + 15], 10, -30611744);
            c = II(c, d, a, b, m[i + 6], 15, -1560198380);
            b = II(b, c, d, a, m[i + 13], 21, 1309151649);
            a = II(a, b, c, d, m[i + 4], 6, -145523070);
            d = II(d, a, b, c, m[i + 11], 10, -1120210379);
            c = II(c, d, a, b, m[i + 2], 15, 718787259);
            b = II(b, c, d, a, m[i + 9], 21, -343485551);
            a = a + aa >>> 0;
            b = b + bb >>> 0;
            c = c + cc >>> 0;
            d = d + dd >>> 0;
          }
          return crypt.endian([a, b, c, d]);
        };
        md53._ff = function(a, b, c, d, x, s, t) {
          var n = a + (b & c | ~b & d) + (x >>> 0) + t;
          return (n << s | n >>> 32 - s) + b;
        };
        md53._gg = function(a, b, c, d, x, s, t) {
          var n = a + (b & d | c & ~d) + (x >>> 0) + t;
          return (n << s | n >>> 32 - s) + b;
        };
        md53._hh = function(a, b, c, d, x, s, t) {
          var n = a + (b ^ c ^ d) + (x >>> 0) + t;
          return (n << s | n >>> 32 - s) + b;
        };
        md53._ii = function(a, b, c, d, x, s, t) {
          var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
          return (n << s | n >>> 32 - s) + b;
        };
        md53._blocksize = 16;
        md53._digestsize = 16;
        module.exports = function(message, options) {
          if (message === void 0 || message === null)
            throw new Error("Illegal argument " + message);
          var digestbytes = crypt.wordsToBytes(md53(message, options));
          return options && options.asBytes ? digestbytes : options && options.asString ? bin.bytesToString(digestbytes) : crypt.bytesToHex(digestbytes);
        };
      })();
    }
  });

  // node_modules/deepslate/lib/index.js
  var lib_exports = {};
  __export(lib_exports, {
    Aquifer: () => Aquifer,
    BiomeSource: () => BiomeSource,
    BlendedNoise: () => BlendedNoise,
    BlockColors: () => BlockColors,
    BlockDefinition: () => BlockDefinition,
    BlockModel: () => BlockModel,
    BlockPos: () => BlockPos,
    BlockState: () => BlockState,
    CheckerboardBiomeSource: () => CheckerboardBiomeSource,
    Chunk: () => Chunk,
    ChunkBuilder: () => ChunkBuilder,
    ChunkPos: () => ChunkPos,
    ChunkSection: () => ChunkSection,
    Climate: () => Climate,
    Color: () => Color,
    CubicSpline: () => CubicSpline,
    Cull: () => Cull,
    DensityFunction: () => DensityFunction,
    Direction: () => Direction,
    EFFECT_COLORS: () => EFFECT_COLORS,
    FixedBiomeSource: () => FixedBiomeSource,
    FluidStatus: () => FluidStatus,
    HeightProvider: () => HeightProvider,
    Heightmap: () => Heightmap,
    Holder: () => Holder,
    HolderSet: () => HolderSet,
    Identifier: () => Identifier,
    ImprovedNoise: () => ImprovedNoise,
    ItemModel: () => ItemModel,
    ItemRenderer: () => ItemRenderer,
    ItemStack: () => ItemStack,
    ItemTint: () => ItemTint,
    Json: () => Json,
    LegacyPositionalRandom: () => LegacyPositionalRandom,
    LegacyRandom: () => LegacyRandom,
    Line: () => Line,
    MaterialRule: () => MaterialRule,
    Matrix3: () => Matrix3,
    Matrix4: () => Matrix4,
    Mesh: () => Mesh,
    MinMaxNumberFunction: () => MinMaxNumberFunction,
    MobEffectInstance: () => MobEffectInstance,
    MultiNoiseBiomeSource: () => MultiNoiseBiomeSource,
    NbtAbstractList: () => NbtAbstractList,
    NbtByte: () => NbtByte,
    NbtByteArray: () => NbtByteArray,
    NbtChunk: () => NbtChunk,
    NbtCompound: () => NbtCompound,
    NbtDouble: () => NbtDouble,
    NbtEnd: () => NbtEnd,
    NbtFile: () => NbtFile,
    NbtFloat: () => NbtFloat,
    NbtInt: () => NbtInt,
    NbtIntArray: () => NbtIntArray,
    NbtList: () => NbtList,
    NbtLong: () => NbtLong,
    NbtLongArray: () => NbtLongArray,
    NbtRegion: () => NbtRegion,
    NbtShort: () => NbtShort,
    NbtString: () => NbtString,
    NbtTag: () => NbtTag,
    NbtType: () => NbtType,
    NoiseAquifer: () => NoiseAquifer,
    NoiseChunk: () => NoiseChunk,
    NoiseChunkGenerator: () => NoiseChunkGenerator,
    NoiseGeneratorSettings: () => NoiseGeneratorSettings,
    NoiseParameters: () => NoiseParameters,
    NoiseRouter: () => NoiseRouter,
    NoiseSettings: () => NoiseSettings,
    NoiseSlideSettings: () => NoiseSlideSettings,
    NormalNoise: () => NormalNoise,
    POTION_EFFECTS: () => POTION_EFFECTS,
    PalettedContainer: () => PalettedContainer,
    PerlinNoise: () => PerlinNoise,
    PerlinSimplexNoise: () => PerlinSimplexNoise,
    PotionContents: () => PotionContents,
    Quad: () => Quad,
    RandomState: () => RandomState,
    RawDataInput: () => RawDataInput,
    RawDataOutput: () => RawDataOutput,
    Registry: () => Registry,
    Renderer: () => Renderer,
    Rotation: () => Rotation,
    ShaderProgram: () => ShaderProgram,
    SimplexNoise: () => SimplexNoise,
    SpecialRenderers: () => SpecialRenderers,
    StringReader: () => StringReader,
    Structure: () => Structure,
    StructurePlacement: () => StructurePlacement,
    StructurePoolElement: () => StructurePoolElement,
    StructureRenderer: () => StructureRenderer,
    StructureSet: () => StructureSet,
    StructureTemplatePool: () => StructureTemplatePool,
    SurfaceCondition: () => SurfaceCondition,
    SurfaceContext: () => SurfaceContext,
    SurfaceRule: () => SurfaceRule,
    SurfaceSystem: () => SurfaceSystem,
    TextureAtlas: () => TextureAtlas,
    Vector: () => Vector,
    Vertex: () => Vertex,
    VerticalAnchor: () => VerticalAnchor,
    VoxelRenderer: () => VoxelRenderer,
    WorldgenRegistries: () => WorldgenRegistries,
    WorldgenStructure: () => WorldgenStructure,
    XoroshiroPositionalRandom: () => XoroshiroPositionalRandom,
    XoroshiroRandom: () => XoroshiroRandom,
    binarySearch: () => binarySearch,
    clamp: () => clamp,
    clampedLerp: () => clampedLerp,
    clampedMap: () => clampedMap,
    computeIfAbsent: () => computeIfAbsent,
    floatLerp: () => floatLerp,
    getSeed: () => getSeed,
    intFloor: () => intFloor,
    inverseLerp: () => inverseLerp,
    isPowerOfTwo: () => isPowerOfTwo,
    jsonToNbt: () => jsonToNbt,
    lazy: () => lazy,
    lazyLerp: () => lazyLerp,
    lazyLerp2: () => lazyLerp2,
    lazyLerp3: () => lazyLerp3,
    lerp: () => lerp,
    lerp2: () => lerp2,
    lerp3: () => lerp3,
    longFloor: () => longFloor,
    longfromBytes: () => longfromBytes,
    map: () => map,
    mutateWithDefault: () => mutateWithDefault,
    nextInt: () => nextInt,
    randomBetweenInclusive: () => randomBetweenInclusive,
    shuffle: () => shuffle,
    smoothstep: () => smoothstep,
    square: () => square,
    upperPowerOfTwo: () => upperPowerOfTwo
  });

  // node_modules/deepslate/lib/nbt/Util.js
  function hasGzipHeader(array) {
    var head = array.slice(0, 2);
    return head.length === 2 && head[0] === 31 && head[1] === 139;
  }
  function hasZlibHeader(array) {
    const head = array.slice(0, 2);
    return head.length === 2 && head[0] === 120 && (head[1] === 1 || head[1] === 94 || head[1] === 156 || head[2] === 218);
  }
  function getBedrockHeader(array) {
    const head = array.slice(0, 8);
    const view = new DataView(head.buffer, head.byteOffset);
    const version = view.getUint32(0, true);
    const length2 = view.getUint32(4, true);
    if (head.length === 8 && version > 0 && version < 100 && length2 === array.byteLength - 8) {
      return version;
    }
    return void 0;
  }
  function encodeUTF8(str4) {
    var array = [], i, c;
    for (i = 0; i < str4.length; i++) {
      c = str4.charCodeAt(i);
      if (c < 128) {
        array.push(c);
      } else if (c < 2048) {
        array.push(192 | c >> 6);
        array.push(128 | c & 63);
      } else if (c < 65536) {
        array.push(224 | c >> 12);
        array.push(128 | c >> 6 & 63);
        array.push(128 | c & 63);
      } else {
        array.push(240 | c >> 18 & 7);
        array.push(128 | c >> 12 & 63);
        array.push(128 | c >> 6 & 63);
        array.push(128 | c & 63);
      }
    }
    return array;
  }
  function decodeUTF8(array) {
    var codepoints = [], i;
    for (i = 0; i < array.length; i++) {
      if ((array[i] & 128) === 0) {
        codepoints.push(array[i] & 127);
      } else if (i + 1 < array.length && (array[i] & 224) === 192 && (array[i + 1] & 192) === 128) {
        codepoints.push((array[i] & 31) << 6 | array[i + 1] & 63);
      } else if (i + 2 < array.length && (array[i] & 240) === 224 && (array[i + 1] & 192) === 128 && (array[i + 2] & 192) === 128) {
        codepoints.push((array[i] & 15) << 12 | (array[i + 1] & 63) << 6 | array[i + 2] & 63);
      } else if (i + 3 < array.length && (array[i] & 248) === 240 && (array[i + 1] & 192) === 128 && (array[i + 2] & 192) === 128 && (array[i + 3] & 192) === 128) {
        codepoints.push((array[i] & 7) << 18 | (array[i + 1] & 63) << 12 | (array[i + 2] & 63) << 6 | array[i + 3] & 63);
      }
    }
    return String.fromCharCode.apply(null, codepoints);
  }

  // node_modules/deepslate/lib/nbt/io/DataInput.js
  var RawDataInput = class {
    littleEndian;
    offset;
    array;
    view;
    constructor(input, options) {
      this.littleEndian = options?.littleEndian ?? false;
      this.offset = options?.offset ?? 0;
      this.array = input instanceof Uint8Array ? input : new Uint8Array(input);
      this.view = new DataView(this.array.buffer, this.array.byteOffset);
    }
    readNumber(type, size) {
      const value = this.view[type](this.offset, this.littleEndian);
      this.offset += size;
      return value;
    }
    readByte = this.readNumber.bind(this, "getInt8", 1);
    readShort = this.readNumber.bind(this, "getInt16", 2);
    readInt = this.readNumber.bind(this, "getInt32", 4);
    readFloat = this.readNumber.bind(this, "getFloat32", 4);
    readDouble = this.readNumber.bind(this, "getFloat64", 8);
    readBytes(length2) {
      const bytes = this.array.slice(this.offset, this.offset + length2);
      this.offset += length2;
      return bytes;
    }
    readString() {
      const length2 = this.readShort();
      const bytes = this.readBytes(length2);
      return decodeUTF8(bytes);
    }
  };

  // node_modules/deepslate/lib/nbt/io/DataOutput.js
  var RawDataOutput = class {
    littleEndian;
    offset;
    buffer;
    array;
    view;
    constructor(options) {
      this.littleEndian = options?.littleEndian ?? false;
      this.offset = options?.offset ?? 0;
      this.buffer = new ArrayBuffer(options?.initialSize ?? 1024);
      this.array = new Uint8Array(this.buffer);
      this.view = new DataView(this.buffer);
    }
    accommodate(size) {
      const requiredLength = this.offset + size;
      if (this.buffer.byteLength >= requiredLength) {
        return;
      }
      let newLength = this.buffer.byteLength;
      while (newLength < requiredLength) {
        newLength *= 2;
      }
      const newBuffer = new ArrayBuffer(newLength);
      const newArray = new Uint8Array(newBuffer);
      newArray.set(this.array);
      if (this.offset > this.buffer.byteLength) {
        newArray.fill(0, this.buffer.byteLength, this.offset);
      }
      this.buffer = newBuffer;
      this.view = new DataView(newBuffer);
      this.array = newArray;
    }
    writeNumber(type, size, value) {
      this.accommodate(size);
      this.view[type](this.offset, value, this.littleEndian);
      this.offset += size;
    }
    writeByte = this.writeNumber.bind(this, "setInt8", 1);
    writeShort = this.writeNumber.bind(this, "setInt16", 2);
    writeInt = this.writeNumber.bind(this, "setInt32", 4);
    writeFloat = this.writeNumber.bind(this, "setFloat32", 4);
    writeDouble = this.writeNumber.bind(this, "setFloat64", 8);
    writeBytes(bytes) {
      this.accommodate(bytes.length);
      this.array.set(bytes, this.offset);
      this.offset += bytes.length;
    }
    writeString(value) {
      const bytes = encodeUTF8(value);
      this.writeShort(bytes.length);
      this.writeBytes(bytes);
    }
    getData() {
      this.accommodate(0);
      return this.array.slice(0, this.offset);
    }
  };

  // node_modules/deepslate/lib/util/Json.js
  var Json;
  (function(Json2) {
    function readNumber(obj) {
      return typeof obj === "number" ? obj : void 0;
    }
    Json2.readNumber = readNumber;
    function readInt(obj) {
      return typeof obj === "number" ? Math.floor(obj) : void 0;
    }
    Json2.readInt = readInt;
    function readString(obj) {
      return typeof obj === "string" ? obj : void 0;
    }
    Json2.readString = readString;
    function readBoolean(obj) {
      return typeof obj === "boolean" ? obj : void 0;
    }
    Json2.readBoolean = readBoolean;
    function readObject(obj) {
      return typeof obj === "object" && obj !== null && !Array.isArray(obj) ? obj : void 0;
    }
    Json2.readObject = readObject;
    function readArray(obj, parser) {
      if (!Array.isArray(obj))
        return void 0;
      if (!parser)
        return obj;
      return obj.map((el) => parser(el));
    }
    Json2.readArray = readArray;
    function readPair(obj, parser) {
      if (!Array.isArray(obj))
        return void 0;
      return [0, 1].map(((i) => parser(obj[i])));
    }
    Json2.readPair = readPair;
    function readMap(obj, parser) {
      const root = readObject(obj) ?? {};
      return Object.fromEntries(Object.entries(root).map(([k, v]) => [k, parser(v)]));
    }
    Json2.readMap = readMap;
    function compose(obj, parser, mapper) {
      const result = parser(obj);
      return result ? mapper(result) : void 0;
    }
    Json2.compose = compose;
    function readEnum(obj, values) {
      if (typeof obj !== "string")
        return values[0];
      if (values.includes(obj))
        return obj;
      return values[0];
    }
    Json2.readEnum = readEnum;
  })(Json || (Json = {}));

  // node_modules/deepslate/lib/util/Color.js
  var Color;
  (function(Color2) {
    function fromJson(obj) {
      const packed = Json.readNumber(obj);
      if (packed)
        return intToRgb(packed);
      const array = Json.readArray(obj, (o) => Json.readNumber(o) ?? 0);
      if (array === void 0 || array.length !== 3)
        return void 0;
      return array;
    }
    Color2.fromJson = fromJson;
    function fromNbt(nbt) {
      if (nbt.isNumber())
        return intToRgb(nbt.getAsNumber());
      if (!nbt.isListOrArray())
        return void 0;
      const values = nbt.getItems();
      if (values.length < 3)
        return void 0;
      return values.map((i) => i.getAsNumber());
    }
    Color2.fromNbt = fromNbt;
    function intToRgb(n) {
      const r = n >> 16 & 255;
      const g = n >> 8 & 255;
      const b = n & 255;
      return [r / 255, g / 255, b / 255];
    }
    Color2.intToRgb = intToRgb;
  })(Color || (Color = {}));

  // node_modules/deepslate/lib/util/StringReader.js
  var StringReader = class _StringReader {
    source;
    cursor;
    constructor(source) {
      this.source = source;
      this.cursor = 0;
    }
    get remainingLength() {
      return this.source.length - this.cursor;
    }
    get totalLength() {
      return this.source.length;
    }
    getRead(start = 0) {
      return this.source.substring(start, this.cursor);
    }
    getRemaining() {
      return this.source.substring(this.cursor);
    }
    canRead(length2 = 1) {
      return this.cursor + length2 <= this.source.length;
    }
    peek(offset = 0) {
      return this.source.charAt(this.cursor + offset);
    }
    read() {
      return this.source.charAt(this.cursor++);
    }
    skip() {
      this.cursor += 1;
    }
    skipWhitespace() {
      while (this.canRead() && _StringReader.isWhitespace(this.peek())) {
        this.skip();
      }
    }
    expect(c, skipWhitespace = false) {
      if (skipWhitespace) {
        this.skipWhitespace();
      }
      if (!this.canRead() || this.peek() !== c) {
        throw this.createError(`Expected '${c}'`);
      }
      this.skip();
    }
    readInt() {
      const start = this.cursor;
      while (this.canRead() && _StringReader.isAllowedInNumber(this.peek())) {
        this.skip();
      }
      const number = this.getRead(start);
      if (number.length === 0) {
        throw this.createError("Expected integer");
      }
      try {
        const value = Number(number);
        if (isNaN(value) || !Number.isInteger(value)) {
          throw new Error();
        }
        return value;
      } catch (e) {
        this.cursor = start;
        throw this.createError(`Invalid integer '${number}'`);
      }
    }
    readFloat() {
      const start = this.cursor;
      while (this.canRead() && _StringReader.isAllowedInNumber(this.peek())) {
        this.skip();
      }
      const number = this.getRead(start);
      if (number.length === 0) {
        throw this.createError("Expected float");
      }
      try {
        const value = Number(number);
        if (isNaN(value)) {
          throw new Error();
        }
        return value;
      } catch (e) {
        this.cursor = start;
        throw this.createError(`Invalid float '${number}'`);
      }
    }
    readUnquotedString() {
      const start = this.cursor;
      while (this.canRead() && _StringReader.isAllowedInUnquotedString(this.peek())) {
        this.skip();
      }
      return this.getRead(start);
    }
    readQuotedString() {
      if (!this.canRead()) {
        return "";
      }
      const c = this.peek();
      if (!_StringReader.isQuotedStringStart(c)) {
        throw this.createError("Expected quote to start a string");
      }
      this.skip();
      return this.readStringUntil(c);
    }
    readString() {
      if (!this.canRead()) {
        return "";
      }
      const c = this.peek();
      if (_StringReader.isQuotedStringStart(c)) {
        this.skip();
        return this.readStringUntil(c);
      }
      return this.readUnquotedString();
    }
    readStringUntil(terminator) {
      const result = [];
      let escaped = false;
      while (this.canRead()) {
        const c = this.read();
        if (escaped) {
          if (c === terminator || c === "\\") {
            result.push(c);
            escaped = false;
          } else {
            this.cursor -= 1;
            throw this.createError(`Invalid escape sequence '${c}' in quoted string`);
          }
        } else if (c === "\\") {
          escaped = true;
        } else if (c === terminator) {
          return result.join("");
        } else {
          result.push(c);
        }
      }
      throw this.createError("Unclosed quoted string");
    }
    readBoolean() {
      const start = this.cursor;
      const value = this.readUnquotedString();
      if (value.length === 0) {
        throw this.createError("Expected bool");
      }
      if (value === "true") {
        return true;
      } else if (value === "false") {
        return false;
      } else {
        this.cursor = start;
        throw this.createError(`Invalid bool, expected true or false but found '${value}'`);
      }
    }
    static isAllowedInNumber(c) {
      return c >= "0" && c <= "9" || c === "." || c === "-";
    }
    static isAllowedInUnquotedString(c) {
      return c >= "0" && c <= "9" || c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_" || c === "-" || c === "." || c === "+";
    }
    static isQuotedStringStart(c) {
      return c === "'" || c === '"';
    }
    static isWhitespace(c) {
      return c === " " || c === "	" || c === "\n" || c === "\r";
    }
    createError(message) {
      const cursor = Math.min(this.source.length, this.cursor);
      const context = (cursor > 10 ? "..." : "") + this.source.substring(Math.max(0, cursor - 10), cursor);
      return new Error(`${message} at position ${this.cursor}: ${context}<--[HERE]`);
    }
  };

  // node_modules/deepslate/lib/util/Util.js
  function lazy(getter) {
    let value = null;
    return () => {
      if (value == null) {
        value = getter();
      }
      return value;
    };
  }
  function computeIfAbsent(map2, key, getter) {
    const existing = map2.get(key);
    if (existing !== void 0) {
      return existing;
    }
    const value = getter(key);
    map2.set(key, value);
    return value;
  }
  function mutateWithDefault(map2, key, initialValue, mutator) {
    const existing = map2.get(key);
    const value = existing ?? initialValue;
    mutator(value, key);
    map2.set(key, value);
    return value;
  }

  // node_modules/pako/dist/pako.esm.mjs
  var Z_FIXED$1 = 4;
  var Z_BINARY = 0;
  var Z_TEXT = 1;
  var Z_UNKNOWN$1 = 2;
  function zero$1(buf) {
    let len2 = buf.length;
    while (--len2 >= 0) {
      buf[len2] = 0;
    }
  }
  var STORED_BLOCK = 0;
  var STATIC_TREES = 1;
  var DYN_TREES = 2;
  var MIN_MATCH$1 = 3;
  var MAX_MATCH$1 = 258;
  var LENGTH_CODES$1 = 29;
  var LITERALS$1 = 256;
  var L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
  var D_CODES$1 = 30;
  var BL_CODES$1 = 19;
  var HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
  var MAX_BITS$1 = 15;
  var Buf_size = 16;
  var MAX_BL_BITS = 7;
  var END_BLOCK = 256;
  var REP_3_6 = 16;
  var REPZ_3_10 = 17;
  var REPZ_11_138 = 18;
  var extra_lbits = (
    /* extra bits for each length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
  );
  var extra_dbits = (
    /* extra bits for each distance code */
    new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
  );
  var extra_blbits = (
    /* extra bits for each bit length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
  );
  var bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var DIST_CODE_LEN = 512;
  var static_ltree = new Array((L_CODES$1 + 2) * 2);
  zero$1(static_ltree);
  var static_dtree = new Array(D_CODES$1 * 2);
  zero$1(static_dtree);
  var _dist_code = new Array(DIST_CODE_LEN);
  zero$1(_dist_code);
  var _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
  zero$1(_length_code);
  var base_length = new Array(LENGTH_CODES$1);
  zero$1(base_length);
  var base_dist = new Array(D_CODES$1);
  zero$1(base_dist);
  function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
    this.static_tree = static_tree;
    this.extra_bits = extra_bits;
    this.extra_base = extra_base;
    this.elems = elems;
    this.max_length = max_length;
    this.has_stree = static_tree && static_tree.length;
  }
  var static_l_desc;
  var static_d_desc;
  var static_bl_desc;
  function TreeDesc(dyn_tree, stat_desc) {
    this.dyn_tree = dyn_tree;
    this.max_code = 0;
    this.stat_desc = stat_desc;
  }
  var d_code = (dist2) => {
    return dist2 < 256 ? _dist_code[dist2] : _dist_code[256 + (dist2 >>> 7)];
  };
  var put_short = (s, w) => {
    s.pending_buf[s.pending++] = w & 255;
    s.pending_buf[s.pending++] = w >>> 8 & 255;
  };
  var send_bits = (s, value, length2) => {
    if (s.bi_valid > Buf_size - length2) {
      s.bi_buf |= value << s.bi_valid & 65535;
      put_short(s, s.bi_buf);
      s.bi_buf = value >> Buf_size - s.bi_valid;
      s.bi_valid += length2 - Buf_size;
    } else {
      s.bi_buf |= value << s.bi_valid & 65535;
      s.bi_valid += length2;
    }
  };
  var send_code = (s, c, tree) => {
    send_bits(
      s,
      tree[c * 2],
      tree[c * 2 + 1]
      /*.Len*/
    );
  };
  var bi_reverse = (code, len2) => {
    let res = 0;
    do {
      res |= code & 1;
      code >>>= 1;
      res <<= 1;
    } while (--len2 > 0);
    return res >>> 1;
  };
  var bi_flush = (s) => {
    if (s.bi_valid === 16) {
      put_short(s, s.bi_buf);
      s.bi_buf = 0;
      s.bi_valid = 0;
    } else if (s.bi_valid >= 8) {
      s.pending_buf[s.pending++] = s.bi_buf & 255;
      s.bi_buf >>= 8;
      s.bi_valid -= 8;
    }
  };
  var gen_bitlen = (s, desc) => {
    const tree = desc.dyn_tree;
    const max_code = desc.max_code;
    const stree = desc.stat_desc.static_tree;
    const has_stree = desc.stat_desc.has_stree;
    const extra = desc.stat_desc.extra_bits;
    const base = desc.stat_desc.extra_base;
    const max_length = desc.stat_desc.max_length;
    let h;
    let n, m;
    let bits;
    let xbits;
    let f;
    let overflow = 0;
    for (bits = 0; bits <= MAX_BITS$1; bits++) {
      s.bl_count[bits] = 0;
    }
    tree[s.heap[s.heap_max] * 2 + 1] = 0;
    for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
      n = s.heap[h];
      bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
      if (bits > max_length) {
        bits = max_length;
        overflow++;
      }
      tree[n * 2 + 1] = bits;
      if (n > max_code) {
        continue;
      }
      s.bl_count[bits]++;
      xbits = 0;
      if (n >= base) {
        xbits = extra[n - base];
      }
      f = tree[n * 2];
      s.opt_len += f * (bits + xbits);
      if (has_stree) {
        s.static_len += f * (stree[n * 2 + 1] + xbits);
      }
    }
    if (overflow === 0) {
      return;
    }
    do {
      bits = max_length - 1;
      while (s.bl_count[bits] === 0) {
        bits--;
      }
      s.bl_count[bits]--;
      s.bl_count[bits + 1] += 2;
      s.bl_count[max_length]--;
      overflow -= 2;
    } while (overflow > 0);
    for (bits = max_length; bits !== 0; bits--) {
      n = s.bl_count[bits];
      while (n !== 0) {
        m = s.heap[--h];
        if (m > max_code) {
          continue;
        }
        if (tree[m * 2 + 1] !== bits) {
          s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
          tree[m * 2 + 1] = bits;
        }
        n--;
      }
    }
  };
  var gen_codes = (tree, max_code, bl_count) => {
    const next_code = new Array(MAX_BITS$1 + 1);
    let code = 0;
    let bits;
    let n;
    for (bits = 1; bits <= MAX_BITS$1; bits++) {
      code = code + bl_count[bits - 1] << 1;
      next_code[bits] = code;
    }
    for (n = 0; n <= max_code; n++) {
      let len2 = tree[n * 2 + 1];
      if (len2 === 0) {
        continue;
      }
      tree[n * 2] = bi_reverse(next_code[len2]++, len2);
    }
  };
  var tr_static_init = () => {
    let n;
    let bits;
    let length2;
    let code;
    let dist2;
    const bl_count = new Array(MAX_BITS$1 + 1);
    length2 = 0;
    for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
      base_length[code] = length2;
      for (n = 0; n < 1 << extra_lbits[code]; n++) {
        _length_code[length2++] = code;
      }
    }
    _length_code[length2 - 1] = code;
    dist2 = 0;
    for (code = 0; code < 16; code++) {
      base_dist[code] = dist2;
      for (n = 0; n < 1 << extra_dbits[code]; n++) {
        _dist_code[dist2++] = code;
      }
    }
    dist2 >>= 7;
    for (; code < D_CODES$1; code++) {
      base_dist[code] = dist2 << 7;
      for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
        _dist_code[256 + dist2++] = code;
      }
    }
    for (bits = 0; bits <= MAX_BITS$1; bits++) {
      bl_count[bits] = 0;
    }
    n = 0;
    while (n <= 143) {
      static_ltree[n * 2 + 1] = 8;
      n++;
      bl_count[8]++;
    }
    while (n <= 255) {
      static_ltree[n * 2 + 1] = 9;
      n++;
      bl_count[9]++;
    }
    while (n <= 279) {
      static_ltree[n * 2 + 1] = 7;
      n++;
      bl_count[7]++;
    }
    while (n <= 287) {
      static_ltree[n * 2 + 1] = 8;
      n++;
      bl_count[8]++;
    }
    gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
    for (n = 0; n < D_CODES$1; n++) {
      static_dtree[n * 2 + 1] = 5;
      static_dtree[n * 2] = bi_reverse(n, 5);
    }
    static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
    static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
    static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
  };
  var init_block = (s) => {
    let n;
    for (n = 0; n < L_CODES$1; n++) {
      s.dyn_ltree[n * 2] = 0;
    }
    for (n = 0; n < D_CODES$1; n++) {
      s.dyn_dtree[n * 2] = 0;
    }
    for (n = 0; n < BL_CODES$1; n++) {
      s.bl_tree[n * 2] = 0;
    }
    s.dyn_ltree[END_BLOCK * 2] = 1;
    s.opt_len = s.static_len = 0;
    s.sym_next = s.matches = 0;
  };
  var bi_windup = (s) => {
    if (s.bi_valid > 8) {
      put_short(s, s.bi_buf);
    } else if (s.bi_valid > 0) {
      s.pending_buf[s.pending++] = s.bi_buf;
    }
    s.bi_buf = 0;
    s.bi_valid = 0;
  };
  var smaller = (tree, n, m, depth) => {
    const _n2 = n * 2;
    const _m2 = m * 2;
    return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
  };
  var pqdownheap = (s, tree, k) => {
    const v = s.heap[k];
    let j = k << 1;
    while (j <= s.heap_len) {
      if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
        j++;
      }
      if (smaller(tree, v, s.heap[j], s.depth)) {
        break;
      }
      s.heap[k] = s.heap[j];
      k = j;
      j <<= 1;
    }
    s.heap[k] = v;
  };
  var compress_block = (s, ltree, dtree) => {
    let dist2;
    let lc;
    let sx = 0;
    let code;
    let extra;
    if (s.sym_next !== 0) {
      do {
        dist2 = s.pending_buf[s.sym_buf + sx++] & 255;
        dist2 += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
        lc = s.pending_buf[s.sym_buf + sx++];
        if (dist2 === 0) {
          send_code(s, lc, ltree);
        } else {
          code = _length_code[lc];
          send_code(s, code + LITERALS$1 + 1, ltree);
          extra = extra_lbits[code];
          if (extra !== 0) {
            lc -= base_length[code];
            send_bits(s, lc, extra);
          }
          dist2--;
          code = d_code(dist2);
          send_code(s, code, dtree);
          extra = extra_dbits[code];
          if (extra !== 0) {
            dist2 -= base_dist[code];
            send_bits(s, dist2, extra);
          }
        }
      } while (sx < s.sym_next);
    }
    send_code(s, END_BLOCK, ltree);
  };
  var build_tree = (s, desc) => {
    const tree = desc.dyn_tree;
    const stree = desc.stat_desc.static_tree;
    const has_stree = desc.stat_desc.has_stree;
    const elems = desc.stat_desc.elems;
    let n, m;
    let max_code = -1;
    let node;
    s.heap_len = 0;
    s.heap_max = HEAP_SIZE$1;
    for (n = 0; n < elems; n++) {
      if (tree[n * 2] !== 0) {
        s.heap[++s.heap_len] = max_code = n;
        s.depth[n] = 0;
      } else {
        tree[n * 2 + 1] = 0;
      }
    }
    while (s.heap_len < 2) {
      node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
      tree[node * 2] = 1;
      s.depth[node] = 0;
      s.opt_len--;
      if (has_stree) {
        s.static_len -= stree[node * 2 + 1];
      }
    }
    desc.max_code = max_code;
    for (n = s.heap_len >> 1; n >= 1; n--) {
      pqdownheap(s, tree, n);
    }
    node = elems;
    do {
      n = s.heap[
        1
        /*SMALLEST*/
      ];
      s.heap[
        1
        /*SMALLEST*/
      ] = s.heap[s.heap_len--];
      pqdownheap(
        s,
        tree,
        1
        /*SMALLEST*/
      );
      m = s.heap[
        1
        /*SMALLEST*/
      ];
      s.heap[--s.heap_max] = n;
      s.heap[--s.heap_max] = m;
      tree[node * 2] = tree[n * 2] + tree[m * 2];
      s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
      tree[n * 2 + 1] = tree[m * 2 + 1] = node;
      s.heap[
        1
        /*SMALLEST*/
      ] = node++;
      pqdownheap(
        s,
        tree,
        1
        /*SMALLEST*/
      );
    } while (s.heap_len >= 2);
    s.heap[--s.heap_max] = s.heap[
      1
      /*SMALLEST*/
    ];
    gen_bitlen(s, desc);
    gen_codes(tree, max_code, s.bl_count);
  };
  var scan_tree = (s, tree, max_code) => {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }
    tree[(max_code + 1) * 2 + 1] = 65535;
    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1];
      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        s.bl_tree[curlen * 2] += count;
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          s.bl_tree[curlen * 2]++;
        }
        s.bl_tree[REP_3_6 * 2]++;
      } else if (count <= 10) {
        s.bl_tree[REPZ_3_10 * 2]++;
      } else {
        s.bl_tree[REPZ_11_138 * 2]++;
      }
      count = 0;
      prevlen = curlen;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  };
  var send_tree = (s, tree, max_code) => {
    let n;
    let prevlen = -1;
    let curlen;
    let nextlen = tree[0 * 2 + 1];
    let count = 0;
    let max_count = 7;
    let min_count = 4;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    }
    for (n = 0; n <= max_code; n++) {
      curlen = nextlen;
      nextlen = tree[(n + 1) * 2 + 1];
      if (++count < max_count && curlen === nextlen) {
        continue;
      } else if (count < min_count) {
        do {
          send_code(s, curlen, s.bl_tree);
        } while (--count !== 0);
      } else if (curlen !== 0) {
        if (curlen !== prevlen) {
          send_code(s, curlen, s.bl_tree);
          count--;
        }
        send_code(s, REP_3_6, s.bl_tree);
        send_bits(s, count - 3, 2);
      } else if (count <= 10) {
        send_code(s, REPZ_3_10, s.bl_tree);
        send_bits(s, count - 3, 3);
      } else {
        send_code(s, REPZ_11_138, s.bl_tree);
        send_bits(s, count - 11, 7);
      }
      count = 0;
      prevlen = curlen;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      } else if (curlen === nextlen) {
        max_count = 6;
        min_count = 3;
      } else {
        max_count = 7;
        min_count = 4;
      }
    }
  };
  var build_bl_tree = (s) => {
    let max_blindex;
    scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
    scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
    build_tree(s, s.bl_desc);
    for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
      if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
        break;
      }
    }
    s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
    return max_blindex;
  };
  var send_all_trees = (s, lcodes, dcodes, blcodes) => {
    let rank2;
    send_bits(s, lcodes - 257, 5);
    send_bits(s, dcodes - 1, 5);
    send_bits(s, blcodes - 4, 4);
    for (rank2 = 0; rank2 < blcodes; rank2++) {
      send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
    }
    send_tree(s, s.dyn_ltree, lcodes - 1);
    send_tree(s, s.dyn_dtree, dcodes - 1);
  };
  var detect_data_type = (s) => {
    let block_mask = 4093624447;
    let n;
    for (n = 0; n <= 31; n++, block_mask >>>= 1) {
      if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
        return Z_BINARY;
      }
    }
    if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
      return Z_TEXT;
    }
    for (n = 32; n < LITERALS$1; n++) {
      if (s.dyn_ltree[n * 2] !== 0) {
        return Z_TEXT;
      }
    }
    return Z_BINARY;
  };
  var static_init_done = false;
  var _tr_init$1 = (s) => {
    if (!static_init_done) {
      tr_static_init();
      static_init_done = true;
    }
    s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
    s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
    s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
    s.bi_buf = 0;
    s.bi_valid = 0;
    init_block(s);
  };
  var _tr_stored_block$1 = (s, buf, stored_len, last) => {
    send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
    bi_windup(s);
    put_short(s, stored_len);
    put_short(s, ~stored_len);
    if (stored_len) {
      s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
    }
    s.pending += stored_len;
  };
  var _tr_align$1 = (s) => {
    send_bits(s, STATIC_TREES << 1, 3);
    send_code(s, END_BLOCK, static_ltree);
    bi_flush(s);
  };
  var _tr_flush_block$1 = (s, buf, stored_len, last) => {
    let opt_lenb, static_lenb;
    let max_blindex = 0;
    if (s.level > 0) {
      if (s.strm.data_type === Z_UNKNOWN$1) {
        s.strm.data_type = detect_data_type(s);
      }
      build_tree(s, s.l_desc);
      build_tree(s, s.d_desc);
      max_blindex = build_bl_tree(s);
      opt_lenb = s.opt_len + 3 + 7 >>> 3;
      static_lenb = s.static_len + 3 + 7 >>> 3;
      if (static_lenb <= opt_lenb) {
        opt_lenb = static_lenb;
      }
    } else {
      opt_lenb = static_lenb = stored_len + 5;
    }
    if (stored_len + 4 <= opt_lenb && buf !== -1) {
      _tr_stored_block$1(s, buf, stored_len, last);
    } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
      send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
      compress_block(s, static_ltree, static_dtree);
    } else {
      send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
      send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
      compress_block(s, s.dyn_ltree, s.dyn_dtree);
    }
    init_block(s);
    if (last) {
      bi_windup(s);
    }
  };
  var _tr_tally$1 = (s, dist2, lc) => {
    s.pending_buf[s.sym_buf + s.sym_next++] = dist2;
    s.pending_buf[s.sym_buf + s.sym_next++] = dist2 >> 8;
    s.pending_buf[s.sym_buf + s.sym_next++] = lc;
    if (dist2 === 0) {
      s.dyn_ltree[lc * 2]++;
    } else {
      s.matches++;
      dist2--;
      s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
      s.dyn_dtree[d_code(dist2) * 2]++;
    }
    return s.sym_next === s.sym_end;
  };
  var _tr_init_1 = _tr_init$1;
  var _tr_stored_block_1 = _tr_stored_block$1;
  var _tr_flush_block_1 = _tr_flush_block$1;
  var _tr_tally_1 = _tr_tally$1;
  var _tr_align_1 = _tr_align$1;
  var trees = {
    _tr_init: _tr_init_1,
    _tr_stored_block: _tr_stored_block_1,
    _tr_flush_block: _tr_flush_block_1,
    _tr_tally: _tr_tally_1,
    _tr_align: _tr_align_1
  };
  var adler32 = (adler, buf, len2, pos) => {
    let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
    while (len2 !== 0) {
      n = len2 > 2e3 ? 2e3 : len2;
      len2 -= n;
      do {
        s1 = s1 + buf[pos++] | 0;
        s2 = s2 + s1 | 0;
      } while (--n);
      s1 %= 65521;
      s2 %= 65521;
    }
    return s1 | s2 << 16 | 0;
  };
  var adler32_1 = adler32;
  var makeTable = () => {
    let c, table = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      table[n] = c;
    }
    return table;
  };
  var crcTable = new Uint32Array(makeTable());
  var crc32 = (crc, buf, len2, pos) => {
    const t = crcTable;
    const end = pos + len2;
    crc ^= -1;
    for (let i = pos; i < end; i++) {
      crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
    }
    return crc ^ -1;
  };
  var crc32_1 = crc32;
  var messages = {
    2: "need dictionary",
    /* Z_NEED_DICT       2  */
    1: "stream end",
    /* Z_STREAM_END      1  */
    0: "",
    /* Z_OK              0  */
    "-1": "file error",
    /* Z_ERRNO         (-1) */
    "-2": "stream error",
    /* Z_STREAM_ERROR  (-2) */
    "-3": "data error",
    /* Z_DATA_ERROR    (-3) */
    "-4": "insufficient memory",
    /* Z_MEM_ERROR     (-4) */
    "-5": "buffer error",
    /* Z_BUF_ERROR     (-5) */
    "-6": "incompatible version"
    /* Z_VERSION_ERROR (-6) */
  };
  var constants$2 = {
    /* Allowed flush values; see deflate() and inflate() below for details */
    Z_NO_FLUSH: 0,
    Z_PARTIAL_FLUSH: 1,
    Z_SYNC_FLUSH: 2,
    Z_FULL_FLUSH: 3,
    Z_FINISH: 4,
    Z_BLOCK: 5,
    Z_TREES: 6,
    /* Return codes for the compression/decompression functions. Negative values
    * are errors, positive values are used for special but normal events.
    */
    Z_OK: 0,
    Z_STREAM_END: 1,
    Z_NEED_DICT: 2,
    Z_ERRNO: -1,
    Z_STREAM_ERROR: -2,
    Z_DATA_ERROR: -3,
    Z_MEM_ERROR: -4,
    Z_BUF_ERROR: -5,
    //Z_VERSION_ERROR: -6,
    /* compression levels */
    Z_NO_COMPRESSION: 0,
    Z_BEST_SPEED: 1,
    Z_BEST_COMPRESSION: 9,
    Z_DEFAULT_COMPRESSION: -1,
    Z_FILTERED: 1,
    Z_HUFFMAN_ONLY: 2,
    Z_RLE: 3,
    Z_FIXED: 4,
    Z_DEFAULT_STRATEGY: 0,
    /* Possible values of the data_type field (though see inflate()) */
    Z_BINARY: 0,
    Z_TEXT: 1,
    //Z_ASCII:                1, // = Z_TEXT (deprecated)
    Z_UNKNOWN: 2,
    /* The deflate compression method */
    Z_DEFLATED: 8
    //Z_NULL:                 null // Use -1 or null inline, depending on var type
  };
  var { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;
  var {
    Z_NO_FLUSH: Z_NO_FLUSH$2,
    Z_PARTIAL_FLUSH,
    Z_FULL_FLUSH: Z_FULL_FLUSH$1,
    Z_FINISH: Z_FINISH$3,
    Z_BLOCK: Z_BLOCK$1,
    Z_OK: Z_OK$3,
    Z_STREAM_END: Z_STREAM_END$3,
    Z_STREAM_ERROR: Z_STREAM_ERROR$2,
    Z_DATA_ERROR: Z_DATA_ERROR$2,
    Z_BUF_ERROR: Z_BUF_ERROR$1,
    Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
    Z_FILTERED,
    Z_HUFFMAN_ONLY,
    Z_RLE,
    Z_FIXED,
    Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
    Z_UNKNOWN,
    Z_DEFLATED: Z_DEFLATED$2
  } = constants$2;
  var MAX_MEM_LEVEL = 9;
  var MAX_WBITS$1 = 15;
  var DEF_MEM_LEVEL = 8;
  var LENGTH_CODES = 29;
  var LITERALS = 256;
  var L_CODES = LITERALS + 1 + LENGTH_CODES;
  var D_CODES = 30;
  var BL_CODES = 19;
  var HEAP_SIZE = 2 * L_CODES + 1;
  var MAX_BITS = 15;
  var MIN_MATCH = 3;
  var MAX_MATCH = 258;
  var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
  var PRESET_DICT = 32;
  var INIT_STATE = 42;
  var GZIP_STATE = 57;
  var EXTRA_STATE = 69;
  var NAME_STATE = 73;
  var COMMENT_STATE = 91;
  var HCRC_STATE = 103;
  var BUSY_STATE = 113;
  var FINISH_STATE = 666;
  var BS_NEED_MORE = 1;
  var BS_BLOCK_DONE = 2;
  var BS_FINISH_STARTED = 3;
  var BS_FINISH_DONE = 4;
  var OS_CODE = 3;
  var err = (strm, errorCode) => {
    strm.msg = messages[errorCode];
    return errorCode;
  };
  var rank = (f) => {
    return f * 2 - (f > 4 ? 9 : 0);
  };
  var zero = (buf) => {
    let len2 = buf.length;
    while (--len2 >= 0) {
      buf[len2] = 0;
    }
  };
  var slide_hash = (s) => {
    let n, m;
    let p;
    let wsize = s.w_size;
    n = s.hash_size;
    p = n;
    do {
      m = s.head[--p];
      s.head[p] = m >= wsize ? m - wsize : 0;
    } while (--n);
    n = wsize;
    p = n;
    do {
      m = s.prev[--p];
      s.prev[p] = m >= wsize ? m - wsize : 0;
    } while (--n);
  };
  var HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
  var HASH = HASH_ZLIB;
  var flush_pending = (strm) => {
    const s = strm.state;
    let len2 = s.pending;
    if (len2 > strm.avail_out) {
      len2 = strm.avail_out;
    }
    if (len2 === 0) {
      return;
    }
    strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len2), strm.next_out);
    strm.next_out += len2;
    s.pending_out += len2;
    strm.total_out += len2;
    strm.avail_out -= len2;
    s.pending -= len2;
    if (s.pending === 0) {
      s.pending_out = 0;
    }
  };
  var flush_block_only = (s, last) => {
    _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
    s.block_start = s.strstart;
    flush_pending(s.strm);
  };
  var put_byte = (s, b) => {
    s.pending_buf[s.pending++] = b;
  };
  var putShortMSB = (s, b) => {
    s.pending_buf[s.pending++] = b >>> 8 & 255;
    s.pending_buf[s.pending++] = b & 255;
  };
  var read_buf = (strm, buf, start, size) => {
    let len2 = strm.avail_in;
    if (len2 > size) {
      len2 = size;
    }
    if (len2 === 0) {
      return 0;
    }
    strm.avail_in -= len2;
    buf.set(strm.input.subarray(strm.next_in, strm.next_in + len2), start);
    if (strm.state.wrap === 1) {
      strm.adler = adler32_1(strm.adler, buf, len2, start);
    } else if (strm.state.wrap === 2) {
      strm.adler = crc32_1(strm.adler, buf, len2, start);
    }
    strm.next_in += len2;
    strm.total_in += len2;
    return len2;
  };
  var longest_match = (s, cur_match) => {
    let chain_length = s.max_chain_length;
    let scan = s.strstart;
    let match;
    let len2;
    let best_len = s.prev_length;
    let nice_match = s.nice_match;
    const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
    const _win = s.window;
    const wmask = s.w_mask;
    const prev = s.prev;
    const strend = s.strstart + MAX_MATCH;
    let scan_end1 = _win[scan + best_len - 1];
    let scan_end = _win[scan + best_len];
    if (s.prev_length >= s.good_match) {
      chain_length >>= 2;
    }
    if (nice_match > s.lookahead) {
      nice_match = s.lookahead;
    }
    do {
      match = cur_match;
      if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
        continue;
      }
      scan += 2;
      match++;
      do {
      } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
      len2 = MAX_MATCH - (strend - scan);
      scan = strend - MAX_MATCH;
      if (len2 > best_len) {
        s.match_start = cur_match;
        best_len = len2;
        if (len2 >= nice_match) {
          break;
        }
        scan_end1 = _win[scan + best_len - 1];
        scan_end = _win[scan + best_len];
      }
    } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
    if (best_len <= s.lookahead) {
      return best_len;
    }
    return s.lookahead;
  };
  var fill_window = (s) => {
    const _w_size = s.w_size;
    let n, more, str4;
    do {
      more = s.window_size - s.lookahead - s.strstart;
      if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
        s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
        s.match_start -= _w_size;
        s.strstart -= _w_size;
        s.block_start -= _w_size;
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
        slide_hash(s);
        more += _w_size;
      }
      if (s.strm.avail_in === 0) {
        break;
      }
      n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
      s.lookahead += n;
      if (s.lookahead + s.insert >= MIN_MATCH) {
        str4 = s.strstart - s.insert;
        s.ins_h = s.window[str4];
        s.ins_h = HASH(s, s.ins_h, s.window[str4 + 1]);
        while (s.insert) {
          s.ins_h = HASH(s, s.ins_h, s.window[str4 + MIN_MATCH - 1]);
          s.prev[str4 & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = str4;
          str4++;
          s.insert--;
          if (s.lookahead + s.insert < MIN_MATCH) {
            break;
          }
        }
      }
    } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
  };
  var deflate_stored = (s, flush) => {
    let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
    let len2, left, have, last = 0;
    let used = s.strm.avail_in;
    do {
      len2 = 65535;
      have = s.bi_valid + 42 >> 3;
      if (s.strm.avail_out < have) {
        break;
      }
      have = s.strm.avail_out - have;
      left = s.strstart - s.block_start;
      if (len2 > left + s.strm.avail_in) {
        len2 = left + s.strm.avail_in;
      }
      if (len2 > have) {
        len2 = have;
      }
      if (len2 < min_block && (len2 === 0 && flush !== Z_FINISH$3 || flush === Z_NO_FLUSH$2 || len2 !== left + s.strm.avail_in)) {
        break;
      }
      last = flush === Z_FINISH$3 && len2 === left + s.strm.avail_in ? 1 : 0;
      _tr_stored_block(s, 0, 0, last);
      s.pending_buf[s.pending - 4] = len2;
      s.pending_buf[s.pending - 3] = len2 >> 8;
      s.pending_buf[s.pending - 2] = ~len2;
      s.pending_buf[s.pending - 1] = ~len2 >> 8;
      flush_pending(s.strm);
      if (left) {
        if (left > len2) {
          left = len2;
        }
        s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
        s.strm.next_out += left;
        s.strm.avail_out -= left;
        s.strm.total_out += left;
        s.block_start += left;
        len2 -= left;
      }
      if (len2) {
        read_buf(s.strm, s.strm.output, s.strm.next_out, len2);
        s.strm.next_out += len2;
        s.strm.avail_out -= len2;
        s.strm.total_out += len2;
      }
    } while (last === 0);
    used -= s.strm.avail_in;
    if (used) {
      if (used >= s.w_size) {
        s.matches = 2;
        s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
        s.strstart = s.w_size;
        s.insert = s.strstart;
      } else {
        if (s.window_size - s.strstart <= used) {
          s.strstart -= s.w_size;
          s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
          if (s.matches < 2) {
            s.matches++;
          }
          if (s.insert > s.strstart) {
            s.insert = s.strstart;
          }
        }
        s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
        s.strstart += used;
        s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
      }
      s.block_start = s.strstart;
    }
    if (s.high_water < s.strstart) {
      s.high_water = s.strstart;
    }
    if (last) {
      return BS_FINISH_DONE;
    }
    if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 && s.strm.avail_in === 0 && s.strstart === s.block_start) {
      return BS_BLOCK_DONE;
    }
    have = s.window_size - s.strstart;
    if (s.strm.avail_in > have && s.block_start >= s.w_size) {
      s.block_start -= s.w_size;
      s.strstart -= s.w_size;
      s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
      if (s.matches < 2) {
        s.matches++;
      }
      have += s.w_size;
      if (s.insert > s.strstart) {
        s.insert = s.strstart;
      }
    }
    if (have > s.strm.avail_in) {
      have = s.strm.avail_in;
    }
    if (have) {
      read_buf(s.strm, s.window, s.strstart, have);
      s.strstart += have;
      s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
    }
    if (s.high_water < s.strstart) {
      s.high_water = s.strstart;
    }
    have = s.bi_valid + 42 >> 3;
    have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
    min_block = have > s.w_size ? s.w_size : have;
    left = s.strstart - s.block_start;
    if (left >= min_block || (left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 && s.strm.avail_in === 0 && left <= have) {
      len2 = left > have ? have : left;
      last = flush === Z_FINISH$3 && s.strm.avail_in === 0 && len2 === left ? 1 : 0;
      _tr_stored_block(s, s.block_start, len2, last);
      s.block_start += len2;
      flush_pending(s.strm);
    }
    return last ? BS_FINISH_STARTED : BS_NEED_MORE;
  };
  var deflate_fast = (s, flush) => {
    let hash_head;
    let bflush;
    for (; ; ) {
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);
        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      hash_head = 0;
      if (s.lookahead >= MIN_MATCH) {
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = s.strstart;
      }
      if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        s.match_length = longest_match(s, hash_head);
      }
      if (s.match_length >= MIN_MATCH) {
        bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
        s.lookahead -= s.match_length;
        if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
          s.match_length--;
          do {
            s.strstart++;
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          } while (--s.match_length !== 0);
          s.strstart++;
        } else {
          s.strstart += s.match_length;
          s.match_length = 0;
          s.ins_h = s.window[s.strstart];
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
        }
      } else {
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_slow = (s, flush) => {
    let hash_head;
    let bflush;
    let max_insert;
    for (; ; ) {
      if (s.lookahead < MIN_LOOKAHEAD) {
        fill_window(s);
        if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      hash_head = 0;
      if (s.lookahead >= MIN_MATCH) {
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
        hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = s.strstart;
      }
      s.prev_length = s.match_length;
      s.prev_match = s.match_start;
      s.match_length = MIN_MATCH - 1;
      if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
        s.match_length = longest_match(s, hash_head);
        if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
          s.match_length = MIN_MATCH - 1;
        }
      }
      if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
        max_insert = s.strstart + s.lookahead - MIN_MATCH;
        bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
        s.lookahead -= s.prev_length - 1;
        s.prev_length -= 2;
        do {
          if (++s.strstart <= max_insert) {
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
        } while (--s.prev_length !== 0);
        s.match_available = 0;
        s.match_length = MIN_MATCH - 1;
        s.strstart++;
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      } else if (s.match_available) {
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
        if (bflush) {
          flush_block_only(s, false);
        }
        s.strstart++;
        s.lookahead--;
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      } else {
        s.match_available = 1;
        s.strstart++;
        s.lookahead--;
      }
    }
    if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      s.match_available = 0;
    }
    s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_rle = (s, flush) => {
    let bflush;
    let prev;
    let scan, strend;
    const _win = s.window;
    for (; ; ) {
      if (s.lookahead <= MAX_MATCH) {
        fill_window(s);
        if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        if (s.lookahead === 0) {
          break;
        }
      }
      s.match_length = 0;
      if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
        scan = s.strstart - 1;
        prev = _win[scan];
        if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
          strend = s.strstart + MAX_MATCH;
          do {
          } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
          s.match_length = MAX_MATCH - (strend - scan);
          if (s.match_length > s.lookahead) {
            s.match_length = s.lookahead;
          }
        }
      }
      if (s.match_length >= MIN_MATCH) {
        bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
        s.lookahead -= s.match_length;
        s.strstart += s.match_length;
        s.match_length = 0;
      } else {
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
      }
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  var deflate_huff = (s, flush) => {
    let bflush;
    for (; ; ) {
      if (s.lookahead === 0) {
        fill_window(s);
        if (s.lookahead === 0) {
          if (flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }
          break;
        }
      }
      s.match_length = 0;
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    }
    s.insert = 0;
    if (flush === Z_FINISH$3) {
      flush_block_only(s, true);
      if (s.strm.avail_out === 0) {
        return BS_FINISH_STARTED;
      }
      return BS_FINISH_DONE;
    }
    if (s.sym_next) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
    return BS_BLOCK_DONE;
  };
  function Config(good_length, max_lazy, nice_length, max_chain, func) {
    this.good_length = good_length;
    this.max_lazy = max_lazy;
    this.nice_length = nice_length;
    this.max_chain = max_chain;
    this.func = func;
  }
  var configuration_table = [
    /*      good lazy nice chain */
    new Config(0, 0, 0, 0, deflate_stored),
    /* 0 store only */
    new Config(4, 4, 8, 4, deflate_fast),
    /* 1 max speed, no lazy matches */
    new Config(4, 5, 16, 8, deflate_fast),
    /* 2 */
    new Config(4, 6, 32, 32, deflate_fast),
    /* 3 */
    new Config(4, 4, 16, 16, deflate_slow),
    /* 4 lazy matches */
    new Config(8, 16, 32, 32, deflate_slow),
    /* 5 */
    new Config(8, 16, 128, 128, deflate_slow),
    /* 6 */
    new Config(8, 32, 128, 256, deflate_slow),
    /* 7 */
    new Config(32, 128, 258, 1024, deflate_slow),
    /* 8 */
    new Config(32, 258, 258, 4096, deflate_slow)
    /* 9 max compression */
  ];
  var lm_init = (s) => {
    s.window_size = 2 * s.w_size;
    zero(s.head);
    s.max_lazy_match = configuration_table[s.level].max_lazy;
    s.good_match = configuration_table[s.level].good_length;
    s.nice_match = configuration_table[s.level].nice_length;
    s.max_chain_length = configuration_table[s.level].max_chain;
    s.strstart = 0;
    s.block_start = 0;
    s.lookahead = 0;
    s.insert = 0;
    s.match_length = s.prev_length = MIN_MATCH - 1;
    s.match_available = 0;
    s.ins_h = 0;
  };
  function DeflateState() {
    this.strm = null;
    this.status = 0;
    this.pending_buf = null;
    this.pending_buf_size = 0;
    this.pending_out = 0;
    this.pending = 0;
    this.wrap = 0;
    this.gzhead = null;
    this.gzindex = 0;
    this.method = Z_DEFLATED$2;
    this.last_flush = -1;
    this.w_size = 0;
    this.w_bits = 0;
    this.w_mask = 0;
    this.window = null;
    this.window_size = 0;
    this.prev = null;
    this.head = null;
    this.ins_h = 0;
    this.hash_size = 0;
    this.hash_bits = 0;
    this.hash_mask = 0;
    this.hash_shift = 0;
    this.block_start = 0;
    this.match_length = 0;
    this.prev_match = 0;
    this.match_available = 0;
    this.strstart = 0;
    this.match_start = 0;
    this.lookahead = 0;
    this.prev_length = 0;
    this.max_chain_length = 0;
    this.max_lazy_match = 0;
    this.level = 0;
    this.strategy = 0;
    this.good_match = 0;
    this.nice_match = 0;
    this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
    this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
    this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
    zero(this.dyn_ltree);
    zero(this.dyn_dtree);
    zero(this.bl_tree);
    this.l_desc = null;
    this.d_desc = null;
    this.bl_desc = null;
    this.bl_count = new Uint16Array(MAX_BITS + 1);
    this.heap = new Uint16Array(2 * L_CODES + 1);
    zero(this.heap);
    this.heap_len = 0;
    this.heap_max = 0;
    this.depth = new Uint16Array(2 * L_CODES + 1);
    zero(this.depth);
    this.sym_buf = 0;
    this.lit_bufsize = 0;
    this.sym_next = 0;
    this.sym_end = 0;
    this.opt_len = 0;
    this.static_len = 0;
    this.matches = 0;
    this.insert = 0;
    this.bi_buf = 0;
    this.bi_valid = 0;
  }
  var deflateStateCheck = (strm) => {
    if (!strm) {
      return 1;
    }
    const s = strm.state;
    if (!s || s.strm !== strm || s.status !== INIT_STATE && //#ifdef GZIP
    s.status !== GZIP_STATE && //#endif
    s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
      return 1;
    }
    return 0;
  };
  var deflateResetKeep = (strm) => {
    if (deflateStateCheck(strm)) {
      return err(strm, Z_STREAM_ERROR$2);
    }
    strm.total_in = strm.total_out = 0;
    strm.data_type = Z_UNKNOWN;
    const s = strm.state;
    s.pending = 0;
    s.pending_out = 0;
    if (s.wrap < 0) {
      s.wrap = -s.wrap;
    }
    s.status = //#ifdef GZIP
    s.wrap === 2 ? GZIP_STATE : (
      //#endif
      s.wrap ? INIT_STATE : BUSY_STATE
    );
    strm.adler = s.wrap === 2 ? 0 : 1;
    s.last_flush = -2;
    _tr_init(s);
    return Z_OK$3;
  };
  var deflateReset = (strm) => {
    const ret = deflateResetKeep(strm);
    if (ret === Z_OK$3) {
      lm_init(strm.state);
    }
    return ret;
  };
  var deflateSetHeader = (strm, head) => {
    if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
      return Z_STREAM_ERROR$2;
    }
    strm.state.gzhead = head;
    return Z_OK$3;
  };
  var deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
    if (!strm) {
      return Z_STREAM_ERROR$2;
    }
    let wrap = 1;
    if (level === Z_DEFAULT_COMPRESSION$1) {
      level = 6;
    }
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else if (windowBits > 15) {
      wrap = 2;
      windowBits -= 16;
    }
    if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap !== 1) {
      return err(strm, Z_STREAM_ERROR$2);
    }
    if (windowBits === 8) {
      windowBits = 9;
    }
    const s = new DeflateState();
    strm.state = s;
    s.strm = strm;
    s.status = INIT_STATE;
    s.wrap = wrap;
    s.gzhead = null;
    s.w_bits = windowBits;
    s.w_size = 1 << s.w_bits;
    s.w_mask = s.w_size - 1;
    s.hash_bits = memLevel + 7;
    s.hash_size = 1 << s.hash_bits;
    s.hash_mask = s.hash_size - 1;
    s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
    s.window = new Uint8Array(s.w_size * 2);
    s.head = new Uint16Array(s.hash_size);
    s.prev = new Uint16Array(s.w_size);
    s.lit_bufsize = 1 << memLevel + 6;
    s.pending_buf_size = s.lit_bufsize * 4;
    s.pending_buf = new Uint8Array(s.pending_buf_size);
    s.sym_buf = s.lit_bufsize;
    s.sym_end = (s.lit_bufsize - 1) * 3;
    s.level = level;
    s.strategy = strategy;
    s.method = method;
    return deflateReset(strm);
  };
  var deflateInit = (strm, level) => {
    return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
  };
  var deflate$2 = (strm, flush) => {
    if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
      return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
    }
    const s = strm.state;
    if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
      return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
    }
    const old_flush = s.last_flush;
    s.last_flush = flush;
    if (s.pending !== 0) {
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
      return err(strm, Z_BUF_ERROR$1);
    }
    if (s.status === FINISH_STATE && strm.avail_in !== 0) {
      return err(strm, Z_BUF_ERROR$1);
    }
    if (s.status === INIT_STATE && s.wrap === 0) {
      s.status = BUSY_STATE;
    }
    if (s.status === INIT_STATE) {
      let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
      let level_flags = -1;
      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= level_flags << 6;
      if (s.strstart !== 0) {
        header |= PRESET_DICT;
      }
      header += 31 - header % 31;
      putShortMSB(s, header);
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      strm.adler = 1;
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
    if (s.status === GZIP_STATE) {
      strm.adler = 0;
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) {
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      } else {
        put_byte(
          s,
          (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
        );
        put_byte(s, s.gzhead.time & 255);
        put_byte(s, s.gzhead.time >> 8 & 255);
        put_byte(s, s.gzhead.time >> 16 & 255);
        put_byte(s, s.gzhead.time >> 24 & 255);
        put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
        put_byte(s, s.gzhead.os & 255);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 255);
          put_byte(s, s.gzhead.extra.length >> 8 & 255);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    if (s.status === EXTRA_STATE) {
      if (s.gzhead.extra) {
        let beg = s.pending;
        let left = (s.gzhead.extra.length & 65535) - s.gzindex;
        while (s.pending + left > s.pending_buf_size) {
          let copy4 = s.pending_buf_size - s.pending;
          s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy4), s.pending);
          s.pending = s.pending_buf_size;
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          s.gzindex += copy4;
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
          left -= copy4;
        }
        let gzhead_extra = new Uint8Array(s.gzhead.extra);
        s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
        s.pending += left;
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex = 0;
      }
      s.status = NAME_STATE;
    }
    if (s.status === NAME_STATE) {
      if (s.gzhead.name) {
        let beg = s.pending;
        let val;
        do {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
            beg = 0;
          }
          if (s.gzindex < s.gzhead.name.length) {
            val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
          } else {
            val = 0;
          }
          put_byte(s, val);
        } while (val !== 0);
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex = 0;
      }
      s.status = COMMENT_STATE;
    }
    if (s.status === COMMENT_STATE) {
      if (s.gzhead.comment) {
        let beg = s.pending;
        let val;
        do {
          if (s.pending === s.pending_buf_size) {
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
            beg = 0;
          }
          if (s.gzindex < s.gzhead.comment.length) {
            val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
          } else {
            val = 0;
          }
          put_byte(s, val);
        } while (val !== 0);
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
      }
      s.status = HCRC_STATE;
    }
    if (s.status === HCRC_STATE) {
      if (s.gzhead.hcrc) {
        if (s.pending + 2 > s.pending_buf_size) {
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
        }
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        strm.adler = 0;
      }
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
    if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
      let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
      if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
        s.status = FINISH_STATE;
      }
      if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
        if (strm.avail_out === 0) {
          s.last_flush = -1;
        }
        return Z_OK$3;
      }
      if (bstate === BS_BLOCK_DONE) {
        if (flush === Z_PARTIAL_FLUSH) {
          _tr_align(s);
        } else if (flush !== Z_BLOCK$1) {
          _tr_stored_block(s, 0, 0, false);
          if (flush === Z_FULL_FLUSH$1) {
            zero(s.head);
            if (s.lookahead === 0) {
              s.strstart = 0;
              s.block_start = 0;
              s.insert = 0;
            }
          }
        }
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
    }
    if (flush !== Z_FINISH$3) {
      return Z_OK$3;
    }
    if (s.wrap <= 0) {
      return Z_STREAM_END$3;
    }
    if (s.wrap === 2) {
      put_byte(s, strm.adler & 255);
      put_byte(s, strm.adler >> 8 & 255);
      put_byte(s, strm.adler >> 16 & 255);
      put_byte(s, strm.adler >> 24 & 255);
      put_byte(s, strm.total_in & 255);
      put_byte(s, strm.total_in >> 8 & 255);
      put_byte(s, strm.total_in >> 16 & 255);
      put_byte(s, strm.total_in >> 24 & 255);
    } else {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 65535);
    }
    flush_pending(strm);
    if (s.wrap > 0) {
      s.wrap = -s.wrap;
    }
    return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
  };
  var deflateEnd = (strm) => {
    if (deflateStateCheck(strm)) {
      return Z_STREAM_ERROR$2;
    }
    const status = strm.state.status;
    strm.state = null;
    return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
  };
  var deflateSetDictionary = (strm, dictionary) => {
    let dictLength = dictionary.length;
    if (deflateStateCheck(strm)) {
      return Z_STREAM_ERROR$2;
    }
    const s = strm.state;
    const wrap = s.wrap;
    if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
      return Z_STREAM_ERROR$2;
    }
    if (wrap === 1) {
      strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
    }
    s.wrap = 0;
    if (dictLength >= s.w_size) {
      if (wrap === 0) {
        zero(s.head);
        s.strstart = 0;
        s.block_start = 0;
        s.insert = 0;
      }
      let tmpDict = new Uint8Array(s.w_size);
      tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
      dictionary = tmpDict;
      dictLength = s.w_size;
    }
    const avail = strm.avail_in;
    const next = strm.next_in;
    const input = strm.input;
    strm.avail_in = dictLength;
    strm.next_in = 0;
    strm.input = dictionary;
    fill_window(s);
    while (s.lookahead >= MIN_MATCH) {
      let str4 = s.strstart;
      let n = s.lookahead - (MIN_MATCH - 1);
      do {
        s.ins_h = HASH(s, s.ins_h, s.window[str4 + MIN_MATCH - 1]);
        s.prev[str4 & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str4;
        str4++;
      } while (--n);
      s.strstart = str4;
      s.lookahead = MIN_MATCH - 1;
      fill_window(s);
    }
    s.strstart += s.lookahead;
    s.block_start = s.strstart;
    s.insert = s.lookahead;
    s.lookahead = 0;
    s.match_length = s.prev_length = MIN_MATCH - 1;
    s.match_available = 0;
    strm.next_in = next;
    strm.input = input;
    strm.avail_in = avail;
    s.wrap = wrap;
    return Z_OK$3;
  };
  var deflateInit_1 = deflateInit;
  var deflateInit2_1 = deflateInit2;
  var deflateReset_1 = deflateReset;
  var deflateResetKeep_1 = deflateResetKeep;
  var deflateSetHeader_1 = deflateSetHeader;
  var deflate_2$1 = deflate$2;
  var deflateEnd_1 = deflateEnd;
  var deflateSetDictionary_1 = deflateSetDictionary;
  var deflateInfo = "pako deflate (from Nodeca project)";
  var deflate_1$2 = {
    deflateInit: deflateInit_1,
    deflateInit2: deflateInit2_1,
    deflateReset: deflateReset_1,
    deflateResetKeep: deflateResetKeep_1,
    deflateSetHeader: deflateSetHeader_1,
    deflate: deflate_2$1,
    deflateEnd: deflateEnd_1,
    deflateSetDictionary: deflateSetDictionary_1,
    deflateInfo
  };
  var _has = (obj, key) => {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };
  var assign = function(obj) {
    const sources = Array.prototype.slice.call(arguments, 1);
    while (sources.length) {
      const source = sources.shift();
      if (!source) {
        continue;
      }
      if (typeof source !== "object") {
        throw new TypeError(source + "must be non-object");
      }
      for (const p in source) {
        if (_has(source, p)) {
          obj[p] = source[p];
        }
      }
    }
    return obj;
  };
  var flattenChunks = (chunks) => {
    let len2 = 0;
    for (let i = 0, l = chunks.length; i < l; i++) {
      len2 += chunks[i].length;
    }
    const result = new Uint8Array(len2);
    for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
      let chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }
    return result;
  };
  var common = {
    assign,
    flattenChunks
  };
  var STR_APPLY_UIA_OK = true;
  try {
    String.fromCharCode.apply(null, new Uint8Array(1));
  } catch (__) {
    STR_APPLY_UIA_OK = false;
  }
  var _utf8len = new Uint8Array(256);
  for (let q = 0; q < 256; q++) {
    _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
  }
  _utf8len[254] = _utf8len[254] = 1;
  var string2buf = (str4) => {
    if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
      return new TextEncoder().encode(str4);
    }
    let buf, c, c2, m_pos, i, str_len = str4.length, buf_len = 0;
    for (m_pos = 0; m_pos < str_len; m_pos++) {
      c = str4.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str4.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
    }
    buf = new Uint8Array(buf_len);
    for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
      c = str4.charCodeAt(m_pos);
      if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
        c2 = str4.charCodeAt(m_pos + 1);
        if ((c2 & 64512) === 56320) {
          c = 65536 + (c - 55296 << 10) + (c2 - 56320);
          m_pos++;
        }
      }
      if (c < 128) {
        buf[i++] = c;
      } else if (c < 2048) {
        buf[i++] = 192 | c >>> 6;
        buf[i++] = 128 | c & 63;
      } else if (c < 65536) {
        buf[i++] = 224 | c >>> 12;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      } else {
        buf[i++] = 240 | c >>> 18;
        buf[i++] = 128 | c >>> 12 & 63;
        buf[i++] = 128 | c >>> 6 & 63;
        buf[i++] = 128 | c & 63;
      }
    }
    return buf;
  };
  var buf2binstring = (buf, len2) => {
    if (len2 < 65534) {
      if (buf.subarray && STR_APPLY_UIA_OK) {
        return String.fromCharCode.apply(null, buf.length === len2 ? buf : buf.subarray(0, len2));
      }
    }
    let result = "";
    for (let i = 0; i < len2; i++) {
      result += String.fromCharCode(buf[i]);
    }
    return result;
  };
  var buf2string = (buf, max2) => {
    const len2 = max2 || buf.length;
    if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
      return new TextDecoder().decode(buf.subarray(0, max2));
    }
    let i, out;
    const utf16buf = new Array(len2 * 2);
    for (out = 0, i = 0; i < len2; ) {
      let c = buf[i++];
      if (c < 128) {
        utf16buf[out++] = c;
        continue;
      }
      let c_len = _utf8len[c];
      if (c_len > 4) {
        utf16buf[out++] = 65533;
        i += c_len - 1;
        continue;
      }
      c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
      while (c_len > 1 && i < len2) {
        c = c << 6 | buf[i++] & 63;
        c_len--;
      }
      if (c_len > 1) {
        utf16buf[out++] = 65533;
        continue;
      }
      if (c < 65536) {
        utf16buf[out++] = c;
      } else {
        c -= 65536;
        utf16buf[out++] = 55296 | c >> 10 & 1023;
        utf16buf[out++] = 56320 | c & 1023;
      }
    }
    return buf2binstring(utf16buf, out);
  };
  var utf8border = (buf, max2) => {
    max2 = max2 || buf.length;
    if (max2 > buf.length) {
      max2 = buf.length;
    }
    let pos = max2 - 1;
    while (pos >= 0 && (buf[pos] & 192) === 128) {
      pos--;
    }
    if (pos < 0) {
      return max2;
    }
    if (pos === 0) {
      return max2;
    }
    return pos + _utf8len[buf[pos]] > max2 ? pos : max2;
  };
  var strings = {
    string2buf,
    buf2string,
    utf8border
  };
  function ZStream() {
    this.input = null;
    this.next_in = 0;
    this.avail_in = 0;
    this.total_in = 0;
    this.output = null;
    this.next_out = 0;
    this.avail_out = 0;
    this.total_out = 0;
    this.msg = "";
    this.state = null;
    this.data_type = 2;
    this.adler = 0;
  }
  var zstream = ZStream;
  var toString$1 = Object.prototype.toString;
  var {
    Z_NO_FLUSH: Z_NO_FLUSH$1,
    Z_SYNC_FLUSH,
    Z_FULL_FLUSH,
    Z_FINISH: Z_FINISH$2,
    Z_OK: Z_OK$2,
    Z_STREAM_END: Z_STREAM_END$2,
    Z_DEFAULT_COMPRESSION,
    Z_DEFAULT_STRATEGY,
    Z_DEFLATED: Z_DEFLATED$1
  } = constants$2;
  function Deflate$1(options) {
    this.options = common.assign({
      level: Z_DEFAULT_COMPRESSION,
      method: Z_DEFLATED$1,
      chunkSize: 16384,
      windowBits: 15,
      memLevel: 8,
      strategy: Z_DEFAULT_STRATEGY
    }, options || {});
    let opt = this.options;
    if (opt.raw && opt.windowBits > 0) {
      opt.windowBits = -opt.windowBits;
    } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
      opt.windowBits += 16;
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = deflate_1$2.deflateInit2(
      this.strm,
      opt.level,
      opt.method,
      opt.windowBits,
      opt.memLevel,
      opt.strategy
    );
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    if (opt.header) {
      deflate_1$2.deflateSetHeader(this.strm, opt.header);
    }
    if (opt.dictionary) {
      let dict;
      if (typeof opt.dictionary === "string") {
        dict = strings.string2buf(opt.dictionary);
      } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
        dict = new Uint8Array(opt.dictionary);
      } else {
        dict = opt.dictionary;
      }
      status = deflate_1$2.deflateSetDictionary(this.strm, dict);
      if (status !== Z_OK$2) {
        throw new Error(messages[status]);
      }
      this._dict_set = true;
    }
  }
  Deflate$1.prototype.push = function(data, flush_mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    let status, _flush_mode;
    if (this.ended) {
      return false;
    }
    if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
    else _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
    if (typeof data === "string") {
      strm.input = strings.string2buf(data);
    } else if (toString$1.call(data) === "[object ArrayBuffer]") {
      strm.input = new Uint8Array(data);
    } else {
      strm.input = data;
    }
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
        this.onData(strm.output.subarray(0, strm.next_out));
        strm.avail_out = 0;
        continue;
      }
      status = deflate_1$2.deflate(strm, _flush_mode);
      if (status === Z_STREAM_END$2) {
        if (strm.next_out > 0) {
          this.onData(strm.output.subarray(0, strm.next_out));
        }
        status = deflate_1$2.deflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return status === Z_OK$2;
      }
      if (strm.avail_out === 0) {
        this.onData(strm.output);
        continue;
      }
      if (_flush_mode > 0 && strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
        strm.avail_out = 0;
        continue;
      }
      if (strm.avail_in === 0) break;
    }
    return true;
  };
  Deflate$1.prototype.onData = function(chunk) {
    this.chunks.push(chunk);
  };
  Deflate$1.prototype.onEnd = function(status) {
    if (status === Z_OK$2) {
      this.result = common.flattenChunks(this.chunks);
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  };
  function deflate$1(input, options) {
    const deflator = new Deflate$1(options);
    deflator.push(input, true);
    if (deflator.err) {
      throw deflator.msg || messages[deflator.err];
    }
    return deflator.result;
  }
  function deflateRaw$1(input, options) {
    options = options || {};
    options.raw = true;
    return deflate$1(input, options);
  }
  function gzip$1(input, options) {
    options = options || {};
    options.gzip = true;
    return deflate$1(input, options);
  }
  var Deflate_1$1 = Deflate$1;
  var deflate_2 = deflate$1;
  var deflateRaw_1$1 = deflateRaw$1;
  var gzip_1$1 = gzip$1;
  var constants$1 = constants$2;
  var deflate_1$1 = {
    Deflate: Deflate_1$1,
    deflate: deflate_2,
    deflateRaw: deflateRaw_1$1,
    gzip: gzip_1$1,
    constants: constants$1
  };
  var BAD$1 = 16209;
  var TYPE$1 = 16191;
  var inffast = function inflate_fast(strm, start) {
    let _in;
    let last;
    let _out;
    let beg;
    let end;
    let dmax;
    let wsize;
    let whave;
    let wnext;
    let s_window;
    let hold;
    let bits;
    let lcode;
    let dcode;
    let lmask;
    let dmask;
    let here;
    let op;
    let len2;
    let dist2;
    let from;
    let from_source;
    let input, output;
    const state = strm.state;
    _in = strm.next_in;
    input = strm.input;
    last = _in + (strm.avail_in - 5);
    _out = strm.next_out;
    output = strm.output;
    beg = _out - (start - strm.avail_out);
    end = _out + (strm.avail_out - 257);
    dmax = state.dmax;
    wsize = state.wsize;
    whave = state.whave;
    wnext = state.wnext;
    s_window = state.window;
    hold = state.hold;
    bits = state.bits;
    lcode = state.lencode;
    dcode = state.distcode;
    lmask = (1 << state.lenbits) - 1;
    dmask = (1 << state.distbits) - 1;
    top:
      do {
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = lcode[hold & lmask];
        dolen:
          for (; ; ) {
            op = here >>> 24;
            hold >>>= op;
            bits -= op;
            op = here >>> 16 & 255;
            if (op === 0) {
              output[_out++] = here & 65535;
            } else if (op & 16) {
              len2 = here & 65535;
              op &= 15;
              if (op) {
                if (bits < op) {
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                len2 += hold & (1 << op) - 1;
                hold >>>= op;
                bits -= op;
              }
              if (bits < 15) {
                hold += input[_in++] << bits;
                bits += 8;
                hold += input[_in++] << bits;
                bits += 8;
              }
              here = dcode[hold & dmask];
              dodist:
                for (; ; ) {
                  op = here >>> 24;
                  hold >>>= op;
                  bits -= op;
                  op = here >>> 16 & 255;
                  if (op & 16) {
                    dist2 = here & 65535;
                    op &= 15;
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                      }
                    }
                    dist2 += hold & (1 << op) - 1;
                    if (dist2 > dmax) {
                      strm.msg = "invalid distance too far back";
                      state.mode = BAD$1;
                      break top;
                    }
                    hold >>>= op;
                    bits -= op;
                    op = _out - beg;
                    if (dist2 > op) {
                      op = dist2 - op;
                      if (op > whave) {
                        if (state.sane) {
                          strm.msg = "invalid distance too far back";
                          state.mode = BAD$1;
                          break top;
                        }
                      }
                      from = 0;
                      from_source = s_window;
                      if (wnext === 0) {
                        from += wsize - op;
                        if (op < len2) {
                          len2 -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist2;
                          from_source = output;
                        }
                      } else if (wnext < op) {
                        from += wsize + wnext - op;
                        op -= wnext;
                        if (op < len2) {
                          len2 -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = 0;
                          if (wnext < len2) {
                            op = wnext;
                            len2 -= op;
                            do {
                              output[_out++] = s_window[from++];
                            } while (--op);
                            from = _out - dist2;
                            from_source = output;
                          }
                        }
                      } else {
                        from += wnext - op;
                        if (op < len2) {
                          len2 -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist2;
                          from_source = output;
                        }
                      }
                      while (len2 > 2) {
                        output[_out++] = from_source[from++];
                        output[_out++] = from_source[from++];
                        output[_out++] = from_source[from++];
                        len2 -= 3;
                      }
                      if (len2) {
                        output[_out++] = from_source[from++];
                        if (len2 > 1) {
                          output[_out++] = from_source[from++];
                        }
                      }
                    } else {
                      from = _out - dist2;
                      do {
                        output[_out++] = output[from++];
                        output[_out++] = output[from++];
                        output[_out++] = output[from++];
                        len2 -= 3;
                      } while (len2 > 2);
                      if (len2) {
                        output[_out++] = output[from++];
                        if (len2 > 1) {
                          output[_out++] = output[from++];
                        }
                      }
                    }
                  } else if ((op & 64) === 0) {
                    here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                    continue dodist;
                  } else {
                    strm.msg = "invalid distance code";
                    state.mode = BAD$1;
                    break top;
                  }
                  break;
                }
            } else if ((op & 64) === 0) {
              here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
              continue dolen;
            } else if (op & 32) {
              state.mode = TYPE$1;
              break top;
            } else {
              strm.msg = "invalid literal/length code";
              state.mode = BAD$1;
              break top;
            }
            break;
          }
      } while (_in < last && _out < end);
    len2 = bits >> 3;
    _in -= len2;
    bits -= len2 << 3;
    hold &= (1 << bits) - 1;
    strm.next_in = _in;
    strm.next_out = _out;
    strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
    strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
    state.hold = hold;
    state.bits = bits;
    return;
  };
  var MAXBITS = 15;
  var ENOUGH_LENS$1 = 852;
  var ENOUGH_DISTS$1 = 592;
  var CODES$1 = 0;
  var LENS$1 = 1;
  var DISTS$1 = 2;
  var lbase = new Uint16Array([
    /* Length codes 257..285 base */
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    13,
    15,
    17,
    19,
    23,
    27,
    31,
    35,
    43,
    51,
    59,
    67,
    83,
    99,
    115,
    131,
    163,
    195,
    227,
    258,
    0,
    0
  ]);
  var lext = new Uint8Array([
    /* Length codes 257..285 extra */
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    16,
    17,
    17,
    17,
    17,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    20,
    20,
    20,
    20,
    21,
    21,
    21,
    21,
    16,
    72,
    78
  ]);
  var dbase = new Uint16Array([
    /* Distance codes 0..29 base */
    1,
    2,
    3,
    4,
    5,
    7,
    9,
    13,
    17,
    25,
    33,
    49,
    65,
    97,
    129,
    193,
    257,
    385,
    513,
    769,
    1025,
    1537,
    2049,
    3073,
    4097,
    6145,
    8193,
    12289,
    16385,
    24577,
    0,
    0
  ]);
  var dext = new Uint8Array([
    /* Distance codes 0..29 extra */
    16,
    16,
    16,
    16,
    17,
    17,
    18,
    18,
    19,
    19,
    20,
    20,
    21,
    21,
    22,
    22,
    23,
    23,
    24,
    24,
    25,
    25,
    26,
    26,
    27,
    27,
    28,
    28,
    29,
    29,
    64,
    64
  ]);
  var inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
    const bits = opts.bits;
    let len2 = 0;
    let sym = 0;
    let min2 = 0, max2 = 0;
    let root = 0;
    let curr = 0;
    let drop = 0;
    let left = 0;
    let used = 0;
    let huff = 0;
    let incr;
    let fill;
    let low;
    let mask;
    let next;
    let base = null;
    let match;
    const count = new Uint16Array(MAXBITS + 1);
    const offs = new Uint16Array(MAXBITS + 1);
    let extra = null;
    let here_bits, here_op, here_val;
    for (len2 = 0; len2 <= MAXBITS; len2++) {
      count[len2] = 0;
    }
    for (sym = 0; sym < codes; sym++) {
      count[lens[lens_index + sym]]++;
    }
    root = bits;
    for (max2 = MAXBITS; max2 >= 1; max2--) {
      if (count[max2] !== 0) {
        break;
      }
    }
    if (root > max2) {
      root = max2;
    }
    if (max2 === 0) {
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      table[table_index++] = 1 << 24 | 64 << 16 | 0;
      opts.bits = 1;
      return 0;
    }
    for (min2 = 1; min2 < max2; min2++) {
      if (count[min2] !== 0) {
        break;
      }
    }
    if (root < min2) {
      root = min2;
    }
    left = 1;
    for (len2 = 1; len2 <= MAXBITS; len2++) {
      left <<= 1;
      left -= count[len2];
      if (left < 0) {
        return -1;
      }
    }
    if (left > 0 && (type === CODES$1 || max2 !== 1)) {
      return -1;
    }
    offs[1] = 0;
    for (len2 = 1; len2 < MAXBITS; len2++) {
      offs[len2 + 1] = offs[len2] + count[len2];
    }
    for (sym = 0; sym < codes; sym++) {
      if (lens[lens_index + sym] !== 0) {
        work[offs[lens[lens_index + sym]]++] = sym;
      }
    }
    if (type === CODES$1) {
      base = extra = work;
      match = 20;
    } else if (type === LENS$1) {
      base = lbase;
      extra = lext;
      match = 257;
    } else {
      base = dbase;
      extra = dext;
      match = 0;
    }
    huff = 0;
    sym = 0;
    len2 = min2;
    next = table_index;
    curr = root;
    drop = 0;
    low = -1;
    used = 1 << root;
    mask = used - 1;
    if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
      return 1;
    }
    for (; ; ) {
      here_bits = len2 - drop;
      if (work[sym] + 1 < match) {
        here_op = 0;
        here_val = work[sym];
      } else if (work[sym] >= match) {
        here_op = extra[work[sym] - match];
        here_val = base[work[sym] - match];
      } else {
        here_op = 32 + 64;
        here_val = 0;
      }
      incr = 1 << len2 - drop;
      fill = 1 << curr;
      min2 = fill;
      do {
        fill -= incr;
        table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
      } while (fill !== 0);
      incr = 1 << len2 - 1;
      while (huff & incr) {
        incr >>= 1;
      }
      if (incr !== 0) {
        huff &= incr - 1;
        huff += incr;
      } else {
        huff = 0;
      }
      sym++;
      if (--count[len2] === 0) {
        if (len2 === max2) {
          break;
        }
        len2 = lens[lens_index + work[sym]];
      }
      if (len2 > root && (huff & mask) !== low) {
        if (drop === 0) {
          drop = root;
        }
        next += min2;
        curr = len2 - drop;
        left = 1 << curr;
        while (curr + drop < max2) {
          left -= count[curr + drop];
          if (left <= 0) {
            break;
          }
          curr++;
          left <<= 1;
        }
        used += 1 << curr;
        if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
          return 1;
        }
        low = huff & mask;
        table[low] = root << 24 | curr << 16 | next - table_index | 0;
      }
    }
    if (huff !== 0) {
      table[next + huff] = len2 - drop << 24 | 64 << 16 | 0;
    }
    opts.bits = root;
    return 0;
  };
  var inftrees = inflate_table;
  var CODES = 0;
  var LENS = 1;
  var DISTS = 2;
  var {
    Z_FINISH: Z_FINISH$1,
    Z_BLOCK,
    Z_TREES,
    Z_OK: Z_OK$1,
    Z_STREAM_END: Z_STREAM_END$1,
    Z_NEED_DICT: Z_NEED_DICT$1,
    Z_STREAM_ERROR: Z_STREAM_ERROR$1,
    Z_DATA_ERROR: Z_DATA_ERROR$1,
    Z_MEM_ERROR: Z_MEM_ERROR$1,
    Z_BUF_ERROR,
    Z_DEFLATED
  } = constants$2;
  var HEAD = 16180;
  var FLAGS = 16181;
  var TIME = 16182;
  var OS = 16183;
  var EXLEN = 16184;
  var EXTRA = 16185;
  var NAME = 16186;
  var COMMENT = 16187;
  var HCRC = 16188;
  var DICTID = 16189;
  var DICT = 16190;
  var TYPE = 16191;
  var TYPEDO = 16192;
  var STORED = 16193;
  var COPY_ = 16194;
  var COPY = 16195;
  var TABLE = 16196;
  var LENLENS = 16197;
  var CODELENS = 16198;
  var LEN_ = 16199;
  var LEN = 16200;
  var LENEXT = 16201;
  var DIST = 16202;
  var DISTEXT = 16203;
  var MATCH = 16204;
  var LIT = 16205;
  var CHECK = 16206;
  var LENGTH = 16207;
  var DONE = 16208;
  var BAD = 16209;
  var MEM = 16210;
  var SYNC = 16211;
  var ENOUGH_LENS = 852;
  var ENOUGH_DISTS = 592;
  var MAX_WBITS = 15;
  var DEF_WBITS = MAX_WBITS;
  var zswap32 = (q) => {
    return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
  };
  function InflateState() {
    this.strm = null;
    this.mode = 0;
    this.last = false;
    this.wrap = 0;
    this.havedict = false;
    this.flags = 0;
    this.dmax = 0;
    this.check = 0;
    this.total = 0;
    this.head = null;
    this.wbits = 0;
    this.wsize = 0;
    this.whave = 0;
    this.wnext = 0;
    this.window = null;
    this.hold = 0;
    this.bits = 0;
    this.length = 0;
    this.offset = 0;
    this.extra = 0;
    this.lencode = null;
    this.distcode = null;
    this.lenbits = 0;
    this.distbits = 0;
    this.ncode = 0;
    this.nlen = 0;
    this.ndist = 0;
    this.have = 0;
    this.next = null;
    this.lens = new Uint16Array(320);
    this.work = new Uint16Array(288);
    this.lendyn = null;
    this.distdyn = null;
    this.sane = 0;
    this.back = 0;
    this.was = 0;
  }
  var inflateStateCheck = (strm) => {
    if (!strm) {
      return 1;
    }
    const state = strm.state;
    if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
      return 1;
    }
    return 0;
  };
  var inflateResetKeep = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    strm.total_in = strm.total_out = state.total = 0;
    strm.msg = "";
    if (state.wrap) {
      strm.adler = state.wrap & 1;
    }
    state.mode = HEAD;
    state.last = 0;
    state.havedict = 0;
    state.flags = -1;
    state.dmax = 32768;
    state.head = null;
    state.hold = 0;
    state.bits = 0;
    state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
    state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
    state.sane = 1;
    state.back = -1;
    return Z_OK$1;
  };
  var inflateReset = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    state.wsize = 0;
    state.whave = 0;
    state.wnext = 0;
    return inflateResetKeep(strm);
  };
  var inflateReset2 = (strm, windowBits) => {
    let wrap;
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    if (windowBits < 0) {
      wrap = 0;
      windowBits = -windowBits;
    } else {
      wrap = (windowBits >> 4) + 5;
      if (windowBits < 48) {
        windowBits &= 15;
      }
    }
    if (windowBits && (windowBits < 8 || windowBits > 15)) {
      return Z_STREAM_ERROR$1;
    }
    if (state.window !== null && state.wbits !== windowBits) {
      state.window = null;
    }
    state.wrap = wrap;
    state.wbits = windowBits;
    return inflateReset(strm);
  };
  var inflateInit2 = (strm, windowBits) => {
    if (!strm) {
      return Z_STREAM_ERROR$1;
    }
    const state = new InflateState();
    strm.state = state;
    state.strm = strm;
    state.window = null;
    state.mode = HEAD;
    const ret = inflateReset2(strm, windowBits);
    if (ret !== Z_OK$1) {
      strm.state = null;
    }
    return ret;
  };
  var inflateInit = (strm) => {
    return inflateInit2(strm, DEF_WBITS);
  };
  var virgin = true;
  var lenfix;
  var distfix;
  var fixedtables = (state) => {
    if (virgin) {
      lenfix = new Int32Array(512);
      distfix = new Int32Array(32);
      let sym = 0;
      while (sym < 144) {
        state.lens[sym++] = 8;
      }
      while (sym < 256) {
        state.lens[sym++] = 9;
      }
      while (sym < 280) {
        state.lens[sym++] = 7;
      }
      while (sym < 288) {
        state.lens[sym++] = 8;
      }
      inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
      sym = 0;
      while (sym < 32) {
        state.lens[sym++] = 5;
      }
      inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
      virgin = false;
    }
    state.lencode = lenfix;
    state.lenbits = 9;
    state.distcode = distfix;
    state.distbits = 5;
  };
  var updatewindow = (strm, src, end, copy4) => {
    let dist2;
    const state = strm.state;
    if (state.window === null) {
      state.wsize = 1 << state.wbits;
      state.wnext = 0;
      state.whave = 0;
      state.window = new Uint8Array(state.wsize);
    }
    if (copy4 >= state.wsize) {
      state.window.set(src.subarray(end - state.wsize, end), 0);
      state.wnext = 0;
      state.whave = state.wsize;
    } else {
      dist2 = state.wsize - state.wnext;
      if (dist2 > copy4) {
        dist2 = copy4;
      }
      state.window.set(src.subarray(end - copy4, end - copy4 + dist2), state.wnext);
      copy4 -= dist2;
      if (copy4) {
        state.window.set(src.subarray(end - copy4, end), 0);
        state.wnext = copy4;
        state.whave = state.wsize;
      } else {
        state.wnext += dist2;
        if (state.wnext === state.wsize) {
          state.wnext = 0;
        }
        if (state.whave < state.wsize) {
          state.whave += dist2;
        }
      }
    }
    return 0;
  };
  var inflate$2 = (strm, flush) => {
    let state;
    let input, output;
    let next;
    let put;
    let have, left;
    let hold;
    let bits;
    let _in, _out;
    let copy4;
    let from;
    let from_source;
    let here = 0;
    let here_bits, here_op, here_val;
    let last_bits, last_op, last_val;
    let len2;
    let ret;
    const hbuf = new Uint8Array(4);
    let opts;
    let n;
    const order = (
      /* permutation of code lengths */
      new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
    );
    if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
      return Z_STREAM_ERROR$1;
    }
    state = strm.state;
    if (state.mode === TYPE) {
      state.mode = TYPEDO;
    }
    put = strm.next_out;
    output = strm.output;
    left = strm.avail_out;
    next = strm.next_in;
    input = strm.input;
    have = strm.avail_in;
    hold = state.hold;
    bits = state.bits;
    _in = have;
    _out = left;
    ret = Z_OK$1;
    inf_leave:
      for (; ; ) {
        switch (state.mode) {
          case HEAD:
            if (state.wrap === 0) {
              state.mode = TYPEDO;
              break;
            }
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 2 && hold === 35615) {
              if (state.wbits === 0) {
                state.wbits = 15;
              }
              state.check = 0;
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
              hold = 0;
              bits = 0;
              state.mode = FLAGS;
              break;
            }
            if (state.head) {
              state.head.done = false;
            }
            if (!(state.wrap & 1) || /* check if zlib header allowed */
            (((hold & 255) << 8) + (hold >> 8)) % 31) {
              strm.msg = "incorrect header check";
              state.mode = BAD;
              break;
            }
            if ((hold & 15) !== Z_DEFLATED) {
              strm.msg = "unknown compression method";
              state.mode = BAD;
              break;
            }
            hold >>>= 4;
            bits -= 4;
            len2 = (hold & 15) + 8;
            if (state.wbits === 0) {
              state.wbits = len2;
            }
            if (len2 > 15 || len2 > state.wbits) {
              strm.msg = "invalid window size";
              state.mode = BAD;
              break;
            }
            state.dmax = 1 << state.wbits;
            state.flags = 0;
            strm.adler = state.check = 1;
            state.mode = hold & 512 ? DICTID : TYPE;
            hold = 0;
            bits = 0;
            break;
          case FLAGS:
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.flags = hold;
            if ((state.flags & 255) !== Z_DEFLATED) {
              strm.msg = "unknown compression method";
              state.mode = BAD;
              break;
            }
            if (state.flags & 57344) {
              strm.msg = "unknown header flags set";
              state.mode = BAD;
              break;
            }
            if (state.head) {
              state.head.text = hold >> 8 & 1;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = TIME;
          /* falls through */
          case TIME:
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.head) {
              state.head.time = hold;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              hbuf[2] = hold >>> 16 & 255;
              hbuf[3] = hold >>> 24 & 255;
              state.check = crc32_1(state.check, hbuf, 4, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = OS;
          /* falls through */
          case OS:
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.head) {
              state.head.xflags = hold & 255;
              state.head.os = hold >> 8;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
            state.mode = EXLEN;
          /* falls through */
          case EXLEN:
            if (state.flags & 1024) {
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.length = hold;
              if (state.head) {
                state.head.extra_len = hold;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32_1(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
            } else if (state.head) {
              state.head.extra = null;
            }
            state.mode = EXTRA;
          /* falls through */
          case EXTRA:
            if (state.flags & 1024) {
              copy4 = state.length;
              if (copy4 > have) {
                copy4 = have;
              }
              if (copy4) {
                if (state.head) {
                  len2 = state.head.extra_len - state.length;
                  if (!state.head.extra) {
                    state.head.extra = new Uint8Array(state.head.extra_len);
                  }
                  state.head.extra.set(
                    input.subarray(
                      next,
                      // extra field is limited to 65536 bytes
                      // - no need for additional size check
                      next + copy4
                    ),
                    /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                    len2
                  );
                }
                if (state.flags & 512 && state.wrap & 4) {
                  state.check = crc32_1(state.check, input, copy4, next);
                }
                have -= copy4;
                next += copy4;
                state.length -= copy4;
              }
              if (state.length) {
                break inf_leave;
              }
            }
            state.length = 0;
            state.mode = NAME;
          /* falls through */
          case NAME:
            if (state.flags & 2048) {
              if (have === 0) {
                break inf_leave;
              }
              copy4 = 0;
              do {
                len2 = input[next + copy4++];
                if (state.head && len2 && state.length < 65536) {
                  state.head.name += String.fromCharCode(len2);
                }
              } while (len2 && copy4 < have);
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy4, next);
              }
              have -= copy4;
              next += copy4;
              if (len2) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.name = null;
            }
            state.length = 0;
            state.mode = COMMENT;
          /* falls through */
          case COMMENT:
            if (state.flags & 4096) {
              if (have === 0) {
                break inf_leave;
              }
              copy4 = 0;
              do {
                len2 = input[next + copy4++];
                if (state.head && len2 && state.length < 65536) {
                  state.head.comment += String.fromCharCode(len2);
                }
              } while (len2 && copy4 < have);
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy4, next);
              }
              have -= copy4;
              next += copy4;
              if (len2) {
                break inf_leave;
              }
            } else if (state.head) {
              state.head.comment = null;
            }
            state.mode = HCRC;
          /* falls through */
          case HCRC:
            if (state.flags & 512) {
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 4 && hold !== (state.check & 65535)) {
                strm.msg = "header crc mismatch";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            if (state.head) {
              state.head.hcrc = state.flags >> 9 & 1;
              state.head.done = true;
            }
            strm.adler = state.check = 0;
            state.mode = TYPE;
            break;
          case DICTID:
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            strm.adler = state.check = zswap32(hold);
            hold = 0;
            bits = 0;
            state.mode = DICT;
          /* falls through */
          case DICT:
            if (state.havedict === 0) {
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              return Z_NEED_DICT$1;
            }
            strm.adler = state.check = 1;
            state.mode = TYPE;
          /* falls through */
          case TYPE:
            if (flush === Z_BLOCK || flush === Z_TREES) {
              break inf_leave;
            }
          /* falls through */
          case TYPEDO:
            if (state.last) {
              hold >>>= bits & 7;
              bits -= bits & 7;
              state.mode = CHECK;
              break;
            }
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.last = hold & 1;
            hold >>>= 1;
            bits -= 1;
            switch (hold & 3) {
              case 0:
                state.mode = STORED;
                break;
              case 1:
                fixedtables(state);
                state.mode = LEN_;
                if (flush === Z_TREES) {
                  hold >>>= 2;
                  bits -= 2;
                  break inf_leave;
                }
                break;
              case 2:
                state.mode = TABLE;
                break;
              case 3:
                strm.msg = "invalid block type";
                state.mode = BAD;
            }
            hold >>>= 2;
            bits -= 2;
            break;
          case STORED:
            hold >>>= bits & 7;
            bits -= bits & 7;
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
              strm.msg = "invalid stored block lengths";
              state.mode = BAD;
              break;
            }
            state.length = hold & 65535;
            hold = 0;
            bits = 0;
            state.mode = COPY_;
            if (flush === Z_TREES) {
              break inf_leave;
            }
          /* falls through */
          case COPY_:
            state.mode = COPY;
          /* falls through */
          case COPY:
            copy4 = state.length;
            if (copy4) {
              if (copy4 > have) {
                copy4 = have;
              }
              if (copy4 > left) {
                copy4 = left;
              }
              if (copy4 === 0) {
                break inf_leave;
              }
              output.set(input.subarray(next, next + copy4), put);
              have -= copy4;
              next += copy4;
              left -= copy4;
              put += copy4;
              state.length -= copy4;
              break;
            }
            state.mode = TYPE;
            break;
          case TABLE:
            while (bits < 14) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.nlen = (hold & 31) + 257;
            hold >>>= 5;
            bits -= 5;
            state.ndist = (hold & 31) + 1;
            hold >>>= 5;
            bits -= 5;
            state.ncode = (hold & 15) + 4;
            hold >>>= 4;
            bits -= 4;
            if (state.nlen > 286 || state.ndist > 30) {
              strm.msg = "too many length or distance symbols";
              state.mode = BAD;
              break;
            }
            state.have = 0;
            state.mode = LENLENS;
          /* falls through */
          case LENLENS:
            while (state.have < state.ncode) {
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.lens[order[state.have++]] = hold & 7;
              hold >>>= 3;
              bits -= 3;
            }
            while (state.have < 19) {
              state.lens[order[state.have++]] = 0;
            }
            state.lencode = state.lendyn;
            state.lenbits = 7;
            opts = { bits: state.lenbits };
            ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;
            if (ret) {
              strm.msg = "invalid code lengths set";
              state.mode = BAD;
              break;
            }
            state.have = 0;
            state.mode = CODELENS;
          /* falls through */
          case CODELENS:
            while (state.have < state.nlen + state.ndist) {
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (here_val < 16) {
                hold >>>= here_bits;
                bits -= here_bits;
                state.lens[state.have++] = here_val;
              } else {
                if (here_val === 16) {
                  n = here_bits + 2;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  if (state.have === 0) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  len2 = state.lens[state.have - 1];
                  copy4 = 3 + (hold & 3);
                  hold >>>= 2;
                  bits -= 2;
                } else if (here_val === 17) {
                  n = here_bits + 3;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  len2 = 0;
                  copy4 = 3 + (hold & 7);
                  hold >>>= 3;
                  bits -= 3;
                } else {
                  n = here_bits + 7;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= here_bits;
                  bits -= here_bits;
                  len2 = 0;
                  copy4 = 11 + (hold & 127);
                  hold >>>= 7;
                  bits -= 7;
                }
                if (state.have + copy4 > state.nlen + state.ndist) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD;
                  break;
                }
                while (copy4--) {
                  state.lens[state.have++] = len2;
                }
              }
            }
            if (state.mode === BAD) {
              break;
            }
            if (state.lens[256] === 0) {
              strm.msg = "invalid code -- missing end-of-block";
              state.mode = BAD;
              break;
            }
            state.lenbits = 9;
            opts = { bits: state.lenbits };
            ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
            state.lenbits = opts.bits;
            if (ret) {
              strm.msg = "invalid literal/lengths set";
              state.mode = BAD;
              break;
            }
            state.distbits = 6;
            state.distcode = state.distdyn;
            opts = { bits: state.distbits };
            ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
            state.distbits = opts.bits;
            if (ret) {
              strm.msg = "invalid distances set";
              state.mode = BAD;
              break;
            }
            state.mode = LEN_;
            if (flush === Z_TREES) {
              break inf_leave;
            }
          /* falls through */
          case LEN_:
            state.mode = LEN;
          /* falls through */
          case LEN:
            if (have >= 6 && left >= 258) {
              strm.next_out = put;
              strm.avail_out = left;
              strm.next_in = next;
              strm.avail_in = have;
              state.hold = hold;
              state.bits = bits;
              inffast(strm, _out);
              put = strm.next_out;
              output = strm.output;
              left = strm.avail_out;
              next = strm.next_in;
              input = strm.input;
              have = strm.avail_in;
              hold = state.hold;
              bits = state.bits;
              if (state.mode === TYPE) {
                state.back = -1;
              }
              break;
            }
            state.back = 0;
            for (; ; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_op && (here_op & 240) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (; ; ) {
                here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (last_bits + here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              hold >>>= last_bits;
              bits -= last_bits;
              state.back += last_bits;
            }
            hold >>>= here_bits;
            bits -= here_bits;
            state.back += here_bits;
            state.length = here_val;
            if (here_op === 0) {
              state.mode = LIT;
              break;
            }
            if (here_op & 32) {
              state.back = -1;
              state.mode = TYPE;
              break;
            }
            if (here_op & 64) {
              strm.msg = "invalid literal/length code";
              state.mode = BAD;
              break;
            }
            state.extra = here_op & 15;
            state.mode = LENEXT;
          /* falls through */
          case LENEXT:
            if (state.extra) {
              n = state.extra;
              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.length += hold & (1 << state.extra) - 1;
              hold >>>= state.extra;
              bits -= state.extra;
              state.back += state.extra;
            }
            state.was = state.length;
            state.mode = DIST;
          /* falls through */
          case DIST:
            for (; ; ) {
              here = state.distcode[hold & (1 << state.distbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if ((here_op & 240) === 0) {
              last_bits = here_bits;
              last_op = here_op;
              last_val = here_val;
              for (; ; ) {
                here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (last_bits + here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              hold >>>= last_bits;
              bits -= last_bits;
              state.back += last_bits;
            }
            hold >>>= here_bits;
            bits -= here_bits;
            state.back += here_bits;
            if (here_op & 64) {
              strm.msg = "invalid distance code";
              state.mode = BAD;
              break;
            }
            state.offset = here_val;
            state.extra = here_op & 15;
            state.mode = DISTEXT;
          /* falls through */
          case DISTEXT:
            if (state.extra) {
              n = state.extra;
              while (bits < n) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              state.offset += hold & (1 << state.extra) - 1;
              hold >>>= state.extra;
              bits -= state.extra;
              state.back += state.extra;
            }
            if (state.offset > state.dmax) {
              strm.msg = "invalid distance too far back";
              state.mode = BAD;
              break;
            }
            state.mode = MATCH;
          /* falls through */
          case MATCH:
            if (left === 0) {
              break inf_leave;
            }
            copy4 = _out - left;
            if (state.offset > copy4) {
              copy4 = state.offset - copy4;
              if (copy4 > state.whave) {
                if (state.sane) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break;
                }
              }
              if (copy4 > state.wnext) {
                copy4 -= state.wnext;
                from = state.wsize - copy4;
              } else {
                from = state.wnext - copy4;
              }
              if (copy4 > state.length) {
                copy4 = state.length;
              }
              from_source = state.window;
            } else {
              from_source = output;
              from = put - state.offset;
              copy4 = state.length;
            }
            if (copy4 > left) {
              copy4 = left;
            }
            left -= copy4;
            state.length -= copy4;
            do {
              output[put++] = from_source[from++];
            } while (--copy4);
            if (state.length === 0) {
              state.mode = LEN;
            }
            break;
          case LIT:
            if (left === 0) {
              break inf_leave;
            }
            output[put++] = state.length;
            left--;
            state.mode = LEN;
            break;
          case CHECK:
            if (state.wrap) {
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold |= input[next++] << bits;
                bits += 8;
              }
              _out -= left;
              strm.total_out += _out;
              state.total += _out;
              if (state.wrap & 4 && _out) {
                strm.adler = state.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
                state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
              }
              _out = left;
              if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
                strm.msg = "incorrect data check";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            state.mode = LENGTH;
          /* falls through */
          case LENGTH:
            if (state.wrap && state.flags) {
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next++] << bits;
                bits += 8;
              }
              if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
                strm.msg = "incorrect length check";
                state.mode = BAD;
                break;
              }
              hold = 0;
              bits = 0;
            }
            state.mode = DONE;
          /* falls through */
          case DONE:
            ret = Z_STREAM_END$1;
            break inf_leave;
          case BAD:
            ret = Z_DATA_ERROR$1;
            break inf_leave;
          case MEM:
            return Z_MEM_ERROR$1;
          case SYNC:
          /* falls through */
          default:
            return Z_STREAM_ERROR$1;
        }
      }
    strm.next_out = put;
    strm.avail_out = left;
    strm.next_in = next;
    strm.avail_in = have;
    state.hold = hold;
    state.bits = bits;
    if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
      if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
    }
    _in -= strm.avail_in;
    _out -= strm.avail_out;
    strm.total_in += _in;
    strm.total_out += _out;
    state.total += _out;
    if (state.wrap & 4 && _out) {
      strm.adler = state.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
      state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
    }
    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
    if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
      ret = Z_BUF_ERROR;
    }
    return ret;
  };
  var inflateEnd = (strm) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    let state = strm.state;
    if (state.window) {
      state.window = null;
    }
    strm.state = null;
    return Z_OK$1;
  };
  var inflateGetHeader = (strm, head) => {
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    const state = strm.state;
    if ((state.wrap & 2) === 0) {
      return Z_STREAM_ERROR$1;
    }
    state.head = head;
    head.done = false;
    return Z_OK$1;
  };
  var inflateSetDictionary = (strm, dictionary) => {
    const dictLength = dictionary.length;
    let state;
    let dictid;
    let ret;
    if (inflateStateCheck(strm)) {
      return Z_STREAM_ERROR$1;
    }
    state = strm.state;
    if (state.wrap !== 0 && state.mode !== DICT) {
      return Z_STREAM_ERROR$1;
    }
    if (state.mode === DICT) {
      dictid = 1;
      dictid = adler32_1(dictid, dictionary, dictLength, 0);
      if (dictid !== state.check) {
        return Z_DATA_ERROR$1;
      }
    }
    ret = updatewindow(strm, dictionary, dictLength, dictLength);
    if (ret) {
      state.mode = MEM;
      return Z_MEM_ERROR$1;
    }
    state.havedict = 1;
    return Z_OK$1;
  };
  var inflateReset_1 = inflateReset;
  var inflateReset2_1 = inflateReset2;
  var inflateResetKeep_1 = inflateResetKeep;
  var inflateInit_1 = inflateInit;
  var inflateInit2_1 = inflateInit2;
  var inflate_2$1 = inflate$2;
  var inflateEnd_1 = inflateEnd;
  var inflateGetHeader_1 = inflateGetHeader;
  var inflateSetDictionary_1 = inflateSetDictionary;
  var inflateInfo = "pako inflate (from Nodeca project)";
  var inflate_1$2 = {
    inflateReset: inflateReset_1,
    inflateReset2: inflateReset2_1,
    inflateResetKeep: inflateResetKeep_1,
    inflateInit: inflateInit_1,
    inflateInit2: inflateInit2_1,
    inflate: inflate_2$1,
    inflateEnd: inflateEnd_1,
    inflateGetHeader: inflateGetHeader_1,
    inflateSetDictionary: inflateSetDictionary_1,
    inflateInfo
  };
  function GZheader() {
    this.text = 0;
    this.time = 0;
    this.xflags = 0;
    this.os = 0;
    this.extra = null;
    this.extra_len = 0;
    this.name = "";
    this.comment = "";
    this.hcrc = 0;
    this.done = false;
  }
  var gzheader = GZheader;
  var toString = Object.prototype.toString;
  var {
    Z_NO_FLUSH,
    Z_FINISH,
    Z_OK,
    Z_STREAM_END,
    Z_NEED_DICT,
    Z_STREAM_ERROR,
    Z_DATA_ERROR,
    Z_MEM_ERROR
  } = constants$2;
  function Inflate$1(options) {
    this.options = common.assign({
      chunkSize: 1024 * 64,
      windowBits: 15,
      to: ""
    }, options || {});
    const opt = this.options;
    if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
      opt.windowBits = -opt.windowBits;
      if (opt.windowBits === 0) {
        opt.windowBits = -15;
      }
    }
    if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
      opt.windowBits += 32;
    }
    if (opt.windowBits > 15 && opt.windowBits < 48) {
      if ((opt.windowBits & 15) === 0) {
        opt.windowBits |= 15;
      }
    }
    this.err = 0;
    this.msg = "";
    this.ended = false;
    this.chunks = [];
    this.strm = new zstream();
    this.strm.avail_out = 0;
    let status = inflate_1$2.inflateInit2(
      this.strm,
      opt.windowBits
    );
    if (status !== Z_OK) {
      throw new Error(messages[status]);
    }
    this.header = new gzheader();
    inflate_1$2.inflateGetHeader(this.strm, this.header);
    if (opt.dictionary) {
      if (typeof opt.dictionary === "string") {
        opt.dictionary = strings.string2buf(opt.dictionary);
      } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
        opt.dictionary = new Uint8Array(opt.dictionary);
      }
      if (opt.raw) {
        status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
        if (status !== Z_OK) {
          throw new Error(messages[status]);
        }
      }
    }
  }
  Inflate$1.prototype.push = function(data, flush_mode) {
    const strm = this.strm;
    const chunkSize = this.options.chunkSize;
    const dictionary = this.options.dictionary;
    let status, _flush_mode, last_avail_out;
    if (this.ended) return false;
    if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
    else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
    if (toString.call(data) === "[object ArrayBuffer]") {
      strm.input = new Uint8Array(data);
    } else {
      strm.input = data;
    }
    strm.next_in = 0;
    strm.avail_in = strm.input.length;
    for (; ; ) {
      if (strm.avail_out === 0) {
        strm.output = new Uint8Array(chunkSize);
        strm.next_out = 0;
        strm.avail_out = chunkSize;
      }
      status = inflate_1$2.inflate(strm, _flush_mode);
      if (status === Z_NEED_DICT && dictionary) {
        status = inflate_1$2.inflateSetDictionary(strm, dictionary);
        if (status === Z_OK) {
          status = inflate_1$2.inflate(strm, _flush_mode);
        } else if (status === Z_DATA_ERROR) {
          status = Z_NEED_DICT;
        }
      }
      while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
        inflate_1$2.inflateReset(strm);
        status = inflate_1$2.inflate(strm, _flush_mode);
      }
      switch (status) {
        case Z_STREAM_ERROR:
        case Z_DATA_ERROR:
        case Z_NEED_DICT:
        case Z_MEM_ERROR:
          this.onEnd(status);
          this.ended = true;
          return false;
      }
      last_avail_out = strm.avail_out;
      if (strm.next_out) {
        if (strm.avail_out === 0 || status === Z_STREAM_END) {
          if (this.options.to === "string") {
            let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
            let tail = strm.next_out - next_out_utf8;
            let utf8str = strings.buf2string(strm.output, next_out_utf8);
            strm.next_out = tail;
            strm.avail_out = chunkSize - tail;
            if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
            this.onData(utf8str);
          } else {
            this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
          }
        }
      }
      if (status === Z_OK && last_avail_out === 0) continue;
      if (status === Z_STREAM_END) {
        status = inflate_1$2.inflateEnd(this.strm);
        this.onEnd(status);
        this.ended = true;
        return true;
      }
      if (strm.avail_in === 0) break;
    }
    return true;
  };
  Inflate$1.prototype.onData = function(chunk) {
    this.chunks.push(chunk);
  };
  Inflate$1.prototype.onEnd = function(status) {
    if (status === Z_OK) {
      if (this.options.to === "string") {
        this.result = this.chunks.join("");
      } else {
        this.result = common.flattenChunks(this.chunks);
      }
    }
    this.chunks = [];
    this.err = status;
    this.msg = this.strm.msg;
  };
  function inflate$1(input, options) {
    const inflator = new Inflate$1(options);
    inflator.push(input);
    if (inflator.err) throw inflator.msg || messages[inflator.err];
    return inflator.result;
  }
  function inflateRaw$1(input, options) {
    options = options || {};
    options.raw = true;
    return inflate$1(input, options);
  }
  var Inflate_1$1 = Inflate$1;
  var inflate_2 = inflate$1;
  var inflateRaw_1$1 = inflateRaw$1;
  var ungzip$1 = inflate$1;
  var constants = constants$2;
  var inflate_1$1 = {
    Inflate: Inflate_1$1,
    inflate: inflate_2,
    inflateRaw: inflateRaw_1$1,
    ungzip: ungzip$1,
    constants
  };
  var { Deflate, deflate, deflateRaw, gzip } = deflate_1$1;
  var { Inflate, inflate, inflateRaw, ungzip } = inflate_1$1;
  var Deflate_1 = Deflate;
  var deflate_1 = deflate;
  var deflateRaw_1 = deflateRaw;
  var gzip_1 = gzip;
  var Inflate_1 = Inflate;
  var inflate_1 = inflate;
  var inflateRaw_1 = inflateRaw;
  var ungzip_1 = ungzip;
  var constants_1 = constants$2;
  var pako = {
    Deflate: Deflate_1,
    deflate: deflate_1,
    deflateRaw: deflateRaw_1,
    gzip: gzip_1,
    Inflate: Inflate_1,
    inflate: inflate_1,
    inflateRaw: inflateRaw_1,
    ungzip: ungzip_1,
    constants: constants_1
  };

  // node_modules/deepslate/lib/nbt/tags/NbtType.js
  var NbtType;
  (function(NbtType2) {
    NbtType2[NbtType2["End"] = 0] = "End";
    NbtType2[NbtType2["Byte"] = 1] = "Byte";
    NbtType2[NbtType2["Short"] = 2] = "Short";
    NbtType2[NbtType2["Int"] = 3] = "Int";
    NbtType2[NbtType2["Long"] = 4] = "Long";
    NbtType2[NbtType2["Float"] = 5] = "Float";
    NbtType2[NbtType2["Double"] = 6] = "Double";
    NbtType2[NbtType2["ByteArray"] = 7] = "ByteArray";
    NbtType2[NbtType2["String"] = 8] = "String";
    NbtType2[NbtType2["List"] = 9] = "List";
    NbtType2[NbtType2["Compound"] = 10] = "Compound";
    NbtType2[NbtType2["IntArray"] = 11] = "IntArray";
    NbtType2[NbtType2["LongArray"] = 12] = "LongArray";
  })(NbtType || (NbtType = {}));

  // node_modules/deepslate/lib/nbt/tags/NbtTag.js
  var NbtTag = class _NbtTag {
    static FACTORIES = /* @__PURE__ */ new Map();
    static register(type, factory) {
      const factoryType = factory.create().getId();
      if (factoryType !== type) {
        throw new Error(`Registered factory ${NbtType[factoryType]} does not match type ${NbtType[type]}`);
      }
      _NbtTag.FACTORIES.set(type, factory);
    }
    isEnd() {
      return this.getId() === NbtType.End;
    }
    isByte() {
      return this.getId() === NbtType.Byte;
    }
    isShort() {
      return this.getId() === NbtType.Short;
    }
    isInt() {
      return this.getId() === NbtType.Int;
    }
    isLong() {
      return this.getId() === NbtType.Long;
    }
    isFloat() {
      return this.getId() === NbtType.Float;
    }
    isDouble() {
      return this.getId() === NbtType.Double;
    }
    isByteArray() {
      return this.getId() === NbtType.ByteArray;
    }
    isString() {
      return this.getId() === NbtType.String;
    }
    isList() {
      return this.getId() === NbtType.List;
    }
    isCompound() {
      return this.getId() === NbtType.Compound;
    }
    isIntArray() {
      return this.getId() === NbtType.IntArray;
    }
    isLongArray() {
      return this.getId() === NbtType.LongArray;
    }
    isNumber() {
      return this.isByte() || this.isShort() || this.isInt() || this.isLong() || this.isFloat() || this.isDouble();
    }
    isArray() {
      return this.isByteArray() || this.isIntArray() || this.isLongArray();
    }
    isListOrArray() {
      return this.isList() || this.isArray();
    }
    getAsNumber() {
      return 0;
    }
    getAsString() {
      return "";
    }
    toJsonWithId() {
      return {
        type: this.getId(),
        value: this.toJson()
      };
    }
    static getFactory(id) {
      const factory = this.FACTORIES.get(id);
      if (!factory) {
        throw new Error(`Invalid tag id ${id}`);
      }
      return factory;
    }
    static create(id) {
      return this.getFactory(id).create();
    }
    static fromString(input) {
      const reader = typeof input === "string" ? new StringReader(input) : input;
      return this.getFactory(NbtType.Compound).fromString(reader);
    }
    static fromJson(value, id = NbtType.Compound) {
      return this.getFactory(id).fromJson(value);
    }
    static fromJsonWithId(value) {
      const obj = Json.readObject(value) ?? {};
      const id = Json.readInt(obj.type) ?? 0;
      return _NbtTag.fromJson(obj.value ?? {}, id);
    }
    static fromBytes(input, id = NbtType.Compound) {
      return this.getFactory(id).fromBytes(input);
    }
  };

  // node_modules/deepslate/lib/nbt/tags/NbtByte.js
  var NbtByte = class _NbtByte extends NbtTag {
    static ZERO = new _NbtByte(0);
    static ONE = new _NbtByte(1);
    value;
    constructor(value) {
      super();
      this.value = typeof value === "number" ? value : value ? 1 : 0;
    }
    getId() {
      return NbtType.Byte;
    }
    equals(other) {
      return other.isByte() && this.value === other.value;
    }
    getAsNumber() {
      return this.value;
    }
    toString() {
      return this.value.toFixed() + "b";
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.value;
    }
    toJson() {
      return this.value;
    }
    toBytes(output) {
      output.writeByte(this.value);
    }
    static create() {
      return _NbtByte.ZERO;
    }
    static fromJson(value) {
      return new _NbtByte(Json.readInt(value) ?? 0);
    }
    static fromBytes(input) {
      const value = input.readByte();
      return new _NbtByte(value);
    }
  };
  NbtTag.register(NbtType.Byte, NbtByte);

  // node_modules/deepslate/lib/nbt/tags/NbtAbstractList.js
  var NbtAbstractList = class extends NbtTag {
    items;
    constructor(items) {
      super();
      this.items = items;
    }
    getItems() {
      return this.items.slice(0);
    }
    getAsTuple(length2, mapper) {
      return [...Array(length2)].map((_, i) => mapper(this.items[i]));
    }
    get(index) {
      index = Math.floor(index);
      if (index < 0 || index >= this.items.length) {
        return void 0;
      }
      return this.items[index];
    }
    get length() {
      return this.items.length;
    }
    map(fn) {
      return this.items.map(fn);
    }
    filter(fn) {
      return this.items.filter(fn);
    }
    forEach(fn) {
      this.items.forEach(fn);
    }
    set(index, tag) {
      this.items[index] = tag;
    }
    add(tag) {
      this.items.push(tag);
    }
    insert(index, tag) {
      this.items.splice(index, 0, tag);
    }
    delete(index) {
      this.items.splice(index, 1);
    }
    clear() {
      this.items = [];
    }
  };

  // node_modules/deepslate/lib/nbt/tags/NbtByteArray.js
  var NbtByteArray = class _NbtByteArray extends NbtAbstractList {
    constructor(items) {
      super(Array.from(items ?? [], (e) => typeof e === "number" ? new NbtByte(e) : e));
    }
    getId() {
      return NbtType.ByteArray;
    }
    equals(other) {
      return other.isByteArray() && this.length === other.length && this.items.every((item, i) => item.equals(other.items[i]));
    }
    getType() {
      return NbtType.Byte;
    }
    toString() {
      const entries = this.items.map((e) => e.getAsNumber().toFixed() + "B");
      return "[B;" + entries.join(",") + "]";
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.items.map((e) => e.getAsNumber());
    }
    toJson() {
      return this.items.map((e) => e.getAsNumber());
    }
    toBytes(output) {
      output.writeInt(this.items.length);
      output.writeBytes(this.items.map((e) => e.getAsNumber()));
    }
    static create() {
      return new _NbtByteArray([]);
    }
    static fromJson(value) {
      const items = Json.readArray(value, (e) => Json.readNumber(e) ?? 0) ?? [];
      return new _NbtByteArray(items);
    }
    static fromBytes(input) {
      const length2 = input.readInt();
      const items = input.readBytes(length2);
      return new _NbtByteArray(items);
    }
  };
  NbtTag.register(NbtType.ByteArray, NbtByteArray);

  // node_modules/deepslate/lib/nbt/tags/NbtFloat.js
  var NbtFloat = class _NbtFloat extends NbtTag {
    value;
    constructor(value) {
      super();
      this.value = value;
    }
    getId() {
      return NbtType.Float;
    }
    equals(other) {
      return other.isFloat() && this.value === other.value;
    }
    getAsNumber() {
      return this.value;
    }
    toString() {
      return this.value.toString() + "f";
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.value;
    }
    toJson() {
      return this.value;
    }
    toBytes(output) {
      output.writeFloat(this.value);
    }
    static create() {
      return new _NbtFloat(0);
    }
    static fromJson(value) {
      return new _NbtFloat(Json.readNumber(value) ?? 0);
    }
    static fromBytes(input) {
      const value = input.readFloat();
      return new _NbtFloat(value);
    }
  };
  NbtTag.register(NbtType.Float, NbtFloat);

  // node_modules/deepslate/lib/nbt/tags/NbtInt.js
  var NbtInt = class _NbtInt extends NbtTag {
    value;
    constructor(value) {
      super();
      this.value = value;
    }
    getId() {
      return NbtType.Int;
    }
    equals(other) {
      return other.isInt() && this.value === other.value;
    }
    getAsNumber() {
      return this.value;
    }
    toString() {
      return this.value.toFixed();
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.value;
    }
    toJson() {
      return this.value;
    }
    toBytes(output) {
      output.writeInt(this.value);
    }
    static create() {
      return new _NbtInt(0);
    }
    static fromJson(value) {
      return new _NbtInt(Json.readInt(value) ?? 0);
    }
    static fromBytes(input) {
      const value = input.readInt();
      return new _NbtInt(value);
    }
  };
  NbtTag.register(NbtType.Int, NbtInt);

  // node_modules/deepslate/lib/nbt/tags/NbtIntArray.js
  var NbtIntArray = class _NbtIntArray extends NbtAbstractList {
    constructor(items) {
      super(Array.from(items ?? [], (e) => typeof e === "number" ? new NbtInt(e) : e));
    }
    getId() {
      return NbtType.IntArray;
    }
    equals(other) {
      return other.isIntArray() && this.length === other.length && this.items.every((item, i) => item.equals(other.items[i]));
    }
    getType() {
      return NbtType.Int;
    }
    get length() {
      return this.items.length;
    }
    toString() {
      const entries = this.items.map((e) => e.getAsNumber().toFixed());
      return "[I;" + entries.join(",") + "]";
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.items.map((e) => e.getAsNumber());
    }
    toJson() {
      return this.items.map((e) => e.getAsNumber());
    }
    toBytes(output) {
      output.writeInt(this.items.length);
      for (const entry of this.items) {
        output.writeInt(entry.getAsNumber());
      }
    }
    static create() {
      return new _NbtIntArray();
    }
    static fromJson(value) {
      const items = Json.readArray(value, (e) => Json.readNumber(e) ?? 0) ?? [];
      return new _NbtIntArray(items);
    }
    static fromBytes(input) {
      const length2 = input.readInt();
      const items = [];
      for (let i = 0; i < length2; i += 1) {
        items.push(input.readInt());
      }
      return new _NbtIntArray(items);
    }
  };
  NbtTag.register(NbtType.IntArray, NbtIntArray);

  // node_modules/deepslate/lib/nbt/tags/NbtList.js
  var NbtList = class _NbtList extends NbtAbstractList {
    type;
    constructor(items, type) {
      super(items ?? []);
      this.type = this.items.length === 0 ? NbtType.End : type ?? this.items[0].getId();
    }
    static make(factory, items) {
      return new _NbtList(items.map((v) => new factory(v)));
    }
    getId() {
      return NbtType.List;
    }
    equals(other) {
      return other.isList() && this.type === other.type && this.length === other.length && this.items.every((item, i) => item.equals(other.items[i]));
    }
    getType() {
      return this.type;
    }
    getNumber(index) {
      const entry = this.get(index);
      if (entry?.isNumber()) {
        return entry.getAsNumber();
      }
      return 0;
    }
    getString(index) {
      const entry = this.get(index);
      if (entry?.isString()) {
        return entry.getAsString();
      }
      return "";
    }
    getList(index, type) {
      const entry = this.get(index);
      if (entry?.isList() && entry.getType() === type) {
        return entry;
      }
      return _NbtList.create();
    }
    getCompound(index) {
      const entry = this.get(index);
      if (entry?.isCompound()) {
        return entry;
      }
      return NbtCompound.create();
    }
    set(index, tag) {
      this.updateType(tag);
      super.set(index, tag);
    }
    add(tag) {
      this.updateType(tag);
      super.add(tag);
    }
    insert(index, tag) {
      this.updateType(tag);
      super.insert(index, tag);
    }
    updateType(tag) {
      if (tag.getId() === NbtType.End) {
        return;
      } else if (this.type === NbtType.End) {
        this.type = tag.getId();
      } else if (this.type !== tag.getId()) {
        throw new Error(`Trying to add tag of type ${NbtType[tag.getId()]} to list of ${NbtType[this.type]}`);
      }
    }
    clear() {
      super.clear();
      this.type = NbtType.End;
    }
    toString() {
      return "[" + this.items.map((i) => i.toString()).join(",") + "]";
    }
    toPrettyString(indent = "  ", depth = 0) {
      if (this.length === 0)
        return "[]";
      const i = indent.repeat(depth);
      const ii = indent.repeat(depth + 1);
      return "[\n" + this.map((value) => {
        return ii + value.toPrettyString(indent, depth + 1);
      }).join(",\n") + "\n" + i + "]";
    }
    toSimplifiedJson() {
      return this.map((e) => e.toSimplifiedJson());
    }
    toJson() {
      return {
        type: this.type,
        items: this.items.map((e) => e.toJson())
      };
    }
    toBytes(output) {
      if (this.items.length === 0) {
        this.type = NbtType.End;
      } else {
        this.type = this.items[0].getId();
      }
      output.writeByte(this.type);
      output.writeInt(this.items.length);
      for (const tag of this.items) {
        tag.toBytes(output);
      }
    }
    static create() {
      return new _NbtList();
    }
    static fromJson(value) {
      const obj = Json.readObject(value) ?? {};
      const type = Json.readNumber(obj.type) ?? NbtType.Compound;
      const items = (Json.readArray(obj.items) ?? []).flatMap((v) => v !== void 0 ? [NbtTag.fromJson(v, type)] : []);
      return new _NbtList(items, type);
    }
    static fromBytes(input) {
      const type = input.readByte();
      const length2 = input.readInt();
      if (type === NbtType.End && length2 > 0) {
        throw new Error(`Missing type on ListTag but length is ${length2}`);
      }
      const items = [];
      for (let i = 0; i < length2; i += 1) {
        items.push(NbtTag.fromBytes(input, type));
      }
      return new _NbtList(items, type);
    }
  };
  NbtTag.register(NbtType.List, NbtList);

  // node_modules/deepslate/lib/nbt/tags/NbtLong.js
  var NbtLong = class _NbtLong extends NbtTag {
    static dataview = new DataView(new Uint8Array(8).buffer);
    value;
    constructor(value) {
      super();
      this.value = _NbtLong.toPair(value);
    }
    static toPair(value) {
      return Array.isArray(value) ? value : _NbtLong.bigintToPair(value);
    }
    static bigintToPair(value) {
      _NbtLong.dataview.setBigInt64(0, value);
      return [_NbtLong.dataview.getInt32(0), _NbtLong.dataview.getInt32(4)];
    }
    static pairToBigint(value) {
      _NbtLong.dataview.setInt32(0, Number(value[0]));
      _NbtLong.dataview.setInt32(4, Number(value[1]));
      return _NbtLong.dataview.getBigInt64(0);
    }
    static pairToString(value) {
      return _NbtLong.pairToBigint(value).toString();
    }
    static pairToNumber(value) {
      return Number(_NbtLong.pairToBigint(value));
    }
    getId() {
      return NbtType.Long;
    }
    equals(other) {
      return other.isLong() && this.value[0] === other.value[0] && this.value[1] === other.value[1];
    }
    getAsNumber() {
      return _NbtLong.pairToNumber(this.value);
    }
    getAsPair() {
      return this.value;
    }
    toBigInt() {
      return _NbtLong.pairToBigint(this.value);
    }
    toString() {
      return _NbtLong.pairToString(this.value) + "L";
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return _NbtLong.pairToNumber(this.value);
    }
    toJson() {
      return this.value;
    }
    toBytes(output) {
      output.writeInt(this.value[0]);
      output.writeInt(this.value[1]);
    }
    static create() {
      return new _NbtLong([0, 0]);
    }
    static fromJson(value) {
      return new _NbtLong(Array.isArray(value) && value.length === 2 ? value.map((e) => typeof e === "number" ? e : 0) : [0, 0]);
    }
    static fromBytes(input) {
      const lo = input.readInt();
      const hi = input.readInt();
      return new _NbtLong([lo, hi]);
    }
  };
  NbtTag.register(NbtType.Long, NbtLong);

  // node_modules/deepslate/lib/nbt/tags/NbtLongArray.js
  var NbtLongArray = class _NbtLongArray extends NbtAbstractList {
    constructor(items) {
      super(Array.from(items ?? [], (e) => typeof e === "bigint" || Array.isArray(e) ? new NbtLong(e) : e));
    }
    getId() {
      return NbtType.LongArray;
    }
    equals(other) {
      return other.isLongArray() && this.length === other.length && this.items.every((item, i) => item.equals(other.items[i]));
    }
    getType() {
      return NbtType.Long;
    }
    get length() {
      return this.items.length;
    }
    toString() {
      const entries = this.items.map((e) => e.toString());
      return "[I;" + entries.join(",") + "]";
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.items.map((e) => e.getAsPair());
    }
    toJson() {
      return this.items.map((e) => e.getAsPair());
    }
    toBytes(output) {
      output.writeInt(this.items.length);
      for (const entry of this.items) {
        const [hi, lo] = entry.getAsPair();
        output.writeInt(hi);
        output.writeInt(lo);
      }
    }
    static create() {
      return new _NbtLongArray();
    }
    static fromJson(value) {
      const items = Json.readArray(value, (e) => Json.readPair(e, (f) => Json.readNumber(f) ?? 0) ?? [0, 0]) ?? [];
      return new _NbtLongArray(items);
    }
    static fromBytes(input) {
      const length2 = input.readInt();
      const items = [];
      for (let i = 0; i < length2; i += 1) {
        items.push([input.readInt(), input.readInt()]);
      }
      return new _NbtLongArray(items);
    }
  };
  NbtTag.register(NbtType.LongArray, NbtLongArray);

  // node_modules/deepslate/lib/nbt/tags/NbtShort.js
  var NbtShort = class _NbtShort extends NbtTag {
    value;
    constructor(value) {
      super();
      this.value = value;
    }
    getId() {
      return NbtType.Short;
    }
    equals(other) {
      return other.isShort() && this.value === other.value;
    }
    getAsNumber() {
      return this.value;
    }
    toString() {
      return this.value.toFixed() + "s";
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.value;
    }
    toJson() {
      return this.value;
    }
    toBytes(output) {
      output.writeShort(this.value);
    }
    static create() {
      return new _NbtShort(0);
    }
    static fromJson(value) {
      return new _NbtShort(typeof value === "number" ? Math.floor(value) : 0);
    }
    static fromBytes(input) {
      const value = input.readShort();
      return new _NbtShort(value);
    }
  };
  NbtTag.register(NbtType.Short, NbtShort);

  // node_modules/deepslate/lib/nbt/tags/NbtString.js
  var NbtString = class _NbtString extends NbtTag {
    static EMPTY = new _NbtString("");
    value;
    constructor(value) {
      super();
      this.value = value;
    }
    getId() {
      return NbtType.String;
    }
    equals(other) {
      return other.isString() && this.value === other.value;
    }
    getAsString() {
      return this.value;
    }
    toString() {
      return '"' + this.value.replace(/(\\|")/g, "\\$1") + '"';
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.value;
    }
    toJson() {
      return this.value;
    }
    toBytes(output) {
      output.writeString(this.value);
    }
    static create() {
      return _NbtString.EMPTY;
    }
    static fromJson(value) {
      return new _NbtString(typeof value === "string" ? value : "");
    }
    static fromBytes(input) {
      const value = input.readString();
      return new _NbtString(value);
    }
  };
  NbtTag.register(NbtType.String, NbtString);

  // node_modules/deepslate/lib/nbt/NbtParser.js
  var NbtParser;
  (function(NbtParser2) {
    const DOUBLE_PATTERN_NOSUFFIX = new RegExp("^[-+]?(?:[0-9]+[.]|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?$", "i");
    const DOUBLE_PATTERN = new RegExp("^[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?d$", "i");
    const FLOAT_PATTERN = new RegExp("^[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?f$", "i");
    const BYTE_PATTERN = new RegExp("^[-+]?(?:0|[1-9][0-9]*)b$", "i");
    const LONG_PATTERN = new RegExp("^[-+]?(?:0|[1-9][0-9]*)l$", "i");
    const SHORT_PATTERN = new RegExp("^[-+]?(?:0|[1-9][0-9]*)s$", "i");
    const INT_PATTERN = new RegExp("^[-+]?(?:0|[1-9][0-9]*)$", "i");
    function readTag(reader) {
      reader.skipWhitespace();
      if (!reader.canRead()) {
        throw reader.createError("Expected value");
      }
      const c = reader.peek();
      if (c === "{") {
        return readCompound(reader);
      } else if (c === "[") {
        if (reader.canRead(3) && !StringReader.isQuotedStringStart(reader.peek(1)) && reader.peek(2) === ";") {
          reader.expect("[", true);
          const start = reader.cursor;
          const d = reader.read();
          reader.skip();
          reader.skipWhitespace();
          if (!reader.canRead()) {
            throw reader.createError("Expected value");
          } else if (d === "B") {
            return readArray(reader, NbtByteArray, NbtType.ByteArray, NbtType.Byte);
          } else if (d === "L") {
            return readArray(reader, NbtLongArray, NbtType.LongArray, NbtType.Long);
          } else if (d === "I") {
            return readArray(reader, NbtIntArray, NbtType.IntArray, NbtType.Int);
          } else {
            reader.cursor = start;
            throw reader.createError(`Invalid array type '${d}'`);
          }
        } else {
          return readList(reader);
        }
      } else {
        reader.skipWhitespace();
        const start = reader.cursor;
        if (StringReader.isQuotedStringStart(reader.peek())) {
          return new NbtString(reader.readQuotedString());
        } else {
          const value = reader.readUnquotedString();
          if (value.length === 0) {
            reader.cursor = start;
            throw reader.createError("Expected value");
          }
          try {
            if (FLOAT_PATTERN.test(value)) {
              const number = Number(value.substring(0, value.length - 1));
              return new NbtFloat(number);
            } else if (BYTE_PATTERN.test(value)) {
              const number = Number(value.substring(0, value.length - 1));
              return new NbtByte(Math.floor(number));
            } else if (LONG_PATTERN.test(value)) {
              const number = BigInt(value.substring(0, value.length - 1));
              return new NbtLong(number);
            } else if (SHORT_PATTERN.test(value)) {
              const number = Number(value.substring(0, value.length - 1));
              return new NbtShort(Math.floor(number));
            } else if (INT_PATTERN.test(value)) {
              const number = Number(value);
              return new NbtInt(Math.floor(number));
            } else if (DOUBLE_PATTERN.test(value)) {
              const number = Number(value.substring(0, value.length - 1));
              return new NbtDouble(number);
            } else if (DOUBLE_PATTERN_NOSUFFIX.test(value)) {
              const number = Number(value);
              return new NbtDouble(number);
            } else if (value.toLowerCase() === "true") {
              return NbtByte.ONE;
            } else if (value.toLowerCase() === "false") {
              return NbtByte.ZERO;
            }
          } catch (e) {
          }
          return value.length === 0 ? NbtString.EMPTY : new NbtString(value);
        }
      }
    }
    NbtParser2.readTag = readTag;
    function readCompound(reader) {
      reader.expect("{", true);
      const properties = /* @__PURE__ */ new Map();
      reader.skipWhitespace();
      while (reader.canRead() && reader.peek() !== "}") {
        const start = reader.cursor;
        reader.skipWhitespace();
        if (!reader.canRead()) {
          throw reader.createError("Expected key");
        }
        const key = reader.readString();
        if (key.length === 0) {
          reader.cursor = start;
          throw reader.createError("Expected key");
        }
        reader.expect(":", true);
        const value = readTag(reader);
        properties.set(key, value);
        if (!hasElementSeparator(reader)) {
          break;
        }
        if (!reader.canRead()) {
          throw reader.createError("Expected key");
        }
      }
      reader.expect("}", true);
      return new NbtCompound(properties);
    }
    function readList(reader) {
      reader.expect("[", true);
      reader.skipWhitespace();
      if (!reader.canRead()) {
        throw reader.createError("Expected value");
      }
      const items = [];
      let type = NbtType.End;
      while (reader.peek() !== "]") {
        const start = reader.cursor;
        const value = readTag(reader);
        const valueId = value.getId();
        if (type === NbtType.End) {
          type = valueId;
        } else if (valueId !== type) {
          reader.cursor = start;
          throw reader.createError(`Can't insert ${NbtType[valueId]} into list of ${NbtType[type]}`);
        }
        items.push(value);
        if (!hasElementSeparator(reader)) {
          break;
        }
        if (!reader.canRead()) {
          throw reader.createError("Expected value");
        }
      }
      reader.expect("]", true);
      return new NbtList(items, type);
    }
    function readArray(reader, factory, arrayId, childId) {
      const data = [];
      while (reader.peek() !== "]") {
        const entry = readTag(reader);
        if (entry.getId() !== childId) {
          throw reader.createError(`Can't insert ${NbtType[entry.getId()]} into ${NbtType[arrayId]}`);
        }
        data.push(entry.isLong() ? entry.getAsPair() : entry.getAsNumber());
        if (!hasElementSeparator(reader)) {
          break;
        }
        if (!reader.canRead()) {
          throw reader.createError("Expected value");
        }
      }
      reader.expect("]");
      return new factory(data);
    }
    function hasElementSeparator(reader) {
      reader.skipWhitespace();
      if (reader.canRead() && reader.peek() === ",") {
        reader.skip();
        reader.skipWhitespace();
        return true;
      } else {
        return false;
      }
    }
  })(NbtParser || (NbtParser = {}));

  // node_modules/deepslate/lib/nbt/tags/NbtCompound.js
  var NbtCompound = class _NbtCompound extends NbtTag {
    properties;
    constructor(properties) {
      super();
      this.properties = properties ?? /* @__PURE__ */ new Map();
    }
    getId() {
      return NbtType.Compound;
    }
    equals(other) {
      return other.isCompound() && this.size === other.size && [...this.properties.entries()].every(([key, value]) => {
        const otherValue = other.properties.get(key);
        return otherValue !== void 0 && value.equals(otherValue);
      });
    }
    has(key) {
      return this.properties.has(key);
    }
    hasNumber(key) {
      return this.get(key)?.isNumber() ?? false;
    }
    hasString(key) {
      return this.get(key)?.isString() ?? false;
    }
    hasList(key, type, length2) {
      const tag = this.get(key);
      return (tag?.isList() && (type === void 0 || tag.getType() === type) && (length2 === void 0 || tag.length === length2)) ?? false;
    }
    hasCompound(key) {
      return this.get(key)?.isCompound() ?? false;
    }
    get(key) {
      return this.properties.get(key);
    }
    getString(key) {
      return this.get(key)?.getAsString() ?? "";
    }
    getNumber(key) {
      return this.get(key)?.getAsNumber() ?? 0;
    }
    getBoolean(key) {
      return this.getNumber(key) !== 0;
    }
    getList(key, type) {
      const tag = this.get(key);
      if (tag?.isList() && (type === void 0 || tag.getType() === type)) {
        return tag;
      }
      return NbtList.create();
    }
    getCompound(key) {
      const tag = this.get(key);
      if (tag?.isCompound()) {
        return tag;
      }
      return _NbtCompound.create();
    }
    getByteArray(key) {
      const tag = this.get(key);
      if (tag?.isByteArray()) {
        return tag;
      }
      return NbtByteArray.create();
    }
    getIntArray(key) {
      const tag = this.get(key);
      if (tag?.isIntArray()) {
        return tag;
      }
      return NbtIntArray.create();
    }
    getLongArray(key) {
      const tag = this.get(key);
      if (tag?.isLongArray()) {
        return tag;
      }
      return NbtLongArray.create();
    }
    keys() {
      return this.properties.keys();
    }
    get size() {
      return this.properties.size;
    }
    map(fn) {
      return Object.fromEntries([...this.properties.entries()].map(([key, value]) => fn(key, value, this)));
    }
    forEach(fn) {
      [...this.properties.entries()].forEach(([key, value]) => fn(key, value, this));
    }
    set(key, value) {
      this.properties.set(key, value);
      return this;
    }
    delete(key) {
      return this.properties.delete(key);
    }
    clear() {
      this.properties.clear();
      return this;
    }
    toString() {
      const pairs = [];
      for (const [key, tag] of this.properties.entries()) {
        const needsQuotes = key.split("").some((c) => !StringReader.isAllowedInUnquotedString(c));
        pairs.push((needsQuotes ? JSON.stringify(key) : key) + ":" + tag.toString());
      }
      return "{" + pairs.join(",") + "}";
    }
    toPrettyString(indent = "  ", depth = 0) {
      if (this.size === 0)
        return "{}";
      const i = indent.repeat(depth);
      const ii = indent.repeat(depth + 1);
      const pairs = [];
      for (const [key, tag] of this.properties.entries()) {
        const needsQuotes = key.split("").some((c) => !StringReader.isAllowedInUnquotedString(c));
        pairs.push((needsQuotes ? JSON.stringify(key) : key) + ": " + tag.toPrettyString(indent, depth + 1));
      }
      return "{\n" + pairs.map((p) => ii + p).join(",\n") + "\n" + i + "}";
    }
    toSimplifiedJson() {
      return this.map((key, value) => [key, value.toSimplifiedJson()]);
    }
    toJson() {
      return this.map((key, value) => [key, {
        type: value.getId(),
        value: value.toJson()
      }]);
    }
    toBytes(output) {
      for (const [key, tag] of this.properties.entries()) {
        const id = tag.getId();
        output.writeByte(id);
        output.writeString(key);
        tag.toBytes(output);
      }
      output.writeByte(NbtType.End);
    }
    static create() {
      return new _NbtCompound();
    }
    static fromString(reader) {
      return NbtParser.readTag(reader);
    }
    static fromJson(value) {
      const properties = Json.readMap(value, (e) => {
        const { type, value: value2 } = Json.readObject(e) ?? {};
        const id = Json.readNumber(type);
        const tag = NbtTag.fromJson(value2 ?? {}, id);
        return tag;
      });
      return new _NbtCompound(new Map(Object.entries(properties)));
    }
    static fromBytes(input) {
      const properties = /* @__PURE__ */ new Map();
      while (true) {
        const id = input.readByte();
        if (id === NbtType.End)
          break;
        const key = input.readString();
        const value = NbtTag.fromBytes(input, id);
        properties.set(key, value);
      }
      return new _NbtCompound(properties);
    }
  };
  NbtTag.register(NbtType.Compound, NbtCompound);

  // node_modules/deepslate/lib/nbt/NbtFile.js
  var NbtFile = class _NbtFile {
    name;
    root;
    compression;
    littleEndian;
    bedrockHeader;
    static DEFAULT_NAME = "";
    static DEFAULT_BEDROCK_HEADER = 4;
    constructor(name, root, compression, littleEndian, bedrockHeader) {
      this.name = name;
      this.root = root;
      this.compression = compression;
      this.littleEndian = littleEndian;
      this.bedrockHeader = bedrockHeader;
    }
    writeNamedTag(output) {
      output.writeByte(NbtType.Compound);
      output.writeString(this.name);
      this.root.toBytes(output);
    }
    write() {
      const littleEndian = this.littleEndian === true || this.bedrockHeader !== void 0;
      const output = new RawDataOutput({ littleEndian, offset: this.bedrockHeader && 8 });
      this.writeNamedTag(output);
      if (this.bedrockHeader !== void 0) {
        const end = output.offset;
        output.offset = 0;
        output.writeInt(this.bedrockHeader);
        output.writeInt(end - 8);
        output.offset = end;
      }
      const array = output.getData();
      if (this.compression === "gzip") {
        return pako.gzip(array);
      } else if (this.compression === "zlib") {
        return pako.deflate(array);
      }
      return array;
    }
    static readNamedTag(input) {
      if (input.readByte() !== NbtType.Compound) {
        throw new Error("Top tag should be a compound");
      }
      return {
        name: input.readString(),
        root: NbtCompound.fromBytes(input)
      };
    }
    static create(options = {}) {
      const name = options.name ?? _NbtFile.DEFAULT_NAME;
      const root = NbtCompound.create();
      const compression = options.compression ?? "none";
      const bedrockHeader = typeof options.bedrockHeader === "boolean" ? _NbtFile.DEFAULT_BEDROCK_HEADER : options.bedrockHeader;
      const littleEndian = options.littleEndian ?? options.bedrockHeader !== void 0;
      return new _NbtFile(name, root, compression, littleEndian, bedrockHeader);
    }
    static read(array, options = {}) {
      const bedrockHeader = typeof options.bedrockHeader === "number" ? options.bedrockHeader : options.bedrockHeader ? getBedrockHeader(array) : void 0;
      const isGzipCompressed = options.compression === "gzip" || !bedrockHeader && options.compression === void 0 && hasGzipHeader(array);
      const isZlibCompressed = options.compression === "zlib" || !bedrockHeader && options.compression === void 0 && hasZlibHeader(array);
      const uncompressedData = isZlibCompressed || isGzipCompressed ? pako.inflate(array) : array;
      const littleEndian = options.littleEndian || bedrockHeader !== void 0;
      const compression = isGzipCompressed ? "gzip" : isZlibCompressed ? "zlib" : "none";
      const input = new RawDataInput(uncompressedData, { littleEndian, offset: bedrockHeader && 8 });
      const { name, root } = _NbtFile.readNamedTag(input);
      return new _NbtFile(options.name ?? name, root, compression, littleEndian, bedrockHeader);
    }
    toJson() {
      return {
        name: this.name,
        root: this.root.toJson(),
        compression: this.compression,
        littleEndian: this.littleEndian,
        bedrockHeader: this.bedrockHeader ?? null
      };
    }
    static fromJson(value) {
      const obj = Json.readObject(value) ?? {};
      const name = Json.readString(obj.name) ?? "";
      const root = NbtCompound.fromJson(obj.root ?? {});
      const compression = Json.readString(obj.compression) ?? "none";
      const littleEndian = Json.readBoolean(obj.littleEndian) ?? false;
      const bedrockHeader = Json.readNumber(obj.bedrockHeader);
      return new _NbtFile(name, root, compression, littleEndian, bedrockHeader);
    }
  };

  // node_modules/deepslate/lib/nbt/NbtChunk.js
  var NbtChunk = class _NbtChunk {
    x;
    z;
    compression;
    timestamp;
    raw;
    file;
    dirty;
    constructor(x, z, compression, timestamp, raw) {
      this.x = x;
      this.z = z;
      this.compression = compression;
      this.timestamp = timestamp;
      this.raw = raw;
      this.dirty = false;
    }
    getCompression() {
      switch (this.compression) {
        case 1:
          return "gzip";
        case 2:
          return "zlib";
        case 3:
          return "none";
        default:
          throw new Error(`Invalid compression mode ${this.compression}`);
      }
    }
    setCompression(compression) {
      switch (compression) {
        case "gzip":
          this.compression = 1;
          break;
        case "zlib":
          this.compression = 2;
          break;
        case "none":
          this.compression = 3;
          break;
        default:
          throw new Error(`Invalid compression mode ${compression}`);
      }
    }
    getFile() {
      if (this.file === void 0) {
        this.file = NbtFile.read(this.raw, {
          compression: this.getCompression()
        });
      }
      return this.file;
    }
    getRoot() {
      return this.getFile().root;
    }
    setRoot(root) {
      if (this.file === void 0) {
        this.file = NbtFile.create({
          compression: this.getCompression()
        });
      }
      this.file.root = root;
      this.markDirty();
    }
    markDirty() {
      this.dirty = true;
    }
    getRaw() {
      if (this.file === void 0 || this.dirty === false) {
        return this.raw;
      }
      this.file.compression = this.getCompression();
      const array = this.file.write();
      this.raw = array;
      this.dirty = false;
      return array;
    }
    toJson() {
      return {
        x: this.x,
        z: this.z,
        compression: this.compression,
        timestamp: this.timestamp,
        size: this.raw.byteLength
      };
    }
    toRef(resolver) {
      return new _NbtChunk.Ref(this.x, this.z, this.compression, this.timestamp, this.raw.byteLength, resolver);
    }
    static create(x, z, file, timestamp) {
      const chunk = new _NbtChunk(x, z, 0, timestamp ?? 0, file.write());
      chunk.setCompression(file.compression);
      return chunk;
    }
    static fromJson(value, resolver) {
      const obj = Json.readObject(value) ?? {};
      const x = Json.readInt(obj.x) ?? 0;
      const z = Json.readInt(obj.z) ?? 0;
      const compression = Json.readNumber(obj.compression) ?? 2;
      const timestamp = Json.readInt(obj.timestamp) ?? 0;
      const size = Json.readInt(obj.size) ?? 0;
      return new _NbtChunk.Ref(x, z, compression, timestamp, size, resolver);
    }
  };
  (function(NbtChunk2) {
    class Ref {
      x;
      z;
      compression;
      timestamp;
      size;
      resolver;
      file;
      constructor(x, z, compression, timestamp, size, resolver) {
        this.x = x;
        this.z = z;
        this.compression = compression;
        this.timestamp = timestamp;
        this.size = size;
        this.resolver = resolver;
      }
      getFile() {
        if (this.file instanceof NbtFile) {
          return this.file;
        }
        return void 0;
      }
      getRoot() {
        if (this.file instanceof NbtFile) {
          return this.file.root;
        }
        return void 0;
      }
      async getFileAsync() {
        if (this.file) {
          return this.file;
        }
        this.file = (async () => {
          const file = await this.resolver(this.x, this.z);
          this.file = file;
          return file;
        })();
        return this.file;
      }
      async getRootAsync() {
        const file = await this.getFileAsync();
        return file.root;
      }
      isResolved() {
        return this.file instanceof NbtFile;
      }
    }
    NbtChunk2.Ref = Ref;
  })(NbtChunk || (NbtChunk = {}));

  // node_modules/deepslate/lib/nbt/NbtRegion.js
  var NbtAbstractRegion = class {
    chunks;
    constructor(chunks) {
      this.chunks = Array(32 * 32).fill(void 0);
      for (const chunk of chunks) {
        const index = NbtRegion.getIndex(chunk.x, chunk.z);
        this.chunks[index] = chunk;
      }
    }
    getChunkPositions() {
      return this.chunks.flatMap((c) => c ? [[c.x, c.z]] : []);
    }
    getChunk(index) {
      if (index < 0 || index >= 32 * 32) {
        return void 0;
      }
      return this.chunks[index];
    }
    findChunk(x, z) {
      return this.getChunk(NbtRegion.getIndex(x, z));
    }
    getFirstChunk() {
      return this.chunks.filter((c) => c !== void 0)[0];
    }
    filter(predicate) {
      return this.chunks.filter((c) => c !== void 0 && predicate(c));
    }
    map(mapper) {
      return this.chunks.flatMap((c) => c !== void 0 ? [mapper(c)] : []);
    }
  };
  var NbtRegion = class _NbtRegion extends NbtAbstractRegion {
    constructor(chunks) {
      super(chunks);
    }
    write() {
      let totalSectors = 0;
      for (const chunk of this.chunks) {
        if (chunk === void 0)
          continue;
        totalSectors += Math.ceil(chunk.getRaw().length / 4096);
      }
      const array = new Uint8Array(8192 + totalSectors * 4096);
      const dataView = new DataView(array.buffer);
      let offset = 2;
      for (const chunk of this.chunks) {
        if (chunk === void 0)
          continue;
        const chunkData = chunk.getRaw();
        const i = 4 * ((chunk.x & 31) + (chunk.z & 31) * 32);
        const sectors = Math.ceil(chunkData.length / 4096);
        dataView.setInt8(i, offset >> 16);
        dataView.setInt16(i + 1, offset & 65535);
        dataView.setInt8(i + 3, sectors);
        dataView.setInt32(i + 4096, chunk.timestamp);
        const j = offset * 4096;
        dataView.setInt32(j, chunkData.length + 1);
        dataView.setInt8(j + 4, chunk.compression);
        array.set(chunkData, j + 5);
        offset += sectors;
      }
      return array;
    }
    static read(array) {
      const chunks = [];
      for (let x = 0; x < 32; x += 1) {
        for (let z = 0; z < 32; z += 1) {
          const i = 4 * ((x & 31) + (z & 31) * 32);
          const sectors = array[i + 3];
          if (sectors === 0)
            continue;
          const offset = (array[i] << 16) + (array[i + 1] << 8) + array[i + 2];
          const timestamp = (array[i + 4096] << 24) + (array[i + 4097] << 16) + (array[i + 4098] << 8) + array[i + 4099];
          const j = offset * 4096;
          const length2 = (array[j] << 24) + (array[j + 1] << 16) + (array[j + 2] << 8) + array[j + 3];
          const compression = array[j + 4];
          const data = array.slice(j + 5, j + 4 + length2);
          chunks.push(new NbtChunk(x, z, compression, timestamp, data));
        }
      }
      return new _NbtRegion(chunks);
    }
    static getIndex(x, z) {
      return (x & 31) + (z & 31) * 32;
    }
    toJson() {
      return {
        chunks: this.map((c) => c.toJson())
      };
    }
    static fromJson(value, chunkResolver) {
      const obj = Json.readObject(value) ?? {};
      const chunks = Json.readArray(obj.chunks) ?? [];
      const chunks2 = chunks.flatMap((c) => c !== void 0 ? [NbtChunk.fromJson(c, chunkResolver)] : []);
      return new _NbtRegion.Ref(chunks2);
    }
  };
  (function(NbtRegion2) {
    class Ref extends NbtAbstractRegion {
    }
    NbtRegion2.Ref = Ref;
  })(NbtRegion || (NbtRegion = {}));

  // node_modules/deepslate/lib/nbt/tags/NbtDouble.js
  var NbtDouble = class _NbtDouble extends NbtTag {
    value;
    constructor(value) {
      super();
      this.value = value;
    }
    getId() {
      return NbtType.Double;
    }
    equals(other) {
      return other.isDouble() && this.value === other.value;
    }
    getAsNumber() {
      return this.value;
    }
    toString() {
      if (Number.isInteger(this.value)) {
        return this.value.toFixed(1);
      }
      return this.value.toString();
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return this.value;
    }
    toJson() {
      return this.value;
    }
    toBytes(output) {
      output.writeDouble(this.value);
    }
    static create() {
      return new _NbtDouble(0);
    }
    static fromJson(value) {
      return new _NbtDouble(Json.readNumber(value) ?? 0);
    }
    static fromBytes(input) {
      const value = input.readDouble();
      return new _NbtDouble(value);
    }
  };
  NbtTag.register(NbtType.Double, NbtDouble);

  // node_modules/deepslate/lib/nbt/tags/NbtEnd.js
  var NbtEnd = class _NbtEnd extends NbtTag {
    static INSTANCE = new _NbtEnd();
    constructor() {
      super();
    }
    getId() {
      return NbtType.End;
    }
    equals(other) {
      return other.isEnd();
    }
    toString() {
      return "END";
    }
    toPrettyString() {
      return this.toString();
    }
    toSimplifiedJson() {
      return null;
    }
    toJson() {
      return null;
    }
    toBytes() {
    }
    static create() {
      return _NbtEnd.INSTANCE;
    }
    static fromJson() {
      return _NbtEnd.INSTANCE;
    }
    static fromBytes() {
      return _NbtEnd.INSTANCE;
    }
  };
  NbtTag.register(NbtType.End, NbtEnd);

  // node_modules/deepslate/lib/nbt/tags/Util.js
  function jsonToNbt(value) {
    if (typeof value === "string") {
      return new NbtString(value);
    }
    if (typeof value === "number") {
      return Number.isInteger(value) ? new NbtInt(value) : new NbtDouble(value);
    }
    if (typeof value === "boolean") {
      return new NbtByte(value);
    }
    if (Array.isArray(value)) {
      return new NbtList(value.map(jsonToNbt));
    }
    if (typeof value === "object" && value !== null) {
      return new NbtCompound(new Map(Object.entries(value ?? {}).map(([k, v]) => [k, jsonToNbt(v)])));
    }
    return new NbtByte(0);
  }

  // node_modules/deepslate/lib/core/Direction.js
  var Direction;
  (function(Direction2) {
    Direction2["UP"] = "up";
    Direction2["DOWN"] = "down";
    Direction2["NORTH"] = "north";
    Direction2["EAST"] = "east";
    Direction2["SOUTH"] = "south";
    Direction2["WEST"] = "west";
  })(Direction || (Direction = {}));
  var directionNormals = {
    [Direction.UP]: [0, 1, 0],
    [Direction.DOWN]: [0, -1, 0],
    [Direction.NORTH]: [0, 0, -1],
    [Direction.EAST]: [1, 0, 0],
    [Direction.SOUTH]: [0, 0, 1],
    [Direction.WEST]: [-1, 0, 0]
  };
  (function(Direction2) {
    Direction2.ALL = [Direction2.UP, Direction2.DOWN, Direction2.NORTH, Direction2.EAST, Direction2.SOUTH, Direction2.WEST];
    function normal(dir) {
      return directionNormals[dir];
    }
    Direction2.normal = normal;
  })(Direction || (Direction = {}));

  // node_modules/deepslate/lib/core/BlockPos.js
  var BlockPos;
  (function(BlockPos2) {
    function create4(x, y, z) {
      return [x, y, z];
    }
    BlockPos2.create = create4;
    BlockPos2.ZERO = BlockPos2.create(0, 0, 0);
    function offset(pos, dx, dy, dz) {
      return [pos[0] + dx, pos[1] + dy, pos[2] + dz];
    }
    BlockPos2.offset = offset;
    function subtract4(pos, other) {
      return [pos[0] - other[0], pos[1] - other[1], pos[2] - other[2]];
    }
    BlockPos2.subtract = subtract4;
    function add4(pos, other) {
      return [pos[0] + other[0], pos[1] + other[1], pos[2] + other[2]];
    }
    BlockPos2.add = add4;
    function towards(pos, dir) {
      return BlockPos2.offset(pos, ...Direction.normal(dir));
    }
    BlockPos2.towards = towards;
    function equals5(a, b) {
      if (a === b)
        return true;
      return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    }
    BlockPos2.equals = equals5;
    function magnitude(pos) {
      return pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2];
    }
    BlockPos2.magnitude = magnitude;
    function toNbt(pos) {
      return new NbtList(pos.map((e) => new NbtInt(e)));
    }
    BlockPos2.toNbt = toNbt;
    function fromNbt(nbt) {
      return nbt.getAsTuple(3, (e) => e?.isInt() ? e.getAsNumber() : 0);
    }
    BlockPos2.fromNbt = fromNbt;
    function fromJson(obj) {
      const array = Json.readArray(obj, (e) => Json.readInt(e) ?? 0) ?? [0, 0, 0];
      return create4(array[0], array[1], array[2]);
    }
    BlockPos2.fromJson = fromJson;
  })(BlockPos || (BlockPos = {}));

  // node_modules/deepslate/lib/core/Identifier.js
  var Identifier = class _Identifier {
    namespace;
    path;
    static DEFAULT_NAMESPACE = "minecraft";
    static SEPARATOR = ":";
    constructor(namespace, path) {
      this.namespace = namespace;
      this.path = path;
    }
    is(other) {
      return this.equals(_Identifier.parse(other));
    }
    equals(other) {
      if (this === other) {
        return true;
      }
      if (!(other instanceof _Identifier)) {
        return false;
      }
      return this.namespace === other.namespace && this.path === other.path;
    }
    toString() {
      return this.namespace + _Identifier.SEPARATOR + this.path;
    }
    withPrefix(prefix) {
      return new _Identifier(this.namespace, prefix + this.path);
    }
    static create(path) {
      return new _Identifier(this.DEFAULT_NAMESPACE, path);
    }
    static parse(id) {
      const sep = id.indexOf(this.SEPARATOR);
      if (sep >= 0) {
        const namespace = sep >= 1 ? id.substring(0, sep) : this.DEFAULT_NAMESPACE;
        const path = id.substring(sep + 1);
        return new _Identifier(namespace, path);
      }
      return new _Identifier(this.DEFAULT_NAMESPACE, id);
    }
  };

  // node_modules/deepslate/lib/core/BlockState.js
  var BlockState = class _BlockState {
    properties;
    static AIR = new _BlockState(Identifier.create("air"));
    static STONE = new _BlockState(Identifier.create("stone"));
    static WATER = new _BlockState(Identifier.create("water"), { level: "0" });
    static LAVA = new _BlockState(Identifier.create("lava"), { level: "0" });
    name;
    constructor(name, properties = {}) {
      this.properties = properties;
      this.name = typeof name === "string" ? Identifier.parse(name) : name;
    }
    getName() {
      return this.name;
    }
    getProperties() {
      return this.properties;
    }
    getProperty(key) {
      return this.properties[key];
    }
    isFluid() {
      return this.is(_BlockState.WATER) || this.is(_BlockState.LAVA);
    }
    isWaterlogged() {
      return this.is(_BlockState.WATER) || this.is(_BlockState.LAVA) || this.is("bubble_column") || this.is("kelp") || this.is("kelp_plant") || this.is("seagrass") || this.is("tall_seagrass") || this.properties["waterlogged"] === "true";
    }
    equals(other) {
      if (!this.name.equals(other.name)) {
        return false;
      }
      if (Object.keys(this.properties).length !== Object.keys(other.properties).length) {
        return false;
      }
      return Object.keys(this.properties).every((p) => {
        return other.properties[p] === this.properties[p];
      });
    }
    is(other) {
      if (typeof other === "string") {
        return this.name.equals(Identifier.parse(other));
      }
      if (other instanceof Identifier) {
        return this.name.equals(other);
      }
      return this.name.equals(other.name);
    }
    toString() {
      if (Object.keys(this.properties).length === 0) {
        return this.name.toString();
      }
      return `${this.name.toString()}[${Object.entries(this.properties).map(([k, v]) => k + "=" + v).join(",")}]`;
    }
    static parse(str4) {
      const stateStart = str4.indexOf("[");
      if (stateStart === -1) {
        return new _BlockState(str4);
      } else {
        const blockId = str4.substring(0, stateStart);
        const states = str4.substring(stateStart + 1, str4.length - 1).split(",");
        const properties = Object.fromEntries(states.map((e) => e.split("=")));
        return new _BlockState(blockId, properties);
      }
    }
    static fromNbt(nbt) {
      const name = Identifier.parse(nbt.getString("Name"));
      const properties = nbt.getCompound("Properties").map((key, value) => [key, value.getAsString()]);
      return new _BlockState(name, properties);
    }
    static fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const name = Identifier.parse(Json.readString(root.Name) ?? _BlockState.STONE.name.toString());
      const properties = Json.readMap(root.Properties, (p) => Json.readString(p) ?? "");
      return new _BlockState(name, properties);
    }
  };

  // node_modules/deepslate/lib/core/PalettedContainer.js
  var PalettedContainer = class {
    size;
    defaultValue;
    storage;
    palette;
    constructor(size, defaultValue) {
      this.size = size;
      this.defaultValue = defaultValue;
      this.storage = Array(size).fill(0);
      this.palette = [defaultValue];
    }
    index(x, y, z) {
      return (x << 8) + (y << 4) + z;
    }
    get(x, y, z) {
      const id = this.storage[this.index(x, y, z)];
      return this.palette[id];
    }
    set(x, y, z, value) {
      let id = this.palette.findIndex((b) => b.equals(value));
      if (id === -1) {
        id = this.palette.length;
        this.palette.push(value);
      }
      this.storage[this.index(x, y, z)] = id;
    }
  };

  // node_modules/deepslate/lib/core/ChunkSection.js
  var ChunkSection = class _ChunkSection {
    minY;
    static WIDTH = 16;
    static SIZE = _ChunkSection.WIDTH * _ChunkSection.WIDTH * _ChunkSection.WIDTH;
    states;
    constructor(minY) {
      this.minY = minY;
      this.states = new PalettedContainer(_ChunkSection.SIZE, BlockState.AIR);
    }
    get minBlockY() {
      return this.minY << 4;
    }
    getBlockState(x, y, z) {
      return this.states.get(x, y, z);
    }
    setBlockState(x, y, z, state) {
      this.states.set(x, y, z, state);
    }
  };

  // node_modules/deepslate/lib/core/Chunk.js
  var Chunk = class {
    minY;
    height;
    pos;
    sections;
    constructor(minY, height, pos) {
      this.minY = minY;
      this.height = height;
      this.pos = pos;
      this.sections = Array(this.sectionsCount).fill(null);
    }
    get maxY() {
      return this.minY + this.height;
    }
    get minSection() {
      return this.minY >> 4;
    }
    get maxSection() {
      return (this.maxY - 1 >> 4) + 1;
    }
    get sectionsCount() {
      return this.maxSection - this.minSection;
    }
    getSectionIndex(y) {
      return (y >> 4) - this.minSection;
    }
    getBlockState(pos) {
      const [x, y, z] = pos;
      const section = this.sections[this.getSectionIndex(y)];
      return section?.getBlockState(x & 15, y & 15, z & 15) ?? BlockState.AIR;
    }
    setBlockState(pos, state) {
      const [x, y, z] = pos;
      const sectionIndex = this.getSectionIndex(y);
      let section = this.sections[sectionIndex];
      if (section === null) {
        if (state.equals(BlockState.AIR))
          return;
        section = this.getOrCreateSection(sectionIndex);
      }
      section.setBlockState(x & 15, y & 15, z & 15, state);
    }
    getOrCreateSection(index) {
      if (this.sections[index] == null) {
        this.sections[index] = new ChunkSection(this.minSection + index);
      }
      return this.sections[index];
    }
  };

  // node_modules/deepslate/lib/core/ChunkPos.js
  var ChunkPos;
  (function(ChunkPos2) {
    function create4(x, z) {
      return [x, z];
    }
    ChunkPos2.create = create4;
    function fromBlockPos(blockPos) {
      return [blockPos[0] >> 4, blockPos[2] >> 4];
    }
    ChunkPos2.fromBlockPos = fromBlockPos;
    function fromLong(long) {
      return [Number(long) & 4294967295, Number(long >> BigInt(32))];
    }
    ChunkPos2.fromLong = fromLong;
    function toLong(chunkPos) {
      return asLong(chunkPos[0], chunkPos[1]);
    }
    ChunkPos2.toLong = toLong;
    function asLong(x, z) {
      return BigInt(x & 4294967295) | BigInt(z & 4294967295) << BigInt(32);
    }
    ChunkPos2.asLong = asLong;
    function minBlockX(chunkPos) {
      return chunkPos[0] << 4;
    }
    ChunkPos2.minBlockX = minBlockX;
    function minBlockZ(chunkPos) {
      return chunkPos[1] << 4;
    }
    ChunkPos2.minBlockZ = minBlockZ;
    function maxBlockX(chunkPos) {
      return (chunkPos[0] << 4) + 15;
    }
    ChunkPos2.maxBlockX = maxBlockX;
    function maxBlockZ(chunkPos) {
      return (chunkPos[1] << 4) + 15;
    }
    ChunkPos2.maxBlockZ = maxBlockZ;
  })(ChunkPos || (ChunkPos = {}));

  // node_modules/deepslate/lib/core/Effects.js
  var EFFECT_COLORS = /* @__PURE__ */ new Map([
    ["minecraft:speed", 3402751],
    ["minecraft:slowness", 9154528],
    ["minecraft:haste", 14270531],
    ["minecraft:mining_fatigue", 4866583],
    ["minecraft:strength", 16762624],
    ["minecraft:instant_health", 16262179],
    ["minecraft:instant_damage", 11101546],
    ["minecraft:jump_boost", 16646020],
    ["minecraft:nausea", 5578058],
    ["minecraft:regeneration", 13458603],
    ["minecraft:resistance", 9520880],
    ["minecraft:fire_resistance", 16750848],
    ["minecraft:water_breathing", 10017472],
    ["minecraft:invisibility", 16185078],
    ["minecraft:blindness", 2039587],
    ["minecraft:night_vision", 12779366],
    ["minecraft:hunger", 5797459],
    ["minecraft:weakness", 4738376],
    ["minecraft:poison", 8889187],
    ["minecraft:wither", 7561558],
    ["minecraft:health_boost", 16284963],
    ["minecraft:absorption", 2445989],
    ["minecraft:saturation", 16262179],
    ["minecraft:glowing", 9740385],
    ["minecraft:levitation", 13565951],
    ["minecraft:luck", 5882118],
    ["minecraft:unluck", 12624973],
    ["minecraft:slow_falling", 15978425],
    ["minecraft:conduit_power", 1950417],
    ["minecraft:dolphins_grace", 8954814],
    ["minecraft:bad_omen", 745784],
    ["minecraft:hero_of_the_village", 4521796],
    ["minecraft:darkness", 2696993],
    ["minecraft:trial_omen", 1484454],
    ["minecraft:raid_omen", 14565464],
    ["minecraft:wind_charged", 12438015],
    ["minecraft:weaving", 7891290],
    ["minecraft:oozing", 10092451],
    ["minecraft:infested", 9214860]
  ]);
  var MobEffectInstance;
  (function(MobEffectInstance2) {
    function fromNbt(tag) {
      return {
        effect: Identifier.parse(tag.getString("id")),
        duration: tag.getNumber("duration"),
        amplifier: tag.getNumber("amplifier")
      };
    }
    MobEffectInstance2.fromNbt = fromNbt;
  })(MobEffectInstance || (MobEffectInstance = {}));
  var POTION_EFFECTS = /* @__PURE__ */ new Map([
    ["minecraft:empty", []],
    ["minecraft:water", []],
    ["minecraft:mundane", []],
    ["minecraft:thick", []],
    ["minecraft:awkward", []],
    ["minecraft:night_vision", [{ effect: Identifier.create("night_vision"), duration: 3600, amplifier: 0 }]],
    ["minecraft:long_night_vision", [{ effect: Identifier.create("night_vision"), duration: 9600, amplifier: 0 }]],
    ["minecraft:invisibility", [{ effect: Identifier.create("invisibility"), duration: 3600, amplifier: 0 }]],
    ["minecraft:long_invisibility", [{ effect: Identifier.create("invisibility"), duration: 9600, amplifier: 0 }]],
    ["minecraft:leaping", [{ effect: Identifier.create("jump_boost"), duration: 3600, amplifier: 0 }]],
    ["minecraft:long_leaping", [{ effect: Identifier.create("jump_boost"), duration: 9600, amplifier: 0 }]],
    ["minecraft:strong_leaping", [{ effect: Identifier.create("jump_boost"), duration: 1800, amplifier: 1 }]],
    ["minecraft:fire_resistance", [{ effect: Identifier.create("fire_resistance"), duration: 3600, amplifier: 0 }]],
    ["minecraft:long_fire_resistance", [{ effect: Identifier.create("fire_resistance"), duration: 9600, amplifier: 0 }]],
    ["minecraft:swiftness", [{ effect: Identifier.create("speed"), duration: 3600, amplifier: 0 }]],
    ["minecraft:long_swiftness", [{ effect: Identifier.create("speed"), duration: 9600, amplifier: 0 }]],
    ["minecraft:strong_swiftness", [{ effect: Identifier.create("speed"), duration: 1800, amplifier: 1 }]],
    ["minecraft:slowness", [{ effect: Identifier.create("slowness"), duration: 1800, amplifier: 0 }]],
    ["minecraft:long_slowness", [{ effect: Identifier.create("slowness"), duration: 4800, amplifier: 0 }]],
    ["minecraft:strong_slowness", [{ effect: Identifier.create("slowness"), duration: 400, amplifier: 3 }]],
    ["minecraft:turtle_master", [{ effect: Identifier.create("slowness"), duration: 400, amplifier: 3 }, { effect: Identifier.create("resistance"), duration: 400, amplifier: 2 }]],
    ["minecraft:long_turtle_master", [{ effect: Identifier.create("slowness"), duration: 800, amplifier: 3 }, { effect: Identifier.create("resistance"), duration: 800, amplifier: 2 }]],
    ["minecraft:strong_turtle_master", [{ effect: Identifier.create("slowness"), duration: 400, amplifier: 5 }, { effect: Identifier.create("resistance"), duration: 400, amplifier: 3 }]],
    ["minecraft:water_breathing", [{ effect: Identifier.create("water_breathing"), duration: 3600, amplifier: 0 }]],
    ["minecraft:long_water_breathing", [{ effect: Identifier.create("water_breathing"), duration: 9600, amplifier: 0 }]],
    ["minecraft:healing", [{ effect: Identifier.create("instant_health"), duration: 1, amplifier: 0 }]],
    ["minecraft:strong_healing", [{ effect: Identifier.create("instant_health"), duration: 1, amplifier: 1 }]],
    ["minecraft:harming", [{ effect: Identifier.create("instant_damage"), duration: 1, amplifier: 0 }]],
    ["minecraft:strong_harming", [{ effect: Identifier.create("instant_damage"), duration: 1, amplifier: 1 }]],
    ["minecraft:poison", [{ effect: Identifier.create("poison"), duration: 900, amplifier: 0 }]],
    ["minecraft:long_poison", [{ effect: Identifier.create("poison"), duration: 1800, amplifier: 0 }]],
    ["minecraft:strong_poison", [{ effect: Identifier.create("poison"), duration: 432, amplifier: 1 }]],
    ["minecraft:regeneration", [{ effect: Identifier.create("regeneration"), duration: 900, amplifier: 0 }]],
    ["minecraft:long_regeneration", [{ effect: Identifier.create("regeneration"), duration: 1800, amplifier: 0 }]],
    ["minecraft:strong_regeneration", [{ effect: Identifier.create("regeneration"), duration: 450, amplifier: 1 }]],
    ["minecraft:strength", [{ effect: Identifier.create("strength"), duration: 3600, amplifier: 0 }]],
    ["minecraft:long_strength", [{ effect: Identifier.create("strength"), duration: 9600, amplifier: 0 }]],
    ["minecraft:strong_strength", [{ effect: Identifier.create("strength"), duration: 1800, amplifier: 1 }]],
    ["minecraft:weakness", [{ effect: Identifier.create("weakness"), duration: 1800, amplifier: 0 }]],
    ["minecraft:long_weakness", [{ effect: Identifier.create("weakness"), duration: 4800, amplifier: 0 }]],
    ["minecraft:luck", [{ effect: Identifier.create("luck"), duration: 6e3, amplifier: 0 }]],
    ["minecraft:slow_falling", [{ effect: Identifier.create("slow_falling"), duration: 1800, amplifier: 0 }]],
    ["minecraft:long_slow_falling", [{ effect: Identifier.create("slow_falling"), duration: 4800, amplifier: 0 }]],
    ["minecraft:wind_charged", [{ effect: Identifier.create("wind_charged"), duration: 3600, amplifier: 0 }]],
    ["minecraft:weaving", [{ effect: Identifier.create("weaving"), duration: 3600, amplifier: 0 }]],
    ["minecraft:oozing", [{ effect: Identifier.create("oozing"), duration: 3600, amplifier: 0 }]],
    ["minecraft:infested", [{ effect: Identifier.create("infested"), duration: 3600, amplifier: 0 }]]
  ]);
  var PotionContents;
  (function(PotionContents2) {
    function fromNbt(tag) {
      const ans = {};
      if (tag.isString()) {
        ans.potion = Identifier.parse(tag.getAsString());
      } else if (tag.isCompound()) {
        if (tag.hasString("potion")) {
          ans.potion = Identifier.parse(tag.getString("potion"));
        }
        if (tag.hasNumber("custom_color")) {
          ans.customColor = tag.getNumber("custom_color");
        }
        if (tag.hasList("custom_effects")) {
          ans.customEffects = tag.getList("custom_effects", NbtType.Compound).map(MobEffectInstance.fromNbt);
        }
      }
      return ans;
    }
    PotionContents2.fromNbt = fromNbt;
    function getColor(contents) {
      if (contents.customColor) {
        return Color.intToRgb(contents.customColor);
      }
      const effects = getAllEffects(contents);
      return mixEffectColors(effects);
    }
    PotionContents2.getColor = getColor;
    function getAllEffects(contents) {
      const ans = [];
      if (contents.potion) {
        ans.push(...POTION_EFFECTS.get(contents.potion.toString()) ?? []);
      }
      if (contents.customEffects) {
        ans.push(...contents.customEffects);
      }
      return ans;
    }
    PotionContents2.getAllEffects = getAllEffects;
    function mixEffectColors(effects) {
      let [r, g, b] = [0, 0, 0];
      let total = 0;
      for (const effect of effects) {
        const color = EFFECT_COLORS.get(effect.effect.toString());
        if (color === void 0)
          continue;
        const rgb = Color.intToRgb(color);
        const amplifier = effect.amplifier + 1;
        r += amplifier * rgb[0];
        g += amplifier * rgb[1];
        b += amplifier * rgb[2];
        total += amplifier;
      }
      if (total === 0) {
        return Color.intToRgb(-13083194);
      }
      r = r / total;
      g = g / total;
      b = b / total;
      return [r, g, b];
    }
  })(PotionContents || (PotionContents = {}));

  // node_modules/deepslate/lib/core/Holder.js
  var Holder;
  (function(Holder2) {
    function parser(registry, directParser) {
      return (obj) => {
        if (typeof obj === "string") {
          return reference(registry, Identifier.parse(obj));
        } else {
          return direct(directParser(obj));
        }
      };
    }
    Holder2.parser = parser;
    function direct(value, id) {
      return {
        value: () => value,
        key: () => id
      };
    }
    Holder2.direct = direct;
    function reference(registry, id, required = true) {
      if (required) {
        return {
          value: () => registry.getOrThrow(id),
          key: () => id
        };
      } else {
        return {
          value: () => registry.get(id),
          key: () => id
        };
      }
    }
    Holder2.reference = reference;
  })(Holder || (Holder = {}));

  // node_modules/deepslate/lib/core/HolderSet.js
  var HolderSet = class _HolderSet {
    entries;
    constructor(entries) {
      this.entries = entries;
    }
    static parser(registry, valueParser) {
      const defaultedValueParser = valueParser ?? ((obj) => Holder.reference(registry, Identifier.parse(Json.readString(obj) ?? "")));
      return (obj) => {
        if (typeof obj === "string") {
          if (obj.startsWith("#")) {
            return Holder.reference(registry.getTagRegistry(), Identifier.parse(obj.substring(1)));
          } else {
            return Holder.direct(new _HolderSet([]));
          }
        } else {
          return Holder.direct(new _HolderSet(Json.readArray(obj, defaultedValueParser) ?? []) ?? []);
        }
      };
    }
    static fromJson(registry, obj, id) {
      const root = Json.readObject(obj) ?? {};
      const replace = Json.readBoolean(root.replace) ?? false;
      const entries = Json.readArray(root.values, (obj2) => {
        var required = true;
        var id2 = "";
        if (typeof obj2 === "string") {
          id2 = obj2;
        } else {
          const entry = Json.readObject(obj2) ?? {};
          required = Json.readBoolean(entry.required) ?? false;
          id2 = Json.readString(entry.id) ?? "";
        }
        if (id2.startsWith("#")) {
          return Holder.reference(registry.getTagRegistry(), Identifier.parse(id2.substring(1)), required);
        } else {
          return Holder.reference(registry, Identifier.parse(id2), required);
        }
      }) ?? [];
      if (id && !replace && registry.getTagRegistry().has(id)) {
        entries?.push(Holder.direct(registry.getTagRegistry().get(id)));
      }
      return new _HolderSet(entries);
    }
    *getEntries() {
      for (const entry of this.entries) {
        const value = entry.value();
        if (value === void 0) {
          continue;
        }
        if (value instanceof _HolderSet) {
          yield* value.getEntries();
        } else {
          yield entry;
        }
      }
    }
  };

  // node_modules/deepslate/lib/core/ItemStack.js
  var ItemStack = class _ItemStack {
    id;
    count;
    components;
    constructor(id, count, components = /* @__PURE__ */ new Map()) {
      this.id = id;
      this.count = count;
      this.components = components;
    }
    getComponent(key, baseComponents) {
      if (typeof key === "string") {
        key = Identifier.parse(key);
      }
      if (this.components.has("!" + key.toString())) {
        return void 0;
      }
      const value = this.components.get(key.toString());
      if (value) {
        return value;
      }
      if (baseComponents) {
        return baseComponents.getItemComponents(this.id)?.get(key.toString());
      }
      return void 0;
    }
    hasComponent(key, baseComponents) {
      if (typeof key === "string") {
        key = Identifier.parse(key);
      }
      if (this.components.has("!" + key.toString())) {
        return false;
      }
      if (this.components.has(key.toString())) {
        return true;
      }
      if (baseComponents) {
        return baseComponents.getItemComponents(this.id)?.has(key.toString());
      }
      return false;
    }
    clone() {
      const components = new Map(this.components);
      return new _ItemStack(this.id, this.count, components);
    }
    is(other) {
      if (typeof other === "string") {
        return this.id.equals(Identifier.parse(other));
      }
      if (other instanceof Identifier) {
        return this.id.equals(other);
      }
      return this.id.equals(other.id);
    }
    equals(other) {
      if (this === other) {
        return true;
      }
      if (!(other instanceof _ItemStack)) {
        return false;
      }
      return this.count === other.count && this.isSameItemSameComponents(other);
    }
    isSameItemSameComponents(other) {
      if (!this.id.equals(other.id) || this.components.size !== other.components.size) {
        return false;
      }
      for (const [key, value] of this.components) {
        const otherValue = other.components.get(key);
        if (value.toString() !== otherValue?.toString()) {
          return false;
        }
      }
      return true;
    }
    toString() {
      let result = this.id.toString();
      if (this.components.size > 0) {
        result += `[${[...this.components.entries()].map(([k, v]) => {
          return k.startsWith("!") ? k : `${k}=${v.toString()}`;
        }).join(",")}]`;
      }
      if (this.count > 1) {
        result += ` ${this.count}`;
      }
      return result;
    }
    static fromString(string) {
      const reader = new StringReader(string);
      while (reader.canRead() && reader.peek() !== "[") {
        reader.skip();
      }
      const itemId = Identifier.parse(reader.getRead());
      if (!reader.canRead()) {
        return new _ItemStack(itemId, 1);
      }
      const components = /* @__PURE__ */ new Map();
      reader.skip();
      if (reader.peek() === "]") {
        return new _ItemStack(itemId, 1, components);
      }
      do {
        if (reader.peek() === "!") {
          reader.skip();
          reader.skipWhitespace();
          const start = reader.cursor;
          while (reader.canRead() && reader.peek() !== "]" && reader.peek() !== ",") {
            reader.skip();
          }
          components.set("!" + Identifier.parse(reader.getRead(start).trim()).toString(), new NbtCompound());
        } else {
          reader.skipWhitespace();
          const start = reader.cursor;
          while (reader.canRead() && reader.peek() !== "=") {
            reader.skip();
          }
          const component = Identifier.parse(reader.getRead(start).trim()).toString();
          if (!reader.canRead())
            break;
          reader.skip();
          reader.skipWhitespace();
          const tag = NbtParser.readTag(reader);
          components.set(component, tag);
        }
        reader.skipWhitespace();
        if (!reader.canRead())
          break;
        if (reader.peek() === "]") {
          return new _ItemStack(itemId, 1, components);
        }
        if (reader.peek() !== ",") {
          throw new Error("Expected , or ]");
        }
        reader.skip();
      } while (reader.canRead());
      throw new Error("Missing closing ]");
    }
    toNbt() {
      const result = new NbtCompound().set("id", new NbtString(this.id.toString()));
      if (this.count > 1) {
        result.set("count", new NbtInt(this.count));
      }
      if (this.components.size > 0) {
        result.set("components", new NbtCompound(this.components));
      }
      return result;
    }
    static fromNbt(nbt) {
      const id = Identifier.parse(nbt.getString("id"));
      const count = nbt.hasNumber("count") ? nbt.getNumber("count") : 1;
      const components = new Map(Object.entries(nbt.getCompound("components").map((key, value) => {
        if (key.startsWith("!")) {
          return ["!" + Identifier.parse(key).toString(), new NbtCompound()];
        }
        return [Identifier.parse(key).toString(), value];
      })));
      return new _ItemStack(id, count, components);
    }
  };

  // node_modules/deepslate/lib/core/Registry.js
  var Registry = class _Registry {
    key;
    parser;
    static REGISTRY = new _Registry(Identifier.create("root"));
    storage = /* @__PURE__ */ new Map();
    builtin = /* @__PURE__ */ new Map();
    tags = void 0;
    constructor(key, parser) {
      this.key = key;
      this.parser = parser;
    }
    static createAndRegister(name, parser) {
      const registry = new _Registry(Identifier.create(name), parser);
      _Registry.REGISTRY.register(registry.key, registry);
      return registry;
    }
    register(id, value, builtin) {
      this.storage.set(id.toString(), value);
      if (builtin) {
        this.builtin.set(id.toString(), value);
      }
      return Holder.reference(this, id);
    }
    delete(id) {
      const deleted = this.storage.delete(id.toString());
      this.builtin.delete(id.toString());
      return deleted;
    }
    keys() {
      return [...this.storage.keys()].map((e) => Identifier.parse(e));
    }
    has(id) {
      return this.storage.has(id.toString());
    }
    get(id) {
      var value = this.storage.get(id.toString());
      if (value instanceof Function) {
        value = value();
        this.storage.set(id.toString(), value);
      }
      return value;
    }
    getOrThrow(id) {
      const value = this.get(id);
      if (value === void 0) {
        throw new Error(`Missing key in ${this.key.toString()}: ${id.toString()}`);
      }
      return value;
    }
    parse(obj) {
      if (!this.parser) {
        throw new Error(`No parser exists for ${this.key.toString()}`);
      }
      return this.parser(obj);
    }
    clear() {
      this.storage.clear();
      for (const [key, value] of this.builtin.entries()) {
        this.storage.set(key, value);
      }
      if (this.tags) {
        this.tags.clear();
      }
      return this;
    }
    assign(other) {
      if (!this.key.equals(other.key)) {
        throw new Error(`Cannot assign registry of type ${other.key.toString()} to registry of type ${this.key.toString()}`);
      }
      for (const key of other.keys()) {
        this.storage.set(key.toString(), other.getOrThrow(key));
      }
      return this;
    }
    cloneEmpty() {
      return new _Registry(this.key, this.parser);
    }
    forEach(fn) {
      for (const [key, value] of this.storage.entries()) {
        fn(Identifier.parse(key), value instanceof Function ? value() : value, this);
      }
    }
    map(fn) {
      return [...this.storage.entries()].map(([key, value]) => {
        return fn(Identifier.parse(key), value instanceof Function ? value() : value, this);
      });
    }
    getTagRegistry() {
      if (this.tags === void 0) {
        this.tags = new _Registry(new Identifier(this.key.namespace, `tags/${this.key.path}`));
      }
      return this.tags;
    }
  };

  // node_modules/deepslate/lib/core/Rotation.js
  var Rotation;
  (function(Rotation2) {
    Rotation2["NONE"] = "none";
    Rotation2["CLOCKWISE_90"] = "clockwise_90";
    Rotation2["CLOCKWISE_180"] = "180";
    Rotation2["COUNTERCLOCKWISE_90"] = "counterclockwise_90";
  })(Rotation || (Rotation = {}));
  (function(Rotation2) {
    function getRandom(random2) {
      return [Rotation2.NONE, Rotation2.CLOCKWISE_90, Rotation2.CLOCKWISE_180, Rotation2.COUNTERCLOCKWISE_90][random2.nextInt(4)];
    }
    Rotation2.getRandom = getRandom;
  })(Rotation || (Rotation = {}));

  // node_modules/deepslate/lib/core/Structure.js
  var Structure = class _Structure {
    size;
    palette;
    blocks;
    static REGISTRY = Registry.createAndRegister("structures");
    static EMPTY = new _Structure(BlockPos.ZERO);
    blocksMap = [];
    constructor(size, palette = [], blocks = []) {
      this.size = size;
      this.palette = palette;
      this.blocks = blocks;
      blocks.forEach((block) => {
        if (!this.isInside(block.pos)) {
          throw new Error(`Found block at ${block.pos} which is outside the structure bounds ${this.size}`);
        }
        this.blocksMap[block.pos[0] * size[1] * size[2] + block.pos[1] * size[2] + block.pos[2]] = block;
      });
    }
    getSize() {
      return this.size;
    }
    addBlock(pos, name, properties, nbt) {
      if (!this.isInside(pos)) {
        throw new Error(`Cannot add block at ${pos} outside the structure bounds ${this.size}`);
      }
      const blockState = new BlockState(name, properties);
      let state = this.palette.findIndex((b) => b.equals(blockState));
      if (state === -1) {
        state = this.palette.length;
        this.palette.push(blockState);
      }
      this.blocks.push({ pos, state, nbt });
      this.blocksMap[pos[0] * this.size[1] * this.size[2] + pos[1] * this.size[2] + pos[2]] = { pos, state, nbt };
      return this;
    }
    getBlocks() {
      return this.blocks.map((b) => this.toPlacedBlock(b));
    }
    getBlock(pos) {
      if (!this.isInside(pos))
        return null;
      const block = this.blocksMap[pos[0] * this.size[1] * this.size[2] + pos[1] * this.size[2] + pos[2]];
      if (!block)
        return null;
      return this.toPlacedBlock(block);
    }
    toPlacedBlock(block) {
      const state = this.palette[block.state];
      if (!state) {
        throw new Error(`Block at ${block.pos.join(" ")} in structure references invalid palette index ${block.state}`);
      }
      return {
        pos: block.pos,
        state,
        nbt: block.nbt
      };
    }
    isInside(pos) {
      return pos[0] >= 0 && pos[0] < this.size[0] && pos[1] >= 0 && pos[1] < this.size[1] && pos[2] >= 0 && pos[2] < this.size[2];
    }
    static fromNbt(nbt) {
      const size = BlockPos.fromNbt(nbt.getList("size"));
      const palette = nbt.getList("palette", NbtType.Compound).map((tag) => BlockState.fromNbt(tag));
      const blocks = nbt.getList("blocks", NbtType.Compound).map((tag) => {
        const pos = BlockPos.fromNbt(tag.getList("pos"));
        const state = tag.getNumber("state");
        const nbt2 = tag.getCompound("nbt");
        return { pos, state, nbt: nbt2.size > 0 ? nbt2 : void 0 };
      });
      return new _Structure(size, palette, blocks);
    }
    static transform(pos, rotation, pivot) {
      switch (rotation) {
        case Rotation.COUNTERCLOCKWISE_90:
          return BlockPos.create(pivot[0] - pivot[2] + pos[2], pos[1], pivot[0] + pivot[2] - pos[0]);
        case Rotation.CLOCKWISE_90:
          return BlockPos.create(pivot[0] + pivot[2] - pos[2], pos[1], pivot[2] - pivot[0] + pos[0]);
        case Rotation.CLOCKWISE_180:
          return BlockPos.create(pivot[0] + pivot[0] - pos[0], pos[1], pivot[2] + pivot[2] - pos[2]);
        default:
          return pos;
      }
    }
  };

  // node_modules/deepslate/lib/math/Util.js
  var MIN_INT = -2147483648;
  var MAX_INT = 2147483647;
  var MIN_LONG = -9223372036854776e3;
  var MAX_LONG = 9223372036854776e3;
  function square(x) {
    return x * x;
  }
  function clamp(x, min2, max2) {
    return Math.max(min2, Math.min(max2, x));
  }
  function lerp(a, b, c) {
    return b + a * (c - b);
  }
  function floatLerp(a, b, c) {
    return Math.fround(b + Math.fround(a * Math.fround(c - b)));
  }
  function lerp2(a, b, c, d, e, f) {
    return lerp(b, lerp(a, c, d), lerp(a, e, f));
  }
  function lerp3(a, b, c, d, e, f, g, h, i, j, k) {
    return lerp(c, lerp2(a, b, d, e, f, g), lerp2(a, b, h, i, j, k));
  }
  function lazyLerp(a, b, c) {
    if (a === 0)
      return b();
    if (a === 1)
      return c();
    return b() + a * (c() - b());
  }
  function lazyLerp2(a, b, c, d, e, f) {
    return lazyLerp(b, () => lazyLerp(a, c, d), () => lazyLerp(a, e, f));
  }
  function lazyLerp3(a, b, c, d, e, f, g, h, i, j, k) {
    return lazyLerp(c, () => lazyLerp2(a, b, d, e, f, g), () => lazyLerp2(a, b, h, i, j, k));
  }
  function clampedLerp(a, b, c) {
    if (c < 0) {
      return a;
    } else if (c > 1) {
      return b;
    } else {
      return lerp(c, a, b);
    }
  }
  function inverseLerp(a, b, c) {
    return (a - b) / (c - b);
  }
  function smoothstep(x) {
    return x * x * x * (x * (x * 6 - 15) + 10);
  }
  function map(a, b, c, d, e) {
    return lerp(inverseLerp(a, b, c), d, e);
  }
  function clampedMap(a, b, c, d, e) {
    return clampedLerp(d, e, inverseLerp(a, b, c));
  }
  function intFloor(a) {
    return clamp(Math.floor(a), MIN_INT, MAX_INT);
  }
  function longFloor(a) {
    return clamp(Math.floor(a), MIN_LONG, MAX_LONG);
  }
  function binarySearch(n, n2, predicate) {
    let n3 = n2 - n;
    while (n3 > 0) {
      const n4 = Math.floor(n3 / 2);
      const n5 = n + n4;
      if (predicate(n5)) {
        n3 = n4;
        continue;
      }
      n = n5 + 1;
      n3 -= n4 + 1;
    }
    return n;
  }
  function getSeed(x, y, z) {
    let seed = BigInt(x * 3129871) ^ BigInt(z) * BigInt(116129781) ^ BigInt(y);
    seed = seed * seed * BigInt(42317861) + seed * BigInt(11);
    return seed >> BigInt(16);
  }
  function longfromBytes(a, b, c, d, e, f, g, h) {
    return BigInt(a) << BigInt(56) | BigInt(b) << BigInt(48) | BigInt(c) << BigInt(40) | BigInt(d) << BigInt(32) | BigInt(e) << BigInt(24) | BigInt(f) << BigInt(16) | BigInt(g) << BigInt(8) | BigInt(h);
  }
  function isPowerOfTwo(x) {
    return (x & x - 1) === 0;
  }
  function upperPowerOfTwo(x) {
    x -= 1;
    x |= x >> 1;
    x |= x >> 2;
    x |= x >> 4;
    x |= x >> 8;
    x |= x >> 18;
    x |= x >> 32;
    return x + 1;
  }
  function randomBetweenInclusive(random2, min2, max2) {
    return random2.nextInt(max2 - min2 + 1) + min2;
  }
  function nextInt(random2, min2, max2) {
    return min2 >= max2 ? min2 : random2.nextInt(max2 - min2 + 1) + min2;
  }
  function shuffle(array, random2) {
    for (var i = array.length; i > 1; i--) {
      const switchIndex = random2.nextInt(i);
      const tmp = array[switchIndex];
      array[switchIndex] = array[i - 1];
      array[i - 1] = tmp;
    }
  }

  // node_modules/deepslate/lib/math/CubicSpline.js
  var MinMaxNumberFunction;
  (function(MinMaxNumberFunction2) {
    function is(obj) {
      return typeof obj === "object" && obj !== null && "minValue" in obj && "maxValue" in obj;
    }
    MinMaxNumberFunction2.is = is;
  })(MinMaxNumberFunction || (MinMaxNumberFunction = {}));
  var CubicSpline;
  (function(CubicSpline2) {
    function fromJson(obj, extractor) {
      if (typeof obj === "number") {
        return new Constant(obj);
      }
      const root = Json.readObject(obj) ?? {};
      const spline = new MultiPoint(extractor(root.coordinate));
      const points = Json.readArray(root.points, (e) => Json.readObject(e) ?? {}) ?? [];
      if (points.length === 0) {
        return new Constant(0);
      }
      for (const point of points) {
        const location = Json.readNumber(point.location) ?? 0;
        const value = fromJson(point.value, extractor);
        const derivative = Json.readNumber(point.derivative) ?? 0;
        spline.addPoint(location, value, derivative);
      }
      return spline;
    }
    CubicSpline2.fromJson = fromJson;
    class Constant {
      value;
      constructor(value) {
        this.value = value;
      }
      compute() {
        return this.value;
      }
      min() {
        return this.value;
      }
      max() {
        return this.value;
      }
      mapAll() {
        return this;
      }
      calculateMinMax() {
      }
    }
    CubicSpline2.Constant = Constant;
    class MultiPoint {
      coordinate;
      locations;
      values;
      derivatives;
      calculatedMin = Number.NEGATIVE_INFINITY;
      calculatedMax = Number.POSITIVE_INFINITY;
      constructor(coordinate, locations = [], values = [], derivatives = []) {
        this.coordinate = coordinate;
        this.locations = locations;
        this.values = values;
        this.derivatives = derivatives;
      }
      compute(c) {
        const coordinate = this.coordinate.compute(c);
        const i = binarySearch(0, this.locations.length, (n2) => coordinate < this.locations[n2]) - 1;
        const n = this.locations.length - 1;
        if (i < 0) {
          return Math.fround(this.values[0].compute(c) + Math.fround(this.derivatives[0] * Math.fround(coordinate - this.locations[0])));
        }
        if (i === n) {
          return Math.fround(this.values[n].compute(c) + Math.fround(this.derivatives[n] * Math.fround(coordinate - this.locations[n])));
        }
        const loc0 = this.locations[i];
        const loc1 = this.locations[i + 1];
        const der0 = this.derivatives[i];
        const der1 = this.derivatives[i + 1];
        const f = Math.fround(Math.fround(coordinate - loc0) / Math.fround(loc1 - loc0));
        const val0 = this.values[i].compute(c);
        const val1 = this.values[i + 1].compute(c);
        const f8 = Math.fround(Math.fround(der0 * Math.fround(loc1 - loc0)) - Math.fround(val1 - val0));
        const f9 = Math.fround(Math.fround(-der1 * Math.fround(loc1 - loc0)) + Math.fround(val1 - val0));
        const f10 = Math.fround(floatLerp(f, val0, val1) + Math.fround(Math.fround(f * Math.fround(1 - f)) * floatLerp(f, f8, f9)));
        return f10;
      }
      min() {
        return this.calculatedMin;
      }
      max() {
        return this.calculatedMax;
      }
      mapAll(visitor) {
        return new MultiPoint(visitor(this.coordinate), this.locations, this.values.map((v) => v.mapAll(visitor)), this.derivatives);
      }
      addPoint(location, value, derivative = 0) {
        this.locations.push(Math.fround(location));
        this.values.push(typeof value === "number" ? new CubicSpline2.Constant(Math.fround(value)) : value);
        this.derivatives.push(Math.fround(derivative));
        return this;
      }
      calculateMinMax() {
        if (!MinMaxNumberFunction.is(this.coordinate)) {
          return;
        }
        const lastIdx = this.locations.length - 1;
        var splineMin = Number.POSITIVE_INFINITY;
        var splineMax = Number.NEGATIVE_INFINITY;
        const coordinateMin = this.coordinate.minValue();
        const coordinateMax = this.coordinate.maxValue();
        for (const innerSpline of this.values) {
          innerSpline.calculateMinMax();
        }
        if (coordinateMin < this.locations[0]) {
          const minExtend = MultiPoint.linearExtend(coordinateMin, this.locations, this.values[0].min(), this.derivatives, 0);
          const maxExtend = MultiPoint.linearExtend(coordinateMin, this.locations, this.values[0].max(), this.derivatives, 0);
          splineMin = Math.min(splineMin, Math.min(minExtend, maxExtend));
          splineMax = Math.max(splineMax, Math.max(minExtend, maxExtend));
        }
        if (coordinateMax > this.locations[lastIdx]) {
          const minExtend = MultiPoint.linearExtend(coordinateMax, this.locations, this.values[lastIdx].min(), this.derivatives, lastIdx);
          const maxExtend = MultiPoint.linearExtend(coordinateMax, this.locations, this.values[lastIdx].max(), this.derivatives, lastIdx);
          splineMin = Math.min(splineMin, Math.min(minExtend, maxExtend));
          splineMax = Math.max(splineMax, Math.max(minExtend, maxExtend));
        }
        for (const innerSpline of this.values) {
          splineMin = Math.min(splineMin, innerSpline.min());
          splineMax = Math.max(splineMax, innerSpline.max());
        }
        for (var i = 0; i < lastIdx; ++i) {
          const locationLeft = this.locations[i];
          const locationRight = this.locations[i + 1];
          const locationDelta = Math.fround(locationRight - locationLeft);
          const splineLeft = this.values[i];
          const splineRight = this.values[i + 1];
          const minLeft = splineLeft.min();
          const maxLeft = splineLeft.max();
          const minRight = splineRight.min();
          const maxRight = splineRight.max();
          const derivativeLeft = this.derivatives[i];
          const derivativeRight = this.derivatives[i + 1];
          if (derivativeLeft !== 0 || derivativeRight !== 0) {
            const maxValueDeltaLeft = Math.fround(derivativeLeft * locationDelta);
            const maxValueDeltaRight = Math.fround(derivativeRight * locationDelta);
            const minValue = Math.min(minLeft, minRight);
            const maxValue = Math.max(maxLeft, maxRight);
            const minDeltaLeft = Math.fround(Math.fround(maxValueDeltaLeft - maxRight) + minLeft);
            const maxDeltaLeft = Math.fround(Math.fround(maxValueDeltaLeft - minRight) + maxLeft);
            const minDeltaRight = Math.fround(Math.fround(-maxValueDeltaRight + minRight) - maxLeft);
            const maxDeltaRight = Math.fround(Math.fround(-maxValueDeltaRight + maxRight) - minLeft);
            const minDelta = Math.min(minDeltaLeft, minDeltaRight);
            const maxDelta = Math.max(maxDeltaLeft, maxDeltaRight);
            splineMin = Math.min(splineMin, Math.fround(minValue + Math.fround(0.25 * minDelta)));
            splineMax = Math.max(splineMax, Math.fround(maxValue + Math.fround(0.25 * maxDelta)));
          }
        }
        this.calculatedMin = splineMin;
        this.calculatedMax = splineMax;
      }
      static linearExtend(location, locations, value, derivatives, useIndex) {
        const derivative = derivatives[useIndex];
        if (derivative == 0) {
          return value;
        }
        return Math.fround(value + Math.fround(derivative * Math.fround(location - locations[useIndex])));
      }
    }
    CubicSpline2.MultiPoint = MultiPoint;
  })(CubicSpline || (CubicSpline = {}));

  // node_modules/gl-matrix/esm/common.js
  var common_exports = {};
  __export(common_exports, {
    ANGLE_ORDER: () => ANGLE_ORDER,
    ARRAY_TYPE: () => ARRAY_TYPE,
    EPSILON: () => EPSILON,
    RANDOM: () => RANDOM,
    equals: () => equals,
    round: () => round,
    setMatrixArrayType: () => setMatrixArrayType,
    toDegree: () => toDegree,
    toRadian: () => toRadian
  });
  var EPSILON = 1e-6;
  var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
  var RANDOM = Math.random;
  var ANGLE_ORDER = "zyx";
  function round(a) {
    if (a >= 0) return Math.round(a);
    return a % 0.5 === 0 ? Math.floor(a) : Math.round(a);
  }
  function setMatrixArrayType(type) {
    ARRAY_TYPE = type;
  }
  var degree = Math.PI / 180;
  var radian = 180 / Math.PI;
  function toRadian(a) {
    return a * degree;
  }
  function toDegree(a) {
    return a * radian;
  }
  function equals(a, b) {
    var tolerance = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : EPSILON;
    return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
  }

  // node_modules/gl-matrix/esm/mat3.js
  var mat3_exports = {};
  __export(mat3_exports, {
    add: () => add,
    adjoint: () => adjoint,
    clone: () => clone,
    copy: () => copy,
    create: () => create,
    determinant: () => determinant,
    equals: () => equals2,
    exactEquals: () => exactEquals,
    frob: () => frob,
    fromMat2d: () => fromMat2d,
    fromMat4: () => fromMat4,
    fromQuat: () => fromQuat,
    fromRotation: () => fromRotation,
    fromScaling: () => fromScaling,
    fromTranslation: () => fromTranslation,
    fromValues: () => fromValues,
    identity: () => identity,
    invert: () => invert,
    mul: () => mul,
    multiply: () => multiply,
    multiplyScalar: () => multiplyScalar,
    multiplyScalarAndAdd: () => multiplyScalarAndAdd,
    normalFromMat4: () => normalFromMat4,
    projection: () => projection,
    rotate: () => rotate,
    scale: () => scale,
    set: () => set,
    str: () => str,
    sub: () => sub,
    subtract: () => subtract,
    translate: () => translate,
    transpose: () => transpose
  });
  function create() {
    var out = new ARRAY_TYPE(9);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
    }
    out[0] = 1;
    out[4] = 1;
    out[8] = 1;
    return out;
  }
  function fromMat4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
  }
  function clone(a) {
    var out = new ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function fromValues(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    var out = new ARRAY_TYPE(9);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
  }
  function set(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
  }
  function identity(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function transpose(out, a) {
    if (out === a) {
      var a01 = a[1], a02 = a[2], a12 = a[5];
      out[1] = a[3];
      out[2] = a[6];
      out[3] = a01;
      out[5] = a[7];
      out[6] = a02;
      out[7] = a12;
    } else {
      out[0] = a[0];
      out[1] = a[3];
      out[2] = a[6];
      out[3] = a[1];
      out[4] = a[4];
      out[5] = a[7];
      out[6] = a[2];
      out[7] = a[5];
      out[8] = a[8];
    }
    return out;
  }
  function invert(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    var b01 = a22 * a11 - a12 * a21;
    var b11 = -a22 * a10 + a12 * a20;
    var b21 = a21 * a10 - a11 * a20;
    var det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
  }
  function adjoint(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    out[0] = a11 * a22 - a12 * a21;
    out[1] = a02 * a21 - a01 * a22;
    out[2] = a01 * a12 - a02 * a11;
    out[3] = a12 * a20 - a10 * a22;
    out[4] = a00 * a22 - a02 * a20;
    out[5] = a02 * a10 - a00 * a12;
    out[6] = a10 * a21 - a11 * a20;
    out[7] = a01 * a20 - a00 * a21;
    out[8] = a00 * a11 - a01 * a10;
    return out;
  }
  function determinant(a) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
  }
  function multiply(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    var b00 = b[0], b01 = b[1], b02 = b[2];
    var b10 = b[3], b11 = b[4], b12 = b[5];
    var b20 = b[6], b21 = b[7], b22 = b[8];
    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;
    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;
    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
  }
  function translate(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], x = v[0], y = v[1];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a10;
    out[4] = a11;
    out[5] = a12;
    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
  }
  function rotate(out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;
    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;
    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
  }
  function scale(out, a, v) {
    var x = v[0], y = v[1];
    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];
    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function fromTranslation(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = v[0];
    out[7] = v[1];
    out[8] = 1;
    return out;
  }
  function fromRotation(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = 0;
    out[3] = -s;
    out[4] = c;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function fromScaling(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = v[1];
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function fromMat2d(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;
    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;
    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
  }
  function fromQuat(out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;
    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;
    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;
    return out;
  }
  function normalFromMat4(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    return out;
  }
  function projection(out, width, height) {
    out[0] = 2 / width;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = -2 / height;
    out[5] = 0;
    out[6] = -1;
    out[7] = 1;
    out[8] = 1;
    return out;
  }
  function str(a) {
    return "mat3(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ")";
  }
  function frob(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8]);
  }
  function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    return out;
  }
  function subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    return out;
  }
  function multiplyScalar(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    return out;
  }
  function multiplyScalarAndAdd(out, a, b, scale4) {
    out[0] = a[0] + b[0] * scale4;
    out[1] = a[1] + b[1] * scale4;
    out[2] = a[2] + b[2] * scale4;
    out[3] = a[3] + b[3] * scale4;
    out[4] = a[4] + b[4] * scale4;
    out[5] = a[5] + b[5] * scale4;
    out[6] = a[6] + b[6] * scale4;
    out[7] = a[7] + b[7] * scale4;
    out[8] = a[8] + b[8] * scale4;
    return out;
  }
  function exactEquals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
  }
  function equals2(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8));
  }
  var mul = multiply;
  var sub = subtract;

  // node_modules/gl-matrix/esm/mat4.js
  var mat4_exports = {};
  __export(mat4_exports, {
    add: () => add2,
    adjoint: () => adjoint2,
    clone: () => clone2,
    copy: () => copy2,
    create: () => create2,
    decompose: () => decompose,
    determinant: () => determinant2,
    equals: () => equals3,
    exactEquals: () => exactEquals2,
    frob: () => frob2,
    fromQuat: () => fromQuat3,
    fromQuat2: () => fromQuat2,
    fromRotation: () => fromRotation2,
    fromRotationTranslation: () => fromRotationTranslation,
    fromRotationTranslationScale: () => fromRotationTranslationScale,
    fromRotationTranslationScaleOrigin: () => fromRotationTranslationScaleOrigin,
    fromScaling: () => fromScaling2,
    fromTranslation: () => fromTranslation2,
    fromValues: () => fromValues2,
    fromXRotation: () => fromXRotation,
    fromYRotation: () => fromYRotation,
    fromZRotation: () => fromZRotation,
    frustum: () => frustum,
    getRotation: () => getRotation,
    getScaling: () => getScaling,
    getTranslation: () => getTranslation,
    identity: () => identity2,
    invert: () => invert2,
    lookAt: () => lookAt,
    mul: () => mul2,
    multiply: () => multiply2,
    multiplyScalar: () => multiplyScalar2,
    multiplyScalarAndAdd: () => multiplyScalarAndAdd2,
    ortho: () => ortho,
    orthoNO: () => orthoNO,
    orthoZO: () => orthoZO,
    perspective: () => perspective,
    perspectiveFromFieldOfView: () => perspectiveFromFieldOfView,
    perspectiveNO: () => perspectiveNO,
    perspectiveZO: () => perspectiveZO,
    rotate: () => rotate2,
    rotateX: () => rotateX,
    rotateY: () => rotateY,
    rotateZ: () => rotateZ,
    scale: () => scale2,
    set: () => set2,
    str: () => str2,
    sub: () => sub2,
    subtract: () => subtract2,
    targetTo: () => targetTo,
    translate: () => translate2,
    transpose: () => transpose2
  });
  function create2() {
    var out = new ARRAY_TYPE(16);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
    }
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }
  function clone2(a) {
    var out = new ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function copy2(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function fromValues2(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    var out = new ARRAY_TYPE(16);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function set2(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function identity2(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function transpose2(out, a) {
    if (out === a) {
      var a01 = a[1], a02 = a[2], a03 = a[3];
      var a12 = a[6], a13 = a[7];
      var a23 = a[11];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a01;
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a02;
      out[9] = a12;
      out[11] = a[14];
      out[12] = a03;
      out[13] = a13;
      out[14] = a23;
    } else {
      out[0] = a[0];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a[1];
      out[5] = a[5];
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a[2];
      out[9] = a[6];
      out[10] = a[10];
      out[11] = a[14];
      out[12] = a[3];
      out[13] = a[7];
      out[14] = a[11];
      out[15] = a[15];
    }
    return out;
  }
  function invert2(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }
  function adjoint2(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    out[0] = a11 * b11 - a12 * b10 + a13 * b09;
    out[1] = a02 * b10 - a01 * b11 - a03 * b09;
    out[2] = a31 * b05 - a32 * b04 + a33 * b03;
    out[3] = a22 * b04 - a21 * b05 - a23 * b03;
    out[4] = a12 * b08 - a10 * b11 - a13 * b07;
    out[5] = a00 * b11 - a02 * b08 + a03 * b07;
    out[6] = a32 * b02 - a30 * b05 - a33 * b01;
    out[7] = a20 * b05 - a22 * b02 + a23 * b01;
    out[8] = a10 * b10 - a11 * b08 + a13 * b06;
    out[9] = a01 * b08 - a00 * b10 - a03 * b06;
    out[10] = a30 * b04 - a31 * b02 + a33 * b00;
    out[11] = a21 * b02 - a20 * b04 - a23 * b00;
    out[12] = a11 * b07 - a10 * b09 - a12 * b06;
    out[13] = a00 * b09 - a01 * b07 + a02 * b06;
    out[14] = a31 * b01 - a30 * b03 - a32 * b00;
    out[15] = a20 * b03 - a21 * b01 + a22 * b00;
    return out;
  }
  function determinant2(a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b0 = a00 * a11 - a01 * a10;
    var b1 = a00 * a12 - a02 * a10;
    var b2 = a01 * a12 - a02 * a11;
    var b3 = a20 * a31 - a21 * a30;
    var b4 = a20 * a32 - a22 * a30;
    var b5 = a21 * a32 - a22 * a31;
    var b6 = a00 * b5 - a01 * b4 + a02 * b3;
    var b7 = a10 * b5 - a11 * b4 + a12 * b3;
    var b8 = a20 * b2 - a21 * b1 + a22 * b0;
    var b9 = a30 * b2 - a31 * b1 + a32 * b0;
    return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
  }
  function multiply2(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  function translate2(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    return out;
  }
  function scale2(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function rotate2(out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2];
    var len2 = Math.sqrt(x * x + y * y + z * z);
    var s, c, t;
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;
    var b00, b01, b02;
    var b10, b11, b12;
    var b20, b21, b22;
    if (len2 < EPSILON) {
      return null;
    }
    len2 = 1 / len2;
    x *= len2;
    y *= len2;
    z *= len2;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    return out;
  }
  function rotateX(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    if (a !== out) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
  }
  function rotateY(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    if (a !== out) {
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
  }
  function rotateZ(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    if (a !== out) {
      out[8] = a[8];
      out[9] = a[9];
      out[10] = a[10];
      out[11] = a[11];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
  }
  function fromTranslation2(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromScaling2(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = v[1];
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = v[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromRotation2(out, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2];
    var len2 = Math.sqrt(x * x + y * y + z * z);
    var s, c, t;
    if (len2 < EPSILON) {
      return null;
    }
    len2 = 1 / len2;
    x *= len2;
    y *= len2;
    z *= len2;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    out[0] = x * x * t + c;
    out[1] = y * x * t + z * s;
    out[2] = z * x * t - y * s;
    out[3] = 0;
    out[4] = x * y * t - z * s;
    out[5] = y * y * t + c;
    out[6] = z * y * t + x * s;
    out[7] = 0;
    out[8] = x * z * t + y * s;
    out[9] = y * z * t - x * s;
    out[10] = z * z * t + c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromXRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = c;
    out[6] = s;
    out[7] = 0;
    out[8] = 0;
    out[9] = -s;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromYRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = 0;
    out[2] = -s;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromZRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = 0;
    out[3] = 0;
    out[4] = -s;
    out[5] = c;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromRotationTranslation(out, q, v) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromQuat2(out, a) {
    var translation = new ARRAY_TYPE(3);
    var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7];
    var magnitude = bx * bx + by * by + bz * bz + bw * bw;
    if (magnitude > 0) {
      translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
      translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
      translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
    } else {
      translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
      translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
      translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
    }
    fromRotationTranslation(out, a, translation);
    return out;
  }
  function getTranslation(out, mat) {
    out[0] = mat[12];
    out[1] = mat[13];
    out[2] = mat[14];
    return out;
  }
  function getScaling(out, mat) {
    var m11 = mat[0];
    var m12 = mat[1];
    var m13 = mat[2];
    var m21 = mat[4];
    var m22 = mat[5];
    var m23 = mat[6];
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
    out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
    out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
    return out;
  }
  function getRotation(out, mat) {
    var scaling = new ARRAY_TYPE(3);
    getScaling(scaling, mat);
    var is1 = 1 / scaling[0];
    var is2 = 1 / scaling[1];
    var is3 = 1 / scaling[2];
    var sm11 = mat[0] * is1;
    var sm12 = mat[1] * is2;
    var sm13 = mat[2] * is3;
    var sm21 = mat[4] * is1;
    var sm22 = mat[5] * is2;
    var sm23 = mat[6] * is3;
    var sm31 = mat[8] * is1;
    var sm32 = mat[9] * is2;
    var sm33 = mat[10] * is3;
    var trace = sm11 + sm22 + sm33;
    var S = 0;
    if (trace > 0) {
      S = Math.sqrt(trace + 1) * 2;
      out[3] = 0.25 * S;
      out[0] = (sm23 - sm32) / S;
      out[1] = (sm31 - sm13) / S;
      out[2] = (sm12 - sm21) / S;
    } else if (sm11 > sm22 && sm11 > sm33) {
      S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
      out[3] = (sm23 - sm32) / S;
      out[0] = 0.25 * S;
      out[1] = (sm12 + sm21) / S;
      out[2] = (sm31 + sm13) / S;
    } else if (sm22 > sm33) {
      S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
      out[3] = (sm31 - sm13) / S;
      out[0] = (sm12 + sm21) / S;
      out[1] = 0.25 * S;
      out[2] = (sm23 + sm32) / S;
    } else {
      S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
      out[3] = (sm12 - sm21) / S;
      out[0] = (sm31 + sm13) / S;
      out[1] = (sm23 + sm32) / S;
      out[2] = 0.25 * S;
    }
    return out;
  }
  function decompose(out_r, out_t, out_s, mat) {
    out_t[0] = mat[12];
    out_t[1] = mat[13];
    out_t[2] = mat[14];
    var m11 = mat[0];
    var m12 = mat[1];
    var m13 = mat[2];
    var m21 = mat[4];
    var m22 = mat[5];
    var m23 = mat[6];
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    out_s[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
    out_s[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
    out_s[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
    var is1 = 1 / out_s[0];
    var is2 = 1 / out_s[1];
    var is3 = 1 / out_s[2];
    var sm11 = m11 * is1;
    var sm12 = m12 * is2;
    var sm13 = m13 * is3;
    var sm21 = m21 * is1;
    var sm22 = m22 * is2;
    var sm23 = m23 * is3;
    var sm31 = m31 * is1;
    var sm32 = m32 * is2;
    var sm33 = m33 * is3;
    var trace = sm11 + sm22 + sm33;
    var S = 0;
    if (trace > 0) {
      S = Math.sqrt(trace + 1) * 2;
      out_r[3] = 0.25 * S;
      out_r[0] = (sm23 - sm32) / S;
      out_r[1] = (sm31 - sm13) / S;
      out_r[2] = (sm12 - sm21) / S;
    } else if (sm11 > sm22 && sm11 > sm33) {
      S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
      out_r[3] = (sm23 - sm32) / S;
      out_r[0] = 0.25 * S;
      out_r[1] = (sm12 + sm21) / S;
      out_r[2] = (sm31 + sm13) / S;
    } else if (sm22 > sm33) {
      S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
      out_r[3] = (sm31 - sm13) / S;
      out_r[0] = (sm12 + sm21) / S;
      out_r[1] = 0.25 * S;
      out_r[2] = (sm23 + sm32) / S;
    } else {
      S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
      out_r[3] = (sm12 - sm21) / S;
      out_r[0] = (sm31 + sm13) / S;
      out_r[1] = (sm23 + sm32) / S;
      out_r[2] = 0.25 * S;
    }
    return out_r;
  }
  function fromRotationTranslationScale(out, q, v, s) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    out[0] = (1 - (yy + zz)) * sx;
    out[1] = (xy + wz) * sx;
    out[2] = (xz - wy) * sx;
    out[3] = 0;
    out[4] = (xy - wz) * sy;
    out[5] = (1 - (xx + zz)) * sy;
    out[6] = (yz + wx) * sy;
    out[7] = 0;
    out[8] = (xz + wy) * sz;
    out[9] = (yz - wx) * sz;
    out[10] = (1 - (xx + yy)) * sz;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    var ox = o[0];
    var oy = o[1];
    var oz = o[2];
    var out0 = (1 - (yy + zz)) * sx;
    var out1 = (xy + wz) * sx;
    var out2 = (xz - wy) * sx;
    var out4 = (xy - wz) * sy;
    var out5 = (1 - (xx + zz)) * sy;
    var out6 = (yz + wx) * sy;
    var out8 = (xz + wy) * sz;
    var out9 = (yz - wx) * sz;
    var out10 = (1 - (xx + yy)) * sz;
    out[0] = out0;
    out[1] = out1;
    out[2] = out2;
    out[3] = 0;
    out[4] = out4;
    out[5] = out5;
    out[6] = out6;
    out[7] = 0;
    out[8] = out8;
    out[9] = out9;
    out[10] = out10;
    out[11] = 0;
    out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
    out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
    out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
    out[15] = 1;
    return out;
  }
  function fromQuat3(out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function frustum(out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left);
    var tb = 1 / (top - bottom);
    var nf = 1 / (near - far);
    out[0] = near * 2 * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = near * 2 * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near * 2 * nf;
    out[15] = 0;
    return out;
  }
  function perspectiveNO(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      var nf = 1 / (near - far);
      out[10] = (far + near) * nf;
      out[14] = 2 * far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -2 * near;
    }
    return out;
  }
  var perspective = perspectiveNO;
  function perspectiveZO(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      var nf = 1 / (near - far);
      out[10] = far * nf;
      out[14] = far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -near;
    }
    return out;
  }
  function perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov.upDegrees * Math.PI / 180);
    var downTan = Math.tan(fov.downDegrees * Math.PI / 180);
    var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180);
    var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180);
    var xScale = 2 / (leftTan + rightTan);
    var yScale = 2 / (upTan + downTan);
    out[0] = xScale;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = yScale;
    out[6] = 0;
    out[7] = 0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = (upTan - downTan) * yScale * 0.5;
    out[10] = far / (near - far);
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near / (near - far);
    out[15] = 0;
    return out;
  }
  function orthoNO(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }
  var ortho = orthoNO;
  function orthoZO(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = near * nf;
    out[15] = 1;
    return out;
  }
  function lookAt(out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len2;
    var eyex = eye[0];
    var eyey = eye[1];
    var eyez = eye[2];
    var upx = up[0];
    var upy = up[1];
    var upz = up[2];
    var centerx = center[0];
    var centery = center[1];
    var centerz = center[2];
    if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
      return identity2(out);
    }
    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len2 = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len2;
    z1 *= len2;
    z2 *= len2;
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len2 = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len2) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      len2 = 1 / len2;
      x0 *= len2;
      x1 *= len2;
      x2 *= len2;
    }
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len2 = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len2) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      len2 = 1 / len2;
      y0 *= len2;
      y1 *= len2;
      y2 *= len2;
    }
    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
  }
  function targetTo(out, eye, target, up) {
    var eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
    var z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
    var len2 = z0 * z0 + z1 * z1 + z2 * z2;
    if (len2 > 0) {
      len2 = 1 / Math.sqrt(len2);
      z0 *= len2;
      z1 *= len2;
      z2 *= len2;
    }
    var x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
    len2 = x0 * x0 + x1 * x1 + x2 * x2;
    if (len2 > 0) {
      len2 = 1 / Math.sqrt(len2);
      x0 *= len2;
      x1 *= len2;
      x2 *= len2;
    }
    out[0] = x0;
    out[1] = x1;
    out[2] = x2;
    out[3] = 0;
    out[4] = z1 * x2 - z2 * x1;
    out[5] = z2 * x0 - z0 * x2;
    out[6] = z0 * x1 - z1 * x0;
    out[7] = 0;
    out[8] = z0;
    out[9] = z1;
    out[10] = z2;
    out[11] = 0;
    out[12] = eyex;
    out[13] = eyey;
    out[14] = eyez;
    out[15] = 1;
    return out;
  }
  function str2(a) {
    return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
  }
  function frob2(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8] + a[9] * a[9] + a[10] * a[10] + a[11] * a[11] + a[12] * a[12] + a[13] * a[13] + a[14] * a[14] + a[15] * a[15]);
  }
  function add2(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
  }
  function subtract2(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
  }
  function multiplyScalar2(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
  }
  function multiplyScalarAndAdd2(out, a, b, scale4) {
    out[0] = a[0] + b[0] * scale4;
    out[1] = a[1] + b[1] * scale4;
    out[2] = a[2] + b[2] * scale4;
    out[3] = a[3] + b[3] * scale4;
    out[4] = a[4] + b[4] * scale4;
    out[5] = a[5] + b[5] * scale4;
    out[6] = a[6] + b[6] * scale4;
    out[7] = a[7] + b[7] * scale4;
    out[8] = a[8] + b[8] * scale4;
    out[9] = a[9] + b[9] * scale4;
    out[10] = a[10] + b[10] * scale4;
    out[11] = a[11] + b[11] * scale4;
    out[12] = a[12] + b[12] * scale4;
    out[13] = a[13] + b[13] * scale4;
    out[14] = a[14] + b[14] * scale4;
    out[15] = a[15] + b[15] * scale4;
    return out;
  }
  function exactEquals2(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
  }
  function equals3(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
    var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
    var a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    var b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
    var b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
    var b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1, Math.abs(a15), Math.abs(b15));
  }
  var mul2 = multiply2;
  var sub2 = subtract2;

  // node_modules/gl-matrix/esm/vec3.js
  var vec3_exports = {};
  __export(vec3_exports, {
    add: () => add3,
    angle: () => angle,
    bezier: () => bezier,
    ceil: () => ceil,
    clone: () => clone3,
    copy: () => copy3,
    create: () => create3,
    cross: () => cross,
    dist: () => dist,
    distance: () => distance,
    div: () => div,
    divide: () => divide,
    dot: () => dot,
    equals: () => equals4,
    exactEquals: () => exactEquals3,
    floor: () => floor,
    forEach: () => forEach,
    fromValues: () => fromValues3,
    hermite: () => hermite,
    inverse: () => inverse,
    len: () => len,
    length: () => length,
    lerp: () => lerp4,
    max: () => max,
    min: () => min,
    mul: () => mul3,
    multiply: () => multiply3,
    negate: () => negate,
    normalize: () => normalize,
    random: () => random,
    rotateX: () => rotateX2,
    rotateY: () => rotateY2,
    rotateZ: () => rotateZ2,
    round: () => round2,
    scale: () => scale3,
    scaleAndAdd: () => scaleAndAdd,
    set: () => set3,
    slerp: () => slerp,
    sqrDist: () => sqrDist,
    sqrLen: () => sqrLen,
    squaredDistance: () => squaredDistance,
    squaredLength: () => squaredLength,
    str: () => str3,
    sub: () => sub3,
    subtract: () => subtract3,
    transformMat3: () => transformMat3,
    transformMat4: () => transformMat4,
    transformQuat: () => transformQuat,
    zero: () => zero2
  });
  function create3() {
    var out = new ARRAY_TYPE(3);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    return out;
  }
  function clone3(a) {
    var out = new ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function length(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function fromValues3(x, y, z) {
    var out = new ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function copy3(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function set3(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function add3(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }
  function subtract3(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }
  function multiply3(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  }
  function divide(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
  }
  function ceil(out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    return out;
  }
  function floor(out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    return out;
  }
  function min(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
  }
  function max(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
  }
  function round2(out, a) {
    out[0] = round(a[0]);
    out[1] = round(a[1]);
    out[2] = round(a[2]);
    return out;
  }
  function scale3(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
  }
  function scaleAndAdd(out, a, b, scale4) {
    out[0] = a[0] + b[0] * scale4;
    out[1] = a[1] + b[1] * scale4;
    out[2] = a[2] + b[2] * scale4;
    return out;
  }
  function distance(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function squaredDistance(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return x * x + y * y + z * z;
  }
  function squaredLength(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return x * x + y * y + z * z;
  }
  function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  }
  function inverse(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    out[2] = 1 / a[2];
    return out;
  }
  function normalize(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var len2 = x * x + y * y + z * z;
    if (len2 > 0) {
      len2 = 1 / Math.sqrt(len2);
    }
    out[0] = a[0] * len2;
    out[1] = a[1] * len2;
    out[2] = a[2] * len2;
    return out;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2];
    var bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  function lerp4(out, a, b, t) {
    var ax = a[0];
    var ay = a[1];
    var az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
  }
  function slerp(out, a, b, t) {
    var angle2 = Math.acos(Math.min(Math.max(dot(a, b), -1), 1));
    var sinTotal = Math.sin(angle2);
    var ratioA = Math.sin((1 - t) * angle2) / sinTotal;
    var ratioB = Math.sin(t * angle2) / sinTotal;
    out[0] = ratioA * a[0] + ratioB * b[0];
    out[1] = ratioA * a[1] + ratioB * b[1];
    out[2] = ratioA * a[2] + ratioB * b[2];
    return out;
  }
  function hermite(out, a, b, c, d, t) {
    var factorTimes2 = t * t;
    var factor1 = factorTimes2 * (2 * t - 3) + 1;
    var factor2 = factorTimes2 * (t - 2) + t;
    var factor3 = factorTimes2 * (t - 1);
    var factor4 = factorTimes2 * (3 - 2 * t);
    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
    return out;
  }
  function bezier(out, a, b, c, d, t) {
    var inverseFactor = 1 - t;
    var inverseFactorTimesTwo = inverseFactor * inverseFactor;
    var factorTimes2 = t * t;
    var factor1 = inverseFactorTimesTwo * inverseFactor;
    var factor2 = 3 * t * inverseFactorTimesTwo;
    var factor3 = 3 * factorTimes2 * inverseFactor;
    var factor4 = factorTimes2 * t;
    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
    return out;
  }
  function random(out, scale4) {
    scale4 = scale4 === void 0 ? 1 : scale4;
    var r = RANDOM() * 2 * Math.PI;
    var z = RANDOM() * 2 - 1;
    var zScale = Math.sqrt(1 - z * z) * scale4;
    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale4;
    return out;
  }
  function transformMat4(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    var w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
  }
  function transformMat3(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  }
  function transformQuat(out, a, q) {
    var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    var vx = a[0], vy = a[1], vz = a[2];
    var tx = qy * vz - qz * vy;
    var ty = qz * vx - qx * vz;
    var tz = qx * vy - qy * vx;
    tx = tx + tx;
    ty = ty + ty;
    tz = tz + tz;
    out[0] = vx + qw * tx + qy * tz - qz * ty;
    out[1] = vy + qw * ty + qz * tx - qx * tz;
    out[2] = vz + qw * tz + qx * ty - qy * tx;
    return out;
  }
  function rotateX2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0];
    r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
    r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function rotateY2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
    r[1] = p[1];
    r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function rotateZ2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
    r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
    r[2] = p[2];
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function angle(a, b) {
    var ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2], mag = Math.sqrt((ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz)), cosine = mag && dot(a, b) / mag;
    return Math.acos(Math.min(Math.max(cosine, -1), 1));
  }
  function zero2(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
  }
  function str3(a) {
    return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
  }
  function exactEquals3(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  function equals4(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2];
    var b0 = b[0], b1 = b[1], b2 = b[2];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2));
  }
  var sub3 = subtract3;
  var mul3 = multiply3;
  var div = divide;
  var dist = distance;
  var sqrDist = squaredDistance;
  var len = length;
  var sqrLen = squaredLength;
  var forEach = (function() {
    var vec = create3();
    return function(a, stride, offset, count, fn, arg) {
      var i, l;
      if (!stride) {
        stride = 3;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
      }
      return a;
    };
  })();

  // node_modules/deepslate/lib/math/Matrix3.js
  var Matrix3 = class _Matrix3 {
    data;
    constructor(data) {
      this.data = data ?? mat3_exports.create();
    }
    static fromMatrix4(source) {
      return new _Matrix3(mat3_exports.fromMat4(mat3_exports.create(), source.data));
    }
    static fromQuat(source) {
      return new _Matrix3(mat3_exports.fromQuat(mat3_exports.create(), source));
    }
    clone() {
      return new _Matrix3(mat3_exports.clone(this.data));
    }
    copy(other) {
      mat3_exports.copy(this.data, other.data);
      return this;
    }
    translate(a) {
      mat3_exports.translate(this.data, this.data, Array.isArray(a) ? a : [a.x, a.y]);
      return this;
    }
    scale(a) {
      if (typeof a === "number") {
        mat3_exports.multiplyScalar(this.data, this.data, a);
      } else {
        mat3_exports.scale(this.data, this.data, Array.isArray(a) ? a : [a.x, a.y]);
      }
      return this;
    }
    add(other) {
      mat3_exports.add(this.data, this.data, other.data);
      return this;
    }
    sub(other) {
      mat3_exports.sub(this.data, this.data, other.data);
      return this;
    }
    mul(other) {
      mat3_exports.mul(this.data, this.data, other.data);
      return this;
    }
    transpose() {
      mat3_exports.transpose(this.data, this.data);
      return this;
    }
    invert() {
      mat3_exports.invert(this.data, this.data);
      return this;
    }
    get m00() {
      return this.data[0];
    }
    get m01() {
      return this.data[1];
    }
    get m02() {
      return this.data[2];
    }
    get m10() {
      return this.data[3];
    }
    get m11() {
      return this.data[4];
    }
    get m12() {
      return this.data[5];
    }
    get m20() {
      return this.data[6];
    }
    get m21() {
      return this.data[7];
    }
    get m22() {
      return this.data[8];
    }
    set m00(x) {
      this.data[0] = x;
    }
    set m01(x) {
      this.data[1] = x;
    }
    set m02(x) {
      this.data[2] = x;
    }
    set m10(x) {
      this.data[3] = x;
    }
    set m11(x) {
      this.data[4] = x;
    }
    set m12(x) {
      this.data[5] = x;
    }
    set m20(x) {
      this.data[6] = x;
    }
    set m21(x) {
      this.data[7] = x;
    }
    set m22(x) {
      this.data[8] = x;
    }
    toString() {
      return mat3_exports.str(this.data);
    }
  };

  // node_modules/deepslate/lib/math/Vector.js
  var Vector = class _Vector {
    x;
    y;
    z;
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    lengthSquared() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    distance(other) {
      return this.sub(other).length();
    }
    distanceSquared(other) {
      return this.sub(other).lengthSquared();
    }
    abs() {
      return new _Vector(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
    }
    add(other) {
      return new _Vector(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    sub(other) {
      return new _Vector(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    mul(other) {
      return new _Vector(this.x * other.x, this.y * other.y, this.z * other.z);
    }
    div(other) {
      return new _Vector(this.x / other.x, this.y / other.y, this.z / other.z);
    }
    scale(n) {
      return new _Vector(this.x * n, this.y * n, this.z * n);
    }
    dot(other) {
      return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    cross(other) {
      const x = this.y * other.z - this.z * other.y;
      const y = this.z * other.x - this.x * other.z;
      const z = this.x * other.y - this.y * other.x;
      return new _Vector(x, y, z);
    }
    normalize() {
      if (this.x == 0 && this.y == 0 && this.z == 0) {
        return this;
      }
      const r = 1 / this.length();
      return new _Vector(this.x * r, this.y * r, this.z * r);
    }
    components() {
      return [this.x, this.y, this.z];
    }
    toString() {
      return `[${this.x} ${this.y} ${this.z}]`;
    }
  };

  // node_modules/deepslate/lib/math/Matrix4.js
  var Matrix4 = class _Matrix4 {
    data;
    constructor(data) {
      this.data = data ?? mat4_exports.create();
    }
    static fromQuat(source) {
      return new _Matrix4(mat4_exports.fromQuat(mat4_exports.create(), source));
    }
    clone() {
      return new _Matrix4(mat4_exports.clone(this.data));
    }
    translate(a) {
      mat4_exports.translate(this.data, this.data, Array.isArray(a) ? a : a.components());
      return this;
    }
    scale(a) {
      if (typeof a === "number") {
        mat4_exports.multiplyScalar(this.data, this.data, a);
      } else {
        mat4_exports.scale(this.data, this.data, Array.isArray(a) ? a : a.components());
      }
      return this;
    }
    add(other) {
      mat4_exports.add(this.data, this.data, other.data);
      return this;
    }
    sub(other) {
      mat4_exports.sub(this.data, this.data, other.data);
      return this;
    }
    mul(other) {
      mat4_exports.mul(this.data, this.data, other.data);
      return this;
    }
    transpose() {
      mat4_exports.transpose(this.data, this.data);
      return this;
    }
    invert() {
      mat4_exports.invert(this.data, this.data);
      return this;
    }
    affine() {
      return this.scale(1 / this.m33);
    }
    get m00() {
      return this.data[0];
    }
    get m01() {
      return this.data[1];
    }
    get m02() {
      return this.data[2];
    }
    get m03() {
      return this.data[3];
    }
    get m10() {
      return this.data[4];
    }
    get m11() {
      return this.data[5];
    }
    get m12() {
      return this.data[6];
    }
    get m13() {
      return this.data[7];
    }
    get m20() {
      return this.data[8];
    }
    get m21() {
      return this.data[9];
    }
    get m22() {
      return this.data[10];
    }
    get m23() {
      return this.data[11];
    }
    get m30() {
      return this.data[12];
    }
    get m31() {
      return this.data[13];
    }
    get m32() {
      return this.data[14];
    }
    get m33() {
      return this.data[15];
    }
    set m00(x) {
      this.data[0] = x;
    }
    set m01(x) {
      this.data[1] = x;
    }
    set m02(x) {
      this.data[2] = x;
    }
    set m03(x) {
      this.data[3] = x;
    }
    set m10(x) {
      this.data[4] = x;
    }
    set m11(x) {
      this.data[5] = x;
    }
    set m12(x) {
      this.data[6] = x;
    }
    set m13(x) {
      this.data[7] = x;
    }
    set m20(x) {
      this.data[8] = x;
    }
    set m21(x) {
      this.data[9] = x;
    }
    set m22(x) {
      this.data[10] = x;
    }
    set m23(x) {
      this.data[11] = x;
    }
    set m30(x) {
      this.data[12] = x;
    }
    set m31(x) {
      this.data[13] = x;
    }
    set m32(x) {
      this.data[14] = x;
    }
    set m33(x) {
      this.data[15] = x;
    }
    getTranslation() {
      const [x, y, z] = mat4_exports.getTranslation(vec3_exports.create(), this.data);
      return new Vector(x, y, z);
    }
    toString() {
      return mat4_exports.str(this.data);
    }
  };

  // node_modules/deepslate/lib/math/random/LegacyRandom.js
  var import_md5 = __toESM(require_md5(), 1);
  var LegacyRandom = class _LegacyRandom {
    static MODULUS_BITS = 48;
    static MODULUS_MASK = BigInt("281474976710655");
    static MULTIPLIER = BigInt("25214903917");
    static INCREMENT = BigInt("11");
    static FLOAT_MULTIPLIER = 1 / Math.pow(2, 24);
    static DOUBLE_MULTIPLIER = 1 / Math.pow(2, 30);
    seed = BigInt(0);
    constructor(seed) {
      this.setSeed(seed);
    }
    static fromLargeFeatureSeed(worldSeed, x, z) {
      const random2 = new _LegacyRandom(worldSeed);
      const a = random2.nextLong();
      const b = random2.nextLong();
      const seed = BigInt(x) * a ^ BigInt(z) * b ^ worldSeed;
      random2.setSeed(seed);
      return random2;
    }
    static fromLargeFeatureWithSalt(worldSeed, x, z, salt) {
      const seed = BigInt(x) * BigInt("341873128712") + BigInt(z) * BigInt("132897987541") + worldSeed + BigInt(salt);
      return new _LegacyRandom(seed);
    }
    fork() {
      return new _LegacyRandom(this.nextLong());
    }
    forkPositional() {
      return new LegacyPositionalRandom(this.nextLong());
    }
    setSeed(seed) {
      this.seed = (seed ^ _LegacyRandom.MULTIPLIER) & _LegacyRandom.MODULUS_MASK;
    }
    advance() {
      this.seed = this.seed * _LegacyRandom.MULTIPLIER + _LegacyRandom.INCREMENT & _LegacyRandom.MODULUS_MASK;
    }
    consume(count) {
      for (let i = 0; i < count; i += 1) {
        this.advance();
      }
    }
    next(bits) {
      this.advance();
      const out = Number(this.seed >> BigInt(_LegacyRandom.MODULUS_BITS - bits));
      return out > 2147483647 ? out - 4294967296 : out;
    }
    nextInt(max2) {
      if (max2 === void 0) {
        return this.next(32);
      }
      if ((max2 & max2 - 1) == 0) {
        return Number(BigInt(max2) * BigInt(this.next(31)) >> BigInt(31));
      }
      let a, b;
      while ((a = this.next(31)) - (b = a % max2) + (max2 - 1) < 0) {
      }
      return b;
    }
    nextLong() {
      return (BigInt(this.next(32)) << BigInt(32)) + BigInt(this.next(32));
    }
    nextFloat() {
      return this.next(24) * _LegacyRandom.FLOAT_MULTIPLIER;
    }
    nextDouble() {
      const a = this.next(30);
      this.advance();
      return a * _LegacyRandom.DOUBLE_MULTIPLIER;
    }
  };
  var LegacyPositionalRandom = class {
    seed;
    constructor(seed) {
      this.seed = seed;
    }
    at(x, y, z) {
      const seed = getSeed(x, y, z);
      return new LegacyRandom(seed ^ this.seed);
    }
    fromHashOf(name) {
      const hash = (0, import_md5.default)(name, { asBytes: true });
      const seed = longfromBytes(hash[0], hash[1], hash[2], hash[3], hash[4], hash[5], hash[6], hash[7]);
      return new LegacyRandom(seed ^ this.seed);
    }
    seedKey() {
      return [this.seed, BigInt(0)];
    }
  };

  // node_modules/deepslate/lib/math/random/XoroshiroRandom.js
  var import_md52 = __toESM(require_md5(), 1);
  var XoroshiroRandom = class _XoroshiroRandom {
    static SILVER_RATIO_64 = BigInt("7640891576956012809");
    static GOLDEN_RATIO_64 = BigInt("-7046029254386353131");
    static FLOAT_MULTIPLIER = 1 / Math.pow(2, 24);
    static DOUBLE_MULTIPLIER = 11102230246251565e-32;
    static BIGINT_1 = BigInt(1);
    static BIGINT_17 = BigInt(17);
    static BIGINT_21 = BigInt(21);
    static BIGINT_27 = BigInt(27);
    static BIGINT_28 = BigInt(28);
    static BIGINT_30 = BigInt(30);
    static BIGINT_31 = BigInt(31);
    static BIGINT_32 = BigInt(32);
    static BIGINT_49 = BigInt(49);
    static BIGINT_64 = BigInt(64);
    static STAFFORD_1 = BigInt("-4658895280553007687");
    static STAFFORD_2 = BigInt("-7723592293110705685");
    static MAX_ULONG = BigInt("0xFFFFFFFFFFFFFFFF");
    static POW2_60 = BigInt("0x10000000000000000");
    static POW2_63 = BigInt("0x8000000000000000");
    static MAX_UINT = BigInt(4294967295);
    seed = [BigInt(0), BigInt(0)];
    constructor(seed) {
      this.seed = seed;
    }
    static create(seed) {
      return new _XoroshiroRandom(_XoroshiroRandom.upgradeSeedTo128bit(seed));
    }
    static mixStafford13(value) {
      value = (value ^ value >> _XoroshiroRandom.BIGINT_30) * _XoroshiroRandom.STAFFORD_1 & _XoroshiroRandom.MAX_ULONG;
      value = (value ^ value >> _XoroshiroRandom.BIGINT_27) * _XoroshiroRandom.STAFFORD_2 & _XoroshiroRandom.MAX_ULONG;
      return (value ^ value >> _XoroshiroRandom.BIGINT_31) & _XoroshiroRandom.MAX_ULONG;
    }
    static upgradeSeedTo128bit(seed) {
      if (seed < 0) {
        seed += _XoroshiroRandom.POW2_60;
      }
      const seedLo = seed ^ _XoroshiroRandom.SILVER_RATIO_64;
      const seedHi = seedLo + _XoroshiroRandom.GOLDEN_RATIO_64 & _XoroshiroRandom.MAX_ULONG;
      return [_XoroshiroRandom.mixStafford13(seedLo), _XoroshiroRandom.mixStafford13(seedHi)];
    }
    static rotateLeft(value, shift) {
      return value << shift & _XoroshiroRandom.MAX_ULONG | value >> _XoroshiroRandom.BIGINT_64 - shift;
    }
    setSeed(seed) {
      this.seed = _XoroshiroRandom.upgradeSeedTo128bit(seed);
    }
    fork() {
      return new _XoroshiroRandom([this.next(), this.next()]);
    }
    forkPositional() {
      return new XoroshiroPositionalRandom(this.next(), this.next());
    }
    next() {
      const seedLo = this.seed[0];
      let seedHi = this.seed[1];
      const value = _XoroshiroRandom.rotateLeft(seedLo + seedHi & _XoroshiroRandom.MAX_ULONG, _XoroshiroRandom.BIGINT_17) + seedLo & _XoroshiroRandom.MAX_ULONG;
      seedHi ^= seedLo;
      this.seed = [
        _XoroshiroRandom.rotateLeft(seedLo, _XoroshiroRandom.BIGINT_49) ^ seedHi ^ seedHi << _XoroshiroRandom.BIGINT_21 & _XoroshiroRandom.MAX_ULONG,
        _XoroshiroRandom.rotateLeft(seedHi, _XoroshiroRandom.BIGINT_28)
      ];
      return value;
    }
    nextLong() {
      let value = this.next();
      if (value > _XoroshiroRandom.POW2_63)
        value -= _XoroshiroRandom.POW2_60;
      return value;
    }
    consume(count) {
      let seedLo = this.seed[0];
      let seedHi = this.seed[1];
      for (let i = 0; i < count; i += 1) {
        seedHi ^= seedLo;
        seedLo = _XoroshiroRandom.rotateLeft(seedLo, _XoroshiroRandom.BIGINT_49) ^ seedHi ^ seedHi << _XoroshiroRandom.BIGINT_21;
        seedHi = _XoroshiroRandom.rotateLeft(seedHi, _XoroshiroRandom.BIGINT_28);
      }
      this.seed = [seedLo, seedHi];
    }
    nextBits(bits) {
      return this.next() >> BigInt(64 - bits);
    }
    nextInt(max2) {
      let value = this.next() & _XoroshiroRandom.MAX_UINT;
      if (!max2) {
        let result = Number(value);
        if (result >= 2147483648) {
          result -= 4294967296;
        }
        return result;
      } else {
        const maxBigint = BigInt(max2);
        let product = value * maxBigint;
        let productLo = product & _XoroshiroRandom.MAX_UINT;
        if (productLo < maxBigint) {
          const newMax = ((~maxBigint & _XoroshiroRandom.MAX_UINT) + _XoroshiroRandom.BIGINT_1) % maxBigint;
          while (productLo < newMax) {
            value = this.next() & _XoroshiroRandom.MAX_UINT;
            product = value * maxBigint;
            productLo = product & _XoroshiroRandom.MAX_UINT;
          }
        }
        const productHi = product >> _XoroshiroRandom.BIGINT_32;
        return Number(productHi);
      }
    }
    nextFloat() {
      return Number(this.nextBits(24)) * _XoroshiroRandom.FLOAT_MULTIPLIER;
    }
    nextDouble() {
      return Number(this.nextBits(53)) * _XoroshiroRandom.DOUBLE_MULTIPLIER;
    }
    parityConfigString() {
      return "seedLo: " + this.seed[0] + ", seedHi: " + this.seed[1];
    }
  };
  var XoroshiroPositionalRandom = class {
    seedLo;
    seedHi;
    constructor(seedLo, seedHi) {
      this.seedLo = seedLo;
      this.seedHi = seedHi;
    }
    at(x, y, z) {
      const positionSeed = getSeed(x, y, z);
      const seedLo = positionSeed ^ this.seedLo;
      return new XoroshiroRandom([seedLo, this.seedHi]);
    }
    fromHashOf(name) {
      const hash = (0, import_md52.default)(name, { asBytes: true });
      const lo = longfromBytes(hash[0], hash[1], hash[2], hash[3], hash[4], hash[5], hash[6], hash[7]);
      const hi = longfromBytes(hash[8], hash[9], hash[10], hash[11], hash[12], hash[13], hash[14], hash[15]);
      return new XoroshiroRandom([lo ^ this.seedLo, hi ^ this.seedHi]);
    }
    seedKey() {
      return [this.seedLo, this.seedHi];
    }
  };

  // node_modules/deepslate/lib/math/noise/SimplexNoise.js
  var SimplexNoise = class _SimplexNoise {
    static GRADIENT = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1], [1, 1, 0], [0, -1, 1], [-1, 1, 0], [0, -1, -1]];
    static F2 = 0.5 * (Math.sqrt(3) - 1);
    static G2 = (3 - Math.sqrt(3)) / 6;
    p;
    xo;
    yo;
    zo;
    constructor(random2) {
      this.xo = random2.nextDouble() * 256;
      this.yo = random2.nextDouble() * 256;
      this.zo = random2.nextDouble() * 256;
      this.p = Array(256);
      for (let i = 0; i < 256; i += 1) {
        this.p[i] = i;
      }
      for (let i = 0; i < 256; i += 1) {
        const j = random2.nextInt(256 - i);
        const b = this.p[i];
        this.p[i] = this.p[i + j];
        this.p[i + j] = b;
      }
    }
    sample2D(d, d2) {
      const d6 = (d + d2) * _SimplexNoise.F2;
      const n4 = intFloor(d + d6);
      const n3 = intFloor(d2 + d6);
      const d3 = (n4 + n3) * _SimplexNoise.G2;
      const d7 = n4 - d3;
      const d8 = d - d7;
      let a;
      let b;
      const d4 = d2 - (n3 - d3);
      if (d8 > d4) {
        a = 1;
        b = 0;
      } else {
        a = 0;
        b = 1;
      }
      const d9 = d8 - a + _SimplexNoise.G2;
      const d10 = d4 - b + _SimplexNoise.G2;
      const d11 = d8 - 1 + 2 * _SimplexNoise.G2;
      const d12 = d4 - 1 + 2 * _SimplexNoise.G2;
      const n5 = n4 & 255;
      const n6 = n3 & 255;
      const n7 = this.P(n5 + this.P(n6)) % 12;
      const n8 = this.P(n5 + a + this.P(n6 + b)) % 12;
      const n9 = this.P(n5 + 1 + this.P(n6 + 1)) % 12;
      const d13 = this.getCornerNoise3D(n7, d8, d4, 0, 0.5);
      const d14 = this.getCornerNoise3D(n8, d9, d10, 0, 0.5);
      const d15 = this.getCornerNoise3D(n9, d11, d12, 0, 0.5);
      return 70 * (d13 + d14 + d15);
    }
    sample(x, y, z) {
      const d5 = (x + y + z) * 0.3333333333333333;
      const x2 = intFloor(x + d5);
      const y2 = intFloor(y + d5);
      const z2 = intFloor(z + d5);
      const d7 = (x2 + y2 + z2) * 0.16666666666666666;
      const x3 = x - (x2 - d7);
      const y3 = y - (y2 - d7);
      const z3 = z - (z2 - d7);
      let a;
      let b;
      let c;
      let d;
      let e;
      let f;
      if (x3 >= y3) {
        if (y3 >= z3) {
          a = 1;
          b = 0;
          c = 0;
          d = 1;
          e = 1;
          f = 0;
        } else if (x3 >= z3) {
          a = 1;
          b = 0;
          c = 0;
          d = 1;
          e = 0;
          f = 1;
        } else {
          a = 0;
          b = 0;
          c = 1;
          d = 1;
          e = 0;
          f = 1;
        }
      } else if (y3 < z3) {
        a = 0;
        b = 0;
        c = 1;
        d = 0;
        e = 1;
        f = 1;
      } else if (x3 < z3) {
        a = 0;
        b = 1;
        c = 0;
        d = 0;
        e = 1;
        f = 1;
      } else {
        a = 0;
        b = 1;
        c = 0;
        d = 1;
        e = 1;
        f = 0;
      }
      const x4 = x3 - a + 0.16666666666666666;
      const y4 = y3 - b + 0.16666666666666666;
      const z4 = z3 - c + 0.16666666666666666;
      const x5 = x3 - d + 0.3333333333333333;
      const y5 = y3 - e + 0.3333333333333333;
      const z5 = z3 - f + 0.3333333333333333;
      const x6 = x3 - 0.5;
      const y6 = y3 - 0.5;
      const z6 = z3 - 0.5;
      const x7 = x2 & 255;
      const y7 = y2 & 255;
      const z7 = z2 & 255;
      const g = this.P(x7 + this.P(y7 + this.P(z7))) % 12;
      const h = this.P(x7 + a + this.P(y7 + b + this.P(z7 + c))) % 12;
      const i = this.P(x7 + d + this.P(y7 + e + this.P(z7 + f))) % 12;
      const j = this.P(x7 + 1 + this.P(y7 + 1 + this.P(z7 + 1))) % 12;
      const k = this.getCornerNoise3D(g, x3, y3, z3, 0.6);
      const l = this.getCornerNoise3D(h, x4, y4, z4, 0.6);
      const m = this.getCornerNoise3D(i, x5, y5, z5, 0.6);
      const n = this.getCornerNoise3D(j, x6, y6, z6, 0.6);
      return 32 * (k + l + m + n);
    }
    P(i) {
      return this.p[i & 255];
    }
    getCornerNoise3D(i, a, b, c, d) {
      let f;
      let e = d - a * a - b * b - c * c;
      if (e < 0) {
        f = 0;
      } else {
        e *= e;
        f = e * e * _SimplexNoise.gradDot(i, a, b, c);
      }
      return f;
    }
    static gradDot(a, b, c, d) {
      const grad = _SimplexNoise.GRADIENT[a & 15];
      return grad[0] * b + grad[1] * c + grad[2] * d;
    }
  };

  // node_modules/deepslate/lib/math/noise/ImprovedNoise.js
  var ImprovedNoise = class {
    p;
    xo;
    yo;
    zo;
    constructor(random2) {
      this.xo = random2.nextDouble() * 256;
      this.yo = random2.nextDouble() * 256;
      this.zo = random2.nextDouble() * 256;
      this.p = Array(256);
      for (let i = 0; i < 256; i += 1) {
        this.p[i] = i > 127 ? i - 256 : i;
      }
      for (let i = 0; i < 256; i += 1) {
        const j = random2.nextInt(256 - i);
        const b = this.p[i];
        this.p[i] = this.p[i + j];
        this.p[i + j] = b;
      }
    }
    sample(x, y, z, yScale = 0, yLimit = 0) {
      const x2 = x + this.xo;
      const y2 = y + this.yo;
      const z2 = z + this.zo;
      const x3 = intFloor(x2);
      const y3 = intFloor(y2);
      const z3 = intFloor(z2);
      const x4 = x2 - x3;
      const y4 = y2 - y3;
      const z4 = z2 - z3;
      let y6 = 0;
      if (yScale !== 0) {
        const t = yLimit >= 0 && yLimit < y4 ? yLimit : y4;
        y6 = intFloor(t / yScale + 1e-7) * yScale;
      }
      return this.sampleAndLerp(x3, y3, z3, x4, y4 - y6, z4, y4);
    }
    sampleAndLerp(a, b, c, d, e, f, g) {
      const h = this.P(a);
      const i = this.P(a + 1);
      const j = this.P(h + b);
      const k = this.P(h + b + 1);
      const l = this.P(i + b);
      const m = this.P(i + b + 1);
      const n = SimplexNoise.gradDot(this.P(j + c), d, e, f);
      const o = SimplexNoise.gradDot(this.P(l + c), d - 1, e, f);
      const p = SimplexNoise.gradDot(this.P(k + c), d, e - 1, f);
      const q = SimplexNoise.gradDot(this.P(m + c), d - 1, e - 1, f);
      const r = SimplexNoise.gradDot(this.P(j + c + 1), d, e, f - 1);
      const s = SimplexNoise.gradDot(this.P(l + c + 1), d - 1, e, f - 1);
      const t = SimplexNoise.gradDot(this.P(k + c + 1), d, e - 1, f - 1);
      const u = SimplexNoise.gradDot(this.P(m + c + 1), d - 1, e - 1, f - 1);
      const v = smoothstep(d);
      const w = smoothstep(g);
      const x = smoothstep(f);
      return lerp3(v, w, x, n, o, p, q, r, s, t, u);
    }
    P(i) {
      return this.p[i & 255] & 255;
    }
  };

  // node_modules/deepslate/lib/math/noise/PerlinNoise.js
  var PerlinNoise = class _PerlinNoise {
    noiseLevels;
    amplitudes;
    lowestFreqInputFactor;
    lowestFreqValueFactor;
    maxValue;
    constructor(random2, firstOctave, amplitudes, forceLegacy = false) {
      if (random2 instanceof XoroshiroRandom && !forceLegacy) {
        const forkedRandom = random2.forkPositional();
        this.noiseLevels = Array(amplitudes.length);
        for (let i = 0; i < amplitudes.length; i++) {
          if (amplitudes[i] !== 0) {
            const octave = firstOctave + i;
            this.noiseLevels[i] = new ImprovedNoise(forkedRandom.fromHashOf("octave_" + octave));
          }
        }
      } else {
        if (1 - firstOctave < amplitudes.length) {
          throw new Error("Positive octaves are not allowed when using LegacyRandom");
        }
        this.noiseLevels = Array(amplitudes.length);
        for (let i = -firstOctave; i >= 0; i -= 1) {
          if (i < amplitudes.length && amplitudes[i] !== 0) {
            this.noiseLevels[i] = new ImprovedNoise(random2);
          } else {
            random2.consume(262);
          }
        }
      }
      this.amplitudes = amplitudes;
      this.lowestFreqInputFactor = Math.pow(2, firstOctave);
      this.lowestFreqValueFactor = Math.pow(2, amplitudes.length - 1) / (Math.pow(2, amplitudes.length) - 1);
      this.maxValue = this.edgeValue(2);
    }
    sample(x, y, z, yScale = 0, yLimit = 0, fixY = false) {
      let value = 0;
      let inputF = this.lowestFreqInputFactor;
      let valueF = this.lowestFreqValueFactor;
      for (let i = 0; i < this.noiseLevels.length; i += 1) {
        const noise = this.noiseLevels[i];
        if (noise) {
          value += this.amplitudes[i] * valueF * noise.sample(_PerlinNoise.wrap(x * inputF), fixY ? -noise.yo : _PerlinNoise.wrap(y * inputF), _PerlinNoise.wrap(z * inputF), yScale * inputF, yLimit * inputF);
        }
        inputF *= 2;
        valueF /= 2;
      }
      return value;
    }
    getOctaveNoise(i) {
      return this.noiseLevels[this.noiseLevels.length - 1 - i];
    }
    edgeValue(x) {
      let value = 0;
      let valueF = this.lowestFreqValueFactor;
      for (let i = 0; i < this.noiseLevels.length; i += 1) {
        if (this.noiseLevels[i]) {
          value += this.amplitudes[i] * x * valueF;
        }
        valueF /= 2;
      }
      return value;
    }
    static wrap(value) {
      return value - longFloor(value / 33554432 + 0.5) * 33554432;
    }
  };

  // node_modules/deepslate/lib/math/noise/BlendedNoise.js
  var BlendedNoise = class {
    xzScale;
    yScale;
    xzFactor;
    yFactor;
    smearScaleMultiplier;
    minLimitNoise;
    maxLimitNoise;
    mainNoise;
    xzMultiplier;
    yMultiplier;
    maxValue;
    constructor(random2, xzScale, yScale, xzFactor, yFactor, smearScaleMultiplier) {
      this.xzScale = xzScale;
      this.yScale = yScale;
      this.xzFactor = xzFactor;
      this.yFactor = yFactor;
      this.smearScaleMultiplier = smearScaleMultiplier;
      this.minLimitNoise = new PerlinNoise(random2, -15, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], true);
      this.maxLimitNoise = new PerlinNoise(random2, -15, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], true);
      this.mainNoise = new PerlinNoise(random2, -7, [1, 1, 1, 1, 1, 1, 1, 1], true);
      this.xzMultiplier = 684.412 * xzScale;
      this.yMultiplier = 684.412 * yScale;
      this.maxValue = this.minLimitNoise.edgeValue(this.yMultiplier + 2);
    }
    sample(x, y, z) {
      const scaledX = x * this.xzMultiplier;
      const scaledY = y * this.yMultiplier;
      const scaledZ = z * this.xzMultiplier;
      const factoredX = scaledX / this.xzFactor;
      const factoredY = scaledY / this.yFactor;
      const factoredZ = scaledZ / this.xzFactor;
      const smear = this.yMultiplier * this.smearScaleMultiplier;
      const factoredSmear = smear / this.yFactor;
      let noise;
      let value = 0;
      let factor = 1;
      for (let i = 0; i < 8; i += 1) {
        noise = this.mainNoise.getOctaveNoise(i);
        if (noise) {
          const xx = PerlinNoise.wrap(factoredX * factor);
          const yy = PerlinNoise.wrap(factoredY * factor);
          const zz = PerlinNoise.wrap(factoredZ * factor);
          value += noise.sample(xx, yy, zz, factoredSmear * factor, factoredY * factor) / factor;
        }
        factor /= 2;
      }
      value = (value / 10 + 1) / 2;
      factor = 1;
      let min2 = 0;
      let max2 = 0;
      for (let i = 0; i < 16; i += 1) {
        const xx = PerlinNoise.wrap(scaledX * factor);
        const yy = PerlinNoise.wrap(scaledY * factor);
        const zz = PerlinNoise.wrap(scaledZ * factor);
        const smearsmear = smear * factor;
        if (value < 1 && (noise = this.minLimitNoise.getOctaveNoise(i))) {
          min2 += noise.sample(xx, yy, zz, smearsmear, scaledY * factor) / factor;
        }
        if (value > 0 && (noise = this.maxLimitNoise.getOctaveNoise(i))) {
          max2 += noise.sample(xx, yy, zz, smearsmear, scaledY * factor) / factor;
        }
        factor /= 2;
      }
      return clampedLerp(min2 / 512, max2 / 512, value) / 128;
    }
  };

  // node_modules/deepslate/lib/math/noise/NormalNoise.js
  var NormalNoise = class _NormalNoise {
    static INPUT_FACTOR = 1.0181268882175227;
    valueFactor;
    first;
    second;
    maxValue;
    constructor(random2, { firstOctave, amplitudes }) {
      this.first = new PerlinNoise(random2, firstOctave, amplitudes);
      this.second = new PerlinNoise(random2, firstOctave, amplitudes);
      let min2 = Infinity;
      let max2 = -Infinity;
      for (let i = 0; i < amplitudes.length; i += 1) {
        if (amplitudes[i] !== 0) {
          min2 = Math.min(min2, i);
          max2 = Math.max(max2, i);
        }
      }
      const expectedDeviation = 0.1 * (1 + 1 / (max2 - min2 + 1));
      this.valueFactor = 1 / 6 / expectedDeviation;
      this.maxValue = (this.first.maxValue + this.second.maxValue) * this.valueFactor;
    }
    sample(x, y, z) {
      const x2 = x * _NormalNoise.INPUT_FACTOR;
      const y2 = y * _NormalNoise.INPUT_FACTOR;
      const z2 = z * _NormalNoise.INPUT_FACTOR;
      return (this.first.sample(x, y, z) + this.second.sample(x2, y2, z2)) * this.valueFactor;
    }
  };
  var NoiseParameters;
  (function(NoiseParameters2) {
    function create4(firstOctave, amplitudes) {
      return { firstOctave, amplitudes };
    }
    NoiseParameters2.create = create4;
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      return {
        firstOctave: Json.readInt(root.firstOctave) ?? 0,
        amplitudes: Json.readArray(root.amplitudes, (e) => Json.readNumber(e) ?? 0) ?? []
      };
    }
    NoiseParameters2.fromJson = fromJson;
  })(NoiseParameters || (NoiseParameters = {}));

  // node_modules/deepslate/lib/math/noise/PerlinSimplexNoise.js
  var PerlinSimplexNoise = class {
    noiseLevels;
    highestFreqInputFactor;
    highestFreqValueFactor;
    constructor(random2, octaves) {
      const lastOctave = octaves[octaves.length - 1];
      const negFirstOctave = -octaves[0];
      const range = negFirstOctave + lastOctave + 1;
      const octavesSet = new Set(octaves);
      const noise = new SimplexNoise(random2);
      this.noiseLevels = Array(range);
      if (lastOctave >= 0 && lastOctave < range && octavesSet.has(0)) {
        this.noiseLevels[lastOctave] = noise;
      }
      for (let i = lastOctave + 1; i < range; i += 1) {
        if (i >= 0 && octavesSet.has(lastOctave - i)) {
          this.noiseLevels[i] = new SimplexNoise(random2);
        } else {
          random2.consume(262);
        }
      }
      if (lastOctave > 0) {
        throw new Error("Positive octaves are not allowed");
      }
      this.highestFreqInputFactor = Math.pow(2, lastOctave);
      this.highestFreqValueFactor = 1 / (Math.pow(2, range) - 1);
    }
    sample(x, y, useOffsets) {
      let value = 0;
      let inputF = this.highestFreqInputFactor;
      let valueF = this.highestFreqValueFactor;
      for (let i = 0; i < this.noiseLevels.length; i += 1) {
        const noise = this.noiseLevels[i];
        if (noise) {
          value += valueF * noise.sample2D(x * inputF + (useOffsets ? noise.xo : 0), y * inputF + (useOffsets ? noise.yo : 0));
        }
        inputF /= 2;
        valueF *= 2;
      }
      return value;
    }
  };

  // node_modules/deepslate/lib/render/BlockColors.js
  var grass = [124 / 255, 189 / 255, 107 / 255];
  var spruce = Color.intToRgb(6396257);
  var birch = Color.intToRgb(8431445);
  var foliage = Color.intToRgb(4764952);
  var water = Color.intToRgb(4159204);
  var lily_pad = Color.intToRgb(2129968);
  var redstone = (power) => {
    const a = power / 15;
    const r = a * 0.6 + (a > 0 ? 0.4 : 0.3);
    const g = clamp(a * a * 0.7 - 0.5, 0, 1);
    const b = clamp(a * a * 0.6 - 0.7, 0, 1);
    return [r, g, b];
  };
  var stem = (age) => {
    return [age / 8, 1 - age / 32, age / 64];
  };
  var BlockColors = {
    large_fern: () => grass,
    tall_grass: () => grass,
    grass_block: () => grass,
    fern: () => grass,
    grass: () => grass,
    short_grass: () => grass,
    potted_fern: () => grass,
    pink_petals: () => grass,
    wildflowers: () => grass,
    bush: () => grass,
    spruce_leaves: () => spruce,
    birch_leaves: () => birch,
    oak_leaves: () => foliage,
    jungle_leaves: () => foliage,
    acacia_leaves: () => foliage,
    dark_oak_leaves: () => foliage,
    vine: () => foliage,
    mangrove_leaves: () => foliage,
    water: () => water,
    bubble_column: () => water,
    cauldron: () => water,
    water_cauldron: () => water,
    redstone_wire: (props) => redstone(parseInt(props["power"] ?? "0")),
    sugar_cane: () => grass,
    attached_melon_stem: () => stem(7),
    attached_pumpkin_stem: () => stem(7),
    melon_stem: (props) => stem(parseInt(props["age"] ?? "0")),
    pumpkin_stem: (props) => stem(parseInt(props["age"] ?? "0")),
    lily_pad: () => lily_pad
  };

  // node_modules/deepslate/lib/render/Cull.js
  var Cull;
  (function(Cull2) {
    function rotate3(cull, x, y) {
      let { up, down, north, east, south, west } = cull;
      switch (y) {
        case 90:
          [north, east, south, west] = [east, south, west, north];
          break;
        case 180:
          [north, east, south, west] = [south, west, north, east];
          break;
        case 270:
          [north, east, south, west] = [west, north, east, south];
      }
      switch (x) {
        case 90:
          [up, north, down, south] = [north, down, south, up];
          break;
        case 180:
          [up, north, down, south] = [down, south, up, north];
          break;
        case 270:
          [up, north, down, south] = [south, up, north, down];
      }
      return { up, down, north, east, south, west };
    }
    Cull2.rotate = rotate3;
    function none() {
      return /* @__PURE__ */ Object.create(null);
    }
    Cull2.none = none;
  })(Cull || (Cull = {}));

  // node_modules/deepslate/lib/render/Vertex.js
  var Vertex = class _Vertex {
    pos;
    color;
    texture;
    textureLimit;
    normal;
    blockPos;
    static VEC = vec3_exports.create();
    constructor(pos, color, texture, textureLimit, normal, blockPos) {
      this.pos = pos;
      this.color = color;
      this.texture = texture;
      this.textureLimit = textureLimit;
      this.normal = normal;
      this.blockPos = blockPos;
    }
    transform(transformation) {
      _Vertex.VEC[0] = this.pos.x;
      _Vertex.VEC[1] = this.pos.y;
      _Vertex.VEC[2] = this.pos.z;
      vec3_exports.transformMat4(_Vertex.VEC, _Vertex.VEC, transformation);
      this.pos = new Vector(_Vertex.VEC[0], _Vertex.VEC[1], _Vertex.VEC[2]);
      return this;
    }
    static fromPos(pos) {
      return new _Vertex(pos, [0, 0, 0], [0, 0], [0, 0, 0, 0], void 0, void 0);
    }
  };

  // node_modules/deepslate/lib/render/Line.js
  var Line = class _Line {
    v1;
    v2;
    constructor(v1, v2) {
      this.v1 = v1;
      this.v2 = v2;
    }
    vertices() {
      return [this.v1, this.v2];
    }
    forEach(fn) {
      fn(this.v1);
      fn(this.v2);
      return this;
    }
    transform(transformation) {
      this.forEach((v) => v.transform(transformation));
      return this;
    }
    setColor(color) {
      this.forEach((v) => v.color = color);
      return this;
    }
    toString() {
      return `Line(${this.v1.pos.toString()}, ${this.v2.pos.toString()})`;
    }
    static fromPoints(p1, p2) {
      return new _Line(Vertex.fromPos(p1), Vertex.fromPos(p2));
    }
  };

  // node_modules/deepslate/lib/render/Mesh.js
  var Mesh = class {
    quads;
    lines;
    posBuffer;
    colorBuffer;
    textureBuffer;
    textureLimitBuffer;
    normalBuffer;
    blockPosBuffer;
    indexBuffer;
    linePosBuffer;
    lineColorBuffer;
    constructor(quads = [], lines = []) {
      this.quads = quads;
      this.lines = lines;
    }
    clear() {
      this.quads = [];
      this.lines = [];
      return this;
    }
    isEmpty() {
      return this.quads.length === 0 && this.lines.length === 0;
    }
    quadVertices() {
      return this.quads.length * 4;
    }
    quadIndices() {
      return this.quads.length * 6;
    }
    lineVertices() {
      return this.lines.length * 2;
    }
    merge(other) {
      this.quads = this.quads.concat(other.quads);
      this.lines = this.lines.concat(other.lines);
      return this;
    }
    addLine(x1, y1, z1, x2, y2, z2, color) {
      const line = new Line(Vertex.fromPos(new Vector(x1, y1, z1)), Vertex.fromPos(new Vector(x2, y2, z2))).setColor(color);
      this.lines.push(line);
      return this;
    }
    addLineCube(x1, y1, z1, x2, y2, z2, color) {
      this.addLine(x1, y1, z1, x1, y1, z2, color);
      this.addLine(x2, y1, z1, x2, y1, z2, color);
      this.addLine(x1, y1, z1, x2, y1, z1, color);
      this.addLine(x1, y1, z2, x2, y1, z2, color);
      this.addLine(x1, y1, z1, x1, y2, z1, color);
      this.addLine(x2, y1, z1, x2, y2, z1, color);
      this.addLine(x1, y1, z2, x1, y2, z2, color);
      this.addLine(x2, y1, z2, x2, y2, z2, color);
      this.addLine(x1, y2, z1, x1, y2, z2, color);
      this.addLine(x2, y2, z1, x2, y2, z2, color);
      this.addLine(x1, y2, z1, x2, y2, z1, color);
      this.addLine(x1, y2, z2, x2, y2, z2, color);
      return this;
    }
    transform(transformation) {
      for (const quad of this.quads) {
        quad.transform(transformation);
      }
      return this;
    }
    computeNormals() {
      for (const quad of this.quads) {
        const normal = quad.normal();
        quad.forEach((v) => v.normal = normal);
      }
    }
    rebuild(gl, options) {
      const rebuildBuffer = (buffer, type, data) => {
        if (!buffer) {
          buffer = gl.createBuffer() ?? void 0;
        }
        if (!buffer) {
          throw new Error("Cannot create new buffer");
        }
        gl.bindBuffer(type, buffer);
        gl.bufferData(type, data, gl.DYNAMIC_DRAW);
        return buffer;
      };
      const rebuildBufferV = (array, buffer, mapper) => {
        if (array.length === 0) {
          if (buffer)
            gl.deleteBuffer(buffer);
          return void 0;
        }
        const data = array.flatMap((e) => e.vertices().flatMap((v) => {
          const data2 = mapper(v);
          if (!data2)
            throw new Error("Missing vertex component");
          return data2;
        }));
        return rebuildBuffer(buffer, gl.ARRAY_BUFFER, new Float32Array(data));
      };
      if (options.pos) {
        this.posBuffer = rebuildBufferV(this.quads, this.posBuffer, (v) => v.pos.components());
        this.linePosBuffer = rebuildBufferV(this.lines, this.linePosBuffer, (v) => v.pos.components());
      }
      if (options.color) {
        this.colorBuffer = rebuildBufferV(this.quads, this.colorBuffer, (v) => v.color);
        this.lineColorBuffer = rebuildBufferV(this.lines, this.lineColorBuffer, (v) => v.color);
      }
      if (options.texture) {
        this.textureBuffer = rebuildBufferV(this.quads, this.textureBuffer, (v) => v.texture);
        this.textureLimitBuffer = rebuildBufferV(this.quads, this.textureLimitBuffer, (v) => v.textureLimit);
      }
      if (options.normal) {
        this.normalBuffer = rebuildBufferV(this.quads, this.normalBuffer, (v) => v.normal?.components());
      }
      if (options.blockPos) {
        this.blockPosBuffer = rebuildBufferV(this.quads, this.blockPosBuffer, (v) => v.blockPos?.components());
      }
      if (this.quads.length === 0) {
        if (this.indexBuffer)
          gl.deleteBuffer(this.indexBuffer);
        this.indexBuffer = void 0;
      } else {
        this.indexBuffer = rebuildBuffer(this.indexBuffer, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.quads.flatMap((_, i) => [4 * i, 4 * i + 1, 4 * i + 2, i * 4, 4 * i + 2, 4 * i + 3], true)));
      }
      return this;
    }
  };

  // node_modules/deepslate/lib/render/BlockDefinition.js
  var BlockDefinition = class _BlockDefinition {
    variants;
    multipart;
    constructor(variants, multipart) {
      this.variants = variants;
      this.multipart = multipart;
    }
    getModelVariants(props) {
      if (this.variants) {
        const matches = Object.keys(this.variants).filter((v) => this.matchesVariant(v, props));
        if (matches.length === 0)
          return [];
        const variant = this.variants[matches[0]];
        return [Array.isArray(variant) ? variant[0] : variant];
      } else if (this.multipart) {
        const matches = this.multipart.filter((p) => p.when ? this.matchesCase(p.when, props) : true);
        return matches.map((p) => Array.isArray(p.apply) ? p.apply[0] : p.apply);
      }
      return [];
    }
    getMesh(name, props, atlas, blockModelProvider, cull) {
      const variants = this.getModelVariants(props);
      const mesh = new Mesh();
      for (const variant of variants) {
        const newCull = Cull.rotate(cull, variant.x ?? 0, variant.y ?? 0);
        const blockModel = blockModelProvider.getBlockModel(Identifier.parse(variant.model));
        if (!blockModel) {
          throw new Error(`Cannot find block model ${variant.model}`);
        }
        const tint = name ? BlockColors[name.path]?.(props) : void 0;
        const variantMesh = blockModel.getMesh(atlas, newCull, tint);
        if (variant.x || variant.y) {
          const t2 = mat4_exports.create();
          mat4_exports.translate(t2, t2, [8, 8, 8]);
          mat4_exports.rotateY(t2, t2, -common_exports.toRadian(variant.y ?? 0));
          mat4_exports.rotateX(t2, t2, -common_exports.toRadian(variant.x ?? 0));
          mat4_exports.translate(t2, t2, [-8, -8, -8]);
          variantMesh.transform(t2);
        }
        mesh.merge(variantMesh);
      }
      const t = mat4_exports.create();
      mat4_exports.scale(t, t, [0.0625, 0.0625, 0.0625]);
      return mesh.transform(t);
    }
    matchesVariant(variant, props) {
      return variant.split(",").every((p) => {
        const [k, v] = p.split("=");
        return props[k] === v;
      });
    }
    matchesCase(condition, props) {
      if (Array.isArray(condition.OR)) {
        return condition.OR.some((c) => this.matchesCase(c, props));
      }
      if (Array.isArray(condition.AND)) {
        return condition.AND.every((c) => this.matchesCase(c, props));
      }
      const states = condition;
      return Object.keys(states).every((k) => {
        const values = states[k].split("|");
        return values.includes(props[k]);
      });
    }
    static fromJson(data) {
      return new _BlockDefinition(data.variants, data.multipart);
    }
  };

  // node_modules/deepslate/lib/render/Quad.js
  var Quad = class _Quad {
    v1;
    v2;
    v3;
    v4;
    constructor(v1, v2, v3, v4) {
      this.v1 = v1;
      this.v2 = v2;
      this.v3 = v3;
      this.v4 = v4;
    }
    vertices() {
      return [this.v1, this.v2, this.v3, this.v4];
    }
    forEach(fn) {
      fn(this.v1);
      fn(this.v2);
      fn(this.v3);
      fn(this.v4);
      return this;
    }
    transform(transformation) {
      this.forEach((v) => v.transform(transformation));
      return this;
    }
    normal() {
      const e1 = this.v2.pos.sub(this.v1.pos);
      const e2 = this.v3.pos.sub(this.v1.pos);
      return e1.cross(e2).normalize();
    }
    reverse() {
      [this.v1, this.v2, this.v3, this.v4] = [this.v4, this.v3, this.v2, this.v1];
      return this;
    }
    setColor(color) {
      this.forEach((v) => v.color = color);
      return this;
    }
    setTexture(texture, textureLimit) {
      this.v1.textureLimit = textureLimit;
      this.v2.textureLimit = textureLimit;
      this.v3.textureLimit = textureLimit;
      this.v4.textureLimit = textureLimit;
      this.v1.texture = [texture[0], texture[1]];
      this.v2.texture = [texture[2], texture[3]];
      this.v3.texture = [texture[4], texture[5]];
      this.v4.texture = [texture[6], texture[7]];
      return this;
    }
    toString() {
      return `Quad(${this.v1.pos.toString()}, ${this.v2.pos.toString()}, ${this.v3.pos.toString()}, ${this.v4.pos.toString()})`;
    }
    static fromPoints(p1, p2, p3, p4) {
      return new _Quad(Vertex.fromPos(p1), Vertex.fromPos(p2), Vertex.fromPos(p3), Vertex.fromPos(p4));
    }
  };

  // node_modules/deepslate/lib/render/BlockModel.js
  var faceRotations = {
    0: [0, 3, 2, 3, 2, 1, 0, 1],
    90: [2, 3, 2, 1, 0, 1, 0, 3],
    180: [2, 1, 0, 1, 0, 3, 2, 3],
    270: [0, 1, 0, 3, 2, 3, 2, 1]
  };
  var rotationAxis = {
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1]
  };
  var SQRT2 = 1.41421356237;
  var rescaleAxis = {
    x: [1, SQRT2, SQRT2],
    y: [SQRT2, 1, SQRT2],
    z: [SQRT2, SQRT2, 1]
  };
  var BlockModel = class _BlockModel {
    parent;
    textures;
    elements;
    display;
    guiLight;
    static BUILTIN_GENERATED = Identifier.create("builtin/generated");
    static GENERATED_LAYERS = ["layer0", "layer1", "layer2", "layer3", "layer4"];
    generationMarker = false;
    constructor(parent, textures, elements, display, guiLight) {
      this.parent = parent;
      this.textures = textures;
      this.elements = elements;
      this.display = display;
      this.guiLight = guiLight;
    }
    getDisplayTransform(display) {
      const transform = this.display?.[display];
      const t = mat4_exports.create();
      mat4_exports.translate(t, t, [8, 8, 8]);
      if (transform?.translation) {
        mat4_exports.translate(t, t, transform.translation);
      }
      if (transform?.rotation) {
        mat4_exports.rotateX(t, t, transform.rotation[0] * Math.PI / 180);
        mat4_exports.rotateY(t, t, transform.rotation[1] * Math.PI / 180);
        mat4_exports.rotateZ(t, t, -transform.rotation[2] * Math.PI / 180);
      }
      if (transform?.scale) {
        mat4_exports.scale(t, t, transform.scale);
      }
      mat4_exports.translate(t, t, [-8, -8, -8]);
      return t;
    }
    getMesh(atlas, cull, tint) {
      const mesh = new Mesh();
      const getTint = (index) => {
        if (tint === void 0)
          return [1, 1, 1];
        if (index === void 0 || index < 0)
          return [1, 1, 1];
        if (typeof tint === "function")
          return tint(index);
        return tint;
      };
      for (const e of this.elements ?? []) {
        mesh.merge(this.getElementMesh(e, atlas, cull, getTint));
      }
      return mesh;
    }
    getElementMesh(e, atlas, cull, getTint) {
      const mesh = new Mesh();
      const [x0, y0, z0] = e.from;
      const [x1, y1, z1] = e.to;
      const addFace = (face, uv, pos) => {
        const quad = Quad.fromPoints(new Vector(pos[0], pos[1], pos[2]), new Vector(pos[3], pos[4], pos[5]), new Vector(pos[6], pos[7], pos[8]), new Vector(pos[9], pos[10], pos[11]));
        const tint = getTint(face.tintindex);
        quad.setColor(tint);
        const [u0, v0, u1, v1] = atlas.getTextureUV(this.getTexture(face.texture));
        const du = (u1 - u0) / 16;
        const dv = (v1 - v0) / 16;
        uv[0] = (face.uv?.[0] ?? uv[0]) * du;
        uv[1] = (face.uv?.[1] ?? uv[1]) * dv;
        uv[2] = (face.uv?.[2] ?? uv[2]) * du;
        uv[3] = (face.uv?.[3] ?? uv[3]) * dv;
        const r = faceRotations[face.rotation ?? 0];
        quad.setTexture([
          u0 + uv[r[0]],
          v0 + uv[r[1]],
          u0 + uv[r[2]],
          v0 + uv[r[3]],
          u0 + uv[r[4]],
          v0 + uv[r[5]],
          u0 + uv[r[6]],
          v0 + uv[r[7]]
        ], [u0 + Math.min(uv[0], uv[2]), v0 + Math.min(uv[1], uv[3]), u0 + Math.max(uv[0], uv[2]), v0 + Math.max(uv[1], uv[3])]);
        mesh.quads.push(quad);
      };
      if (e.faces?.up?.texture && (!e.faces.up.cullface || !cull[e.faces.up.cullface])) {
        addFace(e.faces.up, [x0, 16 - z1, x1, 16 - z0], [x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0]);
      }
      if (e.faces?.down?.texture && (!e.faces.down.cullface || !cull[e.faces.down.cullface])) {
        addFace(e.faces.down, [16 - z1, 16 - x1, 16 - z0, 16 - x0], [x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1]);
      }
      if (e.faces?.south?.texture && (!e.faces.south.cullface || !cull[e.faces.south.cullface])) {
        addFace(e.faces.south, [x0, 16 - y1, x1, 16 - y0], [x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1]);
      }
      if (e.faces?.north?.texture && (!e.faces.north.cullface || !cull[e.faces.north.cullface])) {
        addFace(e.faces.north, [16 - x1, 16 - y1, 16 - x0, 16 - y0], [x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0]);
      }
      if (e.faces?.east?.texture && (!e.faces.east.cullface || !cull[e.faces.east.cullface])) {
        addFace(e.faces.east, [16 - z1, 16 - y1, 16 - z0, 16 - y0], [x1, y0, z1, x1, y0, z0, x1, y1, z0, x1, y1, z1]);
      }
      if (e.faces?.west?.texture && (!e.faces.west.cullface || !cull[e.faces.west.cullface])) {
        addFace(e.faces.west, [z0, 16 - y1, z1, 16 - y0], [x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0]);
      }
      const t = mat4_exports.create();
      if (e.rotation) {
        const origin = vec3_exports.fromValues(...e.rotation.origin);
        mat4_exports.translate(t, t, origin);
        mat4_exports.rotate(t, t, common_exports.toRadian(e.rotation.angle), rotationAxis[e.rotation.axis]);
        if (e.rotation.rescale) {
          mat4_exports.scale(t, t, rescaleAxis[e.rotation.axis]);
        }
        vec3_exports.negate(origin, origin);
        mat4_exports.translate(t, t, origin);
      }
      return mesh.transform(t);
    }
    getTexture(textureRef) {
      textureRef = textureRef.startsWith("#") ? textureRef.slice(1) : textureRef;
      textureRef = this.textures?.[textureRef] ?? "";
      while (textureRef.startsWith("#")) {
        textureRef = this.textures?.[textureRef.slice(1)] ?? "";
      }
      return Identifier.parse(textureRef);
    }
    flatten(accessor) {
      if (!this.parent) {
        return;
      }
      if (this.parent.equals(_BlockModel.BUILTIN_GENERATED)) {
        this.generationMarker = true;
        return;
      }
      const parent = this.getParent(accessor);
      if (!parent) {
        console.warn(`parent ${this.parent} does not exist!`);
        this.parent = void 0;
        return;
      }
      parent.flatten(accessor);
      if (!this.elements) {
        this.elements = parent.elements;
      }
      if (!this.textures) {
        this.textures = {};
      }
      Object.keys(parent.textures ?? {}).forEach((t) => {
        if (!this.textures[t]) {
          this.textures[t] = parent.textures[t];
        }
      });
      if (!this.display) {
        this.display = {};
      }
      Object.keys(parent.display ?? {}).forEach((k) => {
        const l = k;
        if (!this.display[l]) {
          this.display[l] = parent.display[l];
        } else {
          Object.keys(parent.display[l] ?? {}).forEach((m) => {
            const n = m;
            if (!this.display[l][n]) {
              this.display[l][n] = parent.display[l][n];
            }
          });
        }
      });
      if (!this.guiLight) {
        this.guiLight = parent.guiLight;
      }
      if (parent.generationMarker) {
        this.generationMarker = true;
      }
      if (this.generationMarker && (this.elements?.length ?? 0) === 0) {
        for (let i = 0; i < _BlockModel.GENERATED_LAYERS.length; i += 1) {
          const layer = _BlockModel.GENERATED_LAYERS[i];
          if (!Object.hasOwn(this.textures, layer)) {
            break;
          }
          if (!this.elements) {
            this.elements = [];
          }
          this.elements.push({
            from: [0, 0, 0],
            to: [16, 16, 0],
            faces: { south: { texture: `#${layer}`, tintindex: i } }
          });
        }
      }
      this.parent = void 0;
    }
    getParent(accessor) {
      if (!this.parent)
        return null;
      return accessor.getBlockModel(this.parent);
    }
    static fromJson(data) {
      const parent = data.parent === void 0 ? void 0 : Identifier.parse(data.parent);
      return new _BlockModel(parent, data.textures, data.elements, data.display);
    }
  };

  // node_modules/deepslate/lib/render/SpecialRenderer.js
  function liquidRenderer(type, level, atlas, cull, tintindex) {
    const y = cull["up"] ? 16 : [14.2, 12.5, 10.5, 9, 7, 5.3, 3.7, 1.9, 16, 16, 16, 16, 16, 16, 16, 16][level];
    return new BlockModel(void 0, {
      still: `block/${type}_still`,
      flow: `block/${type}_flow`
    }, [{
      from: [0, 0, 0],
      to: [16, y, 16],
      faces: {
        up: { texture: "#still", tintindex, cullface: Direction.UP },
        down: { texture: "#still", tintindex, cullface: Direction.DOWN },
        north: { texture: "#flow", tintindex, cullface: Direction.NORTH },
        east: { texture: "#flow", tintindex, cullface: Direction.EAST },
        south: { texture: "#flow", tintindex, cullface: Direction.SOUTH },
        west: { texture: "#flow", tintindex, cullface: Direction.WEST }
      }
    }]).getMesh(atlas, cull, BlockColors[type]?.({}));
  }
  var DyeColors = {
    white: Color.intToRgb(16383998),
    orange: Color.intToRgb(16351261),
    magenta: Color.intToRgb(13061821),
    light_blue: Color.intToRgb(3847130),
    yellow: Color.intToRgb(16701501),
    lime: Color.intToRgb(8439583),
    pink: Color.intToRgb(15961002),
    gray: Color.intToRgb(4673362),
    light_gray: Color.intToRgb(10329495),
    cyan: Color.intToRgb(1481884),
    purple: Color.intToRgb(8991416),
    blue: Color.intToRgb(3949738),
    brown: Color.intToRgb(8606770),
    green: Color.intToRgb(6192150),
    red: Color.intToRgb(11546150),
    black: Color.intToRgb(1908001)
  };
  var SpecialRenderers;
  (function(SpecialRenderers2) {
    function chestRenderer(texture) {
      return (atlas) => {
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/chest/").toString()
        }, [
          {
            from: [1, 0, 1],
            to: [15, 10, 15],
            faces: {
              north: { uv: [10.5, 8.25, 14, 10.75], rotation: 180, texture: "#0" },
              east: { uv: [7, 8.25, 10.5, 10.75], rotation: 180, texture: "#0" },
              south: { uv: [3.5, 8.25, 7, 10.75], rotation: 180, texture: "#0" },
              west: { uv: [0, 8.25, 3.5, 10.75], rotation: 180, texture: "#0" },
              up: { uv: [7, 4.75, 10.5, 8.25], texture: "#0" },
              down: { uv: [3.5, 4.75, 7, 8.25], texture: "#0" }
            }
          },
          {
            from: [1, 10, 1],
            to: [15, 14, 15],
            faces: {
              north: { uv: [10.5, 3.75, 14, 4.75], rotation: 180, texture: "#0" },
              east: { uv: [7, 3.75, 10.5, 4.75], rotation: 180, texture: "#0" },
              south: { uv: [3.5, 3.75, 7, 4.75], rotation: 180, texture: "#0" },
              west: { uv: [0, 3.75, 3.5, 4.75], rotation: 180, texture: "#0" },
              up: { uv: [7, 0, 10.5, 3.5], texture: "#0" },
              down: { uv: [3.5, 0, 7, 3.5], texture: "#0" }
            }
          },
          {
            from: [7, 7, 0],
            to: [9, 11, 2],
            faces: {
              north: { uv: [0.25, 0.25, 0.75, 1.25], rotation: 180, texture: "#0" },
              east: { uv: [0, 0.25, 0.25, 1.25], rotation: 180, texture: "#0" },
              south: { uv: [1, 0.25, 1.5, 1.25], rotation: 180, texture: "#0" },
              west: { uv: [0.75, 0.25, 1, 1.25], rotation: 180, texture: "#0" },
              up: { uv: [0.25, 0, 0.75, 0.25], rotation: 180, texture: "#0" },
              down: { uv: [0.75, 0, 1.25, 0.25], rotation: 180, texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.chestRenderer = chestRenderer;
    function decoratedPotRenderer(atlas) {
      return new BlockModel(void 0, {
        0: "entity/decorated_pot/decorated_pot_side",
        1: "entity/decorated_pot/decorated_pot_base"
      }, [
        {
          from: [1, 0, 1],
          to: [15, 16, 15],
          faces: {
            north: { uv: [1, 0, 15, 16], texture: "#0" },
            east: { uv: [1, 0, 15, 16], texture: "#0" },
            south: { uv: [1, 0, 15, 16], texture: "#0" },
            west: { uv: [1, 0, 15, 16], texture: "#0" },
            up: { uv: [0, 6.5, 7, 13.5], texture: "#1" },
            down: { uv: [7, 6.5, 14, 13.5], texture: "#1" }
          }
        },
        {
          from: [5, 16, 5],
          to: [11, 17, 11],
          faces: {
            north: { uv: [0, 5.5, 3, 6], texture: "#1" },
            east: { uv: [3, 5.5, 6, 6], texture: "#1" },
            south: { uv: [6, 5.5, 9, 6], texture: "#1" },
            west: { uv: [9, 5.5, 12, 6], texture: "#1" }
          }
        },
        {
          from: [4, 17, 4],
          to: [12, 20, 12],
          faces: {
            north: { uv: [0, 4, 4, 5.5], texture: "#1" },
            east: { uv: [4, 4, 8, 5.5], texture: "#1" },
            south: { uv: [8, 4, 12, 5.5], texture: "#1" },
            west: { uv: [12, 4, 16, 5.5], texture: "#1" },
            up: { uv: [4, 0, 8, 4], texture: "#1" },
            down: { uv: [8, 0, 12, 4], texture: "#1" }
          }
        }
      ]).getMesh(atlas, Cull.none());
    }
    SpecialRenderers2.decoratedPotRenderer = decoratedPotRenderer;
    function shieldRenderer(atlas) {
      return new BlockModel(void 0, {
        0: "entity/shield_base_nopattern"
      }, [
        {
          from: [-6, -11, -2],
          to: [6, 11, -1],
          faces: {
            north: { uv: [3.5, 0.25, 6.5, 5.75], texture: "#0" },
            east: { uv: [3.25, 0.25, 3.5, 5.75], texture: "#0" },
            south: { uv: [0.25, 0.25, 3.25, 5.75], texture: "#0" },
            west: { uv: [0, 0.25, 0.25, 5.75], texture: "#0" },
            up: { uv: [0.25, 0, 3.25, 0.25], texture: "#0" },
            down: { uv: [3.25, 0, 6.25, 0.25], texture: "#0" }
          }
        }
      ]).getMesh(atlas, Cull.none());
    }
    SpecialRenderers2.shieldRenderer = shieldRenderer;
    function headRenderer(texture, n) {
      return (atlas) => {
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/").toString()
        }, [
          {
            from: [4, 0, 4],
            to: [12, 8, 12],
            faces: {
              north: { uv: [6, 2 * n, 8, 4 * n], texture: "#0" },
              east: { uv: [2, 2 * n, 0, 4 * n], texture: "#0" },
              south: { uv: [2, 2 * n, 4, 4 * n], texture: "#0" },
              west: { uv: [6, 2 * n, 4, 4 * n], texture: "#0" },
              up: { uv: [2, 0 * n, 4, 2 * n], texture: "#0" },
              down: { uv: [4, 0 * n, 6, 2 * n], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.headRenderer = headRenderer;
    function dragonHeadRenderer(texture = Identifier.create("enderdragon/dragon")) {
      return (atlas) => {
        const transformation = mat4_exports.create();
        mat4_exports.translate(transformation, transformation, [8, 8, 8]);
        mat4_exports.scale(transformation, transformation, [0.75, 0.75, 0.75]);
        mat4_exports.rotateY(transformation, transformation, Math.PI);
        mat4_exports.translate(transformation, transformation, [-8, -11.2, -8]);
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/").toString()
        }, [
          {
            from: [2, 4, -16],
            to: [14, 9, 0],
            faces: {
              north: { uv: [12, 3.75, 12.75, 4.0625], texture: "#0" },
              east: { uv: [11, 3.75, 12, 4.0625], texture: "#0" },
              south: { uv: [13.75, 3.75, 14.5, 4.0625], texture: "#0" },
              west: { uv: [12.75, 3.75, 13.75, 4.0625], texture: "#0" },
              up: { uv: [12.75, 3.75, 12, 2.75], texture: "#0" },
              down: { uv: [13.5, 2.75, 12.75, 3.75], texture: "#0" }
            }
          },
          {
            from: [0, 0, -2],
            to: [16, 16, 14],
            faces: {
              north: { uv: [8, 2.875, 9, 3.875], texture: "#0" },
              east: { uv: [7, 2.875, 8, 3.875], texture: "#0" },
              south: { uv: [10, 2.875, 11, 3.875], texture: "#0" },
              west: { uv: [9, 2.875, 10, 3.875], texture: "#0" },
              up: { uv: [9, 2.875, 8, 1.875], texture: "#0" },
              down: { uv: [10, 1.875, 9, 2.875], texture: "#0" }
            }
          },
          {
            from: [2, 0, -16],
            to: [14, 4, 0],
            rotation: { angle: -0.2 * 180 / Math.PI, axis: "x", origin: [8, 4, -2] },
            faces: {
              north: { uv: [12, 5.0625, 12.75, 5.3125], texture: "#0" },
              east: { uv: [11, 5.0625, 12, 5.3125], texture: "#0" },
              south: { uv: [13.75, 5.0625, 14.5, 5.3125], texture: "#0" },
              west: { uv: [12.75, 5.0625, 13.75, 5.3125], texture: "#0" },
              up: { uv: [12.75, 5.0625, 12, 4.0625], texture: "#0" },
              down: { uv: [13.5, 4.0625, 12.75, 5.0625], texture: "#0" }
            }
          },
          {
            from: [3, 16, 4],
            to: [5, 20, 10],
            faces: {
              north: { uv: [0.375, 0.375, 0.5, 0.625], texture: "#0" },
              east: { uv: [0, 0.375, 0.375, 0.625], texture: "#0" },
              south: { uv: [0.875, 0.375, 1, 0.625], texture: "#0" },
              west: { uv: [0.5, 0.375, 0.875, 0.625], texture: "#0" },
              up: { uv: [0.5, 0.375, 0.375, 0], texture: "#0" },
              down: { uv: [0.625, 0, 0.5, 0.375], texture: "#0" }
            }
          },
          {
            from: [11, 16, 4],
            to: [13, 20, 10],
            faces: {
              north: { uv: [0.375, 0.375, 0.5, 0.625], texture: "#0" },
              east: { uv: [0, 0.375, 0.375, 0.625], texture: "#0" },
              south: { uv: [0.875, 0.375, 1, 0.625], texture: "#0" },
              west: { uv: [0.5, 0.375, 0.875, 0.625], texture: "#0" },
              up: { uv: [0.5, 0.375, 0.375, 0], texture: "#0" },
              down: { uv: [0.625, 0, 0.5, 0.375], texture: "#0" }
            }
          },
          {
            from: [3, 9, -14],
            to: [5, 11, -10],
            faces: {
              north: { uv: [7.25, 0.25, 7.375, 0.375], texture: "#0" },
              east: { uv: [7, 0.25, 7.25, 0.375], texture: "#0" },
              south: { uv: [7.625, 0.25, 7.75, 0.375], texture: "#0" },
              west: { uv: [7.375, 0.25, 7.625, 0.375], texture: "#0" },
              up: { uv: [7.375, 0.25, 7.25, 0], texture: "#0" },
              down: { uv: [7.5, 0, 7.375, 0.25], texture: "#0" }
            }
          },
          {
            from: [11, 9, -14],
            to: [13, 11, -10],
            faces: {
              north: { uv: [7.25, 0.25, 7.375, 0.375], texture: "#0" },
              east: { uv: [7, 0.25, 7.25, 0.375], texture: "#0" },
              south: { uv: [7.625, 0.25, 7.75, 0.375], texture: "#0" },
              west: { uv: [7.375, 0.25, 7.625, 0.375], texture: "#0" },
              up: { uv: [7.375, 0.25, 7.25, 0], texture: "#0" },
              down: { uv: [7.5, 0, 7.375, 0.25], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none()).transform(transformation);
      };
    }
    SpecialRenderers2.dragonHeadRenderer = dragonHeadRenderer;
    function piglinHeadRenderer(texture = Identifier.create("piglin/piglin")) {
      return (atlas) => {
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/").toString()
        }, [
          {
            from: [3, 0, 4],
            to: [13, 8, 12],
            faces: {
              north: { uv: [6.5, 2, 9, 4], texture: "#0" },
              east: { uv: [2, 2, 0, 4], texture: "#0" },
              south: { uv: [2, 2, 4.5, 4], texture: "#0" },
              west: { uv: [6.5, 2, 4.5, 4], texture: "#0" },
              up: { uv: [2, 0, 4.5, 2], texture: "#0" },
              down: { uv: [4.5, 0, 7, 2], texture: "#0" }
            }
          },
          {
            from: [6, 0, 12],
            to: [10, 4, 13],
            faces: {
              north: { uv: [9.25, 0.5, 10.25, 1.5], texture: "#0" },
              east: { uv: [7.75, 0.5, 8, 1.5], texture: "#0" },
              south: { uv: [8, 0.5, 9, 1.5], texture: "#0" },
              west: { uv: [9, 0.5, 9.25, 1.5], texture: "#0" },
              up: { uv: [8, 0.25, 9, 0.5], texture: "#0" },
              down: { uv: [9, 0.25, 10, 0.5], texture: "#0" }
            }
          },
          {
            from: [5, 0, 12],
            to: [6, 2, 13],
            faces: {
              north: { uv: [1.25, 0.25, 1.5, 0.75], texture: "#0" },
              east: { uv: [0.5, 0.25, 0.75, 0.75], texture: "#0" },
              south: { uv: [0.75, 0.25, 1, 0.75], texture: "#0" },
              west: { uv: [1, 0.25, 1.25, 0.75], texture: "#0" },
              up: { uv: [0.75, 0, 1, 0.25], texture: "#0" },
              down: { uv: [1, 0, 1.25, 0.25], texture: "#0" }
            }
          },
          {
            from: [10, 0, 12],
            to: [11, 2, 13],
            faces: {
              north: { uv: [1.25, 1.25, 1.5, 1.75], texture: "#0" },
              east: { uv: [0.5, 1.25, 0.75, 1.75], texture: "#0" },
              south: { uv: [0.75, 1.25, 1, 1.75], texture: "#0" },
              west: { uv: [1, 1.25, 1.25, 1.75], texture: "#0" },
              up: { uv: [0.75, 1, 1, 1.25], texture: "#0" },
              down: { uv: [1, 1, 1.25, 1.25], texture: "#0" }
            }
          },
          {
            from: [2.5, 1.5, 6],
            to: [3.5, 6.5, 10],
            rotation: { angle: -30, axis: "z", origin: [3, 7, 8] },
            faces: {
              north: { uv: [12, 2.5, 12.25, 3.75], texture: "#0" },
              east: { uv: [9.75, 2.5, 10.75, 3.75], texture: "#0" },
              south: { uv: [10.75, 2.5, 11, 3.75], texture: "#0" },
              west: { uv: [11, 2.5, 12, 3.75], texture: "#0" },
              up: { uv: [10.75, 1.5, 11, 2.5], texture: "#0" },
              down: { uv: [11, 1.5, 11.25, 2.5], texture: "#0" }
            }
          },
          {
            from: [12.5, 1.5, 6],
            to: [13.5, 6.5, 10],
            rotation: { angle: 30, axis: "z", origin: [13, 7, 8] },
            faces: {
              north: { uv: [15.25, 2.5, 15, 3.75], texture: "#0" },
              east: { uv: [15, 2.5, 14, 3.75], texture: "#0" },
              south: { uv: [14, 2.5, 13.75, 3.75], texture: "#0" },
              west: { uv: [13.75, 2.5, 12.75, 3.75], texture: "#0" },
              up: { uv: [14, 1.5, 13.75, 2.5], texture: "#0" },
              down: { uv: [14.25, 1.5, 14, 2.5], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.piglinHeadRenderer = piglinHeadRenderer;
    function signRenderer(texture) {
      return (atlas) => {
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/signs/").toString()
        }, [
          {
            from: [-4, 8, 7],
            to: [20, 20, 9],
            faces: {
              north: { uv: [0.5, 1, 6.5, 7], texture: "#0" },
              east: { uv: [0, 1, 0.5, 7], texture: "#0" },
              south: { uv: [7, 1, 13, 7], texture: "#0" },
              west: { uv: [6.5, 1, 7, 7], texture: "#0" },
              up: { uv: [6.5, 1, 0.5, 0], texture: "#0" },
              down: { uv: [12.5, 0, 6.5, 1], texture: "#0" }
            }
          },
          {
            from: [7, -6, 7],
            to: [9, 8, 9],
            faces: {
              north: { uv: [0.5, 8, 1, 15], texture: "#0" },
              east: { uv: [0, 8, 0.5, 15], texture: "#0" },
              south: { uv: [1.5, 8, 2, 15], texture: "#0" },
              west: { uv: [1, 8, 1.5, 15], texture: "#0" },
              up: { uv: [1, 8, 0.5, 7], texture: "#0" },
              down: { uv: [1.5, 7, 1, 8], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.signRenderer = signRenderer;
    function wallSignRenderer(texture) {
      return (atlas) => {
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/signs/").toString()
        }, [
          {
            from: [-4, 4, 17],
            to: [20, 16, 19],
            faces: {
              north: { uv: [0.5, 1, 6.5, 7], texture: "#0" },
              east: { uv: [0, 1, 0.5, 7], texture: "#0" },
              south: { uv: [7, 1, 13, 7], texture: "#0" },
              west: { uv: [6.5, 1, 7, 7], texture: "#0" },
              up: { uv: [6.5, 1, 0.5, 0], texture: "#0" },
              down: { uv: [12.5, 0, 6.5, 1], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.wallSignRenderer = wallSignRenderer;
    function hangingSignRenderer(texture) {
      return (attached, atlas) => {
        if (attached) {
          return new BlockModel(void 0, {
            0: texture.withPrefix("entity/signs/hanging/").toString()
          }, [
            {
              from: [1, 0, 7],
              to: [15, 10, 9],
              faces: {
                north: { uv: [0.5, 7, 4, 12], texture: "#0" },
                east: { uv: [0, 7, 0.5, 12], texture: "#0" },
                south: { uv: [4.5, 7, 8, 12], texture: "#0" },
                west: { uv: [4, 7, 4.5, 12], texture: "#0" },
                up: { uv: [4, 7, 0.5, 6], texture: "#0" },
                down: { uv: [7.5, 6, 4, 7], texture: "#0" }
              }
            },
            {
              from: [2, 10, 8],
              to: [14, 16, 8],
              faces: {
                north: { uv: [3.5, 3, 6.5, 6], texture: "#0" },
                south: { uv: [3.5, 3, 6.5, 6], texture: "#0" }
              }
            }
          ]).getMesh(atlas, Cull.none());
        }
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/signs/hanging/").toString()
        }, [
          {
            from: [1, 0, 7],
            to: [15, 10, 9],
            faces: {
              north: { uv: [0.5, 7, 4, 12], texture: "#0" },
              east: { uv: [0, 7, 0.5, 12], texture: "#0" },
              south: { uv: [4.5, 7, 8, 12], texture: "#0" },
              west: { uv: [4, 7, 4.5, 12], texture: "#0" },
              up: { uv: [4, 7, 0.5, 6], texture: "#0" },
              down: { uv: [7.5, 6, 4, 7], texture: "#0" }
            }
          },
          {
            from: [1.5, 10, 8],
            to: [4.5, 16, 8],
            rotation: { angle: 45, axis: "y", origin: [3, 12, 8] },
            faces: {
              north: { uv: [0, 3, 0.75, 6], texture: "#0" },
              south: { uv: [0, 3, 0.75, 6], texture: "#0" }
            }
          },
          {
            from: [3, 10, 6.5],
            to: [3, 16, 9.5],
            rotation: { angle: 45, axis: "y", origin: [3, 12, 8] },
            faces: {
              east: { uv: [1.5, 3, 2.25, 6], texture: "#0" },
              west: { uv: [1.5, 3, 2.25, 6], texture: "#0" }
            }
          },
          {
            from: [11.5, 10, 8],
            to: [14.5, 16, 8],
            rotation: { angle: 45, axis: "y", origin: [13, 12, 8] },
            faces: {
              north: { uv: [0, 3, 0.75, 6], texture: "#0" },
              south: { uv: [0, 3, 0.75, 6], texture: "#0" }
            }
          },
          {
            from: [13, 10, 6.5],
            to: [13, 16, 9.5],
            rotation: { angle: 45, axis: "y", origin: [13, 12, 8] },
            faces: {
              east: { uv: [1.5, 3, 2.25, 6], texture: "#0" },
              west: { uv: [1.5, 3, 2.25, 6], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.hangingSignRenderer = hangingSignRenderer;
    function wallHangingSignRenderer(woodType) {
      return (atlas) => {
        return new BlockModel(void 0, {
          0: `entity/signs/hanging/${woodType}`
        }, [
          {
            from: [1, 0, 7],
            to: [15, 10, 9],
            faces: {
              north: { uv: [0.5, 7, 4, 12], texture: "#0" },
              east: { uv: [0, 7, 0.5, 12], texture: "#0" },
              south: { uv: [4.5, 7, 8, 12], texture: "#0" },
              west: { uv: [4, 7, 4.5, 12], texture: "#0" },
              up: { uv: [4, 7, 0.5, 6], texture: "#0" },
              down: { uv: [7.5, 6, 4, 7], texture: "#0" }
            }
          },
          {
            from: [0, 14, 6],
            to: [16, 16, 10],
            faces: {
              north: { uv: [1, 2, 5, 3], texture: "#0" },
              east: { uv: [0, 2, 1, 3], texture: "#0" },
              south: { uv: [6, 2, 10, 3], texture: "#0" },
              west: { uv: [5, 2, 6, 3], texture: "#0" },
              up: { uv: [5, 2, 1, 0], texture: "#0" },
              down: { uv: [9, 0, 5, 2], texture: "#0" }
            }
          },
          {
            from: [1.5, 10, 8],
            to: [4.5, 16, 8],
            rotation: { angle: 45, axis: "y", origin: [3, 12, 8] },
            faces: {
              north: { uv: [0, 3, 0.75, 6], texture: "#0" },
              south: { uv: [0, 3, 0.75, 6], texture: "#0" }
            }
          },
          {
            from: [3, 10, 6.5],
            to: [3, 16, 9.5],
            rotation: { angle: 45, axis: "y", origin: [3, 12, 8] },
            faces: {
              east: { uv: [1.5, 3, 2.25, 6], texture: "#0" },
              west: { uv: [1.5, 3, 2.25, 6], texture: "#0" }
            }
          },
          {
            from: [11.5, 10, 8],
            to: [14.5, 16, 8],
            rotation: { angle: 45, axis: "y", origin: [13, 12, 8] },
            faces: {
              north: { uv: [0, 3, 0.75, 6], texture: "#0" },
              south: { uv: [0, 3, 0.75, 6], texture: "#0" }
            }
          },
          {
            from: [13, 10, 6.5],
            to: [13, 16, 9.5],
            rotation: { angle: 45, axis: "y", origin: [13, 12, 8] },
            faces: {
              east: { uv: [1.5, 3, 2.25, 6], texture: "#0" },
              west: { uv: [1.5, 3, 2.25, 6], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.wallHangingSignRenderer = wallHangingSignRenderer;
    function conduitRenderer(atlas) {
      return new BlockModel(void 0, {
        0: "entity/conduit/base"
      }, [
        {
          from: [5, 5, 5],
          to: [11, 11, 11],
          faces: {
            north: { uv: [3, 6, 6, 12], texture: "#0" },
            east: { uv: [0, 6, 3, 12], texture: "#0" },
            south: { uv: [9, 6, 12, 12], texture: "#0" },
            west: { uv: [6, 6, 9, 12], texture: "#0" },
            up: { uv: [6, 6, 3, 0], texture: "#0" },
            down: { uv: [9, 0, 6, 6], texture: "#0" }
          }
        }
      ]).getMesh(atlas, Cull.none());
    }
    SpecialRenderers2.conduitRenderer = conduitRenderer;
    function shulkerBoxRenderer(texture) {
      return (atlas) => {
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/shulker/").toString()
        }, [
          {
            from: [0, 0, 0],
            to: [16, 8, 16],
            faces: {
              north: { uv: [4, 11, 8, 13], texture: "#0" },
              east: { uv: [0, 11, 4, 13], texture: "#0" },
              south: { uv: [12, 11, 16, 13], texture: "#0" },
              west: { uv: [8, 11, 12, 13], texture: "#0" },
              up: { uv: [8, 11, 4, 7], texture: "#0" },
              down: { uv: [12, 7, 8, 11], texture: "#0" }
            }
          },
          {
            from: [0, 4, 0],
            to: [16, 16, 16],
            faces: {
              north: { uv: [4, 4, 8, 7], texture: "#0" },
              east: { uv: [0, 4, 4, 7], texture: "#0" },
              south: { uv: [12, 4, 16, 7], texture: "#0" },
              west: { uv: [8, 4, 12, 7], texture: "#0" },
              up: { uv: [8, 4, 4, 0], texture: "#0" },
              down: { uv: [12, 0, 8, 4], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.shulkerBoxRenderer = shulkerBoxRenderer;
    const bannerFace = (index) => ({
      north: { uv: [0.25, 0.25, 5.25, 10.25], texture: `#${index}`, tintindex: index },
      east: { uv: [0, 0.25, 0.25, 10.25], texture: `#${index}`, tintindex: index },
      south: { uv: [5.5, 0.25, 10.5, 10.25], texture: `#${index}`, tintindex: index },
      west: { uv: [5.25, 0.25, 5.5, 10.25], texture: `#${index}`, tintindex: index },
      up: { uv: [5.25, 0.25, 0.25, 0], texture: `#${index}`, tintindex: index },
      down: { uv: [10.25, 0, 5.25, 0.25], texture: `#${index}`, tintindex: index }
    });
    function createBannerRenderer(color, config) {
      return (atlas, patterns) => {
        const textures = { 0: "entity/banner_base" };
        const elements = [...config.base];
        const colors = [color];
        patterns?.forEach((compound, index) => {
          const pattern = Identifier.parse(compound.getString("pattern")).path;
          const color2 = compound.getString("color");
          index++;
          textures[index] = `entity/banner/${pattern}`;
          elements.push(config.pattern(index));
          colors.push(color2);
        });
        return new BlockModel(void 0, textures, elements).getMesh(atlas, Cull.none(), (index) => DyeColors[colors[index]]);
      };
    }
    SpecialRenderers2.bannerRenderer = (color) => createBannerRenderer(color, {
      base: [
        {
          from: [-2, -8, 6],
          to: [18, 32, 7],
          faces: bannerFace(0)
        },
        {
          from: [7, -12, 7],
          to: [9, 30, 9],
          faces: {
            north: { uv: [11.5, 0.5, 12, 11], texture: "#0" },
            east: { uv: [11, 0.5, 11.5, 11], texture: "#0" },
            south: { uv: [12.5, 0.5, 13, 11], texture: "#0" },
            west: { uv: [12, 0.5, 12.5, 11], texture: "#0" },
            up: { uv: [12, 0.5, 11.5, 0], texture: "#0" },
            down: { uv: [12.5, 0, 12, 0.5], texture: "#0" }
          }
        },
        {
          from: [-2, 30, 7],
          to: [18, 32, 9],
          faces: {
            north: { uv: [0.5, 11, 5.5, 11.5], texture: "#0" },
            east: { uv: [0, 11, 0.5, 11.5], texture: "#0" },
            south: { uv: [6, 11, 11, 11.5], texture: "#0" },
            west: { uv: [5.5, 11, 6, 11.5], texture: "#0" },
            up: { uv: [5.5, 11, 0.5, 10.5], texture: "#0" },
            down: { uv: [10.5, 10.5, 5.5, 11], texture: "#0" }
          }
        }
      ],
      pattern: (index) => ({
        from: [-2, -8, 6],
        to: [18, 32, 7],
        faces: bannerFace(index)
      })
    });
    SpecialRenderers2.wallBannerRenderer = (color) => createBannerRenderer(color, {
      base: [
        {
          from: [-2, -8, -1.5],
          to: [18, 32, -0.5],
          faces: bannerFace(0)
        },
        {
          from: [-2, 30, -3.5],
          to: [18, 32, -1.5],
          faces: {
            north: { uv: [0.5, 11, 5.5, 11.5], texture: "#0" },
            east: { uv: [0, 11, 0.5, 11.5], texture: "#0" },
            south: { uv: [6, 11, 11, 11.5], texture: "#0" },
            west: { uv: [5.5, 11, 6, 11.5], texture: "#0" },
            up: { uv: [5.5, 11, 0.5, 10.5], texture: "#0" },
            down: { uv: [10.5, 10.5, 5.5, 11], texture: "#0" }
          }
        }
      ],
      pattern: (index) => ({
        from: [-2, -8, -1.5],
        to: [18, 32, -0.5],
        faces: bannerFace(index)
      })
    });
    function bellRenderer(atlas) {
      return new BlockModel(void 0, {
        0: "entity/bell/bell_body"
      }, [
        {
          from: [5, 3, 5],
          to: [11, 10, 11],
          faces: {
            north: { uv: [3, 3, 6, 6.5], texture: "#0" },
            east: { uv: [0, 3, 3, 6.5], texture: "#0" },
            south: { uv: [9, 3, 12, 6.5], texture: "#0" },
            west: { uv: [6, 3, 9, 6.5], texture: "#0" },
            up: { uv: [6, 3, 3, 0], texture: "#0" },
            down: { uv: [9, 0, 6, 3], texture: "#0" }
          }
        },
        {
          from: [4, 10, 4],
          to: [12, 12, 12],
          faces: {
            north: { uv: [4, 10.5, 8, 11.5], texture: "#0" },
            east: { uv: [0, 10.5, 4, 11.5], texture: "#0" },
            south: { uv: [12, 10.5, 16, 11.5], texture: "#0" },
            west: { uv: [8, 10.5, 12, 11.5], texture: "#0" },
            up: { uv: [8, 10.5, 4, 6.5], texture: "#0" },
            down: { uv: [12, 6.5, 8, 10.5], texture: "#0" }
          }
        }
      ]).getMesh(atlas, Cull.none());
    }
    SpecialRenderers2.bellRenderer = bellRenderer;
    function bedRenderer(texture) {
      return (part, atlas) => {
        if (part === "foot") {
          return new BlockModel(void 0, {
            0: texture.withPrefix("entity/bed/").toString()
          }, [
            {
              from: [0, 3, 0],
              to: [16, 9, 16],
              faces: {
                north: { uv: [5.5, 5.5, 9.5, 7], rotation: 180, texture: "#0" },
                east: { uv: [0, 7, 1.5, 11], rotation: 270, texture: "#0" },
                west: { uv: [5.5, 7, 7, 11], rotation: 90, texture: "#0" },
                up: { uv: [5.5, 11, 1.5, 7], texture: "#0" },
                down: { uv: [11, 7, 7, 11], texture: "#0" }
              }
            },
            {
              from: [0, 0, 0],
              to: [3, 3, 3],
              faces: {
                north: { uv: [12.5, 5.25, 13.25, 6], texture: "#0" },
                east: { uv: [14.75, 5.25, 15.5, 6], texture: "#0" },
                south: { uv: [14, 5.25, 14.75, 6], texture: "#0" },
                west: { uv: [13.25, 5.25, 14, 6], texture: "#0" },
                up: { uv: [13.25, 4.5, 14, 5.25], texture: "#0" },
                down: { uv: [14, 4.5, 14.75, 5.25], texture: "#0" }
              }
            },
            {
              from: [13, 0, 0],
              to: [16, 3, 3],
              faces: {
                north: { uv: [13.25, 3.75, 14, 4.5], texture: "#0" },
                east: { uv: [12.5, 3.75, 13.25, 4.5], texture: "#0" },
                south: { uv: [14.75, 3.75, 15.5, 4.5], texture: "#0" },
                west: { uv: [14, 3.75, 14.75, 4.5], texture: "#0" },
                up: { uv: [13.25, 3, 14, 3.75], texture: "#0" },
                down: { uv: [14, 3, 14.75, 3.75], texture: "#0" }
              }
            }
          ]).getMesh(atlas, Cull.none());
        }
        return new BlockModel(void 0, {
          0: texture.withPrefix("entity/bed/").toString()
        }, [
          {
            from: [0, 3, 0],
            to: [16, 9, 16],
            faces: {
              east: { uv: [0, 1.5, 1.5, 5.5], rotation: 270, texture: "#0" },
              south: { uv: [1.5, 0, 5.5, 1.5], rotation: 180, texture: "#0" },
              west: { uv: [5.5, 1.5, 7, 5.5], rotation: 90, texture: "#0" },
              up: { uv: [5.5, 5.5, 1.5, 1.5], texture: "#0" },
              down: { uv: [11, 1.5, 7, 5.5], texture: "#0" }
            }
          },
          {
            from: [0, 0, 13],
            to: [3, 3, 16],
            faces: {
              north: { uv: [14.75, 0.75, 15.5, 1.5], texture: "#0" },
              east: { uv: [14, 0.75, 14.75, 1.5], texture: "#0" },
              south: { uv: [13.25, 0.75, 14, 1.5], texture: "#0" },
              west: { uv: [12.5, 0.75, 13.25, 1.5], texture: "#0" },
              up: { uv: [13.25, 0, 14, 0.75], texture: "#0" },
              down: { uv: [14, 0, 14.75, 0.75], texture: "#0" }
            }
          },
          {
            from: [13, 0, 13],
            to: [16, 3, 16],
            faces: {
              north: { uv: [14, 2.25, 14.75, 3], texture: "#0" },
              east: { uv: [13.25, 2.25, 14, 3], texture: "#0" },
              south: { uv: [12.5, 2.25, 13.25, 3], texture: "#0" },
              west: { uv: [14.75, 2.25, 15.5, 3], texture: "#0" },
              up: { uv: [13.25, 1.5, 14, 2.25], texture: "#0" },
              down: { uv: [14, 1.5, 14.75, 2.25], texture: "#0" }
            }
          }
        ]).getMesh(atlas, Cull.none());
      };
    }
    SpecialRenderers2.bedRenderer = bedRenderer;
    function getStr(block, key, fallback = "") {
      return block.getProperty(key) ?? fallback;
    }
    function getInt(block, key, fallback = "0") {
      return parseInt(block.getProperty(key) ?? fallback);
    }
    const ChestRenderers = new Map(Object.entries({
      "minecraft:chest": SpecialRenderers2.chestRenderer(Identifier.create("normal")),
      "minecraft:ender_chest": SpecialRenderers2.chestRenderer(Identifier.create("ender")),
      "minecraft:trapped_chest": SpecialRenderers2.chestRenderer(Identifier.create("trapped")),
      "minecraft:copper_chest": SpecialRenderers2.chestRenderer(Identifier.create("copper")),
      "minecraft:exposed_copper_chest": SpecialRenderers2.chestRenderer(Identifier.create("copper_exposed")),
      "minecraft:weathered_copper_chest": SpecialRenderers2.chestRenderer(Identifier.create("copper_weathered")),
      "minecraft:oxidized_copper_chest": SpecialRenderers2.chestRenderer(Identifier.create("copper_oxidized")),
      "minecraft:waxed_copper_chest": SpecialRenderers2.chestRenderer(Identifier.create("copper")),
      "minecraft:waxed_exposed_copper_chest": SpecialRenderers2.chestRenderer(Identifier.create("copper_exposed")),
      "minecraft:waxed_weathered_copper_chest": SpecialRenderers2.chestRenderer(Identifier.create("copper_weathered")),
      "minecraft:waxed_oxidized_copper_chest": SpecialRenderers2.chestRenderer(Identifier.create("copper_oxidized"))
    }));
    const SkullRenderers = new Map(Object.entries({
      "minecraft:skeleton_skull": SpecialRenderers2.headRenderer(Identifier.create("skeleton/skeleton"), 2),
      "minecraft:wither_skeleton_skull": SpecialRenderers2.headRenderer(Identifier.create("skeleton/wither_skeleton"), 2),
      "minecraft:zombie_head": SpecialRenderers2.headRenderer(Identifier.create("zombie/zombie"), 1),
      "minecraft:creeper_head": SpecialRenderers2.headRenderer(Identifier.create("creeper/creeper"), 2),
      "minecraft:dragon_head": SpecialRenderers2.dragonHeadRenderer(),
      "minecraft:piglin_head": SpecialRenderers2.piglinHeadRenderer(),
      "minecraft:player_head": SpecialRenderers2.headRenderer(Identifier.create("player/wide/steve"), 1)
      // TODO: fix texture
    }));
    const WoodTypes = [
      "oak",
      "spruce",
      "birch",
      "jungle",
      "acacia",
      "dark_oak",
      "mangrove",
      "cherry",
      "bamboo",
      "crimson",
      "warped"
    ];
    const SignRenderers = new Map(WoodTypes.map((type) => [`minecraft:${type}_sign`, SpecialRenderers2.signRenderer(Identifier.create(type))]));
    const WallSignRenderers = new Map(WoodTypes.map((type) => [`minecraft:${type}_wall_sign`, SpecialRenderers2.wallSignRenderer(Identifier.create(type))]));
    const HangingSignRenderers = new Map(WoodTypes.map((type) => [`minecraft:${type}_hanging_sign`, SpecialRenderers2.hangingSignRenderer(Identifier.create(type))]));
    const WallHangingSignRenderers = new Map(WoodTypes.map((type) => [`minecraft:${type}_wall_hanging_sign`, SpecialRenderers2.wallHangingSignRenderer(type)]));
    const ShulkerBoxRenderers = new Map(Object.keys(DyeColors).map((color) => [`minecraft:${color}_shulker_box`, SpecialRenderers2.shulkerBoxRenderer(Identifier.create(`shulker_${color}`))]));
    const BedRenderers = new Map(Object.keys(DyeColors).map((color) => [`minecraft:${color}_bed`, SpecialRenderers2.bedRenderer(Identifier.create(color))]));
    const BannerRenderers = new Map(Object.keys(DyeColors).map((color) => [`minecraft:${color}_banner`, SpecialRenderers2.bannerRenderer(color)]));
    const WallBannerRenderers = new Map(Object.keys(DyeColors).map((color) => [`minecraft:${color}_wall_banner`, SpecialRenderers2.wallBannerRenderer(color)]));
    function getBlockMesh(block, nbt, atlas, cull) {
      const mesh = new Mesh();
      if (block.is("water")) {
        mesh.merge(liquidRenderer("water", getInt(block, "level"), atlas, cull, 0));
      }
      if (block.is("lava")) {
        mesh.merge(liquidRenderer("lava", getInt(block, "level"), atlas, cull));
      }
      const chestRenderer2 = ChestRenderers.get(block.getName().toString());
      if (chestRenderer2 !== void 0) {
        const facing = getStr(block, "facing", "south");
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.rotateY(t2, t2, facing === "west" ? Math.PI / 2 : facing === "south" ? Math.PI : facing === "east" ? Math.PI * 3 / 2 : 0);
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(chestRenderer2(atlas).transform(t2));
      }
      if (block.is("decorated_pot")) {
        mesh.merge(decoratedPotRenderer(atlas));
      }
      const skullRenderer = SkullRenderers.get(block.getName().toString());
      if (skullRenderer !== void 0) {
        const rotation = getInt(block, "rotation") / 16 * Math.PI * 2;
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.rotateY(t2, t2, rotation);
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(skullRenderer(atlas).transform(t2));
      }
      const signRenderer2 = SignRenderers.get(block.getName().toString());
      if (signRenderer2 !== void 0) {
        const rotation = getInt(block, "rotation") / 16 * Math.PI * 2;
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.rotateY(t2, t2, rotation);
        mat4_exports.scale(t2, t2, [2 / 3, 2 / 3, 2 / 3]);
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(signRenderer2(atlas).transform(t2));
      }
      const wallSignRenderer2 = WallSignRenderers.get(block.getName().toString());
      if (wallSignRenderer2 !== void 0) {
        const facing = getStr(block, "facing", "south");
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.rotateY(t2, t2, facing === "west" ? Math.PI / 2 : facing === "south" ? Math.PI : facing === "east" ? Math.PI * 3 / 2 : 0);
        mat4_exports.scale(t2, t2, [2 / 3, 2 / 3, 2 / 3]);
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(wallSignRenderer2(atlas).transform(t2));
      }
      const hangingSignRenderer2 = HangingSignRenderers.get(block.getName().toString());
      if (hangingSignRenderer2 !== void 0) {
        const attached = getStr(block, "attached", "false") === "true";
        const rotation = getInt(block, "rotation") / 16 * Math.PI * 2;
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.rotateY(t2, t2, rotation);
        mat4_exports.scale(t2, t2, [2 / 3, 2 / 3, 2 / 3]);
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(hangingSignRenderer2(attached, atlas).transform(t2));
      }
      const wallHangingSignRenderer2 = WallHangingSignRenderers.get(block.getName().toString());
      if (wallHangingSignRenderer2 !== void 0) {
        const facing = getStr(block, "facing", "south");
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.rotateY(t2, t2, facing === "west" ? Math.PI / 2 : facing === "south" ? Math.PI : facing === "east" ? Math.PI * 3 / 2 : 0);
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(wallHangingSignRenderer2(atlas).transform(t2));
      }
      if (block.is("conduit")) {
        mesh.merge(conduitRenderer(atlas));
      }
      const shulkerBoxRenderer2 = ShulkerBoxRenderers.get(block.getName().toString());
      if (shulkerBoxRenderer2 !== void 0) {
        const facing = getStr(block, "facing", "up");
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        if (facing === "down") {
          mat4_exports.rotateX(t2, t2, Math.PI);
        } else if (facing !== "up") {
          mat4_exports.rotateY(t2, t2, facing === "east" ? Math.PI / 2 : facing === "north" ? Math.PI : facing === "west" ? Math.PI * 3 / 2 : 0);
          mat4_exports.rotateX(t2, t2, Math.PI / 2);
        }
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(shulkerBoxRenderer2(atlas).transform(t2));
      }
      if (block.is("bell")) {
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.scale(t2, t2, [1, -1, -1]);
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(bellRenderer(atlas).transform(t2));
      }
      const bedRenderer2 = BedRenderers.get(block.getName().toString());
      if (bedRenderer2 !== void 0) {
        const part = getStr(block, "part", "head");
        const facing = getStr(block, "facing", "south");
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.rotateY(t2, t2, facing === "east" ? Math.PI / 2 : facing === "north" ? Math.PI : facing === "west" ? Math.PI * 3 / 2 : 0);
        mat4_exports.translate(t2, t2, [-8, -8, -8]);
        mesh.merge(bedRenderer2(part, atlas).transform(t2));
      }
      const bannerRenderer = BannerRenderers.get(block.getName().toString());
      if (bannerRenderer !== void 0) {
        const rotation = getInt(block, "rotation") / 16 * Math.PI * 2;
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 24, 8]);
        mat4_exports.rotateY(t2, t2, rotation);
        mat4_exports.scale(t2, t2, [2 / 3, 2 / 3, 2 / 3]);
        mat4_exports.translate(t2, t2, [-8, -24, -8]);
        mesh.merge(bannerRenderer(atlas, nbt?.getList("patterns", NbtType.Compound)).transform(t2));
      }
      const wallBannerRenderer = WallBannerRenderers.get(block.getName().toString());
      if (wallBannerRenderer !== void 0) {
        const facing = getStr(block, "facing", "south");
        const t2 = mat4_exports.create();
        mat4_exports.translate(t2, t2, [8, 8, 8]);
        mat4_exports.rotateY(t2, t2, facing === "east" ? Math.PI / 2 : facing === "north" ? Math.PI : facing === "west" ? Math.PI * 3 / 2 : 0);
        mat4_exports.scale(t2, t2, [2 / 3, 2 / 3, 2 / 3]);
        mat4_exports.translate(t2, t2, [-8, -23.2, -8]);
        mesh.merge(wallBannerRenderer(atlas, nbt?.getList("patterns", NbtType.Compound)).transform(t2));
      }
      if (!block.is("water") && !block.is("lava") && block.isWaterlogged()) {
        mesh.merge(liquidRenderer("water", 0, atlas, cull, 0));
      }
      const t = mat4_exports.create();
      mat4_exports.scale(t, t, [0.0625, 0.0625, 0.0625]);
      return mesh.transform(t);
    }
    SpecialRenderers2.getBlockMesh = getBlockMesh;
  })(SpecialRenderers || (SpecialRenderers = {}));

  // node_modules/deepslate/lib/render/ChunkBuilder.js
  var ChunkBuilder = class {
    gl;
    structure;
    resources;
    chunks = [];
    chunkSize;
    constructor(gl, structure, resources, chunkSize = 16) {
      this.gl = gl;
      this.structure = structure;
      this.resources = resources;
      this.chunkSize = typeof chunkSize === "number" ? [chunkSize, chunkSize, chunkSize] : chunkSize;
      this.updateStructureBuffers();
    }
    setStructure(structure) {
      this.structure = structure;
      this.updateStructureBuffers();
    }
    updateStructureBuffers(chunkPositions) {
      if (!this.structure)
        return;
      if (!chunkPositions) {
        this.chunks.forEach((x) => x.forEach((y) => y.forEach((chunk) => {
          chunk.mesh.clear();
          chunk.transparentMesh.clear();
        })));
      } else {
        chunkPositions.forEach((chunkPos) => {
          const chunk = this.getChunk(chunkPos);
          chunk.mesh.clear();
          chunk.transparentMesh.clear();
        });
      }
      for (const b of this.structure.getBlocks()) {
        const blockName = b.state.getName();
        const blockProps = b.state.getProperties();
        const defaultProps = this.resources.getDefaultBlockProperties(blockName) ?? {};
        Object.entries(defaultProps).forEach(([k, v]) => {
          if (!blockProps[k])
            blockProps[k] = v;
        });
        const chunkPos = [Math.floor(b.pos[0] / this.chunkSize[0]), Math.floor(b.pos[1] / this.chunkSize[1]), Math.floor(b.pos[2] / this.chunkSize[2])];
        if (chunkPositions && !chunkPositions.some((pos) => vec3_exports.equals(pos, chunkPos)))
          continue;
        const chunk = this.getChunk(chunkPos);
        try {
          const blockDefinition = this.resources.getBlockDefinition(blockName);
          const cull = {
            up: this.needsCull(b, Direction.UP),
            down: this.needsCull(b, Direction.DOWN),
            west: this.needsCull(b, Direction.WEST),
            east: this.needsCull(b, Direction.EAST),
            north: this.needsCull(b, Direction.NORTH),
            south: this.needsCull(b, Direction.SOUTH)
          };
          const mesh = new Mesh();
          if (blockDefinition) {
            mesh.merge(blockDefinition.getMesh(blockName, blockProps, this.resources, this.resources, cull));
          }
          const specialMesh = SpecialRenderers.getBlockMesh(b.state, b.nbt, this.resources, cull);
          if (!specialMesh.isEmpty()) {
            mesh.merge(specialMesh);
          }
          if (!mesh.isEmpty()) {
            this.finishChunkMesh(mesh, b.pos);
            if (this.resources.getBlockFlags(b.state.getName())?.semi_transparent) {
              chunk.transparentMesh.merge(mesh);
            } else {
              chunk.mesh.merge(mesh);
            }
          }
        } catch (e) {
          console.error(`Error rendering block ${blockName}`, e);
        }
      }
      if (!chunkPositions) {
        this.chunks.forEach((x) => x.forEach((y) => y.forEach((chunk) => {
          chunk.mesh.rebuild(this.gl, { pos: true, color: true, texture: true, normal: true, blockPos: true });
          chunk.transparentMesh.rebuild(this.gl, { pos: true, color: true, texture: true, normal: true, blockPos: true });
        })));
      } else {
        chunkPositions.forEach((chunkPos) => {
          const chunk = this.getChunk(chunkPos);
          chunk.mesh.rebuild(this.gl, { pos: true, color: true, texture: true, normal: true, blockPos: true });
          chunk.transparentMesh.rebuild(this.gl, { pos: true, color: true, texture: true, normal: true, blockPos: true });
        });
      }
    }
    getMeshes() {
      const chunks = this.chunks.flatMap((x) => x.flatMap((y) => y.flatMap((chunk) => chunk ?? [])));
      return chunks.flatMap((chunk) => chunk.mesh.isEmpty() ? [] : chunk.mesh).concat(chunks.flatMap((chunk) => chunk.transparentMesh.isEmpty() ? [] : chunk.transparentMesh));
    }
    needsCull(block, dir) {
      const neighbor = this.structure.getBlock(BlockPos.towards(block.pos, dir))?.state;
      if (!neighbor)
        return false;
      const neighborFlags = this.resources.getBlockFlags(neighbor.getName());
      if (block.state.getName().equals(neighbor.getName()) && neighborFlags?.self_culling) {
        return true;
      }
      if (neighborFlags?.opaque) {
        return !(dir === Direction.UP && block.state.isWaterlogged());
      } else {
        return block.state.isWaterlogged() && neighbor.isWaterlogged();
      }
    }
    finishChunkMesh(mesh, pos) {
      const t = mat4_exports.create();
      mat4_exports.translate(t, t, pos);
      mesh.transform(t);
      for (const q of mesh.quads) {
        const normal = q.normal();
        q.forEach((v) => v.normal = normal);
        q.forEach((v) => v.blockPos = new Vector(pos[0], pos[1], pos[2]));
      }
    }
    getChunk(chunkPos) {
      const x = Math.abs(chunkPos[0]) * 2 + (chunkPos[0] < 0 ? 1 : 0);
      const y = Math.abs(chunkPos[1]) * 2 + (chunkPos[1] < 0 ? 1 : 0);
      const z = Math.abs(chunkPos[2]) * 2 + (chunkPos[2] < 0 ? 1 : 0);
      if (!this.chunks[x])
        this.chunks[x] = [];
      if (!this.chunks[x][y])
        this.chunks[x][y] = [];
      if (!this.chunks[x][y][z])
        this.chunks[x][y][z] = { mesh: new Mesh(), transparentMesh: new Mesh() };
      return this.chunks[x][y][z];
    }
  };

  // node_modules/deepslate/lib/render/ShaderProgram.js
  var ShaderProgram = class {
    gl;
    program;
    constructor(gl, vsSource2, fsSource2) {
      this.gl = gl;
      this.program = this.initShaderProgram(vsSource2, fsSource2);
    }
    getProgram() {
      return this.program;
    }
    initShaderProgram(vsSource2, fsSource2) {
      const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource2);
      const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource2);
      const shaderProgram = this.gl.createProgram();
      this.gl.attachShader(shaderProgram, vertexShader);
      this.gl.attachShader(shaderProgram, fragmentShader);
      this.gl.linkProgram(shaderProgram);
      if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
        throw new Error(`Unable to link shader program: ${this.gl.getProgramInfoLog(shaderProgram)}`);
      }
      return shaderProgram;
    }
    loadShader(type, source) {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        const error = new Error(`Compiling ${type === this.gl.VERTEX_SHADER ? "vertex" : "fragment"} shader: ${this.gl.getShaderInfoLog(shader)}`);
        this.gl.deleteShader(shader);
        throw error;
      }
      return shader;
    }
  };

  // node_modules/deepslate/lib/render/Renderer.js
  var vsSource = `
  attribute vec4 vertPos;
  attribute vec2 texCoord;
  attribute vec4 texLimit;
  attribute vec3 vertColor;
  attribute vec3 normal;

  uniform mat4 mView;
  uniform mat4 mProj;

  varying highp vec2 vTexCoord;
  varying highp vec4 vTexLimit;
  varying highp vec3 vTintColor;
  varying highp float vLighting;

  void main(void) {
    gl_Position = mProj * mView * vertPos;
    vTexCoord = texCoord;
	vTexLimit = texLimit;
    vTintColor = vertColor;
    vLighting = normal.y * 0.2 + abs(normal.z) * 0.1 + 0.8;
  }
`;
  var fsSource = `
  precision highp float;
  varying highp vec2 vTexCoord;
  varying highp vec4 vTexLimit;
  varying highp vec3 vTintColor;
  varying highp float vLighting;

  uniform sampler2D sampler;
  uniform highp float pixelSize;

  void main(void) {
		vec4 texColor = texture2D(sampler, clamp(vTexCoord,
			vTexLimit.xy + vec2(0.5, 0.5) * pixelSize,
			vTexLimit.zw - vec2(0.5, 0.5) * pixelSize
		));
		if(texColor.a < 0.01) discard;
		gl_FragColor = vec4(texColor.xyz * vTintColor * vLighting, texColor.a);
  }
`;
  var Renderer = class {
    gl;
    shaderProgram;
    projMatrix;
    activeShader;
    pixelSize = 0;
    constructor(gl) {
      this.gl = gl;
      this.shaderProgram = new ShaderProgram(gl, vsSource, fsSource).getProgram();
      this.activeShader = this.shaderProgram;
      this.projMatrix = this.getPerspective();
      this.initialize();
    }
    setViewport(x, y, width, height) {
      this.gl.viewport(x, y, width, height);
      this.projMatrix = this.getPerspective();
    }
    getPerspective() {
      const fieldOfView = 70 * Math.PI / 180;
      const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
      const projMatrix = mat4_exports.create();
      mat4_exports.perspective(projMatrix, fieldOfView, aspect, 0.1, 500);
      return projMatrix;
    }
    initialize() {
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.LEQUAL);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.gl.BACK);
    }
    setShader(shader) {
      this.gl.useProgram(shader);
      this.activeShader = shader;
    }
    setVertexAttr(name, size, buffer) {
      if (buffer === void 0)
        throw new Error(`Expected buffer for ${name}`);
      const location = this.gl.getAttribLocation(this.activeShader, name);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(location);
    }
    setUniform(name, value) {
      const location = this.gl.getUniformLocation(this.activeShader, name);
      this.gl.uniformMatrix4fv(location, false, value);
    }
    setTexture(texture, pixelSize) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.pixelSize = pixelSize ?? 0;
    }
    createAtlasTexture(image) {
      const texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      return texture;
    }
    prepareDraw(viewMatrix) {
      this.setUniform("mView", viewMatrix);
      this.setUniform("mProj", this.projMatrix);
      const location = this.gl.getUniformLocation(this.activeShader, "pixelSize");
      this.gl.uniform1f(location, this.pixelSize);
    }
    drawMesh(mesh, options) {
      if (mesh.quadVertices() > 0) {
        if (options.pos)
          this.setVertexAttr("vertPos", 3, mesh.posBuffer);
        if (options.color)
          this.setVertexAttr("vertColor", 3, mesh.colorBuffer);
        if (options.texture) {
          this.setVertexAttr("texCoord", 2, mesh.textureBuffer);
          this.setVertexAttr("texLimit", 4, mesh.textureLimitBuffer);
        }
        if (options.normal)
          this.setVertexAttr("normal", 3, mesh.normalBuffer);
        if (options.blockPos)
          this.setVertexAttr("blockPos", 3, mesh.blockPosBuffer);
        if (!mesh.indexBuffer)
          throw new Error("Expected index buffer");
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, mesh.quadIndices(), this.gl.UNSIGNED_SHORT, 0);
      }
      if (mesh.lineVertices() > 0) {
        if (options.pos)
          this.setVertexAttr("vertPos", 3, mesh.linePosBuffer);
        if (options.color)
          this.setVertexAttr("vertColor", 3, mesh.lineColorBuffer);
        this.gl.drawArrays(this.gl.LINES, 0, mesh.lineVertices());
      }
    }
  };

  // node_modules/deepslate/lib/render/ItemRenderer.js
  var ItemRenderer = class _ItemRenderer extends Renderer {
    item;
    resources;
    mesh;
    atlasTexture;
    constructor(gl, item, resources, context = {}) {
      super(gl);
      this.item = item;
      this.resources = resources;
      this.updateMesh(context);
      this.atlasTexture = this.createAtlasTexture(this.resources.getTextureAtlas());
    }
    setItem(item, context = {}) {
      this.item = item;
      this.updateMesh(context);
    }
    updateMesh(context = {}) {
      this.mesh = _ItemRenderer.getItemMesh(this.item, this.resources, context);
      this.mesh.computeNormals();
      this.mesh.rebuild(this.gl, { pos: true, color: true, texture: true, normal: true });
    }
    static getItemMesh(item, resources, context) {
      const itemModelId = item.getComponent("item_model", resources)?.getAsString();
      if (itemModelId === void 0) {
        return new Mesh();
      }
      const itemModel = resources.getItemModel(Identifier.parse(itemModelId));
      if (!itemModel) {
        throw new Error(`Item model ${itemModelId} does not exist (defined by item ${item.toString()})`);
      }
      const mesh = itemModel.getMesh(item, resources, context);
      return mesh;
    }
    getPerspective() {
      const projMatrix = mat4_exports.create();
      mat4_exports.ortho(projMatrix, 0, 16, 0, 16, 0.1, 500);
      return projMatrix;
    }
    drawItem() {
      const view = mat4_exports.create();
      mat4_exports.translate(view, view, [0, 0, -32]);
      this.setShader(this.shaderProgram);
      this.setTexture(this.atlasTexture, this.resources.getPixelSize?.());
      this.prepareDraw(view);
      this.drawMesh(this.mesh, { pos: true, color: true, texture: true, normal: true });
    }
  };

  // node_modules/deepslate/lib/render/ItemTint.js
  var INVALID_COLOR = [0, 0, 0];
  var ItemTint;
  (function(ItemTint2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      switch (type) {
        case "constant":
          return new Constant(Color.fromJson(root.value) ?? INVALID_COLOR);
        case "dye":
          return new Dye(Color.fromJson(root.default) ?? INVALID_COLOR);
        case "grass":
          return new Grass(Json.readNumber(root.temperature) ?? 0, Json.readNumber(root.downfall) ?? 0);
        case "firework":
          return new Firework(Color.fromJson(root.default) ?? INVALID_COLOR);
        case "potion":
          return new Potion(Color.fromJson(root.default) ?? INVALID_COLOR);
        case "map_color":
          return new MapColor(Color.fromJson(root.default) ?? INVALID_COLOR);
        case "custom_model_data":
          return new CustomModelData(Json.readInt(root.index) ?? 0, Color.fromJson(root.default) ?? INVALID_COLOR);
        case "team":
          return new Team(Color.fromJson(root.default) ?? INVALID_COLOR);
        default:
          throw new Error(`Invalid item tint type ${type}`);
      }
    }
    ItemTint2.fromJson = fromJson;
    class Constant {
      value;
      constructor(value) {
        this.value = value;
      }
      getTint(item) {
        return this.value;
      }
    }
    ItemTint2.Constant = Constant;
    class Dye {
      default_color;
      constructor(default_color) {
        this.default_color = default_color;
      }
      getTint(item, resources) {
        const tag = item.getComponent("dyed_color", resources);
        if (!tag) {
          return this.default_color;
        }
        if (!tag.isCompound()) {
          return Color.intToRgb(tag.getAsNumber());
        }
        return Color.intToRgb(tag.getNumber("rgb"));
      }
    }
    ItemTint2.Dye = Dye;
    class Grass {
      temperature;
      downfall;
      constructor(temperature, downfall) {
        this.temperature = temperature;
        this.downfall = downfall;
      }
      getTint(item) {
        return [124 / 255, 189 / 255, 107 / 255];
      }
    }
    ItemTint2.Grass = Grass;
    class Firework {
      default_color;
      constructor(default_color) {
        this.default_color = default_color;
      }
      getTint(item, resources) {
        const tag = item.getComponent("firework_explosion", resources);
        if (!tag?.isCompound()) {
          return this.default_color;
        }
        const colors = tag.get("colors");
        if (!colors || !colors.isListOrArray()) {
          return this.default_color;
        }
        const color = (() => {
          if (colors.length === 1) {
            return Color.intToRgb(colors.get(0).getAsNumber());
          }
          let [r, g, b] = [0, 0, 0];
          for (const color2 of colors.getItems()) {
            r += (color2.getAsNumber() & 16711680) >> 16;
            g += (color2.getAsNumber() & 65280) >> 8;
            b += (color2.getAsNumber() & 255) >> 0;
          }
          r /= colors.length;
          g /= colors.length;
          b /= colors.length;
          return [r / 255, g / 255, b / 255];
        })();
        return color;
      }
    }
    ItemTint2.Firework = Firework;
    class Potion {
      default_color;
      constructor(default_color) {
        this.default_color = default_color;
      }
      getTint(item, resources) {
        const tag = item.getComponent("potion_contents", resources);
        if (!tag) {
          return this.default_color;
        }
        const potionContents = PotionContents.fromNbt(tag);
        return PotionContents.getColor(potionContents);
      }
    }
    ItemTint2.Potion = Potion;
    class MapColor {
      default_color;
      constructor(default_color) {
        this.default_color = default_color;
      }
      getTint(item, resources) {
        const mapColor = item.getComponent("map_color", resources);
        if (!mapColor) {
          return this.default_color;
        }
        return Color.intToRgb(mapColor.getAsNumber());
      }
    }
    ItemTint2.MapColor = MapColor;
    class CustomModelData {
      index;
      default_color;
      constructor(index, default_color) {
        this.index = index;
        this.default_color = default_color;
      }
      getTint(item, resources) {
        const tag = item.getComponent("custom_model_data", resources);
        if (!tag?.isCompound()) {
          return this.default_color;
        }
        const colors = tag.getList("colors").get(this.index);
        if (!colors) {
          return this.default_color;
        }
        return Color.fromNbt(colors) ?? this.default_color;
      }
    }
    ItemTint2.CustomModelData = CustomModelData;
    class Team {
      default_color;
      constructor(default_color) {
        this.default_color = default_color;
      }
      getTint(item, resources, context) {
        return context.context_entity_team_color ?? this.default_color;
      }
    }
    ItemTint2.Team = Team;
  })(ItemTint || (ItemTint = {}));

  // node_modules/deepslate/lib/render/SpecialModel.js
  var SpecialModel;
  (function(SpecialModel2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      switch (type) {
        case "bed":
          return new Bed(Identifier.parse(Json.readString(root.texture) ?? ""));
        case "banner":
          return new Banner(Json.readString(root.color) ?? "");
        case "conduit":
          return new Conduit();
        case "chest":
          return new Chest(Identifier.parse(Json.readString(root.texture) ?? ""), Json.readNumber(root.openness) ?? 0);
        case "head":
          return new Head(Json.readString(root.kind) ?? "", typeof root.texture === "string" ? Identifier.parse(root.texture) : void 0, Json.readNumber(root.animation) ?? 0);
        case "player_head":
          return new Head("player", void 0, 0);
        case "shulker_box":
          return new ShulkerBox(Identifier.parse(Json.readString(root.texture) ?? ""), Json.readNumber(root.openness) ?? 0, Json.readString(root.orientation) ?? "up");
        case "shield":
          return new Shield();
        case "trident":
          return new Trident();
        case "decorated_pot":
          return new DecoratedPot();
        case "standing_sign":
          return new StandingSign(Json.readString(root.wood_type) ?? "", typeof root.texture === "string" ? Identifier.parse(root.texture) : void 0);
        case "hanging_sign":
          return new HangingSign(Json.readString(root.wood_type) ?? "", typeof root.texture === "string" ? Identifier.parse(root.texture) : void 0);
        default:
          console.warn(`[deepslate]: Unknown special model ${type}`);
          return { getMesh: () => new Mesh() };
      }
    }
    SpecialModel2.fromJson = fromJson;
    class Bed {
      renderer;
      constructor(texture) {
        this.renderer = SpecialRenderers.bedRenderer(texture);
      }
      getMesh(item, resources) {
        const headMesh = this.renderer("head", resources);
        const footMesh = this.renderer("foot", resources);
        const t = mat4_exports.create();
        mat4_exports.translate(t, t, [0, 0, -16]);
        return headMesh.merge(footMesh.transform(t));
      }
    }
    class Banner {
      renderer;
      constructor(color) {
        this.renderer = SpecialRenderers.bannerRenderer(color);
      }
      getMesh(item, resources) {
        const patterns = item.getComponent("banner_patterns", void 0);
        const t = mat4_exports.create();
        mat4_exports.translate(t, t, [8, 24, 8]);
        mat4_exports.rotateY(t, t, Math.PI);
        mat4_exports.scale(t, t, [2 / 3, 2 / 3, 2 / 3]);
        mat4_exports.translate(t, t, [-8, -24, -8]);
        return this.renderer(resources, patterns instanceof NbtList ? patterns : void 0).transform(t);
      }
    }
    class Conduit {
      getMesh(item, resources) {
        return SpecialRenderers.conduitRenderer(resources);
      }
    }
    class Chest {
      renderer;
      constructor(texture, openness) {
        this.renderer = SpecialRenderers.chestRenderer(texture);
      }
      getMesh(item, resources) {
        const t = mat4_exports.create();
        mat4_exports.translate(t, t, [8, 8, 8]);
        mat4_exports.rotateY(t, t, Math.PI);
        mat4_exports.translate(t, t, [-8, -8, -8]);
        return this.renderer(resources).transform(t);
      }
    }
    class Head {
      renderer;
      constructor(kind, texture, animation) {
        this.renderer = ({
          skeleton: () => SpecialRenderers.headRenderer(texture ?? Identifier.create("skeleton/skeleton"), 2),
          wither_skeleton: () => SpecialRenderers.headRenderer(texture ?? Identifier.create("skeleton/wither_skeleton"), 2),
          zombie: () => SpecialRenderers.headRenderer(texture ?? Identifier.create("zombie/zombie"), 1),
          creeper: () => SpecialRenderers.headRenderer(texture ?? Identifier.create("creeper/creeper"), 2),
          dragon: () => SpecialRenderers.dragonHeadRenderer(texture),
          piglin: () => SpecialRenderers.piglinHeadRenderer(texture),
          player: () => SpecialRenderers.headRenderer(texture ?? Identifier.create("player/wide/steve"), 1)
          // TODO: fix texture
        }[kind] ?? (() => () => new Mesh()))();
      }
      getMesh(item, resources) {
        return this.renderer(resources);
      }
    }
    class ShulkerBox {
      renderer;
      constructor(texture, openness, orientation) {
        this.renderer = SpecialRenderers.shulkerBoxRenderer(texture);
      }
      getMesh(item, resources) {
        return this.renderer(resources);
      }
    }
    class Shield {
      getMesh(item, resources) {
        const shieldMesh = SpecialRenderers.shieldRenderer(resources);
        const t = mat4_exports.create();
        mat4_exports.translate(t, t, [-3, 1, 0]);
        mat4_exports.rotateX(t, t, -10 * Math.PI / 180);
        mat4_exports.rotateY(t, t, -10 * Math.PI / 180);
        mat4_exports.rotateZ(t, t, -5 * Math.PI / 180);
        return shieldMesh.transform(t);
      }
    }
    class Trident {
      getMesh(item, resources) {
        return new Mesh();
      }
    }
    class DecoratedPot {
      getMesh(item, resources) {
        return SpecialRenderers.decoratedPotRenderer(resources);
      }
    }
    class StandingSign {
      renderer;
      constructor(wood_type, texture) {
        this.renderer = SpecialRenderers.signRenderer(texture ?? Identifier.create(wood_type));
      }
      getMesh(item, resources) {
        return this.renderer(resources);
      }
    }
    class HangingSign {
      renderer;
      constructor(wood_type, texture) {
        this.renderer = SpecialRenderers.hangingSignRenderer(texture ?? Identifier.create(wood_type));
      }
      getMesh(item, resources) {
        return this.renderer(false, resources);
      }
    }
  })(SpecialModel || (SpecialModel = {}));

  // node_modules/deepslate/lib/render/ItemModel.js
  var MISSING_MESH = new Mesh();
  var ItemModel;
  (function(ItemModel2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      switch (type) {
        case "empty":
          return new Empty();
        case "model":
          return new Model(Identifier.parse(Json.readString(root.model) ?? ""), Json.readArray(root.tints, ItemTint.fromJson) ?? []);
        case "composite":
          return new Composite(Json.readArray(root.models, ItemModel2.fromJson) ?? []);
        case "condition":
          return new Condition(Condition.propertyFromJson(root), ItemModel2.fromJson(root.on_true), ItemModel2.fromJson(root.on_false));
        case "select":
          return new Select(Select.propertyFromJson(root), new Map(Json.readArray(root.cases, (e) => Json.readObject(e) ?? {})?.flatMap((caseRoot) => {
            const model = ItemModel2.fromJson(caseRoot.model);
            if (Array.isArray(caseRoot.when)) {
              return caseRoot.when.map((w) => [Json.readString(w) ?? "", model]);
            } else {
              return [[Json.readString(caseRoot.when) ?? "", model]];
            }
          })), root.fallback ? ItemModel2.fromJson(root.fallback) : void 0);
        case "range_dispatch":
          return new RangeDispatch(RangeDispatch.propertyFromJson(root), Json.readNumber(root.scale) ?? 1, Json.readArray(root.entries, (entryObj) => {
            const entryRoot = Json.readObject(entryObj) ?? {};
            return { threshold: Json.readNumber(entryRoot.threshold) ?? 0, model: ItemModel2.fromJson(entryRoot.model) };
          }) ?? [], root.fallback ? ItemModel2.fromJson(root.fallback) : void 0);
        case "special":
          return new Special(SpecialModel.fromJson(root.model), Identifier.parse(Json.readString(root.base) ?? ""));
        case "bundle/selected_item":
          return new BundleSelectedItem();
        default:
          console.warn(`[deepslate]: Unknown item model type '${type}'`);
          return { getMesh: () => new Mesh() };
      }
    }
    ItemModel2.fromJson = fromJson;
    class Empty {
      getMesh(item, resources, context) {
        return new Mesh();
      }
    }
    ItemModel2.Empty = Empty;
    class Model {
      modelId;
      tints;
      constructor(modelId, tints) {
        this.modelId = modelId;
        this.tints = tints;
      }
      getMesh(item, resources, context) {
        const model = resources.getBlockModel(this.modelId);
        if (!model) {
          console.warn(`[deepslate]: Model '${this.modelId}' does not exist`);
          return new Mesh();
        }
        const tint = (i) => {
          if (i < this.tints.length) {
            return this.tints[i].getTint(item, resources, context);
          } else {
            return [1, 1, 1];
          }
        };
        const mesh = model.getMesh(resources, Cull.none(), tint);
        mesh.transform(model.getDisplayTransform(context.display_context ?? "gui"));
        return mesh;
      }
    }
    ItemModel2.Model = Model;
    class Composite {
      models;
      constructor(models) {
        this.models = models;
      }
      getMesh(item, resources, context) {
        const mesh = new Mesh();
        this.models.forEach((model) => mesh.merge(model.getMesh(item, resources, context)));
        return mesh;
      }
    }
    ItemModel2.Composite = Composite;
    class Condition {
      property;
      onTrue;
      onFalse;
      constructor(property, onTrue, onFalse) {
        this.property = property;
        this.onTrue = onTrue;
        this.onFalse = onFalse;
      }
      getMesh(item, resources, context) {
        return (this.property(item, resources, context) ? this.onTrue : this.onFalse).getMesh(item, resources, context);
      }
      static propertyFromJson(root) {
        const property = Json.readString(root.property)?.replace(/^minecraft:/, "");
        switch (property) {
          case "fishing_rod/cast":
          case "selected":
          case "carried":
          case "extended_view":
            return (item, resources, context) => context[property] ?? false;
          case "view_entity":
            return (item, resources, context) => context.context_entity_is_view_entity ?? false;
          case "using_item":
            return (item, resources, context) => (context.use_duration ?? -1) >= 0;
          case "bundle/has_selected_item":
            return (item, resources, context) => (context["bundle/selected_item"] ?? -1) >= 0;
          case "broken":
            return (item, resources, context) => {
              const damage = item.getComponent("damage", resources)?.getAsNumber();
              const max_damage = item.getComponent("max_damage", resources)?.getAsNumber();
              return damage !== void 0 && max_damage !== void 0 && damage >= max_damage - 1;
            };
          case "damaged":
            return (item, resources, context) => {
              const damage = item.getComponent("damage", resources)?.getAsNumber();
              const max_damage = item.getComponent("max_damage", resources)?.getAsNumber();
              return damage !== void 0 && max_damage !== void 0 && damage >= 1;
            };
          case "has_component":
            const componentId = Identifier.parse(Json.readString(root.component) ?? "");
            const ignore_default = Json.readBoolean(root.ignore_default) ?? false;
            return (item, resources, context) => item.hasComponent(componentId, ignore_default ? void 0 : resources);
          case "keybind_down":
            const keybind = Json.readString(root.keybind) ?? "";
            return (item, resources, context) => context.keybind_down?.includes(keybind) ?? false;
          case "custom_model_data":
            const index = Json.readInt(root.index) ?? 0;
            return (item, resources, context) => {
              const tag = item.getComponent("custom_model_data", resources);
              if (!tag?.isCompound())
                return false;
              const flag = tag.getList("flags").getNumber(index);
              return flag !== void 0 && flag !== 0;
            };
          default:
            console.warn(`[deepslate]: Unknown condition property '${property}'`);
            return () => false;
        }
      }
    }
    ItemModel2.Condition = Condition;
    class Select {
      property;
      cases;
      fallback;
      constructor(property, cases, fallback) {
        this.property = property;
        this.cases = cases;
        this.fallback = fallback;
      }
      getMesh(item, resources, context) {
        const value = this.property(item, resources, context);
        return ((value !== null ? this.cases.get(value) : void 0) ?? this.fallback)?.getMesh(item, resources, context) ?? MISSING_MESH;
      }
      static propertyFromJson(root) {
        const property = Json.readString(root.property)?.replace(/^minecraft:/, "");
        switch (property) {
          case "main_hand":
            return (item, resources, context) => context.main_hand ?? "right";
          case "display_context":
            return (item, resources, context) => context.display_context ?? "gui";
          case "context_dimension":
            return (item, resources, context) => context.context_dimension?.toString() ?? null;
          case "charge_type":
            const FIREWORK = Identifier.create("firework_rocket");
            return (item, resources, context) => {
              const tag = item.getComponent("charged_projectiles", resources);
              if (!tag?.isList() || tag.length === 0) {
                return "none";
              }
              return tag.filter((tag2) => {
                if (!tag2.isCompound()) {
                  return false;
                }
                return Identifier.parse(tag2.getString("id")).equals(FIREWORK);
              }).length > 0 ? "rocket" : "arrow";
            };
          case "trim_material":
            return (item, resources, context) => {
              const tag = item.getComponent("trim", resources);
              if (!tag?.isCompound()) {
                return null;
              }
              return Identifier.parse(tag.getString("material")).toString();
            };
          case "block_state":
            const block_state_property = Json.readString(root.block_state_property) ?? "";
            return (item, resources, context) => {
              const tag = item.getComponent("block_state", resources);
              if (!tag?.isCompound()) {
                return null;
              }
              return tag.getString(block_state_property);
            };
          case "local_time":
            return (item, resources, context) => "NOT IMPLEMENTED";
          case "context_entity_type":
            return (item, resources, context) => context.context_entity_type?.toString() ?? null;
          case "custom_model_data":
            const index = Json.readInt(root.index) ?? 0;
            return (item, resources, context) => {
              const tag = item.getComponent("custom_model_data", resources);
              if (!tag?.isCompound()) {
                return null;
              }
              const list = tag.getList("strings");
              if (list.length <= index) {
                return null;
              }
              return list.getString(index);
            };
          default:
            console.warn(`[deepslate]: Unknown select property '${property}'`);
            return () => null;
        }
      }
    }
    ItemModel2.Select = Select;
    class RangeDispatch {
      property;
      scale;
      fallback;
      entries;
      constructor(property, scale4, entries, fallback) {
        this.property = property;
        this.scale = scale4;
        this.fallback = fallback;
        this.entries = entries.sort((a, b) => a.threshold - b.threshold);
      }
      getMesh(item, resources, context) {
        const value = this.property(item, resources, context) * this.scale;
        let model = this.fallback;
        for (const entry of this.entries) {
          if (entry.threshold <= value) {
            model = entry.model;
          } else {
            break;
          }
        }
        return model?.getMesh(item, resources, context) ?? MISSING_MESH;
      }
      static propertyFromJson(root) {
        const property = Json.readString(root.property)?.replace(/^minecraft:/, "");
        switch (property) {
          case "bundle/fullness":
            let calculateBundleWeight = function(item, resources) {
              const tag = item.getComponent("bundle_contents", resources);
              if (!tag?.isListOrArray()) {
                return 0;
              }
              const items = tag.map((t) => t.isCompound() ? ItemStack.fromNbt(t) : void 0);
              return items.reduce((weight, item2) => {
                if (item2 === void 0) {
                  return weight;
                }
                if (item2.hasComponent("bundle_contents", resources)) {
                  return weight + calculateBundleWeight(item2, resources) + 1 / 16;
                }
                const beesTag = item2.getComponent("bees", resources);
                if (beesTag?.isListOrArray() && beesTag.length > 0) {
                  return weight + 1;
                }
                const maxStackSize = item2.getComponent("max_stack_size", resources)?.getAsNumber() ?? 1;
                return weight + item2.count / maxStackSize;
              }, 0);
            };
            return (item, resources, context) => calculateBundleWeight(item, resources);
          case "damage": {
            const normalize2 = Json.readBoolean(root.normalize) ?? true;
            return (item, resources, context) => {
              const maxDamage = item.getComponent("max_damage", resources)?.getAsNumber() ?? 0;
              const damage = clamp(item.getComponent("damage", resources)?.getAsNumber() ?? 0, 0, maxDamage);
              if (normalize2)
                return clamp(damage / maxDamage, 0, 1);
              return clamp(damage, 0, maxDamage);
            };
          }
          case "count": {
            const normalize2 = Json.readBoolean(root.normalize) ?? true;
            return (item, resources, context) => {
              const maxStackSize = item.getComponent("max_stack_size", resources)?.getAsNumber() ?? 1;
              if (normalize2)
                return clamp(item.count / maxStackSize, 0, 1);
              return clamp(item.count, 0, maxStackSize);
            };
          }
          case "cooldown":
            return (item, resources, context) => {
              const tag = item.getComponent("use_cooldown", resources);
              const cooldownGroup = tag?.isCompound() ? Identifier.parse(tag.getString("cooldown_group") ?? item.id) : item.id;
              return context.cooldown_percentage?.[cooldownGroup.toString()] ?? 0;
            };
          case "time":
            const source = Json.readString(root.source) ?? "daytime";
            switch (source) {
              case "moon_phase":
                return (item, resources, context) => (context.game_time ?? 0) / 24e3 % 8 / 8;
              case "random":
                return (item, resources, context) => Math.random();
              default:
                return (item, resources, context) => {
                  const gameTime = context.game_time ?? 0;
                  const linearTime = gameTime / 24e3 % 1 - 0.25;
                  const cosTime = 0.5 - Math.cos(linearTime * Math.PI) / 2;
                  return (linearTime * 2 + cosTime) / 3;
                };
            }
          case "compass":
            return (item, resources, context) => context.compass_angle ?? 0;
          // TODO: calculate properly?
          case "crossbow/pull":
            return (item, resources, context) => context["crossbow/pull"] ?? 0;
          case "use_duration":
            const remaining = Json.readBoolean(root.remaining) ?? true;
            return (item, resources, context) => {
              if (context.use_duration === void 0 || context.use_duration < 0)
                return 0;
              if (remaining)
                return Math.max((context.max_use_duration ?? 0) - context.use_duration, 0);
              return context.use_duration;
            };
          case "use_cycle":
            const period = Json.readNumber(root.period) ?? 1;
            return (item, resources, context) => {
              if (context.use_duration === void 0 || context.use_duration < 0)
                return 0;
              return Math.max((context.max_use_duration ?? 0) - (context.use_duration ?? 0), 0) % period;
            };
          case "custom_model_data":
            const index = Json.readInt(root.index) ?? 0;
            return (item, resources, context) => {
              const tag = item.getComponent("custom_model_data", resources);
              if (!tag?.isCompound()) {
                return 0;
              }
              return tag.getList("floats").getNumber(index);
            };
          default:
            console.warn(`[deepslate]: Unknown range dispatch property '${property}'`);
            return () => 0;
        }
      }
    }
    ItemModel2.RangeDispatch = RangeDispatch;
    class Special {
      specialModel;
      base;
      constructor(specialModel, base) {
        this.specialModel = specialModel;
        this.base = base;
      }
      getMesh(item, resources, context) {
        const mesh = this.specialModel.getMesh(item, resources);
        const model = resources.getBlockModel(this.base);
        if (!model) {
          console.warn(`[deepslate]: Special model base '${this.base}' does not exist`);
          return new Mesh();
        }
        mesh.transform(model.getDisplayTransform(context.display_context ?? "gui"));
        return mesh;
      }
    }
    ItemModel2.Special = Special;
    class BundleSelectedItem {
      getMesh(item, resources, context) {
        const selectedItemIndex = context["bundle/selected_item"];
        if (selectedItemIndex === void 0 || selectedItemIndex < 0)
          return new Mesh();
        const tag = item.getComponent("bundle_contents", resources);
        if (!tag?.isListOrArray()) {
          return new Mesh();
        }
        const selectedItemTag = tag.get(selectedItemIndex);
        if (selectedItemTag === void 0 || !selectedItemTag.isCompound()) {
          return new Mesh();
        }
        const selectedItem = ItemStack.fromNbt(selectedItemTag);
        return ItemRenderer.getItemMesh(selectedItem, resources, {
          ...context,
          "bundle/selected_item": -1,
          selected: false,
          carried: false,
          use_duration: -1
        });
      }
    }
    ItemModel2.BundleSelectedItem = BundleSelectedItem;
  })(ItemModel || (ItemModel = {}));

  // node_modules/deepslate/lib/render/StructureRenderer.js
  var vsColor = `
  attribute vec4 vertPos;
  attribute vec3 blockPos;

  uniform mat4 mView;
  uniform mat4 mProj;

  varying highp vec3 vColor;

  void main(void) {
    gl_Position = mProj * mView * vertPos;
    vColor = blockPos / 256.0;
  }
`;
  var fsColor = `
  precision highp float;
  varying highp vec3 vColor;

  void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;
  var vsGrid = `
  attribute vec4 vertPos;
  attribute vec3 vertColor;

  uniform mat4 mView;
  uniform mat4 mProj;

  varying highp vec3 vColor;

  void main(void) {
    gl_Position = mProj * mView * vertPos;
    vColor = vertColor;
  }
`;
  var fsGrid = `
  precision highp float;
  varying highp vec3 vColor;

  void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;
  var StructureRenderer = class extends Renderer {
    structure;
    resources;
    gridShaderProgram;
    colorShaderProgram;
    gridMesh = new Mesh();
    outlineMesh = new Mesh();
    invisibleBlocksMesh = new Mesh();
    atlasTexture;
    useInvisibleBlocks;
    chunkBuilder;
    constructor(gl, structure, resources, options) {
      super(gl);
      this.structure = structure;
      this.resources = resources;
      const chunkSize = options?.chunkSize ?? 16;
      this.chunkBuilder = new ChunkBuilder(gl, structure, resources, chunkSize);
      if (options?.facesPerBuffer) {
        console.warn("[deepslate renderer warning]: facesPerBuffer option has been removed in favor of chunkSize");
      }
      this.useInvisibleBlocks = options?.useInvisibleBlockBuffer ?? true;
      this.gridShaderProgram = new ShaderProgram(gl, vsGrid, fsGrid).getProgram();
      this.colorShaderProgram = new ShaderProgram(gl, vsColor, fsColor).getProgram();
      this.gridMesh = this.getGridMesh();
      this.outlineMesh = this.getOutlineMesh();
      this.invisibleBlocksMesh = this.getInvisibleBlocksMesh();
      this.atlasTexture = this.createAtlasTexture(this.resources.getTextureAtlas());
    }
    setStructure(structure) {
      this.structure = structure;
      this.chunkBuilder.setStructure(structure);
      this.gridMesh = this.getGridMesh();
      this.invisibleBlocksMesh = this.getInvisibleBlocksMesh();
    }
    updateStructureBuffers(chunkPositions) {
      this.chunkBuilder.updateStructureBuffers(chunkPositions);
    }
    getGridMesh() {
      const [X, Y, Z] = this.structure.getSize();
      const mesh = new Mesh();
      mesh.addLine(0, 0, 0, X, 0, 0, [1, 0, 0]);
      mesh.addLine(0, 0, 0, 0, 0, Z, [0, 0, 1]);
      const c = [0.8, 0.8, 0.8];
      mesh.addLine(0, 0, 0, 0, Y, 0, c);
      mesh.addLine(X, 0, 0, X, Y, 0, c);
      mesh.addLine(0, 0, Z, 0, Y, Z, c);
      mesh.addLine(X, 0, Z, X, Y, Z, c);
      mesh.addLine(0, Y, 0, 0, Y, Z, c);
      mesh.addLine(X, Y, 0, X, Y, Z, c);
      mesh.addLine(0, Y, 0, X, Y, 0, c);
      mesh.addLine(0, Y, Z, X, Y, Z, c);
      for (let x = 1; x <= X; x += 1)
        mesh.addLine(x, 0, 0, x, 0, Z, c);
      for (let z = 1; z <= Z; z += 1)
        mesh.addLine(0, 0, z, X, 0, z, c);
      return mesh.rebuild(this.gl, { pos: true, color: true });
    }
    getOutlineMesh() {
      return new Mesh().addLineCube(0, 0, 0, 1, 1, 1, [1, 1, 1]).rebuild(this.gl, { pos: true, color: true });
    }
    getInvisibleBlocksMesh() {
      const mesh = new Mesh();
      if (!this.useInvisibleBlocks) {
        return mesh;
      }
      const size = this.structure.getSize();
      for (let x = 0; x < size[0]; x += 1) {
        for (let y = 0; y < size[1]; y += 1) {
          for (let z = 0; z < size[2]; z += 1) {
            const block = this.structure.getBlock([x, y, z]);
            if (block === void 0)
              continue;
            if (block === null) {
              mesh.addLineCube(x + 0.4375, y + 0.4375, z + 0.4375, x + 0.5625, y + 0.5625, z + 0.5625, [1, 0.25, 0.25]);
            } else if (block.state.is(BlockState.AIR)) {
              mesh.addLineCube(x + 0.375, y + 0.375, z + 0.375, x + 0.625, y + 0.625, z + 0.625, [0.5, 0.5, 1]);
            } else if (block.state.is(new BlockState("cave_air"))) {
              mesh.addLineCube(x + 0.375, y + 0.375, z + 0.375, x + 0.625, y + 0.625, z + 0.625, [0.5, 1, 0.5]);
            }
          }
        }
      }
      return mesh.rebuild(this.gl, { pos: true, color: true });
    }
    drawGrid(viewMatrix) {
      this.setShader(this.gridShaderProgram);
      this.prepareDraw(viewMatrix);
      this.drawMesh(this.gridMesh, { pos: true, color: true });
    }
    drawInvisibleBlocks(viewMatrix) {
      if (!this.useInvisibleBlocks) {
        return;
      }
      this.setShader(this.gridShaderProgram);
      this.prepareDraw(viewMatrix);
      this.drawMesh(this.invisibleBlocksMesh, { pos: true, color: true });
    }
    drawStructure(viewMatrix) {
      this.setShader(this.shaderProgram);
      this.setTexture(this.atlasTexture, this.resources.getPixelSize?.());
      this.prepareDraw(viewMatrix);
      this.chunkBuilder.getMeshes().forEach((mesh) => {
        this.drawMesh(mesh, { pos: true, color: true, texture: true, normal: true });
      });
    }
    drawColoredStructure(viewMatrix) {
      this.setShader(this.colorShaderProgram);
      this.prepareDraw(viewMatrix);
      this.chunkBuilder.getMeshes().forEach((mesh) => {
        this.drawMesh(mesh, { pos: true, color: true, normal: true, blockPos: true });
      });
    }
    drawOutline(viewMatrix, pos) {
      this.setShader(this.gridShaderProgram);
      const translatedMatrix = mat4_exports.create();
      mat4_exports.copy(translatedMatrix, viewMatrix);
      mat4_exports.translate(translatedMatrix, translatedMatrix, pos);
      this.prepareDraw(translatedMatrix);
      this.drawMesh(this.outlineMesh, { pos: true, color: true });
    }
  };

  // node_modules/deepslate/lib/render/TextureAtlas.js
  var TextureAtlas = class _TextureAtlas {
    img;
    idMap;
    part;
    constructor(img, idMap) {
      this.img = img;
      this.idMap = idMap;
      if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) {
        throw new Error(`Expected texture atlas dimensions to be powers of two, got ${img.width}x${img.height}.`);
      }
      this.part = 16 / img.width;
    }
    getTextureAtlas() {
      return this.img;
    }
    getTextureUV(id) {
      return this.idMap[id.toString()] ?? [0, 0, this.part, this.part];
    }
    getPixelSize() {
      return this.part / 16;
    }
    static async fromBlobs(textures) {
      const initialWidth = Math.sqrt(Object.keys(textures).length + 1);
      const width = upperPowerOfTwo(initialWidth);
      const pixelWidth = width * 16;
      const part = 1 / width;
      const canvas = document.createElement("canvas");
      canvas.width = pixelWidth;
      canvas.height = pixelWidth;
      const ctx = canvas.getContext("2d");
      this.drawInvalidTexture(ctx);
      const idMap = {};
      let index = 1;
      await Promise.all(Object.keys(textures).map(async (id) => {
        const u = index % width;
        const v = Math.floor(index / width);
        index += 1;
        idMap[id] = [part * u, part * v, part * u + part, part * v + part];
        const img = await createImageBitmap(textures[id]);
        ctx.drawImage(img, 0, 0, 16, 16, 16 * u, 16 * v, 16, 16);
      }));
      return new _TextureAtlas(ctx.getImageData(0, 0, pixelWidth, pixelWidth), idMap);
    }
    static empty() {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      _TextureAtlas.drawInvalidTexture(ctx);
      return new _TextureAtlas(ctx.getImageData(0, 0, 16, 16), {});
    }
    static drawInvalidTexture(ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = "magenta";
      ctx.fillRect(0, 0, 8, 8);
      ctx.fillRect(8, 8, 8, 8);
    }
  };

  // node_modules/deepslate/lib/render/VoxelRenderer.js
  var vsVoxel = `
  attribute vec4 vertPos;
  attribute vec3 vertColor;

  uniform mat4 mView;
  uniform mat4 mProj;

  varying highp vec3 vColor;

  void main(void) {
    gl_Position = mProj * mView * vertPos;
    vColor = vertColor;
  }
`;
  var fsVoxel = `
  precision highp float;
  varying highp vec3 vColor;

  void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;
  var VoxelRenderer = class extends Renderer {
    voxelShaderProgram;
    voxels = [];
    quads = [];
    meshes = [];
    constructor(gl) {
      super(gl);
      this.voxelShaderProgram = new ShaderProgram(gl, vsVoxel, fsVoxel).getProgram();
    }
    setVoxels(voxels) {
      this.voxels = voxels;
      this.quads = this.getQuads();
      this.meshes = this.getMeshes();
    }
    getQuads() {
      const lookup = /* @__PURE__ */ new Map();
      for (const v of this.voxels) {
        mutateWithDefault(lookup, v.x, /* @__PURE__ */ new Map(), (m) => {
          mutateWithDefault(m, v.y, /* @__PURE__ */ new Set(), (n) => {
            n.add(v.z);
          });
        });
      }
      const quads = [];
      for (const v of this.voxels) {
        if (!lookup.get(v.x + 1)?.get(v.y)?.has(v.z)) {
          quads.push(Quad.fromPoints(new Vector(v.x + 1, v.y, v.z), new Vector(v.x + 1, v.y + 1, v.z), new Vector(v.x + 1, v.y + 1, v.z + 1), new Vector(v.x + 1, v.y, v.z + 1)).setColor(v.color));
        }
        if (!lookup.get(v.x - 1)?.get(v.y)?.has(v.z)) {
          quads.push(Quad.fromPoints(new Vector(v.x, v.y, v.z + 1), new Vector(v.x, v.y + 1, v.z + 1), new Vector(v.x, v.y + 1, v.z), new Vector(v.x, v.y, v.z)).setColor(v.color));
        }
        if (!lookup.get(v.x)?.get(v.y + 1)?.has(v.z)) {
          quads.push(Quad.fromPoints(new Vector(v.x, v.y + 1, v.z + 1), new Vector(v.x + 1, v.y + 1, v.z + 1), new Vector(v.x + 1, v.y + 1, v.z), new Vector(v.x, v.y + 1, v.z)).setColor(v.color));
        }
        if (!lookup.get(v.x)?.get(v.y - 1)?.has(v.z)) {
          quads.push(Quad.fromPoints(new Vector(v.x, v.y, v.z), new Vector(v.x + 1, v.y, v.z), new Vector(v.x + 1, v.y, v.z + 1), new Vector(v.x, v.y, v.z + 1)).setColor(v.color));
        }
        if (!lookup.get(v.x)?.get(v.y)?.has(v.z + 1)) {
          quads.push(Quad.fromPoints(new Vector(v.x, v.y, v.z + 1), new Vector(v.x + 1, v.y, v.z + 1), new Vector(v.x + 1, v.y + 1, v.z + 1), new Vector(v.x, v.y + 1, v.z + 1)).setColor(v.color));
        }
        if (!lookup.get(v.x)?.get(v.y)?.has(v.z - 1)) {
          quads.push(Quad.fromPoints(new Vector(v.x, v.y + 1, v.z), new Vector(v.x + 1, v.y + 1, v.z), new Vector(v.x + 1, v.y, v.z), new Vector(v.x, v.y, v.z)).setColor(v.color));
        }
      }
      console.debug(`Converted ${this.voxels.length} voxels into ${quads.length} quads!`);
      return quads;
    }
    getMeshes() {
      const meshes = [];
      let mesh = new Mesh();
      for (const quad of this.quads) {
        const normal = quad.normal();
        const light = (normal.y * 0.25 + Math.abs(normal.z) * 0.125 + 0.75) / 256;
        quad.forEach((v) => v.color = [v.color[0] * light, v.color[1] * light, v.color[2] * light]);
        mesh.quads.push(quad);
        if (mesh.quadVertices() > 65e3) {
          meshes.push(mesh);
          mesh = new Mesh();
        }
      }
      if (!mesh.isEmpty()) {
        meshes.push(mesh);
      }
      for (const mesh2 of meshes) {
        mesh2.rebuild(this.gl, { pos: true, color: true });
      }
      return meshes;
    }
    draw(viewMatrix) {
      console.debug(`Drawing ${this.meshes.length} meshes...`);
      this.setShader(this.voxelShaderProgram);
      this.prepareDraw(viewMatrix);
      if (this.meshes.length === 0) {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        return;
      }
      for (const mesh of this.meshes) {
        this.drawMesh(mesh, { pos: true, color: true });
      }
    }
  };

  // node_modules/deepslate/lib/worldgen/NoiseRouter.js
  var NoiseRouter;
  (function(NoiseRouter2) {
    const fieldParser = (obj) => new DensityFunction.HolderHolder(Holder.parser(WorldgenRegistries.DENSITY_FUNCTION, DensityFunction.fromJson)(obj));
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      return {
        barrier: fieldParser(root.barrier),
        fluidLevelFloodedness: fieldParser(root.fluid_level_floodedness),
        fluidLevelSpread: fieldParser(root.fluid_level_spread),
        lava: fieldParser(root.lava),
        temperature: fieldParser(root.temperature),
        vegetation: fieldParser(root.vegetation),
        continents: fieldParser(root.continents),
        erosion: fieldParser(root.erosion),
        depth: fieldParser(root.depth),
        ridges: fieldParser(root.ridges),
        preliminarySurfaceLevel: fieldParser(root.preliminary_surface_level),
        finalDensity: fieldParser(root.final_density),
        veinToggle: fieldParser(root.vein_toggle),
        veinRidged: fieldParser(root.vein_ridged),
        veinGap: fieldParser(root.vein_gap)
      };
    }
    NoiseRouter2.fromJson = fromJson;
    function create4(router) {
      return {
        barrier: DensityFunction.Constant.ZERO,
        fluidLevelFloodedness: DensityFunction.Constant.ZERO,
        fluidLevelSpread: DensityFunction.Constant.ZERO,
        lava: DensityFunction.Constant.ZERO,
        temperature: DensityFunction.Constant.ZERO,
        vegetation: DensityFunction.Constant.ZERO,
        continents: DensityFunction.Constant.ZERO,
        erosion: DensityFunction.Constant.ZERO,
        depth: DensityFunction.Constant.ZERO,
        ridges: DensityFunction.Constant.ZERO,
        preliminarySurfaceLevel: DensityFunction.Constant.ZERO,
        finalDensity: DensityFunction.Constant.ZERO,
        veinToggle: DensityFunction.Constant.ZERO,
        veinRidged: DensityFunction.Constant.ZERO,
        veinGap: DensityFunction.Constant.ZERO,
        ...router
      };
    }
    NoiseRouter2.create = create4;
    function mapAll(router, visitor) {
      return {
        barrier: router.barrier.mapAll(visitor),
        fluidLevelFloodedness: router.fluidLevelFloodedness.mapAll(visitor),
        fluidLevelSpread: router.fluidLevelSpread.mapAll(visitor),
        lava: router.lava.mapAll(visitor),
        temperature: router.temperature.mapAll(visitor),
        vegetation: router.vegetation.mapAll(visitor),
        continents: router.continents.mapAll(visitor),
        erosion: router.erosion.mapAll(visitor),
        depth: router.depth.mapAll(visitor),
        ridges: router.ridges.mapAll(visitor),
        preliminarySurfaceLevel: router.preliminarySurfaceLevel.mapAll(visitor),
        finalDensity: router.finalDensity.mapAll(visitor),
        veinToggle: router.veinToggle.mapAll(visitor),
        veinRidged: router.veinRidged.mapAll(visitor),
        veinGap: router.veinGap.mapAll(visitor)
      };
    }
    NoiseRouter2.mapAll = mapAll;
    const noiseCache = /* @__PURE__ */ new Map();
    function instantiate(random2, noise) {
      const key = noise.key()?.toString();
      if (!key) {
        throw new Error("Cannot instantiate noise from direct holder");
      }
      const randomKey = random2.seedKey();
      const cached = noiseCache.get(key);
      if (cached && cached[0] === randomKey[0] && cached[1] === randomKey[1]) {
        return cached[2];
      }
      const result = new NormalNoise(random2.fromHashOf(key), noise.value());
      noiseCache.set(key, [randomKey[0], randomKey[1], result]);
      return result;
    }
    NoiseRouter2.instantiate = instantiate;
  })(NoiseRouter || (NoiseRouter = {}));

  // node_modules/deepslate/lib/worldgen/NoiseSettings.js
  var NoiseSettings;
  (function(NoiseSettings2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      return {
        minY: Json.readInt(root.min_y) ?? 0,
        height: Json.readInt(root.height) ?? 256,
        xzSize: Json.readInt(root.size_horizontal) ?? 1,
        ySize: Json.readInt(root.size_vertical) ?? 1
      };
    }
    NoiseSettings2.fromJson = fromJson;
    function create4(settings) {
      return {
        minY: 0,
        height: 256,
        xzSize: 1,
        ySize: 1,
        ...settings
      };
    }
    NoiseSettings2.create = create4;
    function cellHeight(settings) {
      return settings.ySize << 2;
    }
    NoiseSettings2.cellHeight = cellHeight;
    function cellWidth(settings) {
      return settings.xzSize << 2;
    }
    NoiseSettings2.cellWidth = cellWidth;
    function cellCountY(settings) {
      return settings.height / cellHeight(settings);
    }
    NoiseSettings2.cellCountY = cellCountY;
    function minCellY(settings) {
      return Math.floor(settings.minY / cellHeight(settings));
    }
    NoiseSettings2.minCellY = minCellY;
  })(NoiseSettings || (NoiseSettings = {}));
  var NoiseSlideSettings;
  (function(NoiseSlideSettings2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      return {
        target: Json.readNumber(root.target) ?? 0,
        size: Json.readInt(root.size) ?? 0,
        offset: Json.readInt(root.offset) ?? 0
      };
    }
    NoiseSlideSettings2.fromJson = fromJson;
    function apply(slide, density, y) {
      if (slide.size <= 0)
        return density;
      const t = (y - slide.offset) / slide.size;
      return clampedLerp(slide.target, density, t);
    }
    NoiseSlideSettings2.apply = apply;
  })(NoiseSlideSettings || (NoiseSlideSettings = {}));

  // node_modules/deepslate/lib/worldgen/VerticalAnchor.js
  var VerticalAnchor;
  (function(VerticalAnchor2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      if (root.absolute !== void 0) {
        return absolute(Json.readNumber(root.absolute) ?? 0);
      } else if (root.above_bottom !== void 0) {
        return aboveBottom(Json.readNumber(root.above_bottom) ?? 0);
      } else if (root.below_top !== void 0) {
        return belowTop(Json.readNumber(root.below_top) ?? 0);
      }
      return () => 0;
    }
    VerticalAnchor2.fromJson = fromJson;
    function absolute(value) {
      return () => value;
    }
    VerticalAnchor2.absolute = absolute;
    function aboveBottom(value) {
      return (context) => context.minY + value;
    }
    VerticalAnchor2.aboveBottom = aboveBottom;
    function belowTop(value) {
      return (context) => context.minY + context.height - 1 - value;
    }
    VerticalAnchor2.belowTop = belowTop;
  })(VerticalAnchor || (VerticalAnchor = {}));

  // node_modules/deepslate/lib/worldgen/SurfaceSystem.js
  var SurfaceSystem = class {
    rule;
    defaultBlock;
    surfaceNoise;
    surfaceSecondaryNoise;
    random;
    positionalRandoms;
    constructor(rule, defaultBlock, seed) {
      this.rule = rule;
      this.defaultBlock = defaultBlock;
      this.random = XoroshiroRandom.create(seed).forkPositional();
      this.surfaceNoise = NoiseRouter.instantiate(this.random, WorldgenRegistries.SURFACE_NOISE);
      this.surfaceSecondaryNoise = NoiseRouter.instantiate(this.random, WorldgenRegistries.SURFACE_SECONDARY_NOISE);
      this.positionalRandoms = /* @__PURE__ */ new Map();
    }
    buildSurface(chunk, noiseChunk, worldgenContext, getBiome) {
      const minX = ChunkPos.minBlockX(chunk.pos);
      const minZ = ChunkPos.minBlockZ(chunk.pos);
      const surfaceContext = new SurfaceContext(this, chunk, noiseChunk, worldgenContext, getBiome);
      const ruleWithContext = this.rule(surfaceContext);
      for (let x = 0; x < 16; x += 1) {
        const worldX = minX + x;
        for (let z = 0; z < 1; z += 1) {
          const worldZ = minZ + z;
          surfaceContext.updateXZ(worldX, worldZ);
          let stoneDepthAbove = 0;
          let waterHeight = Number.MIN_SAFE_INTEGER;
          let stoneDepthOffset = Number.MAX_SAFE_INTEGER;
          for (let y = chunk.maxY; y >= chunk.minY; y -= 1) {
            const worldPos = BlockPos.create(worldX, y, worldZ);
            const oldState = chunk.getBlockState(worldPos);
            if (oldState.equals(BlockState.AIR)) {
              stoneDepthAbove = 0;
              waterHeight = Number.MIN_SAFE_INTEGER;
              continue;
            }
            if (oldState.isFluid()) {
              if (waterHeight === Number.MIN_SAFE_INTEGER) {
                waterHeight = y + 1;
              }
              continue;
            }
            if (stoneDepthOffset >= y) {
              stoneDepthOffset = Number.MIN_SAFE_INTEGER;
              for (let i = y - 1; i >= chunk.minY; i -= 1) {
                const state = chunk.getBlockState(BlockPos.create(worldX, i, worldZ));
                if (state.equals(BlockState.AIR) || state.isFluid()) {
                  stoneDepthOffset = i + 1;
                  break;
                }
              }
            }
            stoneDepthAbove += 1;
            const stoneDepthBelow = y - stoneDepthOffset + 1;
            if (!oldState.equals(this.defaultBlock)) {
              continue;
            }
            surfaceContext.updateY(stoneDepthAbove, stoneDepthBelow, waterHeight, y);
            const newState = ruleWithContext(worldX, y, worldZ);
            if (newState) {
              chunk.setBlockState(worldPos, newState);
            }
          }
        }
      }
    }
    getSurfaceDepth(x, z) {
      const noise = this.surfaceNoise.sample(x, 0, z);
      const offset = this.random.at(x, 0, z).nextDouble() * 0.25;
      return noise * 2.75 + 3 + offset;
    }
    getSurfaceSecondary(x, z) {
      return this.surfaceSecondaryNoise.sample(x, 0, z);
    }
    getRandom(name) {
      return computeIfAbsent(this.positionalRandoms, name, () => {
        return this.random.fromHashOf(name);
      });
    }
  };
  var SurfaceContext = class {
    system;
    chunk;
    noiseChunk;
    context;
    getBiome;
    blockX = 0;
    blockY = 0;
    blockZ = 0;
    stoneDepthAbove = 0;
    stoneDepthBelow = 0;
    surfaceDepth = 0;
    waterHeight = 0;
    biome = () => "";
    surfaceSecondary = () => 0;
    minSurfaceLevel = () => 0;
    constructor(system, chunk, noiseChunk, context, getBiome) {
      this.system = system;
      this.chunk = chunk;
      this.noiseChunk = noiseChunk;
      this.context = context;
      this.getBiome = getBiome;
    }
    updateXZ(x, z) {
      this.blockX = x;
      this.blockZ = z;
      this.surfaceDepth = this.system.getSurfaceDepth(x, z);
      this.surfaceSecondary = lazy(() => this.system.getSurfaceSecondary(x, z));
      this.minSurfaceLevel = lazy(() => this.calculateMinSurfaceLevel(x, z));
    }
    updateY(stoneDepthAbove, stoneDepthBelow, waterHeight, y) {
      this.blockY = y;
      this.stoneDepthAbove = stoneDepthAbove;
      this.stoneDepthBelow = stoneDepthBelow;
      this.waterHeight = waterHeight;
      this.biome = lazy(() => this.getBiome(BlockPos.create(this.blockX, this.blockY, this.blockZ)));
    }
    calculateMinSurfaceLevel(x, z) {
      const cellX = x >> 4;
      const cellZ = z >> 4;
      const level00 = this.noiseChunk.getPreliminarySurfaceLevel(cellX << 4, cellZ << 4);
      const level10 = this.noiseChunk.getPreliminarySurfaceLevel(cellX + 1 << 4, cellZ << 4);
      const level01 = this.noiseChunk.getPreliminarySurfaceLevel(cellX << 4, cellZ + 1 << 4);
      const level11 = this.noiseChunk.getPreliminarySurfaceLevel(cellX + 1 << 4, cellZ + 1 << 4);
      const level = Math.floor(lerp2((x & 15) / 16, (z & 15) / 16, level00, level10, level01, level11));
      return level + this.surfaceDepth - 8;
    }
  };
  var SurfaceRule;
  (function(SurfaceRule2) {
    SurfaceRule2.NOOP = () => () => void 0;
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      switch (type) {
        case "block":
          return block(BlockState.fromJson(root.result_state));
        case "sequence":
          return sequence(Json.readArray(root.sequence, SurfaceRule2.fromJson) ?? []);
        case "condition":
          return condition(SurfaceCondition.fromJson(root.if_true), SurfaceRule2.fromJson(root.then_run));
      }
      return SurfaceRule2.NOOP;
    }
    SurfaceRule2.fromJson = fromJson;
    function block(state) {
      return () => () => state;
    }
    SurfaceRule2.block = block;
    function sequence(rules) {
      return (context) => {
        const rulesWithContext = rules.map((rule) => rule(context));
        return (x, y, z) => {
          for (const rule of rulesWithContext) {
            const result = rule(x, y, z);
            if (result)
              return result;
          }
          return void 0;
        };
      };
    }
    SurfaceRule2.sequence = sequence;
    function condition(ifTrue, thenRun) {
      return (context) => (x, y, z) => {
        if (ifTrue(context)) {
          return thenRun(context)(x, y, z);
        }
        return void 0;
      };
    }
    SurfaceRule2.condition = condition;
  })(SurfaceRule || (SurfaceRule = {}));
  var SurfaceCondition;
  (function(SurfaceCondition2) {
    SurfaceCondition2.FALSE = () => false;
    SurfaceCondition2.TRUE = () => true;
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      switch (type) {
        case "above_preliminary_surface":
          return abovePreliminarySurface();
        case "biome":
          return biome(Json.readArray(root.biome_is, (e) => Json.readString(e) ?? "") ?? []);
        case "not":
          return not(SurfaceCondition2.fromJson(root.invert));
        case "stone_depth":
          return stoneDepth(Json.readInt(root.offset) ?? 0, Json.readBoolean(root.add_surface_depth) ?? false, Json.readInt(root.secondary_depth_range) ?? 0, Json.readString(root.surface_type) === "ceiling");
        case "vertical_gradient":
          return verticalGradient(Json.readString(root.random_name) ?? "", VerticalAnchor.fromJson(root.true_at_and_below), VerticalAnchor.fromJson(root.false_at_and_above));
        case "water":
          return water2(Json.readInt(root.offset) ?? 0, Json.readInt(root.surface_depth_multiplier) ?? 0, Json.readBoolean(root.add_surface_depth) ?? false);
        case "y_above":
          return yAbove(VerticalAnchor.fromJson(root.anchor), Json.readInt(root.surface_depth_multiplier) ?? 0, Json.readBoolean(root.add_surface_depth) ?? false);
      }
      return SurfaceCondition2.FALSE;
    }
    SurfaceCondition2.fromJson = fromJson;
    function abovePreliminarySurface() {
      return (context) => context.blockY >= context.minSurfaceLevel();
    }
    SurfaceCondition2.abovePreliminarySurface = abovePreliminarySurface;
    function biome(biomes) {
      const biomeSet = new Set(biomes);
      return (context) => biomeSet.has(context.biome());
    }
    SurfaceCondition2.biome = biome;
    function not(invert3) {
      return (context) => !invert3(context);
    }
    SurfaceCondition2.not = not;
    function stoneDepth(offset, addSurfaceDepth, secondaryDepthRange, ceiling) {
      return (context) => {
        const depth = ceiling ? context.stoneDepthBelow : context.stoneDepthAbove;
        const surfaceDepth = addSurfaceDepth ? context.surfaceDepth : 0;
        const secondaryDepth = secondaryDepthRange === 0 ? 0 : map(context.surfaceSecondary(), -1, 1, 0, secondaryDepthRange);
        return depth <= 1 + offset + surfaceDepth + secondaryDepth;
      };
    }
    SurfaceCondition2.stoneDepth = stoneDepth;
    function verticalGradient(randomName, trueAtAndBelow, falseAtAndAbove) {
      return (context) => {
        const trueAtAndBelowY = trueAtAndBelow(context.context);
        const falseAtAndAboveY = falseAtAndAbove(context.context);
        if (context.blockY <= trueAtAndBelowY) {
          return true;
        }
        if (context.blockY >= falseAtAndAboveY) {
          return false;
        }
        const random2 = context.system.getRandom(randomName);
        const chance = map(context.blockY, trueAtAndBelowY, falseAtAndAboveY, 1, 0);
        return random2.nextFloat() < chance;
      };
    }
    SurfaceCondition2.verticalGradient = verticalGradient;
    function water2(offset, surfaceDepthMultiplier, addStoneDepth) {
      return (context) => {
        if (context.waterHeight === Number.MIN_SAFE_INTEGER) {
          return true;
        }
        const stoneDepth2 = addStoneDepth ? context.stoneDepthAbove : 0;
        return context.blockY + stoneDepth2 >= context.waterHeight + offset + context.surfaceDepth * surfaceDepthMultiplier;
      };
    }
    SurfaceCondition2.water = water2;
    function yAbove(anchor, surfaceDepthMultiplier, addStoneDepth) {
      return (context) => {
        const stoneDepth2 = addStoneDepth ? context.stoneDepthAbove : 0;
        return context.blockY + stoneDepth2 >= anchor(context.context) + context.surfaceDepth * surfaceDepthMultiplier;
      };
    }
    SurfaceCondition2.yAbove = yAbove;
  })(SurfaceCondition || (SurfaceCondition = {}));

  // node_modules/deepslate/lib/worldgen/NoiseGeneratorSettings.js
  var NoiseGeneratorSettings;
  (function(NoiseGeneratorSettings2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      return {
        surfaceRule: SurfaceRule.fromJson(root.surface_rule),
        noise: NoiseSettings.fromJson(root.noise),
        defaultBlock: BlockState.fromJson(root.default_block),
        defaultFluid: BlockState.fromJson(root.default_fluid),
        noiseRouter: NoiseRouter.fromJson(root.noise_router),
        seaLevel: Json.readInt(root.sea_level) ?? 0,
        disableMobGeneration: Json.readBoolean(root.disable_mob_generation) ?? false,
        aquifersEnabled: Json.readBoolean(root.aquifers_enabled) ?? false,
        oreVeinsEnabled: Json.readBoolean(root.ore_veins_enabled) ?? false,
        legacyRandomSource: Json.readBoolean(root.legacy_random_source) ?? false
      };
    }
    NoiseGeneratorSettings2.fromJson = fromJson;
    function create4(settings) {
      return {
        surfaceRule: SurfaceRule.NOOP,
        noise: NoiseSettings.create({}),
        defaultBlock: BlockState.STONE,
        defaultFluid: BlockState.WATER,
        noiseRouter: NoiseRouter.create({}),
        seaLevel: 0,
        disableMobGeneration: false,
        aquifersEnabled: false,
        oreVeinsEnabled: false,
        legacyRandomSource: false,
        ...settings
      };
    }
    NoiseGeneratorSettings2.create = create4;
  })(NoiseGeneratorSettings || (NoiseGeneratorSettings = {}));

  // node_modules/deepslate/lib/worldgen/WorldgenRegistries.js
  var WorldgenRegistries;
  (function(WorldgenRegistries2) {
    WorldgenRegistries2.NOISE = Registry.createAndRegister("worldgen/noise", NoiseParameters.fromJson);
    WorldgenRegistries2.DENSITY_FUNCTION = Registry.createAndRegister("worldgen/density_function", (obj) => DensityFunction.fromJson(obj));
    WorldgenRegistries2.NOISE_SETTINGS = Registry.createAndRegister("worldgen/noise_settings", NoiseGeneratorSettings.fromJson);
    WorldgenRegistries2.BIOME = Registry.createAndRegister("worldgen/biome");
    WorldgenRegistries2.SURFACE_NOISE = createNoise("surface", -6, [1, 1, 1]);
    WorldgenRegistries2.SURFACE_SECONDARY_NOISE = createNoise("surface_secondary", -6, [1, 1, 0, 1]);
    function createNoise(name, firstOctave, amplitudes) {
      return WorldgenRegistries2.NOISE.register(Identifier.create(name), NoiseParameters.create(firstOctave, amplitudes), true);
    }
  })(WorldgenRegistries || (WorldgenRegistries = {}));

  // node_modules/deepslate/lib/worldgen/DensityFunction.js
  var DensityFunction = class {
    minValue() {
      return -this.maxValue();
    }
    mapAll(visitor) {
      return visitor.map(this);
    }
  };
  (function(DensityFunction2) {
    function context(x, y, z) {
      return {
        x,
        y,
        z
      };
    }
    DensityFunction2.context = context;
    class Transformer extends DensityFunction2 {
      input;
      constructor(input) {
        super();
        this.input = input;
      }
      compute(context2) {
        return this.transform(context2, this.input.compute(context2));
      }
    }
    const NoiseParser = Holder.parser(WorldgenRegistries.NOISE, NoiseParameters.fromJson);
    function fromJson(obj, inputParser = fromJson) {
      if (typeof obj === "string") {
        return new HolderHolder(Holder.reference(WorldgenRegistries.DENSITY_FUNCTION, Identifier.parse(obj)));
      }
      if (typeof obj === "number") {
        return new Constant(obj);
      }
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      switch (type) {
        case "blend_alpha":
          return new ConstantMinMax(1, 0, 1);
        case "blend_offset":
          return new ConstantMinMax(0, -Infinity, Infinity);
        case "beardifier":
          return new ConstantMinMax(0, -Infinity, Infinity);
        case "old_blended_noise":
          return new OldBlendedNoise(Json.readNumber(root.xz_scale) ?? 1, Json.readNumber(root.y_scale) ?? 1, Json.readNumber(root.xz_factor) ?? 80, Json.readNumber(root.y_factor) ?? 160, Json.readNumber(root.smear_scale_multiplier) ?? 8);
        case "flat_cache":
          return new FlatCache(inputParser(root.argument));
        case "interpolated":
          return new Interpolated(inputParser(root.argument));
        case "cache_2d":
          return new Cache2D(inputParser(root.argument));
        case "cache_once":
          return new CacheOnce(inputParser(root.argument));
        case "cache_all_in_cell":
          return new CacheAllInCell(inputParser(root.argument));
        case "noise":
          return new Noise(Json.readNumber(root.xz_scale) ?? 1, Json.readNumber(root.y_scale) ?? 1, NoiseParser(root.noise));
        case "end_islands":
          return new EndIslands();
        case "find_top_surface":
          return new FindTopSurface(inputParser(root.density), inputParser(root.upper_bound), Json.readInt(root.lower_bound) ?? 0, Json.readInt(root.cell_height) ?? 1);
        case "weird_scaled_sampler":
          return new WeirdScaledSampler(inputParser(root.input), Json.readEnum(root.rarity_value_mapper, RarityValueMapper), NoiseParser(root.noise));
        case "shifted_noise":
          return new ShiftedNoise(inputParser(root.shift_x), inputParser(root.shift_y), inputParser(root.shift_z), Json.readNumber(root.xz_scale) ?? 1, Json.readNumber(root.y_scale) ?? 1, NoiseParser(root.noise));
        case "range_choice":
          return new RangeChoice(inputParser(root.input), Json.readNumber(root.min_inclusive) ?? 0, Json.readNumber(root.max_exclusive) ?? 1, inputParser(root.when_in_range), inputParser(root.when_out_of_range));
        case "shift_a":
          return new ShiftA(NoiseParser(root.argument));
        case "shift_b":
          return new ShiftB(NoiseParser(root.argument));
        case "shift":
          return new Shift(NoiseParser(root.argument));
        case "blend_density":
          return new BlendDensity(inputParser(root.argument));
        case "clamp":
          return new Clamp(inputParser(root.input), Json.readNumber(root.min) ?? 0, Json.readNumber(root.max) ?? 1);
        case "abs":
        case "square":
        case "cube":
        case "half_negative":
        case "invert":
        case "quarter_negative":
        case "squeeze":
          return new Mapped(type, inputParser(root.argument));
        case "add":
        case "mul":
        case "min":
        case "max":
          return new Ap2(Json.readEnum(type, Ap2Type), inputParser(root.argument1), inputParser(root.argument2));
        case "spline":
          return new Spline(CubicSpline.fromJson(root.spline, inputParser));
        case "constant":
          return new Constant(Json.readNumber(root.argument) ?? 0);
        case "y_clamped_gradient":
          return new YClampedGradient(Json.readInt(root.from_y) ?? -4064, Json.readInt(root.to_y) ?? 4062, Json.readNumber(root.from_value) ?? -4064, Json.readNumber(root.to_value) ?? 4062);
      }
      return Constant.ZERO;
    }
    DensityFunction2.fromJson = fromJson;
    class Constant extends DensityFunction2 {
      value;
      static ZERO = new Constant(0);
      static ONE = new Constant(1);
      constructor(value) {
        super();
        this.value = value;
      }
      compute() {
        return this.value;
      }
      minValue() {
        return this.value;
      }
      maxValue() {
        return this.value;
      }
    }
    DensityFunction2.Constant = Constant;
    class HolderHolder extends DensityFunction2 {
      holder;
      constructor(holder) {
        super();
        this.holder = holder;
      }
      compute(context2) {
        return this.holder.value().compute(context2);
      }
      minValue() {
        return this.holder.value().minValue();
      }
      maxValue() {
        return this.holder.value().maxValue();
      }
    }
    DensityFunction2.HolderHolder = HolderHolder;
    class ConstantMinMax extends DensityFunction2.Constant {
      min;
      max;
      constructor(value, min2, max2) {
        super(value);
        this.min = min2;
        this.max = max2;
      }
      minValue() {
        return this.min;
      }
      maxValue() {
        return this.max;
      }
    }
    DensityFunction2.ConstantMinMax = ConstantMinMax;
    class OldBlendedNoise extends DensityFunction2 {
      xzScale;
      yScale;
      xzFactor;
      yFactor;
      smearScaleMultiplier;
      blendedNoise;
      constructor(xzScale, yScale, xzFactor, yFactor, smearScaleMultiplier, blendedNoise) {
        super();
        this.xzScale = xzScale;
        this.yScale = yScale;
        this.xzFactor = xzFactor;
        this.yFactor = yFactor;
        this.smearScaleMultiplier = smearScaleMultiplier;
        this.blendedNoise = blendedNoise;
      }
      compute(context2) {
        return this.blendedNoise?.sample(context2.x, context2.y, context2.z) ?? 0;
      }
      maxValue() {
        return this.blendedNoise?.maxValue ?? 0;
      }
    }
    DensityFunction2.OldBlendedNoise = OldBlendedNoise;
    class Wrapper extends DensityFunction2 {
      wrapped;
      constructor(wrapped) {
        super();
        this.wrapped = wrapped;
      }
      minValue() {
        return this.wrapped.minValue();
      }
      maxValue() {
        return this.wrapped.maxValue();
      }
    }
    class FlatCache extends Wrapper {
      lastQuartX;
      lastQuartZ;
      lastValue = 0;
      constructor(wrapped) {
        super(wrapped);
      }
      compute(context2) {
        const quartX = context2.x >> 2;
        const quartZ = context2.z >> 2;
        if (this.lastQuartX !== quartX || this.lastQuartZ !== quartZ) {
          this.lastValue = this.wrapped.compute(DensityFunction2.context(quartX << 2, 0, quartZ << 2));
          this.lastQuartX = quartX;
          this.lastQuartZ = quartZ;
        }
        return this.lastValue;
      }
      mapAll(visitor) {
        return visitor.map(new FlatCache(this.wrapped.mapAll(visitor)));
      }
    }
    DensityFunction2.FlatCache = FlatCache;
    class CacheAllInCell extends Wrapper {
      constructor(wrapped) {
        super(wrapped);
      }
      compute(context2) {
        return this.wrapped.compute(context2);
      }
      mapAll(visitor) {
        return visitor.map(new CacheAllInCell(this.wrapped.mapAll(visitor)));
      }
    }
    DensityFunction2.CacheAllInCell = CacheAllInCell;
    class Cache2D extends Wrapper {
      lastBlockX;
      lastBlockZ;
      lastValue = 0;
      constructor(wrapped) {
        super(wrapped);
      }
      compute(context2) {
        const blockX = context2.x;
        const blockZ = context2.z;
        if (this.lastBlockX !== blockX || this.lastBlockZ !== blockZ) {
          this.lastValue = this.wrapped.compute(context2);
          this.lastBlockX = blockX;
          this.lastBlockZ = blockZ;
        }
        return this.lastValue;
      }
      mapAll(visitor) {
        return visitor.map(new Cache2D(this.wrapped.mapAll(visitor)));
      }
    }
    DensityFunction2.Cache2D = Cache2D;
    class CacheOnce extends Wrapper {
      lastBlockX;
      lastBlockY;
      lastBlockZ;
      lastValue = 0;
      constructor(wrapped) {
        super(wrapped);
      }
      compute(context2) {
        const blockX = context2.x;
        const blockY = context2.y;
        const blockZ = context2.z;
        if (this.lastBlockX !== blockX || this.lastBlockY !== blockY || this.lastBlockZ !== blockZ) {
          this.lastValue = this.wrapped.compute(context2);
          this.lastBlockX = blockX;
          this.lastBlockY = blockY;
          this.lastBlockZ = blockZ;
        }
        return this.lastValue;
      }
      mapAll(visitor) {
        return visitor.map(new CacheOnce(this.wrapped.mapAll(visitor)));
      }
    }
    DensityFunction2.CacheOnce = CacheOnce;
    class Interpolated extends Wrapper {
      cellWidth;
      cellHeight;
      values;
      constructor(wrapped, cellWidth = 4, cellHeight = 4) {
        super(wrapped);
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.values = /* @__PURE__ */ new Map();
      }
      compute({ x: blockX, y: blockY, z: blockZ }) {
        const w = this.cellWidth;
        const h = this.cellHeight;
        const x = (blockX % w + w) % w / w;
        const y = (blockY % h + h) % h / h;
        const z = (blockZ % w + w) % w / w;
        const firstX = Math.floor(blockX / w) * w;
        const firstY = Math.floor(blockY / h) * h;
        const firstZ = Math.floor(blockZ / w) * w;
        const noise000 = () => this.computeCorner(firstX, firstY, firstZ);
        const noise001 = () => this.computeCorner(firstX, firstY, firstZ + w);
        const noise010 = () => this.computeCorner(firstX, firstY + h, firstZ);
        const noise011 = () => this.computeCorner(firstX, firstY + h, firstZ + w);
        const noise100 = () => this.computeCorner(firstX + w, firstY, firstZ);
        const noise101 = () => this.computeCorner(firstX + w, firstY, firstZ + w);
        const noise110 = () => this.computeCorner(firstX + w, firstY + h, firstZ);
        const noise111 = () => this.computeCorner(firstX + w, firstY + h, firstZ + w);
        return lazyLerp3(x, y, z, noise000, noise100, noise010, noise110, noise001, noise101, noise011, noise111);
      }
      computeCorner(x, y, z) {
        return computeIfAbsent(this.values, `${x} ${y} ${z}`, () => {
          return this.wrapped.compute(DensityFunction2.context(x, y, z));
        });
      }
      mapAll(visitor) {
        return visitor.map(new Interpolated(this.wrapped.mapAll(visitor)));
      }
      withCellSize(cellWidth, cellHeight) {
        return new Interpolated(this.wrapped, cellWidth, cellHeight);
      }
    }
    DensityFunction2.Interpolated = Interpolated;
    class Noise extends DensityFunction2 {
      xzScale;
      yScale;
      noiseData;
      noise;
      constructor(xzScale, yScale, noiseData, noise) {
        super();
        this.xzScale = xzScale;
        this.yScale = yScale;
        this.noiseData = noiseData;
        this.noise = noise;
      }
      compute(context2) {
        return this.noise?.sample(context2.x * this.xzScale, context2.y * this.yScale, context2.z * this.xzScale) ?? 0;
      }
      maxValue() {
        return this.noise?.maxValue ?? 2;
      }
    }
    DensityFunction2.Noise = Noise;
    class EndIslands extends DensityFunction2 {
      islandNoise;
      constructor(seed) {
        super();
        const random2 = new LegacyRandom(seed ?? BigInt(0));
        random2.consume(17292);
        this.islandNoise = new SimplexNoise(random2);
      }
      getHeightValue(x, z) {
        const x0 = Math.floor(x / 2);
        const z0 = Math.floor(z / 2);
        const x1 = x % 2;
        const z1 = z % 2;
        let f = clamp(100 - Math.sqrt(x * x + z * z) * 8, -100, 80);
        for (let i = -12; i <= 12; i += 1) {
          for (let j = -12; j <= 12; j += 1) {
            const x2 = x0 + i;
            const z2 = z0 + j;
            if (x2 * x2 + z2 * z2 <= 4096 || this.islandNoise.sample2D(x2, z2) >= -0.9) {
              continue;
            }
            const f1 = (Math.abs(x2) * 3439 + Math.abs(z2) * 147) % 13 + 9;
            const x3 = x1 + i * 2;
            const z3 = z1 + j * 2;
            const f2 = 100 - Math.sqrt(x3 * x3 + z3 * z3) * f1;
            const f3 = clamp(f2, -100, 80);
            f = Math.max(f, f3);
          }
        }
        return f;
      }
      compute({ x, y, z }) {
        return (this.getHeightValue(Math.floor(x / 8), Math.floor(z / 8)) - 8) / 128;
      }
      minValue() {
        return -0.84375;
      }
      maxValue() {
        return 0.5625;
      }
    }
    DensityFunction2.EndIslands = EndIslands;
    class FindTopSurface extends DensityFunction2 {
      density;
      upperBound;
      lowerBound;
      cellHeight;
      constructor(density, upperBound, lowerBound, cellHeight) {
        super();
        this.density = density;
        this.upperBound = upperBound;
        this.lowerBound = lowerBound;
        this.cellHeight = cellHeight;
      }
      compute(context2) {
        const topY = Math.floor(this.upperBound.compute(context2) / this.cellHeight) * this.cellHeight;
        if (topY < this.lowerBound) {
          return this.lowerBound;
        }
        for (let blockY = topY; blockY >= this.lowerBound; blockY -= this.cellHeight) {
          if (this.density.compute(DensityFunction2.context(context2.x, blockY, context2.z)) > 0) {
            return blockY;
          }
        }
        return this.lowerBound;
      }
      mapAll(visitor) {
        return visitor.map(new FindTopSurface(this.density.mapAll(visitor), this.upperBound.mapAll(visitor), this.lowerBound, this.cellHeight));
      }
      minValue() {
        return this.lowerBound;
      }
      maxValue() {
        return Math.max(this.lowerBound, this.upperBound.maxValue());
      }
    }
    DensityFunction2.FindTopSurface = FindTopSurface;
    const RarityValueMapper = ["type_1", "type_2"];
    class WeirdScaledSampler extends Transformer {
      rarityValueMapper;
      noiseData;
      noise;
      static ValueMapper = {
        type_1: WeirdScaledSampler.rarityValueMapper1,
        type_2: WeirdScaledSampler.rarityValueMapper2
      };
      mapper;
      constructor(input, rarityValueMapper, noiseData, noise) {
        super(input);
        this.rarityValueMapper = rarityValueMapper;
        this.noiseData = noiseData;
        this.noise = noise;
        this.mapper = WeirdScaledSampler.ValueMapper[this.rarityValueMapper];
      }
      transform(context2, density) {
        if (!this.noise) {
          return 0;
        }
        const rarity = this.mapper(density);
        return rarity * Math.abs(this.noise.sample(context2.x / rarity, context2.y / rarity, context2.z / rarity));
      }
      mapAll(visitor) {
        return visitor.map(new WeirdScaledSampler(this.input.mapAll(visitor), this.rarityValueMapper, this.noiseData, this.noise));
      }
      minValue() {
        return 0;
      }
      maxValue() {
        return this.rarityValueMapper === "type_1" ? 2 : 3;
      }
      static rarityValueMapper1(value) {
        if (value < -0.5) {
          return 0.75;
        } else if (value < 0) {
          return 1;
        } else if (value < 0.5) {
          return 1.5;
        } else {
          return 2;
        }
      }
      static rarityValueMapper2(value) {
        if (value < -0.75) {
          return 0.5;
        } else if (value < -0.5) {
          return 0.75;
        } else if (value < 0.5) {
          return 1;
        } else if (value < 0.75) {
          return 2;
        } else {
          return 3;
        }
      }
    }
    DensityFunction2.WeirdScaledSampler = WeirdScaledSampler;
    class ShiftedNoise extends Noise {
      shiftX;
      shiftY;
      shiftZ;
      constructor(shiftX, shiftY, shiftZ, xzScale, yScale, noiseData, noise) {
        super(xzScale, yScale, noiseData, noise);
        this.shiftX = shiftX;
        this.shiftY = shiftY;
        this.shiftZ = shiftZ;
      }
      compute(context2) {
        const xx = context2.x * this.xzScale + this.shiftX.compute(context2);
        const yy = context2.y * this.yScale + this.shiftY.compute(context2);
        const zz = context2.z * this.xzScale + this.shiftZ.compute(context2);
        return this.noise?.sample(xx, yy, zz) ?? 0;
      }
      mapAll(visitor) {
        return visitor.map(new ShiftedNoise(this.shiftX.mapAll(visitor), this.shiftY.mapAll(visitor), this.shiftZ.mapAll(visitor), this.xzScale, this.yScale, this.noiseData, this.noise));
      }
    }
    DensityFunction2.ShiftedNoise = ShiftedNoise;
    class RangeChoice extends DensityFunction2 {
      input;
      minInclusive;
      maxExclusive;
      whenInRange;
      whenOutOfRange;
      constructor(input, minInclusive, maxExclusive, whenInRange, whenOutOfRange) {
        super();
        this.input = input;
        this.minInclusive = minInclusive;
        this.maxExclusive = maxExclusive;
        this.whenInRange = whenInRange;
        this.whenOutOfRange = whenOutOfRange;
      }
      compute(context2) {
        const x = this.input.compute(context2);
        return this.minInclusive <= x && x < this.maxExclusive ? this.whenInRange.compute(context2) : this.whenOutOfRange.compute(context2);
      }
      mapAll(visitor) {
        return visitor.map(new RangeChoice(this.input.mapAll(visitor), this.minInclusive, this.maxExclusive, this.whenInRange.mapAll(visitor), this.whenOutOfRange.mapAll(visitor)));
      }
      minValue() {
        return Math.min(this.whenInRange.minValue(), this.whenOutOfRange.minValue());
      }
      maxValue() {
        return Math.max(this.whenInRange.maxValue(), this.whenOutOfRange.maxValue());
      }
    }
    DensityFunction2.RangeChoice = RangeChoice;
    class ShiftNoise extends DensityFunction2 {
      noiseData;
      offsetNoise;
      constructor(noiseData, offsetNoise) {
        super();
        this.noiseData = noiseData;
        this.offsetNoise = offsetNoise;
      }
      compute(context2) {
        return (this.offsetNoise?.sample(context2.x * 0.25, context2.y * 0.25, context2.z * 0.25) ?? 0) * 4;
      }
      maxValue() {
        return (this.offsetNoise?.maxValue ?? 2) * 4;
      }
    }
    DensityFunction2.ShiftNoise = ShiftNoise;
    class ShiftA extends ShiftNoise {
      constructor(noiseData, offsetNoise) {
        super(noiseData, offsetNoise);
      }
      compute(context2) {
        return super.compute(DensityFunction2.context(context2.x, 0, context2.z));
      }
      withNewNoise(newNoise) {
        return new ShiftA(this.noiseData, newNoise);
      }
    }
    DensityFunction2.ShiftA = ShiftA;
    class ShiftB extends ShiftNoise {
      constructor(noiseData, offsetNoise) {
        super(noiseData, offsetNoise);
      }
      compute(context2) {
        return super.compute(DensityFunction2.context(context2.z, context2.x, 0));
      }
      withNewNoise(newNoise) {
        return new ShiftB(this.noiseData, newNoise);
      }
    }
    DensityFunction2.ShiftB = ShiftB;
    class Shift extends ShiftNoise {
      constructor(noiseData, offsetNoise) {
        super(noiseData, offsetNoise);
      }
      withNewNoise(newNoise) {
        return new Shift(this.noiseData, newNoise);
      }
    }
    DensityFunction2.Shift = Shift;
    class BlendDensity extends Transformer {
      constructor(input) {
        super(input);
      }
      transform(context2, density) {
        return density;
      }
      mapAll(visitor) {
        return visitor.map(new BlendDensity(this.input.mapAll(visitor)));
      }
      minValue() {
        return -Infinity;
      }
      maxValue() {
        return Infinity;
      }
    }
    DensityFunction2.BlendDensity = BlendDensity;
    class Clamp extends Transformer {
      min;
      max;
      constructor(input, min2, max2) {
        super(input);
        this.min = min2;
        this.max = max2;
      }
      transform(context2, density) {
        return clamp(density, this.min, this.max);
      }
      mapAll(visitor) {
        return visitor.map(new Clamp(this.input.mapAll(visitor), this.min, this.max));
      }
      minValue() {
        return this.min;
      }
      maxValue() {
        return this.max;
      }
    }
    DensityFunction2.Clamp = Clamp;
    const MappedType = ["abs", "square", "cube", "half_negative", "invert", "quarter_negative", "squeeze"];
    class Mapped extends Transformer {
      type;
      min;
      max;
      static MappedTypes = {
        abs: (d) => Math.abs(d),
        square: (d) => d * d,
        cube: (d) => d * d * d,
        half_negative: (d) => d > 0 ? d : d * 0.5,
        invert: (d) => 1 / d,
        quarter_negative: (d) => d > 0 ? d : d * 0.25,
        squeeze: (d) => {
          const c = clamp(d, -1, 1);
          return c / 2 - c * c * c / 24;
        }
      };
      transformer;
      constructor(type, input, min2, max2) {
        super(input);
        this.type = type;
        this.min = min2;
        this.max = max2;
        this.transformer = Mapped.MappedTypes[this.type];
      }
      transform(context2, density) {
        return this.transformer(density);
      }
      mapAll(visitor) {
        return visitor.map(new Mapped(this.type, this.input.mapAll(visitor)));
      }
      minValue() {
        return this.min ?? -Infinity;
      }
      maxValue() {
        return this.max ?? Infinity;
      }
      withMinMax() {
        const minInput = this.input.minValue();
        let min2 = this.transformer(minInput);
        let max2 = this.transformer(this.input.maxValue());
        if (this.type === "invert") {
          if (min2 < 0 && max2 > 0) {
            [min2, max2] = [-Infinity, Infinity];
          } else {
            [min2, max2] = [max2, min2];
          }
        } else if (this.type === "abs" || this.type === "square") {
          max2 = Math.max(min2, max2);
          min2 = Math.max(0, minInput);
        }
        return new Mapped(this.type, this.input, min2, max2);
      }
    }
    DensityFunction2.Mapped = Mapped;
    const Ap2Type = ["add", "mul", "min", "max"];
    class Ap2 extends DensityFunction2 {
      type;
      argument1;
      argument2;
      min;
      max;
      constructor(type, argument1, argument2, min2, max2) {
        super();
        this.type = type;
        this.argument1 = argument1;
        this.argument2 = argument2;
        this.min = min2;
        this.max = max2;
      }
      compute(context2) {
        const a = this.argument1.compute(context2);
        switch (this.type) {
          case "add":
            return a + this.argument2.compute(context2);
          case "mul":
            return a === 0 ? 0 : a * this.argument2.compute(context2);
          case "min":
            return a < this.argument2.minValue() ? a : Math.min(a, this.argument2.compute(context2));
          case "max":
            return a > this.argument2.maxValue() ? a : Math.max(a, this.argument2.compute(context2));
        }
      }
      mapAll(visitor) {
        return visitor.map(new Ap2(this.type, this.argument1.mapAll(visitor), this.argument2.mapAll(visitor)));
      }
      minValue() {
        return this.min ?? -Infinity;
      }
      maxValue() {
        return this.max ?? Infinity;
      }
      withMinMax() {
        const min1 = this.argument1.minValue();
        const min2 = this.argument2.minValue();
        const max1 = this.argument1.maxValue();
        const max2 = this.argument2.maxValue();
        if ((this.type === "min" || this.type === "max") && (min1 >= max2 || min2 >= max1)) {
          console.warn(`Creating a ${this.type} function between two non-overlapping inputs`);
        }
        let min3, max3;
        switch (this.type) {
          case "add":
            min3 = min1 + min2;
            max3 = max1 + max2;
            break;
          case "mul":
            min3 = min1 > 0 && min2 > 0 ? min1 * min2 || 0 : max1 < 0 && max2 < 0 ? max1 * max2 || 0 : Math.min(min1 * max2 || 0, min2 * max1 || 0);
            max3 = min1 > 0 && min2 > 0 ? max1 * max2 || 0 : max1 < 0 && max2 < 0 ? min1 * min2 || 0 : Math.max(min1 * min2 || 0, max1 * max2 || 0);
            break;
          case "min":
            min3 = Math.min(min1, min2);
            max3 = Math.min(max1, max2);
            break;
          case "max":
            min3 = Math.max(min1, min2);
            max3 = Math.max(max1, max2);
            break;
        }
        return new Ap2(this.type, this.argument1, this.argument2, min3, max3);
      }
    }
    DensityFunction2.Ap2 = Ap2;
    class Spline extends DensityFunction2 {
      spline;
      constructor(spline) {
        super();
        this.spline = spline;
      }
      compute(context2) {
        return this.spline.compute(context2);
      }
      mapAll(visitor) {
        const newCubicSpline = this.spline.mapAll((fn) => {
          if (fn instanceof DensityFunction2) {
            return fn.mapAll(visitor);
          }
          return fn;
        });
        newCubicSpline.calculateMinMax();
        return visitor.map(new Spline(newCubicSpline));
      }
      minValue() {
        return this.spline.min();
      }
      maxValue() {
        return this.spline.max();
      }
    }
    DensityFunction2.Spline = Spline;
    class YClampedGradient extends DensityFunction2 {
      fromY;
      toY;
      fromValue;
      toValue;
      constructor(fromY, toY, fromValue, toValue) {
        super();
        this.fromY = fromY;
        this.toY = toY;
        this.fromValue = fromValue;
        this.toValue = toValue;
      }
      compute(context2) {
        return clampedMap(context2.y, this.fromY, this.toY, this.fromValue, this.toValue);
      }
      minValue() {
        return Math.min(this.fromValue, this.toValue);
      }
      maxValue() {
        return Math.max(this.fromValue, this.toValue);
      }
    }
    DensityFunction2.YClampedGradient = YClampedGradient;
  })(DensityFunction || (DensityFunction = {}));

  // node_modules/deepslate/lib/worldgen/Aquifer.js
  var FluidStatus = class {
    level;
    type;
    constructor(level, type) {
      this.level = level;
      this.type = type;
    }
    at(level) {
      return level < this.level ? this.type : BlockState.AIR;
    }
  };
  var Aquifer;
  (function(Aquifer2) {
    function createDisabled(fluidPicker) {
      return {
        compute({ x, y, z }, density) {
          if (density > 0) {
            return void 0;
          }
          return fluidPicker(x, y, z).at(y);
        }
      };
    }
    Aquifer2.createDisabled = createDisabled;
  })(Aquifer || (Aquifer = {}));
  var NoiseAquifer = class _NoiseAquifer {
    noiseChunk;
    router;
    random;
    globalFluidPicker;
    static X_SPACING = 16;
    static Y_SPACING = 12;
    static Z_SPACING = 16;
    static SURFACE_SAMPLING = [[-2, -1], [-1, -1], [0, -1], [1, -1], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [-2, 1], [-1, 1], [0, 1], [1, 1]];
    minGridX;
    minGridY;
    minGridZ;
    gridSizeX;
    gridSizeZ;
    gridSize;
    aquiferCache;
    aquiferLocationCache;
    constructor(noiseChunk, chunkPos, router, random2, minY, height, globalFluidPicker) {
      this.noiseChunk = noiseChunk;
      this.router = router;
      this.random = random2;
      this.globalFluidPicker = globalFluidPicker;
      this.minGridX = this.gridX(ChunkPos.minBlockX(chunkPos)) - 1;
      this.gridSizeX = this.gridX(ChunkPos.maxBlockX(chunkPos)) + 1 - this.minGridX + 1;
      this.minGridY = this.gridY(minY) - 1;
      this.minGridZ = this.gridZ(ChunkPos.minBlockZ(chunkPos)) - 1;
      this.gridSizeZ = this.gridZ(ChunkPos.maxBlockZ(chunkPos)) + 1 - this.minGridZ + 1;
      const gridSizeY = this.gridY(minY + height) + 1 - this.minGridY + 1;
      this.gridSize = this.gridSizeX * gridSizeY * this.gridSizeZ;
      this.aquiferCache = Array(this.gridSize).fill(void 0);
      this.aquiferLocationCache = Array(this.gridSize).fill(BlockPos.ZERO);
    }
    compute({ x, y, z }, density) {
      if (density <= 0) {
        if (this.globalFluidPicker(x, y, z).at(y).is(BlockState.LAVA)) {
          return BlockState.LAVA;
        } else {
          const gridX = this.gridX(x - 5);
          const gridY = this.gridY(y + 1);
          const gridZ = this.gridZ(z - 5);
          let mag1 = Number.MAX_SAFE_INTEGER;
          let mag2 = Number.MAX_SAFE_INTEGER;
          let mag3 = Number.MAX_SAFE_INTEGER;
          let loc1 = BlockPos.ZERO;
          let loc2 = BlockPos.ZERO;
          let loc3 = BlockPos.ZERO;
          for (let xOffset = 0; xOffset <= 1; xOffset += 1) {
            for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
              for (let zOffset = 0; zOffset <= 1; zOffset += 1) {
                const location = this.getLocation(gridX + xOffset, gridY + yOffset, gridZ + zOffset);
                const magnitude = BlockPos.magnitude(location);
                if (mag1 >= magnitude) {
                  loc3 = loc2;
                  loc2 = loc1;
                  loc1 = location;
                  mag3 = mag2;
                  mag2 = mag1;
                  mag1 = magnitude;
                } else if (mag2 >= magnitude) {
                  loc3 = loc2;
                  loc2 = location;
                  mag3 = mag2;
                  mag2 = magnitude;
                } else if (mag3 >= magnitude) {
                  loc3 = location;
                  mag3 = magnitude;
                }
              }
            }
          }
          const status1 = this.getStatus(loc1);
          const status2 = this.getStatus(loc2);
          const status3 = this.getStatus(loc3);
          const similarity12 = _NoiseAquifer.similarity(mag1, mag2);
          const similarity13 = _NoiseAquifer.similarity(mag1, mag3);
          const similarity23 = _NoiseAquifer.similarity(mag2, mag3);
          let pressure;
          if (status1.at(y).is(BlockState.WATER) && this.globalFluidPicker(x, y - 1, z).at(y - 1).is(BlockState.LAVA)) {
            pressure = 1;
          } else if (similarity12 > -1) {
            const barrier = lazy(() => this.router.barrier.compute(DensityFunction.context(x, y * 0.5, z)));
            const pressure12 = this.calculatePressure(y, status1, status2, barrier);
            const pressure13 = this.calculatePressure(y, status1, status3, barrier);
            const pressure23 = this.calculatePressure(y, status2, status3, barrier);
            const n = Math.max(pressure12, pressure13 * Math.max(0, similarity13), pressure23 * Math.max(similarity23));
            pressure = Math.max(0, 2 * Math.max(0, similarity12) * n);
          } else {
            pressure = 0;
          }
          if (density + pressure <= 0) {
            return status1.at(y);
          }
        }
      }
      return void 0;
    }
    static similarity(a, b) {
      return 1 - Math.abs(b - a) / 25;
    }
    calculatePressure(y, status1, status2, barrier) {
      const fluid1 = status1.at(y);
      const fluid2 = status2.at(y);
      if (fluid1.is(BlockState.LAVA) && fluid2.is(BlockState.WATER) || fluid1.is(BlockState.WATER) && fluid2.is(BlockState.LAVA)) {
        return 1;
      }
      const levelDiff = Math.abs(status1.level - status2.level);
      if (levelDiff === 0) {
        return 0;
      }
      const levelAvg = (status1.level + status2.level) / 2;
      const levelAvgDiff = y + 0.5 - levelAvg;
      const p = levelDiff / 2 - Math.abs(levelAvgDiff);
      const pressure = levelAvgDiff > 0 ? p > 0 ? p / 1.5 : p / 2.5 : p > -3 ? (p + 3) / 3 : (p + 3) / 10;
      if (pressure < -2 || pressure > 2) {
        return pressure;
      }
      return pressure + barrier();
    }
    getStatus(location) {
      const [x, y, z] = location;
      const index = this.getIndex(this.gridX(x), this.gridY(y), this.gridZ(z));
      const cachedStatus = this.aquiferCache[index];
      if (cachedStatus !== void 0) {
        return cachedStatus;
      }
      const status = this.computeStatus(x, y, z);
      this.aquiferCache[index] = status;
      return status;
    }
    computeStatus(x, y, z) {
      const globalStatus = this.globalFluidPicker(x, y, z);
      let minPreliminarySurface = Number.MAX_SAFE_INTEGER;
      let isAquifer = false;
      for (const [xOffset, zOffset] of _NoiseAquifer.SURFACE_SAMPLING) {
        const blockX = x + (zOffset << 4);
        const blockZ = z + (zOffset << 4);
        const preliminarySurface = this.noiseChunk.getPreliminarySurfaceLevel(blockX, blockZ);
        minPreliminarySurface = Math.min(minPreliminarySurface, preliminarySurface);
        const noOffset = xOffset === 0 && zOffset === 0;
        if (noOffset && y - 12 > preliminarySurface + 8) {
          return globalStatus;
        }
        if (noOffset || y + 12 > preliminarySurface + 8) {
          const newStatus = this.globalFluidPicker(blockX, preliminarySurface + 8, blockZ);
          if (!newStatus.at(preliminarySurface + 8).is(BlockState.AIR)) {
            if (noOffset) {
              return newStatus;
            } else {
              isAquifer = true;
            }
          }
        }
      }
      const allowedFloodedness = isAquifer ? clampedMap(minPreliminarySurface + 8 - y, 0, 64, 1, 0) : 0;
      const floodedness = clamp(this.router.fluidLevelFloodedness.compute(DensityFunction.context(x, y * 0.67, z)), -1, 1);
      if (floodedness > map(allowedFloodedness, 1, 0, -0.3, 0.8)) {
        return globalStatus;
      }
      if (floodedness <= map(allowedFloodedness, 1, 0, -0.8, 0.4)) {
        return new FluidStatus(Number.MIN_SAFE_INTEGER, globalStatus.type);
      }
      const gridY = Math.floor(y / 40);
      const spread = this.router.fluidLevelSpread.compute(DensityFunction.context(Math.floor(x / 16), gridY, Math.floor(z / 16)));
      const level = gridY * 40 + 20 + Math.floor(spread / 3) * 3;
      const statusLevel = Math.min(minPreliminarySurface, level);
      const fluid = this.getFluidType(x, y, z, globalStatus.type, level);
      return new FluidStatus(statusLevel, fluid);
    }
    getFluidType(x, y, z, global, level) {
      if (level <= -10) {
        const lava = this.router.lava.compute(DensityFunction.context(Math.floor(x / 64), Math.floor(y / 40), Math.floor(z / 64)));
        if (Math.abs(lava) > 0.3) {
          return BlockState.LAVA;
        }
      }
      return global;
    }
    getLocation(x, y, z) {
      const index = this.getIndex(x, y, z);
      const cachedLocation = this.aquiferLocationCache[index];
      if (BlockPos.equals(cachedLocation, BlockPos.ZERO)) {
        return cachedLocation;
      }
      const random2 = this.random.at(x, y, z);
      const location = BlockPos.create(x * _NoiseAquifer.X_SPACING + random2.nextInt(10), y * _NoiseAquifer.Y_SPACING + random2.nextInt(9), z * _NoiseAquifer.Z_SPACING + random2.nextInt(10));
      this.aquiferLocationCache[index] = location;
      return location;
    }
    getIndex(x, y, z) {
      const gridX = x - this.minGridX;
      const gridY = y - this.minGridY;
      const gridZ = z - this.minGridZ;
      const index = (gridY * this.gridSizeZ + gridZ) * this.gridSizeX + gridX;
      if (index < 0 || index >= this.gridSize) {
        throw new Error(`Invalid aquifer index at ${x} ${y} ${z}: 0 <= ${index} < ${this.gridSize}`);
      }
      return index;
    }
    gridX(x) {
      return Math.floor(x / _NoiseAquifer.X_SPACING);
    }
    gridY(y) {
      return Math.floor(y / _NoiseAquifer.Y_SPACING);
    }
    gridZ(z) {
      return Math.floor(z / _NoiseAquifer.Z_SPACING);
    }
  };

  // node_modules/deepslate/lib/worldgen/HeightProvider.js
  var HeightProvider;
  (function(HeightProvider2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      switch (type) {
        case void 0:
          return constant(VerticalAnchor.fromJson(obj));
        case "constant":
          return constant(VerticalAnchor.fromJson(root.value));
        case "uniform":
          return uniform(VerticalAnchor.fromJson(root.min_inclusive), VerticalAnchor.fromJson(root.max_inclusive));
        case "biased_to_bottom":
          return biased_to_bottom(VerticalAnchor.fromJson(root.min_inclusive), VerticalAnchor.fromJson(root.max_inclusive), Json.readInt(root.inner));
        case "very_biased_to_bottom":
          return very_biased_to_bottom(VerticalAnchor.fromJson(root.min_inclusive), VerticalAnchor.fromJson(root.max_inclusive), Json.readInt(root.inner));
        case "trapezoid":
          return trapezoid(VerticalAnchor.fromJson(root.min_inclusive), VerticalAnchor.fromJson(root.max_inclusive), Json.readInt(root.plateau));
        case "weighted_list":
          return weighted_list(Json.readArray(root.distribution, (obj2) => {
            const entry = Json.readObject(obj2) ?? {};
            return { weight: Json.readInt(entry.weight) ?? 1, data: fromJson(entry.data) };
          }) ?? []);
      }
      return () => 0;
    }
    HeightProvider2.fromJson = fromJson;
    function constant(anchor) {
      return (_, context) => anchor(context);
    }
    HeightProvider2.constant = constant;
    function uniform(minInclusive, maxInclusive) {
      return (random2, context) => {
        const minY = minInclusive(context);
        const maxY = maxInclusive(context);
        if (minY > maxY) {
          return minY;
        } else {
          return random2.nextInt(maxY - minY + 1) + minY;
        }
      };
    }
    HeightProvider2.uniform = uniform;
    function biased_to_bottom(minInclusive, maxInclusive, inner = 1) {
      return (random2, context) => {
        const minY = minInclusive(context);
        const maxY = maxInclusive(context);
        if (maxY - minY - inner + 1 <= 0) {
          return minY;
        } else {
          const r = random2.nextInt(maxY - minY - inner + 1);
          return random2.nextInt(r + inner) + minY;
        }
      };
    }
    HeightProvider2.biased_to_bottom = biased_to_bottom;
    function very_biased_to_bottom(minInclusive, maxInclusive, inner = 1) {
      return (random2, context) => {
        const minY = minInclusive(context);
        const maxY = maxInclusive(context);
        if (maxY - minY - inner + 1 <= 0) {
          return minY;
        } else {
          const r1 = nextInt(random2, minY + inner, maxY);
          const r2 = nextInt(random2, minY, r1 - 1);
          return nextInt(random2, minY, r2 - 1 + inner);
        }
      };
    }
    HeightProvider2.very_biased_to_bottom = very_biased_to_bottom;
    function trapezoid(minInclusive, maxInclusive, plateau = 0) {
      return (random2, context) => {
        const minY = minInclusive(context);
        const maxY = maxInclusive(context);
        if (minY > maxY) {
          return minY;
        } else {
          const range = maxY - minY;
          if (plateau >= range) {
            return randomBetweenInclusive(random2, minY, maxY);
          } else {
            const slope = (range - plateau) / 2;
            const r = range - slope;
            return minY + randomBetweenInclusive(random2, 0, r) + randomBetweenInclusive(random2, 0, slope);
          }
        }
      };
    }
    HeightProvider2.trapezoid = trapezoid;
    function weighted_list(distribution) {
      const totalWeight = distribution.reduce((sum, e, i) => sum + e.weight, 0);
      return (random2, context) => {
        let r = random2.nextInt(totalWeight);
        for (const e of distribution) {
          r -= e.weight;
          if (r <= 0) {
            return e.data(random2, context);
          }
        }
        return 0;
      };
    }
    HeightProvider2.weighted_list = weighted_list;
  })(HeightProvider || (HeightProvider = {}));

  // node_modules/deepslate/lib/worldgen/Heightmap.js
  var Heightmap;
  (function(Heightmap2) {
    function fromJson(obj) {
      if (typeof obj === "string") {
        if (obj === "WORLD_SURFACE_WG" || obj === "WORLD_SURFACE" || obj === "OCEAN_FLOOR_WG" || obj === "OCEAN_FLOOR" || obj === "MOTION_BLOCKING" || obj === "MOTION_BLOCKING_NO_LEAVES") {
          return obj;
        }
      }
    }
    Heightmap2.fromJson = fromJson;
  })(Heightmap || (Heightmap = {}));

  // node_modules/deepslate/lib/worldgen/NoiseChunk.js
  var NoiseChunk = class {
    cellCountXZ;
    cellCountY;
    cellNoiseMinY;
    minX;
    minZ;
    settings;
    cellWidth;
    cellHeight;
    firstCellX;
    firstCellZ;
    firstNoiseX;
    firstNoiseZ;
    noiseSizeXZ;
    preliminarySurfaceLevelCache = /* @__PURE__ */ new Map();
    aquifer;
    materialRule;
    preliminarySurfaceLevel;
    constructor(cellCountXZ, cellCountY, cellNoiseMinY, randomState, minX, minZ, settings, aquifersEnabled, fluidPicker) {
      this.cellCountXZ = cellCountXZ;
      this.cellCountY = cellCountY;
      this.cellNoiseMinY = cellNoiseMinY;
      this.minX = minX;
      this.minZ = minZ;
      this.settings = settings;
      this.cellWidth = NoiseSettings.cellWidth(settings);
      this.cellHeight = NoiseSettings.cellHeight(settings);
      this.firstCellX = Math.floor(minX / this.cellWidth);
      this.firstCellZ = Math.floor(minZ / this.cellWidth);
      this.firstNoiseX = minX >> 2;
      this.firstNoiseZ = minZ >> 2;
      this.noiseSizeXZ = cellCountXZ * this.cellWidth >> 2;
      if (!aquifersEnabled || true) {
        this.aquifer = Aquifer.createDisabled(fluidPicker);
      } else {
        const chunkPos = ChunkPos.fromBlockPos(BlockPos.create(minX, 0, minZ));
        const minY = cellNoiseMinY * NoiseSettings.cellHeight(settings);
        const height = cellCountY * NoiseSettings.cellHeight(settings);
        this.aquifer = new NoiseAquifer(this, chunkPos, randomState.router, randomState.aquiferRandom, minY, height, fluidPicker);
      }
      const finalDensity = randomState.router.finalDensity;
      this.materialRule = MaterialRule.fromList([
        (context) => this.aquifer.compute(context, finalDensity.compute(context))
      ]);
      this.preliminarySurfaceLevel = randomState.router.preliminarySurfaceLevel;
    }
    getFinalState(x, y, z) {
      return this.materialRule({ x, y, z });
    }
    getPreliminarySurfaceLevel(quartX, quartZ) {
      return computeIfAbsent(this.preliminarySurfaceLevelCache, ChunkPos.asLong(quartX, quartZ), () => {
        const x = quartX << 2;
        const z = quartZ << 2;
        return Math.floor(this.preliminarySurfaceLevel.compute(DensityFunction.context(x, 0, z)));
      });
    }
  };
  var MaterialRule;
  (function(MaterialRule2) {
    function fromList(rules) {
      return (context) => {
        for (const rule of rules) {
          const state = rule(context);
          if (state)
            return state;
        }
        return void 0;
      };
    }
    MaterialRule2.fromList = fromList;
  })(MaterialRule || (MaterialRule = {}));

  // node_modules/deepslate/lib/worldgen/NoiseChunkGenerator.js
  var NoiseChunkGenerator = class {
    biomeSource;
    settings;
    noiseChunkCache;
    globalFluidPicker;
    constructor(biomeSource, settings) {
      this.biomeSource = biomeSource;
      this.settings = settings;
      this.noiseChunkCache = /* @__PURE__ */ new Map();
      const lavaFluid = new FluidStatus(-54, BlockState.LAVA);
      const defaultFluid = new FluidStatus(settings.seaLevel, settings.defaultFluid);
      this.globalFluidPicker = (x, y, z) => {
        if (y < Math.min(-54, settings.seaLevel)) {
          return lavaFluid;
        }
        return defaultFluid;
      };
    }
    getBaseHeight(blockX, blockZ, heightmap, randomState) {
      let predicate;
      if (heightmap === "OCEAN_FLOOR" || heightmap === "OCEAN_FLOOR_WG") {
        predicate = (state) => state.equals(BlockState.STONE);
      } else {
        predicate = (state) => !state.equals(BlockState.AIR);
      }
      return this.iterateNoiseColumn(randomState, blockX, blockZ, void 0, predicate, BlockState.STONE) ?? this.settings.noise.minY;
    }
    iterateNoiseColumn(randomState, blockX, blockZ, fillArray, predicate, defaultBlock) {
      const minY = this.settings.noise.minY;
      const cellHeight = NoiseSettings.cellHeight(this.settings.noise);
      const minCellY = Math.floor(minY / cellHeight);
      const cellCountY = Math.floor(this.settings.noise.height / cellHeight);
      if (cellCountY <= 0) {
        return void 0;
      }
      const cellWidth = NoiseSettings.cellWidth(this.settings.noise);
      const cellX = Math.floor(blockX / cellWidth);
      const cellZ = Math.floor(blockZ / cellWidth);
      const noiseChunk = new NoiseChunk(1, cellCountY, minCellY, randomState, cellX, cellZ, this.settings.noise, this.settings.aquifersEnabled, this.globalFluidPicker);
      for (let cellY = cellCountY - 1; cellY >= 0; cellY -= 1) {
        for (let offY = cellHeight - 1; offY >= 0; offY -= 1) {
          const blockY = (minCellY + cellY) * cellHeight + offY;
          const state = noiseChunk.getFinalState(blockX, blockY, blockZ) ?? defaultBlock ?? this.settings.defaultBlock;
          if (fillArray !== void 0) {
            fillArray[blockY + minY] = state;
          }
          if (predicate !== void 0 && predicate(state)) {
            return blockY + 1;
          }
        }
      }
    }
    fill(randomState, chunk, onlyFirstZ = false) {
      const minY = Math.max(chunk.minY, this.settings.noise.minY);
      const maxY = Math.min(chunk.maxY, this.settings.noise.minY + this.settings.noise.height);
      const cellWidth = NoiseSettings.cellWidth(this.settings.noise);
      const cellHeight = NoiseSettings.cellHeight(this.settings.noise);
      const cellCountXZ = Math.floor(16 / cellWidth);
      const minCellY = Math.floor(minY / cellHeight);
      const cellCountY = Math.floor((maxY - minY) / cellHeight);
      const minX = ChunkPos.minBlockX(chunk.pos);
      const minZ = ChunkPos.minBlockZ(chunk.pos);
      const noiseChunk = this.getOrCreateNoiseChunk(randomState, chunk);
      for (let cellX = 0; cellX < cellCountXZ; cellX += 1) {
        for (let cellZ = 0; cellZ < (onlyFirstZ ? 1 : cellCountXZ); cellZ += 1) {
          let section = chunk.getOrCreateSection(chunk.sectionsCount - 1);
          for (let cellY = cellCountY - 1; cellY >= 0; cellY -= 1) {
            for (let offY = cellHeight - 1; offY >= 0; offY -= 1) {
              const blockY = (minCellY + cellY) * cellHeight + offY;
              const sectionY = blockY & 15;
              const sectionIndex = chunk.getSectionIndex(blockY);
              if (chunk.getSectionIndex(section.minBlockY) !== sectionIndex) {
                section = chunk.getOrCreateSection(sectionIndex);
              }
              for (let offX = 0; offX < cellWidth; offX += 1) {
                const blockX = minX + cellX * cellWidth + offX;
                const sectionX = blockX & 15;
                for (let offZ = 0; offZ < (onlyFirstZ ? 1 : cellWidth); offZ += 1) {
                  const blockZ = minZ + cellZ * cellWidth + offZ;
                  const sectionZ = blockZ & 15;
                  const state = noiseChunk.getFinalState(blockX, blockY, blockZ) ?? this.settings.defaultBlock;
                  section.setBlockState(sectionX, sectionY, sectionZ, state);
                }
              }
            }
          }
        }
      }
    }
    buildSurface(randomState, chunk, biome = "minecraft:plains") {
      const noiseChunk = this.getOrCreateNoiseChunk(randomState, chunk);
      const context = this.settings.noise;
      randomState.surfaceSystem.buildSurface(chunk, noiseChunk, context, () => biome);
    }
    computeBiome(randomState, quartX, quartY, quartZ) {
      return this.biomeSource.getBiome(quartX, quartY, quartZ, randomState.sampler);
    }
    getOrCreateNoiseChunk(randomState, chunk) {
      return computeIfAbsent(this.noiseChunkCache, ChunkPos.toLong(chunk.pos), () => {
        const minY = Math.max(chunk.minY, this.settings.noise.minY);
        const maxY = Math.min(chunk.maxY, this.settings.noise.minY + this.settings.noise.height);
        const cellWidth = NoiseSettings.cellWidth(this.settings.noise);
        const cellHeight = NoiseSettings.cellHeight(this.settings.noise);
        const cellCountXZ = Math.floor(16 / cellWidth);
        const minCellY = Math.floor(minY / cellHeight);
        const cellCountY = Math.floor((maxY - minY) / cellHeight);
        const minX = ChunkPos.minBlockX(chunk.pos);
        const minZ = ChunkPos.minBlockZ(chunk.pos);
        return new NoiseChunk(cellCountXZ, cellCountY, minCellY, randomState, minX, minZ, this.settings.noise, this.settings.aquifersEnabled, this.globalFluidPicker);
      });
    }
  };

  // node_modules/deepslate/lib/worldgen/biome/CheckerboardBiomeSource.js
  var CheckerboardBiomeSource = class _CheckerboardBiomeSource {
    shift;
    biomes;
    n;
    constructor(shift, biomes) {
      this.shift = shift;
      this.biomes = biomes;
      if (biomes.length === 0) {
        throw new Error("Cannot create checkerboard biome source without biomes");
      }
      this.n = biomes.length;
    }
    getBiome(x, y, z) {
      const i = (((x >> this.shift) + (z >> this.shift)) % this.n + this.n) % this.n;
      return Identifier.parse(this.biomes[i].toString());
    }
    static fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const scale4 = Json.readInt(root.scale) ?? 2;
      let biomes;
      if (typeof root.biomes === "string") {
        biomes = [Identifier.parse(root.biomes)];
      } else {
        biomes = Json.readArray(root.biomes, (b) => Identifier.parse(Json.readString(b) ?? "")) ?? [];
      }
      return new _CheckerboardBiomeSource(scale4 + 2, biomes);
    }
  };

  // node_modules/deepslate/lib/worldgen/biome/FixedBiomeSource.js
  var FixedBiomeSource = class _FixedBiomeSource {
    biome;
    constructor(biome) {
      this.biome = biome;
    }
    getBiome() {
      return this.biome;
    }
    static fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const biome = Identifier.parse(Json.readString(root.biome) ?? "plains");
      return new _FixedBiomeSource(biome);
    }
  };

  // node_modules/deepslate/lib/worldgen/biome/Climate.js
  var Climate;
  (function(Climate2) {
    const PARAMETER_SPACE = 7;
    function target(temperature, humidity, continentalness, erosion, depth, weirdness) {
      return new TargetPoint(temperature, humidity, continentalness, erosion, depth, weirdness);
    }
    Climate2.target = target;
    function parameters(temperature, humidity, continentalness, erosion, depth, weirdness, offset) {
      return new ParamPoint(param(temperature), param(humidity), param(continentalness), param(erosion), param(depth), param(weirdness), offset);
    }
    Climate2.parameters = parameters;
    function param(value, max2) {
      if (typeof value === "number") {
        return new Param(value, max2 ?? value);
      }
      return value;
    }
    Climate2.param = param;
    class Param {
      min;
      max;
      constructor(min2, max2) {
        this.min = min2;
        this.max = max2;
      }
      distance(param2) {
        const diffMax = (typeof param2 === "number" ? param2 : param2.min) - this.max;
        const diffMin = this.min - (typeof param2 === "number" ? param2 : param2.max);
        if (diffMax > 0) {
          return diffMax;
        }
        return Math.max(diffMin, 0);
      }
      union(param2) {
        return new Param(Math.min(this.min, param2.min), Math.max(this.max, param2.max));
      }
      static fromJson(obj) {
        if (typeof obj === "number")
          return new Param(obj, obj);
        const [min2, max2] = Json.readArray(obj, (e) => Json.readNumber(e)) ?? [];
        return new Param(min2 ?? 0, max2 ?? 0);
      }
    }
    Climate2.Param = Param;
    class ParamPoint {
      temperature;
      humidity;
      continentalness;
      erosion;
      depth;
      weirdness;
      offset;
      constructor(temperature, humidity, continentalness, erosion, depth, weirdness, offset) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.continentalness = continentalness;
        this.erosion = erosion;
        this.depth = depth;
        this.weirdness = weirdness;
        this.offset = offset;
      }
      fittness(point) {
        return square(this.temperature.distance(point.temperature)) + square(this.humidity.distance(point.humidity)) + square(this.continentalness.distance(point.continentalness)) + square(this.erosion.distance(point.erosion)) + square(this.depth.distance(point.depth)) + square(this.weirdness.distance(point.weirdness)) + square(this.offset - point.offset);
      }
      space() {
        return [this.temperature, this.humidity, this.continentalness, this.erosion, this.depth, this.weirdness, new Param(this.offset, this.offset)];
      }
      static fromJson(obj) {
        const root = Json.readObject(obj) ?? {};
        return new ParamPoint(Param.fromJson(root.temperature), Param.fromJson(root.humidity), Param.fromJson(root.continentalness), Param.fromJson(root.erosion), Param.fromJson(root.depth), Param.fromJson(root.weirdness), Json.readNumber(root.offset) ?? 0);
      }
    }
    Climate2.ParamPoint = ParamPoint;
    class TargetPoint {
      temperature;
      humidity;
      continentalness;
      erosion;
      depth;
      weirdness;
      constructor(temperature, humidity, continentalness, erosion, depth, weirdness) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.continentalness = continentalness;
        this.erosion = erosion;
        this.depth = depth;
        this.weirdness = weirdness;
      }
      get offset() {
        return 0;
      }
      toArray() {
        return [this.temperature, this.humidity, this.continentalness, this.erosion, this.depth, this.weirdness, this.offset];
      }
    }
    Climate2.TargetPoint = TargetPoint;
    class Parameters {
      things;
      index;
      constructor(things) {
        this.things = things;
        this.index = new RTree(things);
      }
      find(target2) {
        return this.index.search(target2, (node, values) => node.distance(values));
      }
    }
    Climate2.Parameters = Parameters;
    class Sampler {
      temperature;
      humidity;
      continentalness;
      erosion;
      depth;
      weirdness;
      constructor(temperature, humidity, continentalness, erosion, depth, weirdness) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.continentalness = continentalness;
        this.erosion = erosion;
        this.depth = depth;
        this.weirdness = weirdness;
      }
      static fromRouter(router) {
        return new Climate2.Sampler(router.temperature, router.vegetation, router.continents, router.erosion, router.depth, router.ridges);
      }
      sample(x, y, z) {
        const context = DensityFunction.context(x << 2, y << 2, z << 2);
        return Climate2.target(this.temperature.compute(context), this.humidity.compute(context), this.continentalness.compute(context), this.erosion.compute(context), this.depth.compute(context), this.weirdness.compute(context));
      }
    }
    Climate2.Sampler = Sampler;
    class RTree {
      static CHILDREN_PER_NODE = 10;
      root;
      last_leaf = null;
      constructor(points) {
        if (points.length === 0) {
          throw new Error("At least one point is required to build search tree");
        }
        this.root = RTree.build(points.map(([point, thing]) => new RLeaf(point, thing)));
      }
      static build(nodes) {
        if (nodes.length === 1) {
          return nodes[0];
        }
        if (nodes.length <= RTree.CHILDREN_PER_NODE) {
          const sortedNodes = nodes.map((node) => {
            let key = 0;
            for (let i = 0; i < PARAMETER_SPACE; i += 1) {
              const param2 = node.space[i];
              key += Math.abs((param2.min + param2.max) / 2);
            }
            return { key, node };
          }).sort((a, b) => a.key - b.key).map(({ node }) => node);
          return new RSubTree(sortedNodes);
        }
        let f = Infinity;
        let n3 = -1;
        let result = [];
        for (let n2 = 0; n2 < PARAMETER_SPACE; ++n2) {
          nodes = RTree.sort(nodes, n2, false);
          result = RTree.bucketize(nodes);
          let f2 = 0;
          for (const subTree2 of result) {
            f2 += RTree.area(subTree2.space);
          }
          if (!(f > f2))
            continue;
          f = f2;
          n3 = n2;
        }
        nodes = RTree.sort(nodes, n3, false);
        result = RTree.bucketize(nodes);
        result = RTree.sort(result, n3, true);
        return new RSubTree(result.map((subTree) => RTree.build(subTree.children)));
      }
      static sort(nodes, i, abs) {
        return nodes.map((node) => {
          const param2 = node.space[i];
          const f = (param2.min + param2.max) / 2;
          const key = abs ? Math.abs(f) : f;
          return { key, node };
        }).sort((a, b) => a.key - b.key).map(({ node }) => node);
      }
      static bucketize(nodes) {
        const arrayList = [];
        let arrayList2 = [];
        const n = Math.pow(10, Math.floor(Math.log(nodes.length - 0.01) / Math.log(10)));
        for (const node of nodes) {
          arrayList2.push(node);
          if (arrayList2.length < n)
            continue;
          arrayList.push(new RSubTree(arrayList2));
          arrayList2 = [];
        }
        if (arrayList2.length !== 0) {
          arrayList.push(new RSubTree(arrayList2));
        }
        return arrayList;
      }
      static area(params) {
        let f = 0;
        for (const param2 of params) {
          f += Math.abs(param2.max - param2.min);
        }
        return f;
      }
      search(target2, distance2) {
        const leaf = this.root.search(target2.toArray(), this.last_leaf, distance2);
        this.last_leaf = leaf;
        return leaf.thing();
      }
    }
    Climate2.RTree = RTree;
    class RNode {
      space;
      constructor(space) {
        this.space = space;
      }
      distance(values) {
        let result = 0;
        for (let i = 0; i < PARAMETER_SPACE; i += 1) {
          result += square(this.space[i].distance(values[i]));
        }
        return result;
      }
    }
    Climate2.RNode = RNode;
    class RSubTree extends RNode {
      children;
      constructor(children) {
        super(RSubTree.buildSpace(children));
        this.children = children;
      }
      static buildSpace(nodes) {
        let space = [...Array(PARAMETER_SPACE)].map(() => new Param(Infinity, -Infinity));
        for (const node of nodes) {
          space = [...Array(PARAMETER_SPACE)].map((_, i) => space[i].union(node.space[i]));
        }
        return space;
      }
      search(values, closest_leaf, distance2) {
        let dist2 = closest_leaf ? distance2(closest_leaf, values) : Infinity;
        let leaf = closest_leaf;
        for (const node of this.children) {
          const d1 = distance2(node, values);
          if (dist2 <= d1)
            continue;
          const leaf2 = node.search(values, leaf, distance2);
          if (leaf2 === null)
            continue;
          const d2 = node == leaf2 ? d1 : distance2(leaf2, values);
          if (d2 === 0)
            return leaf2;
          if (dist2 <= d2)
            continue;
          dist2 = d2;
          leaf = leaf2;
        }
        return leaf;
      }
    }
    Climate2.RSubTree = RSubTree;
    class RLeaf extends RNode {
      thing;
      constructor(point, thing) {
        super(point.space());
        this.thing = thing;
      }
      search() {
        return this;
      }
    }
    Climate2.RLeaf = RLeaf;
  })(Climate || (Climate = {}));

  // node_modules/deepslate/lib/worldgen/biome/MultiNoiseBiomeSource.js
  var MultiNoiseBiomeSource = class _MultiNoiseBiomeSource {
    parameters;
    constructor(entries) {
      this.parameters = new Climate.Parameters(entries);
    }
    getBiome(x, y, z, climateSampler) {
      const target = climateSampler.sample(x, y, z);
      return this.parameters.find(target);
    }
    static fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const biomes = Json.readArray(root.biomes, (b) => ((b2) => ({
        biome: Identifier.parse(Json.readString(b2.biome) ?? "plains"),
        parameters: Climate.ParamPoint.fromJson(b2.parameters)
      }))(Json.readObject(b) ?? {})) ?? [];
      const entries = biomes.map((b) => [b.parameters, () => b.biome]);
      return new _MultiNoiseBiomeSource(entries);
    }
  };

  // node_modules/deepslate/lib/worldgen/biome/TheEndBiomeSource.js
  var TheEndBiomeSource = class _TheEndBiomeSource {
    static END = Identifier.create("the_end");
    static HIGHLANDS = Identifier.create("end_highlands");
    static MIDLANDS = Identifier.create("end_midlands");
    static ISLANDS = Identifier.create("small_end_islands");
    static BARRENS = Identifier.create("end_barrens");
    getBiome(x, y, z, climateSampler) {
      const blockX = x << 2;
      const blockY = y << 2;
      const blockZ = z << 2;
      const sectionX = blockX >> 4;
      const sectionZ = blockZ >> 4;
      if (sectionX * sectionX + sectionZ * sectionZ <= 4096) {
        return _TheEndBiomeSource.END;
      }
      const context = DensityFunction.context((sectionX * 2 + 1) * 8, blockY, (sectionZ * 2 + 1) * 8);
      const erosion = climateSampler.erosion.compute(context);
      if (erosion > 0.25) {
        return _TheEndBiomeSource.HIGHLANDS;
      } else if (erosion >= -0.0625) {
        return _TheEndBiomeSource.MIDLANDS;
      } else if (erosion >= -0.21875) {
        return _TheEndBiomeSource.BARRENS;
      } else {
        return _TheEndBiomeSource.ISLANDS;
      }
    }
    static fromJson(obj) {
      return new _TheEndBiomeSource();
    }
  };

  // node_modules/deepslate/lib/worldgen/biome/BiomeSource.js
  var BiomeSource;
  (function(BiomeSource2) {
    function fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      switch (type) {
        case "fixed":
          return FixedBiomeSource.fromJson(obj);
        case "checkerboard":
          return CheckerboardBiomeSource.fromJson(obj);
        case "multi_noise":
          return MultiNoiseBiomeSource.fromJson(obj);
        case "the_end":
          return TheEndBiomeSource.fromJson(obj);
        default:
          return new FixedBiomeSource(Identifier.create("plains"));
      }
    }
    BiomeSource2.fromJson = fromJson;
    function findBiomeHorizontal(biomeSource, centerX, y, centerZ, range, predicate, random2, sampler, step = 1, searchFromCenter = false) {
      if (biomeSource instanceof FixedBiomeSource) {
        if (predicate(biomeSource.getBiome())) {
          if (searchFromCenter) {
            return { pos: BlockPos.create(centerX, y, centerZ), biome: biomeSource.getBiome() };
          } else {
            return { pos: BlockPos.create(centerX - range + random2.nextInt(range * 2 + 1), y, centerZ - range + random2.nextInt(range * 2 + 1)), biome: biomeSource.getBiome() };
          }
        } else {
          return void 0;
        }
      }
      const centerQuardX = centerX >> 2;
      const centerQuardZ = centerZ >> 2;
      const quardRange = range >> 2;
      const quardY = y >> 2;
      var result = void 0;
      var found_count = 0;
      var currentRangeStart = searchFromCenter ? 0 : quardRange;
      for (var currentRange = currentRangeStart; currentRange <= quardRange; currentRange += step) {
        for (var quardZOffset = -currentRange; quardZOffset <= currentRange; quardZOffset += step) {
          const isZEdge = Math.abs(quardZOffset) === currentRange;
          for (var quardXOffset = -currentRange; quardXOffset <= currentRange; quardXOffset += step) {
            if (searchFromCenter) {
              const isXEdge = Math.abs(quardXOffset) === currentRange;
              if (!isXEdge && !isZEdge) {
                continue;
              }
            }
            const quardX = centerQuardX + quardXOffset;
            const quardZ = centerQuardZ + quardZOffset;
            const biome = biomeSource.getBiome(quardX, quardY, quardZ, sampler);
            if (predicate(biome)) {
              if (result === void 0 || random2.nextInt(found_count + 1) <= 0.5) {
                result = { pos: BlockPos.create(quardX << 2, y, quardZ << 2), biome };
                if (searchFromCenter) {
                  return result;
                }
              }
              found_count++;
            }
          }
        }
      }
      return result;
    }
    BiomeSource2.findBiomeHorizontal = findBiomeHorizontal;
  })(BiomeSource || (BiomeSource = {}));

  // node_modules/deepslate/lib/worldgen/RandomState.js
  var RandomState = class {
    seed;
    noiseCache;
    randomCache;
    random;
    aquiferRandom;
    oreRandom;
    surfaceSystem;
    router;
    sampler;
    constructor(settings, seed) {
      this.seed = seed;
      this.noiseCache = /* @__PURE__ */ new Map();
      this.randomCache = /* @__PURE__ */ new Map();
      this.random = (settings.legacyRandomSource ? new LegacyRandom(seed) : XoroshiroRandom.create(seed)).forkPositional();
      this.aquiferRandom = this.random.fromHashOf(Identifier.create("aquifer").toString()).forkPositional();
      this.oreRandom = this.random.fromHashOf(Identifier.create("ore").toString()).forkPositional();
      this.surfaceSystem = new SurfaceSystem(settings.surfaceRule, settings.defaultBlock, seed);
      this.router = NoiseRouter.mapAll(settings.noiseRouter, this.createVisitor(settings.noise, settings.legacyRandomSource));
      this.sampler = Climate.Sampler.fromRouter(this.router);
    }
    createVisitor(noiseSettings, legacyRandom) {
      const mapped = /* @__PURE__ */ new Map();
      const getNoise = (noise) => {
        const key = noise.key();
        if (key === void 0) {
          throw new Error("Cannot create noise without key");
        }
        if (legacyRandom) {
          if (key.equals(Identifier.create("temperature"))) {
            return new NormalNoise(new LegacyRandom(this.seed + BigInt(0)), NoiseParameters.create(-7, [1, 1]));
          }
          if (key.equals(Identifier.create("vegetation"))) {
            return new NormalNoise(new LegacyRandom(this.seed + BigInt(1)), NoiseParameters.create(-7, [1, 1]));
          }
          if (key.equals(Identifier.create("offset"))) {
            return new NormalNoise(this.random.fromHashOf("offset"), NoiseParameters.create(0, [0]));
          }
        }
        return this.getOrCreateNoise(key);
      };
      const visitor = {
        map: (fn) => {
          if (fn instanceof DensityFunction.HolderHolder) {
            const key = fn.holder.key();
            if (key !== void 0 && mapped.has(key.toString())) {
              return mapped.get(key.toString());
            } else {
              const value = fn.holder.value().mapAll(visitor);
              if (key !== void 0) {
                mapped.set(key.toString(), value);
              }
              return value;
            }
          }
          if (fn instanceof DensityFunction.Interpolated) {
            return fn.withCellSize(NoiseSettings.cellWidth(noiseSettings), NoiseSettings.cellHeight(noiseSettings));
          }
          if (fn instanceof DensityFunction.ShiftedNoise) {
            return new DensityFunction.ShiftedNoise(fn.shiftX, fn.shiftY, fn.shiftZ, fn.xzScale, fn.yScale, fn.noiseData, getNoise(fn.noiseData));
          }
          if (fn instanceof DensityFunction.Noise) {
            return new DensityFunction.Noise(fn.xzScale, fn.yScale, fn.noiseData, getNoise(fn.noiseData));
          }
          if (fn instanceof DensityFunction.ShiftNoise) {
            return fn.withNewNoise(getNoise(fn.noiseData));
          }
          if (fn instanceof DensityFunction.WeirdScaledSampler) {
            return new DensityFunction.WeirdScaledSampler(fn.input, fn.rarityValueMapper, fn.noiseData, getNoise(fn.noiseData));
          }
          if (fn instanceof DensityFunction.OldBlendedNoise) {
            const oldBlendedNoiseRandom = legacyRandom ? new LegacyRandom(this.seed + BigInt(0)) : this.random.fromHashOf(Identifier.create("terrain").toString());
            return new DensityFunction.OldBlendedNoise(fn.xzScale, fn.yScale, fn.xzFactor, fn.yFactor, fn.smearScaleMultiplier, new BlendedNoise(oldBlendedNoiseRandom, fn.xzScale, fn.yScale, fn.xzFactor, fn.yFactor, fn.smearScaleMultiplier));
          }
          if (fn instanceof DensityFunction.EndIslands) {
            return new DensityFunction.EndIslands(this.seed);
          }
          if (fn instanceof DensityFunction.Mapped) {
            return fn.withMinMax();
          }
          if (fn instanceof DensityFunction.Ap2) {
            return fn.withMinMax();
          }
          return fn;
        }
      };
      return visitor;
    }
    getOrCreateNoise(id) {
      const noises = Registry.REGISTRY.getOrThrow(Identifier.create("worldgen/noise"));
      return computeIfAbsent(this.noiseCache, id.toString(), (key) => new NormalNoise(this.random.fromHashOf(key), noises.getOrThrow(id)));
    }
    getOrCreateRandom(id) {
      return computeIfAbsent(this.randomCache, id.toString(), (key) => this.random.fromHashOf(key).forkPositional());
    }
  };

  // node_modules/deepslate/lib/worldgen/structure/StructurePoolElement.js
  var StructurePoolElement = class _StructurePoolElement {
    static fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      switch (Json.readString(root.element_type)?.replace(/^minecraft:/, "")) {
        case "single_pool_element":
        case "legacy_single_pool_element":
          const id = Identifier.parse(Json.readString(root.location) ?? "");
          const template = {
            key: () => id,
            value: () => Structure.REGISTRY.get(id) ?? Structure.EMPTY
          };
          return new _StructurePoolElement.SinlgePoolElement(template);
        case "list_pool_element":
          const elements = Json.readArray("elements", _StructurePoolElement.fromJson) ?? [];
          return new _StructurePoolElement.ListPoolElement(elements);
        case "feature_pool_element":
          return new _StructurePoolElement.FeaturePoolElement();
        case "empty_pool_element":
        default:
          return new _StructurePoolElement.EmptyPoolElement();
      }
    }
  };
  (function(StructurePoolElement2) {
    class EmptyPoolElement extends StructurePoolElement2 {
      getBoundingBox(pos, rotation) {
        throw new Error("Invalid call of EmptyPoolElement");
      }
      getShuffledJigsawBlocks(rotation, random2) {
        return [];
      }
      toString() {
        return "[Empty Pool Element]";
      }
    }
    StructurePoolElement2.EmptyPoolElement = EmptyPoolElement;
    class FeaturePoolElement extends StructurePoolElement2 {
      defaultJigsawNBT;
      constructor() {
        super();
        const compoundMap = /* @__PURE__ */ new Map();
        compoundMap.set("name", new NbtString("minecraft:bottom"));
        compoundMap.set("final_state", new NbtString("minecraft:air"));
        compoundMap.set("pool", new NbtString("minecraft:empty"));
        compoundMap.set("target", new NbtString("minecraft:empty"));
        compoundMap.set("joint", new NbtString("rollable"));
        this.defaultJigsawNBT = new NbtCompound(compoundMap);
      }
      getBoundingBox(pos, rotation) {
        return [pos, pos];
      }
      getShuffledJigsawBlocks(rotation, random2) {
        return [{
          pos: [0, 0, 0],
          state: new BlockState(Identifier.create("jigsaw"), {
            orientation: "down_south"
          }),
          nbt: this.defaultJigsawNBT
        }];
      }
      toString() {
        return "[Feature Pool Element]";
      }
    }
    StructurePoolElement2.FeaturePoolElement = FeaturePoolElement;
    class SinlgePoolElement extends StructurePoolElement2 {
      template;
      static JIGSAW_ID = Identifier.parse("jigsaw");
      constructor(template) {
        super();
        this.template = template;
      }
      getBoundingBox(pos, rotation) {
        const size = BlockPos.offset(this.template.value().getSize(), -1, -1, -1);
        const pos1 = pos;
        const pos2 = BlockPos.add(Structure.transform(size, rotation, BlockPos.ZERO), pos);
        const minPos = BlockPos.create(Math.min(pos1[0], pos2[0]), pos1[1], Math.min(pos1[2], pos2[2]));
        const maxPos = BlockPos.create(Math.max(pos1[0], pos2[0]), pos2[1], Math.max(pos1[2], pos2[2]));
        return [minPos, maxPos];
      }
      getShuffledJigsawBlocks(rotation, random2) {
        const blocks = this.template.value().getBlocks().filter((block) => block.state.getName().equals(SinlgePoolElement.JIGSAW_ID));
        blocks.forEach((block) => block.pos = Structure.transform(block.pos, rotation, BlockPos.ZERO));
        shuffle(blocks, random2);
        return blocks;
      }
      toString() {
        return `[Single Pool Element: ${this.template.key()}]`;
      }
    }
    StructurePoolElement2.SinlgePoolElement = SinlgePoolElement;
    class ListPoolElement extends StructurePoolElement2 {
      elements;
      constructor(elements) {
        super();
        this.elements = elements;
      }
      getBoundingBox(pos, rotation) {
        var minPos = void 0;
        var maxPos = void 0;
        for (const element of this.elements) {
          const elementBoundingBox = element.getBoundingBox(pos, rotation);
          if (!minPos || !maxPos) {
            minPos = elementBoundingBox[0];
            maxPos = elementBoundingBox[1];
          } else {
            minPos[0] = Math.min(minPos[0], elementBoundingBox[0][0]);
            minPos[1] = Math.min(minPos[1], elementBoundingBox[0][1]);
            minPos[2] = Math.min(minPos[2], elementBoundingBox[0][2]);
            maxPos[0] = Math.min(minPos[0], elementBoundingBox[1][0]);
            maxPos[1] = Math.min(minPos[1], elementBoundingBox[1][1]);
            maxPos[2] = Math.min(minPos[2], elementBoundingBox[1][2]);
          }
        }
        return [minPos, maxPos];
      }
      getShuffledJigsawBlocks(rotation, random2) {
        return this.elements[0].getShuffledJigsawBlocks(rotation, random2);
      }
      toString() {
        return `[List Pool Element: ${"; ".concat(...this.elements.map((e) => e.toString()))}]`;
      }
    }
    StructurePoolElement2.ListPoolElement = ListPoolElement;
  })(StructurePoolElement || (StructurePoolElement = {}));

  // node_modules/deepslate/lib/worldgen/structure/StructureTemplatePool.js
  var StructureTemplatePool = class _StructureTemplatePool {
    rawTemplates;
    fallback;
    static REGISTRY = Registry.createAndRegister("worldgen/template_pool", _StructureTemplatePool.fromJson);
    totalWeight;
    constructor(rawTemplates, fallback) {
      this.rawTemplates = rawTemplates;
      this.fallback = fallback;
      this.totalWeight = rawTemplates.reduce((v, e) => v + e.weight, 0);
    }
    static structurePoolParser = Holder.parser(_StructureTemplatePool.REGISTRY, _StructureTemplatePool.fromJson);
    static fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const fallback = _StructureTemplatePool.structurePoolParser(root.fallback ?? "");
      const elements = Json.readArray(root.elements, (obj2) => {
        const root2 = Json.readObject(obj2) ?? {};
        const element = StructurePoolElement.fromJson(root2.element);
        const weight = Json.readInt(root2.weight) ?? 1;
        return { element, weight };
      }) ?? [];
      return new _StructureTemplatePool(elements, fallback);
    }
    getRandomTemplate(random2) {
      var v = random2.nextInt(this.totalWeight);
      for (const entry of this.rawTemplates) {
        v -= entry.weight;
        if (v < 0) {
          return entry.element;
        }
      }
      return this.rawTemplates[this.rawTemplates.length - 1].element;
    }
  };

  // node_modules/deepslate/lib/worldgen/structure/WorldgenStructure.js
  var WorldgenStructure = class {
    settings;
    constructor(settings) {
      this.settings = settings;
    }
    onTopOfChunkCenter(context, chunkX, chunkZ, heightmap = "WORLD_SURFACE_WG") {
      const posX = (chunkX << 4) + 8;
      const posZ = (chunkZ << 4) + 8;
      return [posX, context.chunkGenerator.getBaseHeight(posX, posZ, heightmap, context.randomState) - 1, posZ];
    }
    getLowestY(context, minX, minZ, width, depth) {
      return Math.min(context.chunkGenerator.getBaseHeight(minX, minZ, "WORLD_SURFACE_WG", context.randomState) - 1, context.chunkGenerator.getBaseHeight(minX, minZ + depth, "WORLD_SURFACE_WG", context.randomState) - 1, context.chunkGenerator.getBaseHeight(minX + width, minZ, "WORLD_SURFACE_WG", context.randomState) - 1, context.chunkGenerator.getBaseHeight(minX + width, minZ + depth, "WORLD_SURFACE_WG", context.randomState) - 1);
    }
    getLowestYIn5by5BoxOffset7Blocks(context, chunkX, chunkZ, rotation) {
      let width = 5;
      let depth = 5;
      if (rotation === Rotation.CLOCKWISE_90) {
        width = -5;
      } else if (rotation === Rotation.CLOCKWISE_180) {
        width = -5;
        depth = -5;
      } else if (rotation === Rotation.COUNTERCLOCKWISE_90) {
        depth = -5;
      }
      const posX = (chunkX << 4) + 7;
      const posZ = (chunkZ << 4) + 7;
      return BlockPos.create(posX, this.getLowestY(context, posX, posZ, width, depth), posZ);
    }
    tryGenerate(chunkX, chunkZ, context) {
      const random2 = LegacyRandom.fromLargeFeatureSeed(context.seed, chunkX, chunkZ);
      const pos = this.findGenerationPoint(chunkX, chunkZ, random2, context);
      if (pos === void 0)
        return void 0;
      const biome = context.biomeSource.getBiome(pos[0] >> 2, pos[1] >> 2, pos[2] >> 2, context.randomState.sampler);
      return [...this.settings.validBiomes.getEntries()].findIndex((b) => b.key()?.equals(biome)) >= 0 ? pos : void 0;
    }
  };
  (function(WorldgenStructure2) {
    WorldgenStructure2.REGISTRY = Registry.createAndRegister("worldgen/structure", fromJson);
    class StructureSettings {
      validBiomes;
      constructor(validBiomes) {
        this.validBiomes = validBiomes;
      }
    }
    WorldgenStructure2.StructureSettings = StructureSettings;
    class GenerationContext {
      seed;
      biomeSource;
      settings;
      levelHeight;
      chunkGenerator;
      randomState;
      constructor(seed, biomeSource, settings, levelHeight) {
        this.seed = seed;
        this.biomeSource = biomeSource;
        this.settings = settings;
        this.levelHeight = levelHeight;
        this.randomState = new RandomState(settings, seed);
        this.chunkGenerator = new NoiseChunkGenerator(biomeSource, settings);
      }
    }
    WorldgenStructure2.GenerationContext = GenerationContext;
    const structurePoolParser = Holder.parser(StructureTemplatePool.REGISTRY, StructureTemplatePool.fromJson);
    function fromJson(obj) {
      const BiomeTagParser = HolderSet.parser(WorldgenRegistries.BIOME);
      const root = Json.readObject(obj) ?? {};
      const biomes = BiomeTagParser(root.biomes);
      const settings = new StructureSettings(biomes.value());
      switch (Json.readString(root.type)?.replace(/^minecraft:/, "")) {
        case "buried_treasure":
          return new BuriedTreasureStructure(settings);
        case "desert_pyramid":
          return new DesertPyramidStructure(settings);
        case "end_city":
          return new EndCityStructure(settings);
        case "fortress":
          return new NetherFortressStructure(settings);
        case "igloo":
          return new IglooStructure(settings);
        case "jigsaw":
          const startHeight = HeightProvider.fromJson(root.start_height);
          const startPool = structurePoolParser(root.start_pool);
          const startJigsawNameString = Json.readString(root.start_jigsaw_name);
          const startJigsawName = startJigsawNameString ? Identifier.parse(startJigsawNameString) : void 0;
          const heightmap = Heightmap.fromJson(root.project_start_to_heightmap);
          const dimensionPadding = JigsawStructure.DimensionPadding.fromJson(root.dimension_padding);
          return new JigsawStructure(settings, startPool, startHeight, heightmap, startJigsawName, dimensionPadding);
        case "jungle_temple":
          return new JungleTempleStructure(settings);
        case "mineshaft":
          const type = Json.readString(root.mineshaft_type) === "mesa" ? "mesa" : "normal";
          return new MineshaftStructure(settings, type);
        case "nether_fossil":
          return new NetherFortressStructure(settings);
        case "ocean_monument":
          return new OceanMonumentStructure(settings);
        case "ocean_ruin":
          return new OceanRuinStructure(settings);
        case "ruined_portal":
          return new RuinedPortalStructure(settings);
        case "shipwreck":
          const isBeached = Json.readBoolean(root.is_beached) ?? false;
          return new ShipwreckStructure(settings, isBeached);
        case "stronghold":
          return new StrongholdStructure(settings);
        case "swamp_hut":
          return new SwampHutStructure(settings);
        case "woodland_mansion":
          return new WoodlandMansionStructure(settings);
      }
      return new BuriedTreasureStructure(settings);
    }
    WorldgenStructure2.fromJson = fromJson;
    class JigsawStructure extends WorldgenStructure2 {
      startingPoolHolder;
      startHeight;
      projectStartToHeightmap;
      startJigsawName;
      dimensionPadding;
      constructor(settings, startingPoolHolder, startHeight, projectStartToHeightmap, startJigsawName, dimensionPadding) {
        super(settings);
        this.startingPoolHolder = startingPoolHolder;
        this.startHeight = startHeight;
        this.projectStartToHeightmap = projectStartToHeightmap;
        this.startJigsawName = startJigsawName;
        this.dimensionPadding = dimensionPadding;
      }
      findGenerationPoint(chunkX, chunkZ, random2, context) {
        var y = this.startHeight(random2, context.settings.noise);
        const pos = BlockPos.create(chunkX << 4, y, chunkZ << 4);
        const rotation = Rotation.getRandom(random2);
        const startingPool = this.startingPoolHolder.value();
        const startingElement = startingPool.getRandomTemplate(random2);
        if (startingElement instanceof StructurePoolElement.EmptyPoolElement) {
          return void 0;
        } else {
          var startJigsawOffset;
          if (this.startJigsawName) {
            const offset = JigsawStructure.getRandomNamedJigsaw(startingElement, this.startJigsawName, rotation, random2);
            if (offset === void 0) {
              return void 0;
            }
            startJigsawOffset = offset;
          } else {
            startJigsawOffset = BlockPos.ZERO;
          }
          const templateStartPos = BlockPos.subtract(pos, startJigsawOffset);
          const boundingBox = startingElement.getBoundingBox(templateStartPos, rotation);
          const x = (boundingBox[1][0] + boundingBox[0][0]) / 2 ^ 0;
          const z = (boundingBox[1][2] + boundingBox[0][2]) / 2 ^ 0;
          var y;
          if (this.projectStartToHeightmap) {
            y = pos[1] + context.chunkGenerator.getBaseHeight(x, z, this.projectStartToHeightmap, context.randomState);
          } else {
            y = templateStartPos[1];
          }
          boundingBox.forEach((pos2) => pos2[1] += y - boundingBox[0][1] - 1);
          if (JigsawStructure.isStartTooCloseToWorldHeightLimits(this.dimensionPadding, boundingBox, context.levelHeight)) {
            return void 0;
          }
          const generationPoint = BlockPos.create(x, y + startJigsawOffset[1], z);
          return generationPoint;
        }
      }
      static isStartTooCloseToWorldHeightLimits(dimensionPadding, boundingBox, levelHeight) {
        if (dimensionPadding === JigsawStructure.DimensionPadding.ZERO) {
          return false;
        }
        const bottomLimit = levelHeight.minY + dimensionPadding.bottom;
        const topLimit = levelHeight.minY + levelHeight.height - dimensionPadding.top;
        return boundingBox[0][1] < bottomLimit || boundingBox[1][1] > topLimit;
      }
      static getRandomNamedJigsaw(element, name, rotation, random2) {
        const jigsaws = element.getShuffledJigsawBlocks(rotation, random2);
        for (const jigsaw of jigsaws) {
          if (Identifier.parse(jigsaw.nbt?.getString("name") ?? "minecraft:empty").equals(name)) {
            return jigsaw.pos;
          }
        }
        return void 0;
      }
    }
    WorldgenStructure2.JigsawStructure = JigsawStructure;
    (function(JigsawStructure2) {
      class DimensionPadding {
        top;
        bottom;
        static ZERO = new DimensionPadding(0, 0);
        constructor(top, bottom) {
          this.top = top;
          this.bottom = bottom;
        }
        static fromJson(obj) {
          if (obj === void 0) {
            return DimensionPadding.ZERO;
          }
          if (typeof obj === "number") {
            return new DimensionPadding(obj, obj);
          }
          const padding = Json.readObject(obj) ?? {};
          return new DimensionPadding(Json.readInt(padding.top) ?? 0, Json.readInt(padding.bottom) ?? 0);
        }
      }
      JigsawStructure2.DimensionPadding = DimensionPadding;
    })(JigsawStructure = WorldgenStructure2.JigsawStructure || (WorldgenStructure2.JigsawStructure = {}));
    class BuriedTreasureStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ, _, context) {
        return this.onTopOfChunkCenter(context, chunkX, chunkZ, "OCEAN_FLOOR_WG");
      }
    }
    WorldgenStructure2.BuriedTreasureStructure = BuriedTreasureStructure;
    class SinglePieceStructure extends WorldgenStructure2 {
      width;
      depth;
      constructor(settings, width, depth) {
        super(settings);
        this.width = width;
        this.depth = depth;
      }
      findGenerationPoint(chunkX, chunkZ, _, context) {
        if (this.getLowestY(context, chunkX << 4, chunkZ << 4, this.width, this.depth) < context.settings.seaLevel) {
          return void 0;
        } else {
          return this.onTopOfChunkCenter(context, chunkX, chunkZ);
        }
      }
    }
    class DesertPyramidStructure extends SinglePieceStructure {
      constructor(settings) {
        super(settings, 21, 21);
      }
    }
    WorldgenStructure2.DesertPyramidStructure = DesertPyramidStructure;
    class EndCityStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ, random2, context) {
        const rotation = Rotation.getRandom(random2);
        const pos = this.getLowestYIn5by5BoxOffset7Blocks(context, chunkX, chunkZ, rotation);
        if (pos[1] < 60)
          return void 0;
        return pos;
      }
    }
    WorldgenStructure2.EndCityStructure = EndCityStructure;
    class NetherFortressStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ) {
        return BlockPos.create(chunkX << 4, 64, chunkZ << 4);
      }
    }
    WorldgenStructure2.NetherFortressStructure = NetherFortressStructure;
    class IglooStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ, _, context) {
        return this.onTopOfChunkCenter(context, chunkX, chunkZ);
      }
    }
    WorldgenStructure2.IglooStructure = IglooStructure;
    class JungleTempleStructure extends SinglePieceStructure {
      constructor(settings) {
        super(settings, 12, 15);
      }
    }
    WorldgenStructure2.JungleTempleStructure = JungleTempleStructure;
    class MineshaftStructure extends WorldgenStructure2 {
      type;
      constructor(settings, type) {
        super(settings);
        this.type = type;
      }
      findGenerationPoint(chunkX, chunkZ, random2, context) {
        throw new Error("Method not implemented.");
      }
    }
    WorldgenStructure2.MineshaftStructure = MineshaftStructure;
    class NetherFossilStructure extends WorldgenStructure2 {
      height;
      constructor(settings, height) {
        super(settings);
        this.height = height;
      }
      findGenerationPoint(chunkX, chunkZ) {
        throw new Error("Method not implemented.");
      }
    }
    WorldgenStructure2.NetherFossilStructure = NetherFossilStructure;
    class OceanMonumentStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ) {
        throw new Error("Method not implemented.");
      }
    }
    WorldgenStructure2.OceanMonumentStructure = OceanMonumentStructure;
    class OceanRuinStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ, _, context) {
        return this.onTopOfChunkCenter(context, chunkX, chunkZ, "OCEAN_FLOOR_WG");
      }
    }
    WorldgenStructure2.OceanRuinStructure = OceanRuinStructure;
    class RuinedPortalStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ) {
        throw new Error("Method not implemented.");
      }
    }
    WorldgenStructure2.RuinedPortalStructure = RuinedPortalStructure;
    class ShipwreckStructure extends WorldgenStructure2 {
      isBeached;
      constructor(settings, isBeached) {
        super(settings);
        this.isBeached = isBeached;
      }
      findGenerationPoint(chunkX, chunkZ, _, context) {
        return this.onTopOfChunkCenter(context, chunkX, chunkZ, this.isBeached ? "WORLD_SURFACE_WG" : "OCEAN_FLOOR_WG");
      }
    }
    WorldgenStructure2.ShipwreckStructure = ShipwreckStructure;
    class StrongholdStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ) {
        return BlockPos.create(chunkX << 4, 0, chunkZ << 4);
      }
    }
    WorldgenStructure2.StrongholdStructure = StrongholdStructure;
    class SwampHutStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ, _, context) {
        return this.onTopOfChunkCenter(context, chunkX, chunkZ);
      }
    }
    WorldgenStructure2.SwampHutStructure = SwampHutStructure;
    class WoodlandMansionStructure extends WorldgenStructure2 {
      findGenerationPoint(chunkX, chunkZ, random2, context) {
        const rotation = Rotation.getRandom(random2);
        const pos = this.getLowestYIn5by5BoxOffset7Blocks(context, chunkX, chunkZ, rotation);
        if (pos[1] < 60)
          return void 0;
        return pos;
      }
    }
    WorldgenStructure2.WoodlandMansionStructure = WoodlandMansionStructure;
  })(WorldgenStructure || (WorldgenStructure = {}));

  // node_modules/deepslate/lib/worldgen/structure/StructureSet.js
  var StructureSet = class _StructureSet {
    structures;
    placement;
    static REGISTRY = Registry.createAndRegister("worldgen/structure_set", _StructureSet.fromJson);
    constructor(structures, placement) {
      this.structures = structures;
      this.placement = placement;
    }
    static fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const structures = Json.readArray(root.structures, _StructureSet.StructureSelectionEntry.fromJson) ?? [];
      const placement = StructurePlacement.fromJson(root.placement);
      return new _StructureSet(structures, placement);
    }
    getStructureInChunk(chunkX, chunkZ, context) {
      this.placement.prepare(context.biomeSource, context.randomState.sampler, context.seed);
      if (!this.placement.isStructureChunk(context.seed, chunkX, chunkZ)) {
        return void 0;
      }
      if (this.structures.length === 0)
        return void 0;
      if (this.structures.length === 1) {
        const pos = this.structures[0].structure.value().tryGenerate(chunkX, chunkZ, context);
        if (pos !== void 0) {
          return { id: this.structures[0].structure.key(), pos };
        }
      } else {
        const random2 = LegacyRandom.fromLargeFeatureSeed(context.seed, chunkX, chunkZ);
        const list = Object.assign([], this.structures);
        let totalWeight = list.reduce((v, e, i) => v + e.weight, 0);
        while (list.length > 0) {
          let weightIndex = random2.nextInt(totalWeight);
          let id;
          let entry;
          for ([id, entry] of list.entries()) {
            weightIndex -= entry.weight;
            if (weightIndex < 0) {
              break;
            }
          }
          const pos = entry.structure.value().tryGenerate(chunkX, chunkZ, context);
          if (pos !== void 0) {
            return { id: entry.structure.key(), pos };
          }
          list.splice(id, 1);
          totalWeight -= entry.weight;
        }
      }
      return void 0;
    }
  };
  (function(StructureSet2) {
    class StructureSelectionEntry {
      structure;
      weight;
      constructor(structure, weight) {
        this.structure = structure;
        this.weight = weight;
      }
      static fromJson(obj) {
        const root = Json.readObject(obj) ?? {};
        return new StructureSelectionEntry(Holder.reference(WorldgenStructure.REGISTRY, Identifier.parse(Json.readString(root.structure) ?? "minecraft:empty")), Json.readInt(root.weight) ?? 1);
      }
    }
    StructureSet2.StructureSelectionEntry = StructureSelectionEntry;
  })(StructureSet || (StructureSet = {}));

  // node_modules/deepslate/lib/worldgen/structure/StructurePlacement.js
  var StructurePlacement = class _StructurePlacement {
    locateOffset;
    frequencyReductionMethod;
    frequency;
    salt;
    exclusionZone;
    constructor(locateOffset, frequencyReductionMethod, frequency, salt, exclusionZone) {
      this.locateOffset = locateOffset;
      this.frequencyReductionMethod = frequencyReductionMethod;
      this.frequency = frequency;
      this.salt = salt;
      this.exclusionZone = exclusionZone;
    }
    static fromJson(obj) {
      const root = Json.readObject(obj) ?? {};
      const type = Json.readString(root.type)?.replace(/^minecraft:/, "");
      const locateOffset = BlockPos.fromJson(root.locate_offset);
      const frequencyReductionMethod = _StructurePlacement.FrequencyReducer.fromType(Json.readString(root.frequency_reduction_method) ?? "default");
      const frequency = Json.readNumber(root.frequency) ?? 1;
      const salt = Json.readInt(root.salt) ?? 0;
      const exclusionZone = "exclusion_zone" in root ? _StructurePlacement.ExclusionZone.fromJson(root.exclusion_zone) : void 0;
      switch (type) {
        case "random_spread":
          const spacing = Json.readInt(root.spacing) ?? 1;
          const separation = Json.readInt(root.separation) ?? 1;
          const spreadType = _StructurePlacement.SpreadType.fromJson(root.spread_type);
          return new _StructurePlacement.RandomSpreadStructurePlacement(locateOffset, frequencyReductionMethod, frequency, salt, exclusionZone, spacing, separation, spreadType);
        case "concentric_rings":
          const distance2 = Json.readInt(root.distance) ?? 1;
          const spread = Json.readInt(root.spread) ?? 1;
          const count = Json.readInt(root.count) ?? 1;
          const preferredBiomes = HolderSet.parser(WorldgenRegistries.BIOME)(root.preferred_biomes);
          return new _StructurePlacement.ConcentricRingsStructurePlacement(locateOffset, frequencyReductionMethod, frequency, salt, exclusionZone, distance2, spread, count, preferredBiomes);
      }
      return new _StructurePlacement.RandomSpreadStructurePlacement([0, 0, 0], _StructurePlacement.FrequencyReducer.ProbabilityReducer, 1, 0, void 0, 1, 1, "linear");
    }
    isStructureChunk(seed, chunkX, chunkZ) {
      if (!this.isPlacementChunk(seed, chunkX, chunkZ)) {
        return false;
      } else if (this.frequency < 1 && !this.frequencyReductionMethod(seed, this.salt, chunkX, chunkZ, this.frequency)) {
        return false;
      } else if (this.exclusionZone && this.exclusionZone.isPlacementForbidden(seed, chunkX, chunkZ)) {
        return false;
      } else {
        return true;
      }
    }
    prepare(_biomeSource, _sampler, _concentricRingsSeed) {
    }
  };
  (function(StructurePlacement2) {
    let FrequencyReducer;
    (function(FrequencyReducer2) {
      function fromType(type) {
        switch (type) {
          case "legacy_type_1":
            return LegacyPillagerOutpostReducer;
          case "legacy_type_2":
            return LegacyArbitrarySaltProbabilityReducer;
          case "legacy_type_3":
            return LegacyProbabilityReducerWithDouble;
          case "default":
          default:
            return ProbabilityReducer;
        }
      }
      FrequencyReducer2.fromType = fromType;
      function ProbabilityReducer(seed, salt, chunkX, chunkZ, frequency) {
        const random2 = LegacyRandom.fromLargeFeatureWithSalt(seed, salt, chunkX, chunkZ);
        return random2.nextFloat() < frequency;
      }
      FrequencyReducer2.ProbabilityReducer = ProbabilityReducer;
      function LegacyProbabilityReducerWithDouble(seed, _, chunkX, chunkZ, frequency) {
        const random2 = LegacyRandom.fromLargeFeatureSeed(seed, chunkX, chunkZ);
        return random2.nextDouble() < frequency;
      }
      FrequencyReducer2.LegacyProbabilityReducerWithDouble = LegacyProbabilityReducerWithDouble;
      function LegacyArbitrarySaltProbabilityReducer(seed, _, chunkX, chunkZ, frequency) {
        const random2 = LegacyRandom.fromLargeFeatureWithSalt(seed, chunkX, chunkZ, 10387320);
        return random2.nextFloat() < frequency;
      }
      FrequencyReducer2.LegacyArbitrarySaltProbabilityReducer = LegacyArbitrarySaltProbabilityReducer;
      function LegacyPillagerOutpostReducer(seed, _, chunkX, chunkZ, frequency) {
        const a = chunkX >> 4;
        const b = chunkZ >> 4;
        const random2 = new LegacyRandom(BigInt(a ^ b << 4) ^ seed);
        random2.nextInt();
        return random2.nextInt(Math.floor(1 / frequency)) === 0;
      }
      FrequencyReducer2.LegacyPillagerOutpostReducer = LegacyPillagerOutpostReducer;
    })(FrequencyReducer = StructurePlacement2.FrequencyReducer || (StructurePlacement2.FrequencyReducer = {}));
    class ExclusionZone {
      otherSet;
      chunkCount;
      constructor(otherSet, chunkCount) {
        this.otherSet = otherSet;
        this.chunkCount = chunkCount;
      }
      static fromJson(obj) {
        const root = Json.readObject(obj) ?? {};
        return new ExclusionZone(Holder.reference(StructureSet.REGISTRY, Identifier.parse(Json.readString(root.other_set) ?? "")), Json.readInt(root.chunk_count) ?? 1);
      }
      isPlacementForbidden(seed, chunkX, chunkZ) {
        const placement = this.otherSet.value().placement;
        return placement.getPotentialStructureChunks(seed, chunkX - this.chunkCount, chunkZ - this.chunkCount, chunkX + this.chunkCount, chunkZ + this.chunkCount).findIndex((chunk) => Math.abs(chunk[0] - chunkX) <= this.chunkCount && Math.abs(chunk[1] - chunkZ) <= this.chunkCount && placement.isStructureChunk(seed, chunk[0], chunk[1])) >= 0;
      }
    }
    StructurePlacement2.ExclusionZone = ExclusionZone;
    let SpreadType;
    (function(SpreadType2) {
      function fromJson(obj) {
        const string = Json.readString(obj) ?? "linear";
        if (string === "triangular")
          return "triangular";
        return "linear";
      }
      SpreadType2.fromJson = fromJson;
    })(SpreadType = StructurePlacement2.SpreadType || (StructurePlacement2.SpreadType = {}));
    class RandomSpreadStructurePlacement extends StructurePlacement2 {
      spacing;
      separation;
      spreadType;
      constructor(locateOffset, frequencyReductionMethod, frequency, salt, exclusionZone, spacing, separation, spreadType) {
        super(locateOffset, frequencyReductionMethod, frequency, salt, exclusionZone);
        this.spacing = spacing;
        this.separation = separation;
        this.spreadType = spreadType;
      }
      evaluateSpread(random2, max2) {
        switch (this.spreadType) {
          case "linear":
            return random2.nextInt(max2);
          case "triangular":
            return Math.floor((random2.nextInt(max2) + random2.nextInt(max2)) / 2);
        }
      }
      getPotentialStructureChunk(seed, chunkX, chunkZ) {
        const x = Math.floor(chunkX / this.spacing);
        const z = Math.floor(chunkZ / this.spacing);
        const random2 = LegacyRandom.fromLargeFeatureWithSalt(seed, x, z, this.salt);
        const maxOffset = this.spacing - this.separation;
        const offsetX = this.evaluateSpread(random2, maxOffset);
        const offsetZ = this.evaluateSpread(random2, maxOffset);
        return [x * this.spacing + offsetX, z * this.spacing + offsetZ];
      }
      isPlacementChunk(seed, chunkX, chunkZ) {
        const [placementX, palcementZ] = this.getPotentialStructureChunk(seed, chunkX, chunkZ);
        return placementX === chunkX && palcementZ === chunkZ;
      }
      getPotentialStructureChunks(seed, minChunkX, minChunkZ, maxChunkX, maxChunkZ) {
        const positions = [];
        for (let chunkX = Math.floor(minChunkX / this.spacing) * this.spacing; chunkX <= maxChunkX; chunkX += this.spacing) {
          for (let chunkZ = Math.floor(minChunkZ / this.spacing) * this.spacing; chunkZ <= maxChunkZ; chunkZ += this.spacing) {
            positions.push(this.getPotentialStructureChunk(seed, chunkX, chunkZ));
          }
        }
        return positions;
      }
    }
    StructurePlacement2.RandomSpreadStructurePlacement = RandomSpreadStructurePlacement;
    const SEARCH_RANGE = 112;
    class ConcentricRingsStructurePlacement extends StructurePlacement2 {
      distance;
      spread;
      count;
      preferredBiomes;
      positions;
      constructor(locateOffset, frequencyReductionMethod, frequency, salt, exclusionZone, distance2, spread, count, preferredBiomes) {
        super(locateOffset, frequencyReductionMethod, frequency, salt, exclusionZone);
        this.distance = distance2;
        this.spread = spread;
        this.count = count;
        this.preferredBiomes = preferredBiomes;
      }
      prepare(biomeSource, sampler, concentricRingsSeed) {
        if (this.positions !== void 0) {
          return;
        }
        this.positions = [];
        if (this.count === 0) {
          return;
        }
        const random2 = new LegacyRandom(concentricRingsSeed);
        var angle2 = random2.nextDouble() * Math.PI * 2;
        var current_spread = this.spread;
        var ringNr = 0;
        var posInRingNr = 0;
        const preferredBiomes = [...this.preferredBiomes.value().getEntries()].flatMap((b) => b.key() ?? []);
        for (var i = 0; i < this.count; i++) {
          const current_distance = 4 * this.distance + this.distance * ringNr * 6 + (random2.nextDouble() - 0.5) * this.distance * 2.5;
          const chunkX = Math.round(Math.cos(angle2) * current_distance);
          const chunkZ = Math.round(Math.sin(angle2) * current_distance);
          const posX = (chunkX << 4) + 8;
          const posZ = (chunkZ << 4) + 8;
          const forkedRandom = random2.fork();
          const provider = () => {
            const searchResult = BiomeSource.findBiomeHorizontal(biomeSource, posX, 0, posZ, SEARCH_RANGE, (biome) => preferredBiomes.findIndex((b) => b.equals(biome)) >= 0, forkedRandom, sampler);
            if (searchResult) {
              return [searchResult.pos[0] >> 4, searchResult.pos[2] >> 4];
            } else {
              return [chunkX, chunkZ];
            }
          };
          this.positions.push({ center: [chunkX, chunkZ], real: provider });
          angle2 += Math.PI * 2 / current_spread;
          posInRingNr++;
          if (posInRingNr == current_spread) {
            ringNr++;
            posInRingNr = 0;
            current_spread += 2 * current_spread / (ringNr + 1);
            current_spread = Math.min(current_spread, this.count - i);
            angle2 += random2.nextDouble() * Math.PI * 2;
          }
        }
      }
      isPlacementChunk(seed, chunkX, chunkZ) {
        if (this.positions === void 0) {
          console.warn("trying to access concentric rings placement before position calculation");
          return false;
        }
        return this.getPotentialStructureChunks(seed, chunkX, chunkZ, chunkX, chunkZ).findIndex((p) => p[0] === chunkX && p[1] === chunkZ) >= 0;
      }
      getPotentialStructureChunks(seed, minChunkX, minChunkZ, maxChunkX, maxChunkZ) {
        if (this.positions === void 0) {
          console.warn("trying to access concentric rings placement before position calculation");
          return [];
        }
        const results = [];
        for (const position of this.positions) {
          if (position.center[0] < minChunkX - (SEARCH_RANGE >> 4))
            continue;
          if (position.center[0] > maxChunkX + (SEARCH_RANGE >> 4))
            continue;
          if (position.center[1] < minChunkZ - (SEARCH_RANGE >> 4))
            continue;
          if (position.center[1] > maxChunkZ + (SEARCH_RANGE >> 4))
            continue;
          if (position.real instanceof Function) {
            position.real = position.real();
          }
          results.push(position.real);
        }
        return results;
      }
    }
    StructurePlacement2.ConcentricRingsStructurePlacement = ConcentricRingsStructurePlacement;
  })(StructurePlacement || (StructurePlacement = {}));

  // node_modules/deepslate/lib/render/main.js
  var main_exports = {};
  __export(main_exports, {
    BlendedNoise: () => BlendedNoise,
    BlockColors: () => BlockColors,
    BlockDefinition: () => BlockDefinition,
    BlockModel: () => BlockModel,
    BlockPos: () => BlockPos,
    BlockState: () => BlockState,
    Chunk: () => Chunk,
    ChunkBuilder: () => ChunkBuilder,
    ChunkPos: () => ChunkPos,
    ChunkSection: () => ChunkSection,
    Color: () => Color,
    CubicSpline: () => CubicSpline,
    Cull: () => Cull,
    Direction: () => Direction,
    EFFECT_COLORS: () => EFFECT_COLORS,
    Holder: () => Holder,
    HolderSet: () => HolderSet,
    Identifier: () => Identifier,
    ImprovedNoise: () => ImprovedNoise,
    ItemModel: () => ItemModel,
    ItemRenderer: () => ItemRenderer,
    ItemStack: () => ItemStack,
    ItemTint: () => ItemTint,
    Json: () => Json,
    LegacyPositionalRandom: () => LegacyPositionalRandom,
    LegacyRandom: () => LegacyRandom,
    Line: () => Line,
    Matrix3: () => Matrix3,
    Matrix4: () => Matrix4,
    Mesh: () => Mesh,
    MinMaxNumberFunction: () => MinMaxNumberFunction,
    MobEffectInstance: () => MobEffectInstance,
    NoiseParameters: () => NoiseParameters,
    NormalNoise: () => NormalNoise,
    POTION_EFFECTS: () => POTION_EFFECTS,
    PalettedContainer: () => PalettedContainer,
    PerlinNoise: () => PerlinNoise,
    PerlinSimplexNoise: () => PerlinSimplexNoise,
    PotionContents: () => PotionContents,
    Quad: () => Quad,
    Registry: () => Registry,
    Renderer: () => Renderer,
    Rotation: () => Rotation,
    ShaderProgram: () => ShaderProgram,
    SimplexNoise: () => SimplexNoise,
    SpecialRenderers: () => SpecialRenderers,
    StringReader: () => StringReader,
    Structure: () => Structure,
    StructureRenderer: () => StructureRenderer,
    TextureAtlas: () => TextureAtlas,
    Vector: () => Vector,
    Vertex: () => Vertex,
    VoxelRenderer: () => VoxelRenderer,
    XoroshiroPositionalRandom: () => XoroshiroPositionalRandom,
    XoroshiroRandom: () => XoroshiroRandom,
    binarySearch: () => binarySearch,
    clamp: () => clamp,
    clampedLerp: () => clampedLerp,
    clampedMap: () => clampedMap,
    computeIfAbsent: () => computeIfAbsent,
    floatLerp: () => floatLerp,
    getSeed: () => getSeed,
    intFloor: () => intFloor,
    inverseLerp: () => inverseLerp,
    isPowerOfTwo: () => isPowerOfTwo,
    lazy: () => lazy,
    lazyLerp: () => lazyLerp,
    lazyLerp2: () => lazyLerp2,
    lazyLerp3: () => lazyLerp3,
    lerp: () => lerp,
    lerp2: () => lerp2,
    lerp3: () => lerp3,
    longFloor: () => longFloor,
    longfromBytes: () => longfromBytes,
    map: () => map,
    mutateWithDefault: () => mutateWithDefault,
    nextInt: () => nextInt,
    randomBetweenInclusive: () => randomBetweenInclusive,
    shuffle: () => shuffle,
    smoothstep: () => smoothstep,
    square: () => square,
    upperPowerOfTwo: () => upperPowerOfTwo
  });

  // entry.mjs
  window.DS = { ...lib_exports, ...main_exports, mat4: mat4_exports };
})();
/*! Bundled license information:

is-buffer/index.js:
  (*!
   * Determine if an object is a Buffer
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)

pako/dist/pako.esm.mjs:
  (*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) *)
*/

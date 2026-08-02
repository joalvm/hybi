type SchemaLike = Record<string, unknown>;

const MAX_DEPTH = 8;

/**
 * Values that satisfy the formats `ajv-formats` enforces. Fixed strings rather
 * than generated ones: the sample seeds an editor, and a fresh uuid on every
 * open would churn the payload for no gain.
 */
const FORMAT_SAMPLES: Record<string, string> = {
  uuid: '00000000-0000-4000-8000-000000000000',
  'date-time': '2024-01-01T00:00:00.000Z',
  date: '2024-01-01',
  time: '00:00:00',
  duration: 'PT1S',
  email: 'user@example.com',
  hostname: 'example.com',
  ipv4: '127.0.0.1',
  ipv6: '::1',
  uri: 'https://example.com',
  'uri-reference': '/path',
  url: 'https://example.com',
  regex: '.*',
};

function isObject(value: unknown): value is SchemaLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `type` may be a union such as `['string', 'null']`; the first entry wins. */
function firstType(value: unknown): unknown {
  return Array.isArray(value) ? (value as unknown[])[0] : value;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/**
 * A deterministic sample value for a JSON Schema. The result seeds the payload
 * editor, so it favours predictability over realism: same schema, same text,
 * and no random ids that would churn the diff every time an event is opened.
 *
 * The sample also has to *validate* against its own schema — the composer checks
 * it the moment the event is opened — so simple constraints (`format`,
 * `minLength`, `exclusiveMinimum`, `minItems`) are honoured instead of ignored.
 */
export function exampleFromSchema(schema: unknown, depth = 0): unknown {
  if (!isObject(schema) || depth > MAX_DEPTH) return null;

  if ('example' in schema) return schema.example;
  if ('default' in schema) return schema.default;
  // A `const` is the only value that validates, and it is what discriminates the
  // branches of a `oneOf`, so it outranks every other hint.
  if ('const' in schema) return schema.const;
  const enumValues: unknown = schema.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) return firstType(enumValues);

  const base = fromType(schema, depth);
  const composed = fromComposition(schema, depth);
  if (composed === undefined) return base;
  // Both describe the same instance, so two object samples keep the properties
  // of each and the branch wins the keys they share. Anything else is replaced.
  return isObject(base) && isObject(composed) ? { ...base, ...composed } : composed;
}

function fromType(schema: SchemaLike, depth: number): unknown {
  switch (firstType(schema.type)) {
    case 'object': {
      const properties = schema.properties;
      if (!isObject(properties)) return {};
      return Object.fromEntries(
        Object.entries(properties).map(([key, value]) => [key, exampleFromSchema(value, depth + 1)]),
      );
    }
    case 'array': {
      const items = Math.max(1, asNumber(schema.minItems) ?? 1);
      return Array.from({ length: items }, () => exampleFromSchema(schema.items, depth + 1));
    }
    case 'string':
      return sampleString(schema);
    case 'integer':
    case 'number':
      return sampleNumber(schema);
    case 'boolean':
      return false;
    case 'null':
      return null;
    default:
      // An untyped schema that still carries properties is an object in
      // practice; anything else has nothing to build a sample from on its own.
      return isObject(schema.properties)
        ? fromType({ ...schema, type: 'object' }, depth)
        : null;
  }
}

/**
 * `oneOf` and `anyOf` are satisfied by their first branch, and `allOf` by every
 * branch at once, so its object samples are merged. Returns `undefined` when
 * there was no composition to draw from.
 */
function fromComposition(schema: SchemaLike, depth: number): unknown {
  const all = schema.allOf;
  if (Array.isArray(all)) {
    const samples = all.map((entry) => exampleFromSchema(entry, depth + 1));
    return samples.every(isObject) ? Object.assign({}, ...samples) : samples[0];
  }

  const branches: unknown = schema.oneOf ?? schema.anyOf;
  if (!Array.isArray(branches) || branches.length === 0) return undefined;
  return exampleFromSchema(branches[0], depth + 1);
}

function sampleString(schema: SchemaLike): string {
  const format = schema.format;
  const sample = typeof format === 'string' ? FORMAT_SAMPLES[format] : undefined;
  if (sample !== undefined) return sample;

  // A `pattern` cannot be inverted, but documents mostly use it to spell out a
  // date or a time by hand, so the format samples are tried against it before
  // giving up. Padding to a length floor is only safe with no pattern to break.
  if (typeof schema.pattern === 'string') return matchingSample(schema.pattern);
  return 'x'.repeat(asNumber(schema.minLength) ?? 0);
}

function matchingSample(pattern: string): string {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, 'u');
  } catch {
    // An unsupported flavour of regex (a .NET or PCRE extension, say) is not
    // this importer's problem: the user edits the value anyway.
    return '';
  }
  return Object.values(FORMAT_SAMPLES).find((value) => regex.test(value)) ?? '';
}

/**
 * Zero unless the schema forbids it. `exclusiveMinimum: 0` is how documents
 * usually say "an id", and a sample of `0` made every such event open with a
 * validation error.
 */
function sampleNumber(schema: SchemaLike): number {
  const minimum = asNumber(schema.minimum) ?? 0;
  const exclusive = asNumber(schema.exclusiveMinimum);
  return Math.max(0, exclusive === undefined ? minimum : Math.max(minimum, exclusive + 1));
}

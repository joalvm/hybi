import { resolve } from 'node:path';
import { Validator } from '@cfworker/json-schema';
import { describe, expect, it } from 'vitest';
import { exampleFromSchema } from '../../src/main/asyncapi/example.js';
import { AsyncApiImportError, importAsyncApi } from '../../src/main/asyncapi/importer.js';

const fixture = (name: string) => resolve('tests/fixtures', name);

describe('exampleFromSchema', () => {
  it('builds an object from properties', () => {
    expect(
      exampleFromSchema({
        type: 'object',
        properties: {
          token: { type: 'string' },
          retries: { type: 'integer' },
          active: { type: 'boolean' },
        },
      }),
    ).toEqual({ token: '', retries: 0, active: false });
  });

  it('prefers an explicit example and the first enum value', () => {
    expect(exampleFromSchema({ type: 'string', example: 'abc' })).toBe('abc');
    expect(exampleFromSchema({ type: 'string', enum: ['a', 'b'] })).toBe('a');
  });

  it('wraps array items', () => {
    expect(exampleFromSchema({ type: 'array', items: { type: 'string' } })).toEqual(['']);
  });

  /**
   * The sample is validated the moment the event opens, so a constraint that
   * rules out the obvious value has to be honoured or the editor greets the user
   * with an error about its own text.
   */
  it('honours the constraints the sample would otherwise break', () => {
    expect(exampleFromSchema({ type: 'string', format: 'uuid' })).toBe(
      '00000000-0000-4000-8000-000000000000',
    );
    expect(exampleFromSchema({ type: 'string', minLength: 2 })).toBe('xx');
    expect(exampleFromSchema({ type: 'integer', exclusiveMinimum: 0 })).toBe(1);
    expect(exampleFromSchema({ type: 'number', minimum: 5 })).toBe(5);
    expect(exampleFromSchema({ type: 'array', items: { type: 'string' }, minItems: 2 })).toEqual([
      '',
      '',
    ]);
  });

  it('picks a value a pattern accepts when one of the samples fits', () => {
    expect(exampleFromSchema({ type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' })).toBe(
      '2024-01-01',
    );
    expect(exampleFromSchema({ type: 'string', pattern: '^nothing matches this$' })).toBe('');
  });

  it('takes the const and the first branch of a composition', () => {
    expect(
      exampleFromSchema({
        allOf: [
          { type: 'object', properties: { id: { type: 'integer', exclusiveMinimum: 0 } } },
          {
            oneOf: [
              { type: 'object', properties: { op: { const: 'create' } } },
              { type: 'object', properties: { op: { const: 'delete' } } },
            ],
          },
        ],
      }),
    ).toEqual({ id: 1, op: 'create' });
  });
});

describe('importAsyncApi', () => {
  it('produces catalog items from an AsyncAPI 3 document', async () => {
    const result = await importAsyncApi(fixture('asyncapi-v3.json'));
    expect(result.items.length).toBeGreaterThan(0);
    for (const item of result.items) {
      expect(item.source).toBe('asyncapi');
      expect(() => {
        JSON.parse(item.payload);
      }).not.toThrow();
    }
  });

  /**
   * A document describes its own application, so the operations that
   * application *receives* are the ones this client can send. `/pings` exists
   * only as a `send` operation and must stay out of the catalog.
   */
  it('imports the operations the described application receives', async () => {
    const result = await importAsyncApi(fixture('asyncapi-v3.json'));
    expect(result.items.map((item) => item.name)).toEqual(['/users']);
  });

  it('names an item after the channel address, not the message', async () => {
    const result = await importAsyncApi(fixture('asyncapi-v3.json'));
    const payload: unknown = JSON.parse(result.items[0]?.payload ?? '{}');
    expect(payload).toEqual({
      event: '/users',
      data: { id: '00000000-0000-4000-8000-000000000000' },
    });
  });

  /**
   * The payload is an envelope, so the schema has to describe the envelope.
   * Storing the bare message schema opened every imported event with a
   * validation error against its own example.
   */
  it('stores a schema that validates the payload it ships', async () => {
    const result = await importAsyncApi(fixture('asyncapi-v3.json'));
    const item = result.items[0];

    expect(item?.schema).toMatchObject({
      type: 'object',
      properties: { event: { const: '/users' }, data: { type: 'object' } },
      required: ['event', 'data'],
    });
    // The composer's own validator and settings, so this passes exactly when the
    // composer opens the event without complaining.
    const validator = new Validator(item?.schema ?? {}, '7', false);
    const payload: unknown = JSON.parse(item?.payload ?? 'null');
    expect(validator.validate(payload).errors).toEqual([]);
  });

  it('produces catalog items from an AsyncAPI 2 document', async () => {
    const result = await importAsyncApi(fixture('asyncapi-v2.yaml'));
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('groups items into collections from plain tags', async () => {
    const result = await importAsyncApi(fixture('asyncapi-v2.yaml'));
    expect(result.collections.map((collection) => collection.name)).toEqual(['users']);
    expect(result.items[0]?.collectionId).toBe(result.collections[0]?.id);
  });

  /** Membership is mandatory, so an untagged operation groups under its document. */
  it('falls back to a collection named after the file', async () => {
    const result = await importAsyncApi(fixture('asyncapi-v3.json'));
    expect(result.collections.map((collection) => collection.name)).toEqual(['asyncapi-v3']);
    expect(result.items[0]?.collectionId).toBe(result.collections[0]?.id);
  });

  it('rejects an invalid document', async () => {
    await expect(importAsyncApi(fixture('asyncapi-invalid.yaml'))).rejects.toBeInstanceOf(
      AsyncApiImportError,
    );
  });
});

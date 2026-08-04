import { describe, expect, it, vi } from 'vitest';
import { labelOf, LABEL_PARSE_LIMIT } from '../../src/main/connections/websocket/label.js';

describe('labelOf', () => {
  it('lifts the event name out of an envelope', () => {
    expect(labelOf('{"event":"chat.send","data":{"text":"hi"}}')).toBe('chat.send');
  });

  it('falls back to a flattened preview when there is no envelope', () => {
    expect(labelOf('{\n  "a":  1\n}')).toBe('{ "a": 1 }');
  });

  it('truncates a long preview', () => {
    expect(labelOf('x'.repeat(200))).toBe(`${'x'.repeat(48)}…`);
  });

  // The label is 48 characters. Parsing megabytes of JSON into an object graph,
  // or copying the whole body to collapse its whitespace, to print those 48 is
  // what made a chatty peer cost more in the main process than on the wire.
  it('does not parse a frame larger than the parse limit', () => {
    const parse = vi.spyOn(JSON, 'parse');
    const body = `{"event":"big","pad":"${'x'.repeat(LABEL_PARSE_LIMIT)}"}`;

    const label = labelOf(body);

    expect(parse).not.toHaveBeenCalled();
    expect(label).toBe(`${body.slice(0, 48)}…`);
    parse.mockRestore();
  });

  it('does not parse a frame that never mentions an event key', () => {
    const parse = vi.spyOn(JSON, 'parse');
    labelOf('{"data":{"text":"hi"}}');
    expect(parse).not.toHaveBeenCalled();
    parse.mockRestore();
  });

  it('keeps working on a frame whose head is all whitespace', () => {
    expect(labelOf(`${' '.repeat(64)}hello`)).toBe('hello');
  });
});

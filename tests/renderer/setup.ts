/**
 * jsdom implements neither pointer capture nor ResizeObserver, and Radix calls
 * both while opening an overlay. These are the smallest stubs that let the real
 * components run; nothing here is asserted on.
 */
globalThis.ResizeObserver = class {
  observe(): void {
    /* no-op: layout is fixed in jsdom, so there is nothing to observe */
  }
  unobserve(): void {
    /* no-op */
  }
  disconnect(): void {
    /* no-op */
  }
};

globalThis.DOMRect = class {
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {}
  get top(): number {
    return this.y;
  }
  get left(): number {
    return this.x;
  }
  get right(): number {
    return this.x + this.width;
  }
  get bottom(): number {
    return this.y + this.height;
  }
  toJSON(): unknown {
    return this;
  }
  static fromRect(other?: DOMRectInit): DOMRect {
    return new DOMRect(other?.x, other?.y, other?.width, other?.height);
  }
};

Element.prototype.hasPointerCapture = (): boolean => false;
Element.prototype.setPointerCapture = (): void => {
  /* no-op */
};
Element.prototype.releasePointerCapture = (): void => {
  /* no-op */
};
Element.prototype.scrollIntoView = (): void => {
  /* no-op */
};

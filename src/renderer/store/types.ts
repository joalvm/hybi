import type { StoreApi } from 'zustand/vanilla';

export type SliceCreator<T> = (set: StoreApi<T>['setState']) => T;

import {vi} from 'vitest'


export const pool = {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
};

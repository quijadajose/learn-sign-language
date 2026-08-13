import { describe, expect, it } from "vitest";
import { unwrapApiData, unwrapApiList } from "./api";

describe("unwrapApiData", () => {
  it("desenvuelve un nivel de { data }", () => {
    expect(unwrapApiData<{ id: string }>({ data: { id: "1" } })).toEqual({
      id: "1",
    });
  });

  it("devuelve el valor si no hay envelope", () => {
    expect(unwrapApiData({ id: "1" })).toEqual({ id: "1" });
  });

  it("no trata null anidado como payload", () => {
    expect(unwrapApiData({ data: null })).toEqual({ data: null });
  });
});

describe("unwrapApiList", () => {
  it("acepta arrays directos", () => {
    expect(unwrapApiList([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  it("desenvuelve { data: T[] }", () => {
    expect(unwrapApiList({ data: [{ id: 1 }], total: 1 })).toEqual([{ id: 1 }]);
  });

  it("desenvuelve { items: T[] }", () => {
    expect(unwrapApiList({ items: [{ id: 2 }] })).toEqual([{ id: 2 }]);
  });

  it("devuelve [] si no hay lista", () => {
    expect(unwrapApiList({ ok: true })).toEqual([]);
    expect(unwrapApiList(null)).toEqual([]);
  });
});

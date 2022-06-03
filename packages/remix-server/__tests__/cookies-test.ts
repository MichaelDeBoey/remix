import { isCookie } from "../cookies";

// const sign: SignFunction = async (value, secret) => {
//   return JSON.stringify({ value, secret });
// };
// const unsign: UnsignFunction = async (signed, secret) => {
//   try {
//     let unsigned = JSON.parse(signed);
//     if (unsigned.secret !== secret) return false;
//     return unsigned.value;
//   } catch (e: unknown) {
//     return false;
//   }
// };
// const createCookie = createCookieFactory({ sign, unsign });

describe("isCookie", () => {
  it("returns `true` for Cookie objects", () => {
    // expect(isCookie(createCookie("my-cookie"))).toBe(true);
  });

  it("returns `false` for non-Cookie objects", () => {
    expect(isCookie({})).toBe(false);
    expect(isCookie([])).toBe(false);
    expect(isCookie("")).toBe(false);
    expect(isCookie(true)).toBe(false);
  });
});

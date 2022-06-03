import type { Cookie, CookieOptions } from "@remix-run/server";
import { parse, serialize } from "cookie";

import type { SignFunction, UnsignFunction } from "./crypto";
import { warnOnce } from "./warnings";

export type CreateCookieFunction = (
  name: string,
  cookieOptions?: CookieOptions
) => Cookie;

/**
 * Creates a logical container for managing a browser cookie from the server.
 *
 * @see https://remix.run/api/remix#createcookie
 */
export const createCookieFactory =
  ({
    sign,
    unsign,
  }: {
    sign: SignFunction;
    unsign: UnsignFunction;
  }): CreateCookieFunction =>
  (name, cookieOptions = {}) => {
    let { secrets, ...options } = {
      secrets: [],
      path: "/",
      sameSite: "lax" as const,
      ...cookieOptions,
    };

    warnOnceAboutExpiresCookie(name, options.expires);

    return {
      get name() {
        return name;
      },
      get isSigned() {
        return secrets.length > 0;
      },
      get expires() {
        // Max-Age takes precedence over Expires
        return typeof options.maxAge !== "undefined"
          ? new Date(Date.now() + options.maxAge * 1000)
          : options.expires;
      },
      async parse(cookieHeader, parseOptions) {
        if (!cookieHeader) return null;
        let cookies = parse(cookieHeader, { ...options, ...parseOptions });
        return name in cookies
          ? cookies[name] === ""
            ? ""
            : await decodeCookieValue(unsign, cookies[name], secrets)
          : null;
      },
      async serialize(value, serializeOptions) {
        return serialize(
          name,
          value === "" ? "" : await encodeCookieValue(sign, value, secrets),
          {
            ...options,
            ...serializeOptions,
          }
        );
      },
    };
  };

async function encodeCookieValue(
  sign: SignFunction,
  value: any,
  secrets: string[]
): Promise<string> {
  let encoded = encodeData(value);

  if (secrets.length > 0) {
    encoded = await sign(encoded, secrets[0]);
  }

  return encoded;
}

async function decodeCookieValue(
  unsign: UnsignFunction,
  value: string,
  secrets: string[]
): Promise<any> {
  if (secrets.length > 0) {
    for (let secret of secrets) {
      let unsignedValue = await unsign(value, secret);
      if (unsignedValue !== false) {
        return decodeData(unsignedValue);
      }
    }

    return null;
  }

  return decodeData(value);
}

function encodeData(value: any): string {
  return btoa(myUnescape(encodeURIComponent(JSON.stringify(value))));
}

function decodeData(value: string): any {
  try {
    return JSON.parse(decodeURIComponent(myEscape(atob(value))));
  } catch (error) {
    return {};
  }
}

// See: https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/es.escape.js
function myEscape(value: string): string {
  let str = value.toString();
  let result = "";
  let index = 0;
  let chr, code;
  while (index < str.length) {
    chr = str.charAt(index++);
    if (/[\w*+\-./@]/.exec(chr)) {
      result += chr;
    } else {
      code = chr.charCodeAt(0);
      if (code < 256) {
        result += "%" + hex(code, 2);
      } else {
        result += "%u" + hex(code, 4).toUpperCase();
      }
    }
  }
  return result;
}

function hex(code: number, length: number): string {
  let result = code.toString(16);
  while (result.length < length) result = "0" + result;
  return result;
}

// See: https://github.com/zloirock/core-js/blob/master/packages/core-js/modules/es.unescape.js
function myUnescape(value: string): string {
  let str = value.toString();
  let result = "";
  let index = 0;
  let chr, part;
  while (index < str.length) {
    chr = str.charAt(index++);
    if (chr === "%") {
      if (str.charAt(index) === "u") {
        part = str.slice(index + 1, index + 5);
        if (/^[\da-f]{4}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 5;
          continue;
        }
      } else {
        part = str.slice(index, index + 2);
        if (/^[\da-f]{2}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 2;
          continue;
        }
      }
    }
    result += chr;
  }
  return result;
}

function warnOnceAboutExpiresCookie(name: string, expires?: Date) {
  warnOnce(
    !expires,
    `The "${name}" cookie has an "expires" property set. ` +
      `This will cause the expires value to not be updated when the session is committed. ` +
      `Instead, you should set the expires value when serializing the cookie. ` +
      `You can use \`commitSession(session, { expires })\` if using a session storage object, ` +
      `or \`cookie.serialize("value", { expires })\` if you're using the cookie directly.`
  );
}

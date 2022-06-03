import type {
  Cookie,
  SessionIdStorageStrategy,
  SessionStorage,
} from "@remix-run/server";
import { createSession, isCookie } from "@remix-run/server";

import type { CreateCookieFunction } from "./cookies";
import { warnOnce } from "./warnings";

export type CreateSessionStorageFunction = (
  strategy: SessionIdStorageStrategy
) => SessionStorage;

/**
 * Creates a SessionStorage object using a SessionIdStorageStrategy.
 *
 * Note: This is a low-level API that should only be used if none of the
 * existing session storage options meet your requirements.
 *
 * @see https://remix.run/api/remix#createsessionstorage
 */
export const createSessionStorageFactory =
  (createCookie: CreateCookieFunction): CreateSessionStorageFunction =>
  ({ cookie: cookieArg, createData, readData, updateData, deleteData }) => {
    let cookie = isCookie(cookieArg)
      ? cookieArg
      : createCookie(cookieArg?.name || "__session", cookieArg);

    warnOnceAboutSigningSessionCookie(cookie);

    return {
      async getSession(cookieHeader, options) {
        let id = cookieHeader && (await cookie.parse(cookieHeader, options));
        let data = id && (await readData(id));
        return createSession(data || {}, id || "");
      },
      async commitSession(session, options) {
        let { id, data } = session;

        if (id) {
          await updateData(id, data, cookie.expires);
        } else {
          id = await createData(data, cookie.expires);
        }

        return cookie.serialize(id, options);
      },
      async destroySession(session, options) {
        await deleteData(session.id);
        return cookie.serialize("", {
          ...options,
          expires: new Date(0),
        });
      },
    };
  };

export function warnOnceAboutSigningSessionCookie(cookie: Cookie) {
  warnOnce(
    cookie.isSigned,
    `The "${cookie.name}" cookie is not signed, but session cookies should be ` +
      `signed to prevent tampering on the client before they are sent back to the ` +
      `server. See https://remix.run/api/remix#signing-cookies ` +
      `for more information.`
  );
}

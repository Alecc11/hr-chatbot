'use strict';

const { DateTime } = require('luxon');

const ZONE        = 'America/Los_Angeles';
const OPEN_HOUR   = 8;   // 8:00 AM PST/PDT
const CLOSE_HOUR  = 16;  // 4:00 PM PST/PDT (exclusive)
const OPEN_DAYS   = [1, 2, 3, 4, 5]; // Monday–Friday (ISO weekday)

/**
 * Returns true if the current time in Pacific Time falls within
 * Monday–Friday, 8:00 AM – 3:59 PM (i.e. before 4:00 PM).
 * Luxon handles PST/PDT transitions automatically.
 */
function isOpen() {
  // Allow bypassing the time gate in development for local testing
  if (process.env.SKIP_TIME_GATE === 'true') return true;

  const now = DateTime.now().setZone(ZONE);
  return (
    OPEN_DAYS.includes(now.weekday) &&
    now.hour >= OPEN_HOUR &&
    now.hour < CLOSE_HOUR
  );
}

/**
 * Returns the next opening time as a human-readable string (Pacific Time).
 * Used in offline messages to give employees a concrete expectation.
 */
function nextOpenTime() {
  let dt = DateTime.now().setZone(ZONE);

  // Advance until we land on a weekday during open hours
  for (let i = 0; i < 8; i++) {
    // If it's a weekday but before opening, same day at 8 AM
    if (OPEN_DAYS.includes(dt.weekday) && dt.hour < OPEN_HOUR) {
      return dt.set({ hour: OPEN_HOUR, minute: 0, second: 0 })
                .toFormat('cccc, LLLL d \'at\' h:mm a ZZZZ');
    }
    // Move to next day at 8 AM
    dt = dt.plus({ days: 1 }).set({ hour: OPEN_HOUR, minute: 0, second: 0 });
    if (OPEN_DAYS.includes(dt.weekday)) {
      return dt.toFormat('cccc, LLLL d \'at\' h:mm a ZZZZ');
    }
  }

  return 'Monday at 8:00 AM Pacific Time'; // fallback
}

module.exports = { isOpen, nextOpenTime };

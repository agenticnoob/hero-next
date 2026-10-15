// Keep private source records unchanged; apply public identity only to exported text.
const privateIdentity = String.fromCodePoint(24464, 21147);

export function redactJournalIdentity(value) {
  return value
    .split(privateIdentity)
    .join("AXMORF")
    .replace(
      new RegExp(String.fromCharCode(110, 111, 111, 98, 108, 105), "gi"),
      "AXMORF",
    );
}

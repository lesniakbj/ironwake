// Change these namespaces only for incompatible wire-format changes.
// Feature controllers share this contract instead of declaring a room prefix each.
export const ROOM_PROTOCOL = 'ironwake-integrated-v3-';
export const DEMOLITION_ROOM_PROTOCOL = 'ironwake-demolition-integrated-v3-';

export function roomProtocol(isDemolition = false) {
  return isDemolition ? DEMOLITION_ROOM_PROTOCOL : ROOM_PROTOCOL;
}

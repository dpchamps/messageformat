import { isSelectMessage, MessageGroup, PatternElement } from '../data-model';
import { isFunctionRef, isMessageRef } from '../pattern';
import type { Runtime } from '../runtime';

function validateParts(parts: PatternElement[], runtime: Runtime) {
  for (const part of parts) {
    if (isFunctionRef(part)) {
      const { args, func } = part;
      const fn = runtime[func];
      if (!fn || typeof fn !== 'object' || typeof fn.call !== 'function')
        throw new ReferenceError(`Runtime function not available: ${func}`);
      validateParts(args, runtime);
      // TODO: Once runtime arg requirements are defined, test against them
    } else if (isMessageRef(part)) {
      validateParts(part.msg_path, runtime);
    }
  }
}

export function validate(
  { entries }: Readonly<MessageGroup>,
  runtime: Runtime
) {
  for (const msg of Object.values(entries)) {
    if ('entries' in msg) validate(msg, runtime);
    else if (isSelectMessage(msg)) {
      validateParts(
        msg.select.map(sel => sel.value),
        runtime
      );
      for (const { value } of msg.cases) validateParts(value.pattern, runtime);
    } else validateParts(msg.pattern, runtime);
  }
}

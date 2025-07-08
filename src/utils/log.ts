
/**
 * Logs a message to the console with a timestamp.
 * @param message The message to log.
 */
let CONTEXT = "root";
let DEBUG = false;

export function logContext(context: string) {
  CONTEXT = `${context}`;
}

function logString(message: string) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}:${CONTEXT}]  ${message}`;
}

export function log(message: string) {
  if(DEBUG) {
    console.log(logString(message));
  }
}

export function logGroupEnd() {
  console.groupEnd();
}

export function logGroup(arg0: string) {
  console.group(arg0);
}

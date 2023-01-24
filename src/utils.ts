import { CHAT_PAGE, HOST_URL, USER_AGENT } from './constants';

/**
 * @see https://stackoverflow.com/a/1144788/4642844
 * @param string
 */
function escapeRegExp(string: string) {
  // The $& at the end means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @see https://stackoverflow.com/a/1144788/4642844
 * @param str the original string
 * @param find the string to replace
 * @param replace the replacement string
 */
function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

/**
 * Returns proper headers for the https://chat.openai.com/backend-api/conversation endpoint
 * @param accessToken
 */
export function getHeaders(accessToken: string) {
  return {
    'accept': 'application/json',
    'x-openai-assistant-app-id': '',
    'authorization': accessToken,
    'content-type': 'application/json',
    'origin': HOST_URL,
    'referrer': CHAT_PAGE,
    ['sec-fetch-mode']: 'cors',
    ['sec-fetch-site']: 'same-origin',
    'x-requested-with': 'com.chatgpt3auth',
    'user-agent': USER_AGENT,
  };
}

/**
 * Parses the response from the https://chat.openai.com/backend-api/conversation endpoint
 * The response is of content-type: text/event-stream and not JSON.
 * That's why we need to get the raw text from the response first and parse it manually.
 * The final response is the last chunk of the stream.
 * @param data
 */
export function parseStreamBasedResponse(data: string) {
  const chunks = data.split('data: ');
  const sanitizedChunks = chunks
    .map((c) => replaceAll(c, '\n', ''))
    .filter((c) => !!c && c !== '[DONE]');
  if (!sanitizedChunks.length) {
    return null;
  }
  // @ts-ignore
  const response = JSON.parse(sanitizedChunks[sanitizedChunks.length - 1]);
  return {
    message: response.message.content.parts[0],
    messageId: response.message.id,
    conversationId: response.conversation_id,
    isDone: response.message?.end_turn === true,
  };
}

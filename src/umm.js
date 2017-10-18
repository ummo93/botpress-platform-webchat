import util from 'util';
import _ from 'lodash';
import Promise from 'bluebird';


const QUICK_REPLY_PAYLOAD = /\<(.+)\>\s(.+)/i;

// TODO Extract this logic directly to botpress's UMM
function processQuickReplies(qrs, blocName) {
  if (!_.isArray(qrs)) {
    throw new Error('Expected quick_replies to be an array')
  }

  return qrs.map(qr => {
    if (_.isString(qr) && QUICK_REPLY_PAYLOAD.test(qr)) {
      let [, payload, text] = QUICK_REPLY_PAYLOAD.exec(qr);
      
      // <.HELLO> becomes <BLOCNAME.HELLO>
      if (payload.startsWith('.')) {
        payload = blocName + payload
      }

      return {
        title: text,
        payload: payload.toUpperCase()
      }
    }

    return qr
  })
}

function processMap(locElement) {
    if (_.isArray(locElement)) throw new Error('Expected `location_picker` to be an object!');
    if(!locElement.hasOwnProperty('id') || locElement.id === null) throw new Error('Expected `location_picker.id` field');
    if(!locElement.hasOwnProperty('button_title') || locElement.button_title === null) locElement.button_title = "Send Location";
    let searchPlaceholder = "Enter location";
    let title = "Location picker";
    let default_location = null;
    if(locElement.hasOwnProperty('search_placeholder')) searchPlaceholder = locElement['search_placeholder'];
    if(locElement.hasOwnProperty('title')) title = locElement['title'];
    if(locElement.hasOwnProperty('default_location')) default_location = locElement['default_location'];
    return {
        id: locElement.id,
        search_placeholder: searchPlaceholder,
        title: title,
        default_location: default_location,
        button_title: locElement.button_title
    }
}

function processForm(formElement) {
    if (_.isArray(formElement)) {
        throw new Error('Expected `form` to be an object!')
    }
    if(!formElement.hasOwnProperty('id') || formElement.id === null) {
        throw new Error('Expected `form.id` field')
    }
    if(!formElement.hasOwnProperty('elements') || (!_.isArray(formElement.elements))) {
        throw new Error('Expected `form.elements` to be an Array!')
    }
    if(!formElement.hasOwnProperty('button_title') || formElement.button_title === null) formElement.button_title = "Form Submitting";
    return { title: formElement.title, id: formElement.id, button_title: formElement.button_title,
      elements: formElement.elements.map(field => {
          if("input" in field) {
            // Input field
            return {
              label: field.input.label,
              placeholder: field.input.placeholder || "",
              name: field.input.name,
              type: "input",
              subtype: field.input.subtype || "",
              maxlength: field.input.maxlength || "",
              minlength: field.input.minlength || "",
              required: field.input.required || false
            }
          } else if ("textarea" in field) {
            // Textarea field
              return {
                  label: field.textarea.label,
                  placeholder: field.textarea.placeholder || "",
                  name: field.textarea.name,
                  type: "textarea",
                  maxlength: field.textarea.maxlength || "",
                  minlength: field.textarea.minlength || "",
                  required: field.textarea.required || false
              }
          } else if ("select" in field) {
            // Select field
              return {
                  label: field.select.label,
                  placeholder: field.select.placeholder || "",
                  name: field.select.name,
                  options: field.select.options,
                  required: field.select.required || false,
                  type: "select"
              }
          } else {
              throw new Error('Cannot recognize element type!')
          }
      })
    }
}
function getUserId(event) {
  const userId = _.get(event, 'user.id')
    || _.get(event, 'user.userId')
    || _.get(event, 'userId')
    || _.get(event, 'raw.from')
    || _.get(event, 'raw.userId')
    || _.get(event, 'raw.user.id');

  if (!userId) {
    throw new Error('Could not find userId in the incoming event.')
  }

  return userId
}

function PromisifyEvent(event) {
  if (!event._promise) {
    event._promise = new Promise((resolve, reject) => {
      event._resolve = resolve;
      event._reject = reject
    })
  }

  return event
}

function processOutgoing({ event, blocName, instruction }) {
  const ins = Object.assign({}, instruction); // Create a shallow copy of the instruction

  ////////
  // PRE-PROCESSING
  ////////
  
  const optionsList = ['typing', 'quick_replies', 'form', 'location_picker'];

  const options = _.pick(instruction, optionsList);
  
  for (let prop of optionsList) {
    delete ins[prop]
  }

  if (options.quick_replies) {
    options.quick_replies = processQuickReplies(options.quick_replies, blocName)
  }
  if (options.form) {
    options.form = processForm(options.form);
  }
  if (options.location_picker) {
    options.location_picker = processMap(options.location_picker);
  }
  /////////
  /// Processing
  /////////

  if (instruction.type === 'login_prompt') {
    const user = getUserId(event);

    const raw = Object.assign({
      to: user,
      message: instruction.text
    }, options, _.pick(event && event.raw, 'conversationId'));

    return PromisifyEvent({
      platform: 'webchat',
      type: 'login_prompt',
      user: { id: user },
      raw: raw,
      text: instruction.text
    })
  }

  if (!_.isNil(instruction.text)) {
    const user = getUserId(event);

    const raw = Object.assign({
      to: user,
      message: instruction.text
    }, options, _.pick(event && event.raw, 'conversationId'));

    return PromisifyEvent({
      platform: 'webchat',
      type: 'text',
      user: { id: user },
      raw: raw,
      text: instruction.text
    })
  }

  ////////////
  /// POST-PROCESSING
  ////////////
  
  // Nothing to post-process yet

  ////////////
  /// INVALID INSTRUCTION
  ////////////

  const strRep = util.inspect(instruction, false, 1);
  throw new Error(`Unrecognized instruction on Web in bloc '${blocName}': ${strRep}`)

}

////////////
/// TEMPLATES
////////////

function getTemplates() {
  return []
}

module.exports = bp => {
  const [umm, registerConnector] = _.at(bp, ['umm', 'umm.registerConnector']);

  umm && registerConnector && registerConnector({
    platform: 'webchat',
    processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
    templates: getTemplates()
  })
};

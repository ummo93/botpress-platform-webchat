# botpress-platform-webchat (BETA)

[<img src="https://cdn.rawgit.com/botpress/botpress/7e007114/assets/supports_UMM.png" height="60px" />](https://botpress.io/docs/foundamentals/umm.html)

<img src="https://rawgit.com/botpress/botpress-platform-webchat/master/assets/webview_convo.png" height="200px" />

Official Webchat connector module for [Botpress](http://github.com/botpress/botpress). This module allows you to embed your chatbot on any website and also allows you to serve it as a full-screen web app.

## Installation

### Using NPM

```
npm install botpress-platform-webchat
```

## How to use it

[TODO] More instructions coming.

- [UMM](https://botpress.io/docs/foundamentals/umm.html)
- [Flows](https://botpress.io/docs/foundamentals/flow.html).

> **Note on Views**
> 
> You can talk to it and use it in different views (mobile, web, embedded), see section below to have the detail.

### Supported messages

<img src="https://rawgit.com/botpress/botpress-platform-webchat/master/assets/quick_replies.png" height="200px" /><img src="https://rawgit.com/botpress/botpress-platform-webchat/master/assets/mobile_view.png" height="200px" />

#### Sending Text

##### `content.yml`

```yaml
welcome:
  - Hello, world!
  - This is a message on Messenger!
  - text: this works too!
    typing: 2s
  - |
    This is a multi-line
    message :).
```

##### Quick replies

##### `content.yml`

```yaml
welcome:
  - text: Hello, world!
    typing: 250ms
    quick_replies:
      - <QR_YES> Yes
      - <QR_NO> No
```

##### Web form

##### `content.yml`

```yaml
welcome:
  - text: Hello, world!
    typing: 250ms
    form:
      title: Survey
      id: survey
      button_title: Please enter details
      elements:
        - input:
            label: Email
            placeholder: Your email
            name: email
            subtype: email
            required: true
        - textarea:
            label: Text
            placeholder: Your text
            name: text
            maxlength: 100
            minlength: 2
```

It's look's like a usually web form. After submitted, you can handle this event with botpress.hear method. For example:
```js
bp.hear({ type: 'form', formId: "survey" }, (event, next) => {
    // Your code
});
```
To know, what form has call the event, you can handle the form name with "formId" field, for this you may add to content.yml file "id" in the form section.
  
  
###### Form Elements

`input`

Has next attributes: label, name, placeholder, subtype, required, maxlength, minlength, which works like a same attributes in html5 (`subtype` is a same as `type` in html5)

`textarea`

Has a same attributes like `input`, but has no `subtype` attribute

`select`

Has a same attributes like `textarea`, but has no `maxlength` and `minlength` attributes, and has `options` attribute, which contain an option elements.

Example:
```yaml
- select:
    label: Select one item
    name: select
    placeholder: Select one option
    options:
      - option:
          label: "Hindu (Indian) vegetarian"
          value: "hindu"
      - option:
          label: "Strict vegan"
          value: "vegan"
      - option:
          label: "Kosher"
          value: "kosher"
      - option:
          label: "Just put it in a burrito"
          value: "burrito"
```

##### Location Picker
Location picker - this is a convenient way to get a user's geolocation.
For this you need to specify the following parameters in the `.yml` file:

```yml
recipientAddress:
  - text: Please enter your address
    location_picker:
      id: map_example
      search_placeholder: Please type your address here:
      title: Address confirmation
      button_title: ⚐ Send location
      default_location: [-30.123, 20.123]
```
Where:
 
`id` - form id,

`search_placeholder` - placeholder for search box in the map widget,

`title` - title of the form

`button_title` - title for quick reply (request for access from client side)

Then, user getting the form with a location picker element.

Also, `default_location` parameter is not required, then browser request user location via HTML5 geolocation API

At next you can get a user response via usually getting the form, for example:
```js
    bp.hear({ type: 'form', formId: 'map1' }, (event, next) => {
        console.log(event.places);
        event.reply('#rpl');
    });
``` 

In the ```event.places``` we getting the array of the places from google-maps API

#### Other type of messages

We are still working on other type of messages to increase the power of this module. Botpress is a community effort, so **Pull Requests are welcomed**.

- Caroussel **(soon)**
- Image **(soon)**
- Video **(soon)**
- Audio **(soon)**
- Location Picker **(soon)**
- Web Widgets **(soon)**

## Supported views

### Mobile View (Fullscreen)

When your bot is running, you can have access to a mobile view at `${HOSTNAME}/lite/?m=platform-webchat&v=fullscreen` *(e.g `http://localhost:3000/lite/?m=platform-webchat&v=fullscreen`)*.

This **URL is public** (no authentication required) so you can share it we other people.

<img src="https://rawgit.com/botpress/botpress-platform-webchat/master/assets/mobile_view.png" height="200px" />

### Web View (Embedded on Websites)

To embedded the web interface to a website, you simply need to add this script at the end of the `<body>` tag. Don't forget to set the `hostname` correctly to match the public hostname of your bot.

```html
<script>
  window.botpressSettings = {
    hostname: "botpress.pagekite.me" // <<-- Change this to your bot hostname
  };
</script>
<script>
  !function(){function t(){var t=n.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://"+a.hostname+"/api/botpress-platform-webchat/inject.js";var e=n.getElementsByTagName("script")[0];e.parentNode.insertBefore(t,e)}var e=window,a=e.botpressSettings,n=document;e.attachEvent?e.attachEvent("onload",t):e.addEventListener("load",t,!1)}();
</script>
```

## Customize the view

A configuration file (`botpress-platform-webchat.config.yml`) has been created at the `root` of your bot when you installed the module. You can change these values to change the look and feel of the web chat.

```yaml
# DEFAULT SETTINGS
botName: 'Bot' ## Name of your bot
botAvatarUrl: null ## Default avatar url of the image (e.g. 'https://avatars3.githubusercontent.com/u/1315508?v=4&s=400' )
botConvoTitle: 'Technical Support' ## Title of the first conversation with the bot
botConvoDescription: 'This is a description'

# POPUP CONVERSATION SETTINGS
welcomeMsgEnable: true
welcomeMsgDelay: 1000
welcomeMsgText: | ## Welcome message that shows at on pop-up (multi-lines)
  Hey guys!
  Curious about our offer?
  This is the default message...

# COLOR SETTINGS
backgroundColor: '#ffffff' ## Color of the background 
textColorOnBackground: '#666666' ## Color of the text on the background
foregroundColor: '#0176ff' ## Element background color (header, composer, button..)
textColorOnForeground: '#ffffff'  ## Element text color (header, composer, button..)
```

> **Note**
> 
> You need to restart your bot by running `bp start` again for new settings to be effective.

### Community

There's a [Slack community](https://slack.botpress.io) where you are welcome to join us, ask any question and even help others.

Get an invite and join us now! 👉 [https://slack.botpress.io](https://slack.botpress.io)

### License

Licensed under AGPL-3.0

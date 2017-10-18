import React, { Component } from 'react'
import classnames from 'classnames'

import format from 'date-fns/format'
import differenceInMinutes from 'date-fns/difference_in_minutes'

import BotAvatar from '../bot_avatar'
import QuickReplies from './quick_replies'
import LoginPrompt from './login_prompt'
import FileMessage from './file'

import style from './style.scss'
import Form from "./form";
import LocationPicker from "./location_picker";

const TIME_BETWEEN_DATES = 10; // 10 minutes

class MessageGroup extends Component {
  
  renderAvatar() {
    let content = <BotAvatar foregroundColor={this.props.fgColor} />

    if (this.props.avatarUrl) {
      content = <div 
        className={style.picture} 
        style={{ backgroundImage: 'url(' + this.props.avatarUrl +')'}}>
      </div>
    }

    return <div className={style.avatar} style={{ color: this.props.fgColor }}>
      {content}
    </div>
  }

  render() {
    const sample = this.props.messages[0];
    const isBot = !sample.userId;

    const className = classnames(style.message, {
      [style.user]: !isBot
    });

    const bubbleColor = this.props.fgColor;
    const textColor = this.props.textColor;

    return <div className={className}>
      {isBot && this.renderAvatar()}
      <div className={style['message-container']}>
        {isBot && <div className={style['info-line']}>{sample.full_name}</div>}
        <div className={style.group}>
          {this.props.messages.map((data, i) => {
            return <Message
              onLoginPromptSend={this.props.onLoginPromptSend}
              textColor={textColor}
              bubbleColor={bubbleColor} 
              key={`msg-${i}`}
              isLastOfGroup={i >= this.props.messages.length - 1}
              isLastGroup={this.props.isLastGroup}
              data={data} />
          })}
        </div>
      </div>
    </div>
  }
}

export default class MessageList extends Component {
  
  constructor(props) {
    super(props)

    this.messagesDiv = null
  }

  componentDidUpdate(prevProps, prevState) {
    this.tryScrollToBottom()
  }

  tryScrollToBottom() {
    try {
      this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
    } catch (err) {
      // Discard the error
    }
  }

  renderQuickReplies() {
    const messages = this.props.messages || []
    const message = messages[messages.length - 1]
    const quick_replies = message && message['message_raw'] && message['message_raw']['quick_replies']

    return <QuickReplies
      quick_replies={quick_replies}
      fgColor={this.props.fgColor}
      onQuickReplySend={this.props.onQuickReplySend}
      onFileUploadSend={this.props.onFileUploadSend} />
  }

  renderForm() {
    const messages = this.props.messages || [];
    const message = messages[messages.length - 1];
    if(message && message['message_raw'] && message['message_raw']['form']) {
        const form = message['message_raw']['form'];
        return <Form
            button_title={form.button_title}
            fgColor={this.props.fgColor}
            elements={form.elements}
            formId={form.id}
            title={form.title}
            onFormSend={this.props.onFormSend} />
    }
  }

  renderLocationPicker() {
      const messages = this.props.messages || [];
      const message = messages[messages.length - 1];
      if(message && message['message_raw'] && message['message_raw']['location_picker']) {
          const options = message['message_raw']['location_picker'];
          return <LocationPicker
              fgColor={this.props.fgColor}
              options={options}
              onLocationSend={this.props.onLocationSend} />
      }
  }

  renderDate(date) {
    return <div className={style.date}>
        {format(new Date(date), 'MMMM Do YYYY, h:mm a')}
        <div className={style.smallLine}></div>
      </div>
  }

  renderMessageGroups() {
    const messages = this.props.messages || []
    const groups = []

    let lastSpeaker = null
    let lastDate = null
    let currentGroup = null

    messages.forEach(m => {
      const speaker = !!m.userId ? m.userId : 'bot'
      const date = m.sent_on

      // Create a new group if messages are separated by more than X minutes or if different speaker
      if (speaker !== lastSpeaker || differenceInMinutes(new Date(date), new Date(lastDate)) >= TIME_BETWEEN_DATES) {
        currentGroup = []
        groups.push(currentGroup)
      }

      currentGroup.push(m)

      lastSpeaker = speaker
      lastDate = date
    })

    if (this.props.typingUntil) {
      if (lastSpeaker !== 'bot') {
        currentGroup = []
        groups.push(currentGroup)
      }

      currentGroup.push({
        sent_on: new Date(),
        userId: null,
        message_type: 'typing'
      })
    }

    return <div>
      {groups.map((group, i) => {
        const lastGroup = groups[i - 1]
        const lastDate = lastGroup && lastGroup[lastGroup.length - 1] && lastGroup[lastGroup.length - 1].sent_on 
        const groupDate = group && group[0].sent_on

        const isDateNeeded = !groups[i - 1]
          || differenceInMinutes(new Date(groupDate), new Date(lastDate)) > TIME_BETWEEN_DATES

        return <div>
            {isDateNeeded ? this.renderDate(group[0].sent_on) : null}
            <MessageGroup 
              avatarUrl={this.props.avatarUrl}
              fgColor={this.props.fgColor}
              textColor={this.props.textColor}
              key={`msg-group-${i}`}
              onLoginPromptSend={this.props.onLoginPromptSend}
              isLastGroup={i >= groups.length - 1}
              messages={group} />
          </div>
      })}
    </div>
  }

  render() {
    return <div className={style.messages} ref={(m) => { this.messagesDiv = m }}>
      {this.renderMessageGroups()}
      {this.renderForm()}
      {this.renderLocationPicker()}
      {this.renderQuickReplies()}
    </div>
  }
}

class Message extends Component {

  render_text() {
    return <div><p>{this.props.data.message_text}</p></div>
  }
  render_form() {
      return <div><p>{this.props.data.message_text}</p></div>
  }
  render_quick_reply() {
    return <div><p>{this.props.data.message_text}</p></div>
  }

  render_login_prompt() {
    const isLastMessage = this.props.isLastOfGroup && this.props.isLastGroup
    const isBotMessage = !this.props.data.userId

    return <div>
      <LoginPrompt
        isLastMessage={isLastMessage}
        isBotMessage={isBotMessage}
        bgColor={this.props.bubbleColor}
        onLoginPromptSend={this.props.onLoginPromptSend}
        textColor={this.props.textColor} />
    </div>
  }

  render_typing() {
    const bubble = () => <div className={style.typingBubble} 
      style={{ backgroundColor: this.props.bubbleColor, color: this.props.textColor }}/>

    return <div className={style.typingGroup}>
      {bubble()}
      {bubble()}
      {bubble()}
    </div>
  }

  render_file() {
    return <FileMessage file={this.props.data.message_data}/>
  }

  render_unsupported() {
    return <div><p>*Unsupported message type*</p></div>
  }

  render() {
    const bubbleStyle = !!this.props.data.userId
      ? { backgroundColor: this.props.bubbleColor, color: this.props.textColor }
      : null

    const renderer = (this['render_' + this.props.data.message_type] || this.render_unsupported).bind(this)

    let className = style.bubble

    if (style[this.props.data.message_type]) {
      className += ' ' + style[this.props.data.message_type]
    }

    return <div className={className} style={bubbleStyle}>
      {renderer()}
    </div>
  }
}

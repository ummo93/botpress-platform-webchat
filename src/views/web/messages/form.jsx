import React, { Component } from 'react';
import style from './style.scss';

class FormElement extends Component {

  constructor(props) {
    super(props);
    this.state = {}
  }

  changeState(field) {
      return e => {
          this.props.parent.setState({ [field]: e.target.value });
      }
  }

  render() {
    if(this.props.name === "form.name") return null;
    return <label>
      <input
        className={style.loginInput}
        type='input'
        placeholder={this.props.placeholder}
        name={this.props.name}
        onChange={::this.changeState(this.props.name)}
      />
    </label>
  }
}


export default class Form extends Component {

  constructor(props) {
      super(props);
      this.state = {};
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.props.onFormSend) {
      let representation = "";
      for(let key in this.state) representation += `${key}: ${this.state[key]}\n`
      this.props.onFormSend(this.state, this.props.formName, representation)
    }
  }

  render() {
      if (!this.props.form) return null;
      const form = this.props.form.map(fe => <FormElement parent={this} {...this.props} {...fe} />);
      return <form className={style.loginPromptContainer} onSubmit={this.handleSubmit.bind(this)}>
          {form}
        <input className={style.loginButton} type="submit" value="Submit"/>
      </form>
  }
}
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
    return <div className={style.formGroup}>
      <label>
          {this.props.label}
      </label>
      <input
        className={style.formInput}
        type='input'
        placeholder={this.props.placeholder}
        name={this.props.name}
        onChange={::this.changeState(this.props.name)}
      />
    </div>
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
      this.props.onFormSend(this.state, this.props.formId, representation)
    }
  }

  render() {
      if (!this.props.elements) return null;
      const elements = this.props.elements.map(fe => <FormElement parent={this} {...this.props} {...fe} />);
      return <div className={style.formOverlay}>
          <form className={style.formContainer} onSubmit={this.handleSubmit.bind(this)}>
              <div className={style.formTitle}>
                  {this.props.title}
              </div>
              {elements}
              <div className={style.buttonLayer}>
                <input className={style.formSubmit} type="submit" value="Submit"/>
              </div>
          </form>
      </div>
  }
}
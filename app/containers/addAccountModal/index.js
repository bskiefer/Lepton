import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Modal, Button, ButtonToolbar, ToggleButtonGroup, ToggleButton } from 'react-bootstrap'
import { remote } from 'electron'
import { updateAboutModalStatus } from '../../actions'
import React, { Component } from 'react'

import './index.scss'

const keytar = require('keytar')
const conf = remote.getGlobal('conf')
const store = remote.getGlobal('store')

class AddAccountModal extends Component {
  
  constructor(props, context) {
    super(props, context);

    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.setName = this.setName.bind(this);
    this.setToken = this.setToken.bind(this);
    this.setEnterprise = this.setEnterprise.bind(this);
    this.setHost = this.setHost.bind(this);

    this.state = {
      show: false,
      name: '',
      token: '',
      enterprise: false,
      host: ''
    };
  }

  handleClose() {
    this.setState({ show: false });
  }

  handleShow() {
    this.setState({ show: true });
  }

  handleSubmit() {
    keytar.setPassword(`Lepton`, this.state.name, this.state.token);

    store.set(`accounts.${this.state.name}.name`, this.state.name);
    store.set(`accounts.${this.state.name}.enterprise`, this.state.enterprise);
    store.set(`accounts.${this.state.name}.host`, this.state.host);
  }

  setName(e) {
    this.setState({ name: e.target.value.replace('.', '_') });
  }

  setToken(e) {
    this.setState({ token: e.target.value });
  }

  setEnterprise(e) {
    this.setState({ enterprise: e === 2 });
  }

  setHost(e) {
    this.setState({ host: e.target.value });
  }

  render() {
    return (
      <div>
        <br />
        <Button bsStyle="default" bsSize="small" onClick={this.handleShow}>
          Add Account
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose} backdrop={true}>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            
            <input
              className="form-control"
              placeholder="Name"
              onChange={this.setName}
              value={ this.state.name }
            />

            <br />

            <input
              className="form-control"
              placeholder="Token: (gist scope)"
              onChange={this.setToken}
              value={ this.state.token }
            />

            <br />

            <ButtonToolbar>
              <ToggleButtonGroup type="radio" name="options" defaultValue={1} onChange={this.setEnterprise}>
                <ToggleButton value={1}>Github.com</ToggleButton>
                <ToggleButton value={2}>Enterprise</ToggleButton>
              </ToggleButtonGroup>
            </ButtonToolbar>

            <br />

            {this.state.enterprise ? (
              <input
                className="form-control"
                placeholder={'Hostname: git.domain.com'}
                onChange={this.setHost}
              />
            ) : ''}
            

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleSubmit} bsStyle={'success'}>Submit</Button>
            <Button onClick={this.handleClose}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

function mapStateToProps (state) {
  return {
    aboutModalStatus: state.aboutModalStatus
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    updateAboutModalStatus: updateAboutModalStatus
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(AddAccountModal)

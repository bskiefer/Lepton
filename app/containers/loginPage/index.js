import { bindActionCreators } from 'redux'
import { Alert, Button, Image, Modal, ProgressBar } from 'react-bootstrap'
import Avatar from 'boring-avatars'
import { connect } from 'react-redux'
import { remote, ipcRenderer } from 'electron'
import React, { Component } from 'react'

import dojocatImage from '../../utilities/octodex/dojocat.jpg'
import privateinvestocatImage from '../../utilities/octodex/privateinvestocat.jpg'
import saritocatImage from '../../utilities/octodex/saritocat.png'

import './index.scss'

import {
  updateUserAccount
} from '../../actions/index'

const conf = remote.getGlobal('conf')
const logger = remote.getGlobal('logger')

const LoginModeEnum = { CREDENTIALS: 1, TOKEN: 2 }

class LoginPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      inputTokenValue: '',
      loginMode: LoginModeEnum.CREDENTIALS
    }
  }

  componentWillMount () {
    const { loggedInUserInfo } = this.props
    logger.debug('-----> Inside LoginPage componentWillMount with loggedInUserInfo' + JSON.stringify(loggedInUserInfo))

    logger.debug('-----> Registering listener for auto-login signal')
    ipcRenderer.on('auto-login', () => {
      logger.debug('-----> Received "auto-login" signal with loggedInUserInfo ' + JSON.stringify(loggedInUserInfo))
      loggedInUserInfo && loggedInUserInfo.token && this.handleContinueButtonClicked(loggedInUserInfo.token)
    })

    logger.debug('-----> sending login-page-ready signal')
    ipcRenderer.send('login-page-ready')
  }

  componentWillUnmount () {
    logger.debug('-----> Removing listener for auto-login signal')
    ipcRenderer.removeAllListeners('auto-login')
  }

  handleLoginClicked () {
    if (this.props.authWindowStatus === 'OFF') {
      this.props.launchAuthWindow()
    }
  }

  handleContinueButtonClicked (token) {
    this.handleTokenLoginButtonClicked(token)
  }

  handleTokenLoginButtonClicked (token) {
    if (token && this.props.authWindowStatus === 'OFF') {
      this.props.launchAuthWindow(token)
    }
  }

  handleLoginModeSwitched () {
    if (this.state.loginMode === LoginModeEnum.CREDENTIALS) {
      this.setState({
        loginMode: LoginModeEnum.TOKEN
      })
    } else {
      this.setState({
        loginMode: LoginModeEnum.CREDENTIALS
      })
    }
  }

  renderControlSection () {
    const { authWindowStatus, loggedInUserInfo, userSessionStatus, userAccount } = this.props
    const { loginMode } = this.state
    const loggedInUserName = loggedInUserInfo ? loggedInUserInfo.profile : null

    if (userSessionStatus === 'IN_PROGRESS') {
      return (
        <div className='button-group-modal'>
          <ProgressBar active now={ 100 }/>
        </div>
      )
    }

    if (userAccount.enterprise) {
      const token = userAccount.token
      return (
        <div className='button-group-modal'>
          { token
            ? <Button
              autoFocus
              className='modal-button'
              bsStyle="default"
              onClick={ this.handleContinueButtonClicked.bind(this, token) }>
              { loggedInUserName ? `Continue as ${loggedInUserName}` : 'HAPPY CODING' }
            </Button>
            : this.renderTokenLoginSection(false, userSessionStatus)}
        </div>
      )
    }

    if (userSessionStatus === 'EXPIRED' || userSessionStatus === 'INACTIVE' ||
      loggedInUserName === null || loggedInUserName === 'null') {
      return (
        <div className='button-group-modal'>
          { loginMode === LoginModeEnum.CREDENTIALS
            ? this.renderCredentialLoginSection(authWindowStatus, userSessionStatus)
            : this.renderTokenLoginSection(true, userSessionStatus)
          }
        </div>
      )
    }

    return null
  }

  updateInputValue (evt) {
    this.setState({
      inputTokenValue: evt.target.value
    })
  }

  handleLoginAuthWindow(account) {
    const { updateUserAccount } = this.props

    updateUserAccount({
      "name": account,
      "host": conf.get(`accounts:${account}:host`),
      "enterprise": conf.get(`accounts:${account}:enterprise`),
      "token": conf.get(`accounts:${account}:token`)
    })

    console.log(this.props.userAccount)

    this.setState({
      inputTokenValue: conf.get(`accounts:${account}:token`)
    })
    this.props.initUserSession(conf.get(`accounts:${account}:token`))
  }

  renderCredentialLoginSection(authWindowStatus, userSessionStatus) {
    
    const accounts = conf.get('accounts');
    const loginAuthWindow = this.handleLoginAuthWindow.bind(this);

    return (
      <div>
        {Object.keys(accounts).map((i, index) => {
          return <div key={index}>
            <Button
              className='modal-button'
              onClick={() => loginAuthWindow(i)}>
              {i}
              </Button>
            </div>
        })}
      </div>
    )
  }

  renderTokenLoginSection (showLoginSwitch, userSessionStatus) {
    return (
      <form>
        { userSessionStatus === 'EXPIRED'
          ? <Alert bsStyle="warning" className="login-alert">Token invalid</Alert>
          : null
        }
        <input
          className="form-control"
          placeholder="scope: gist"
          value={ this.state.inputTokenValue }
          onChange={ this.updateInputValue.bind(this) }
        />
        <Button
          autoFocus
          className='modal-button'
          onClick={ this.handleTokenLoginButtonClicked.bind(this, this.state.inputTokenValue) }>
            Token Login
        </Button>
        { showLoginSwitch
          ? <div className="login-page-text-link">
            <a href="#" onClick={ this.handleLoginModeSwitched.bind(this) }>Switch to credentials?</a>
          </div>
          : null}
      </form>
    )
  }

  renderLoginModalBody () {
    return (
      <center>
        { this.renderAvatar() }
        { this.renderControlSection() }
      </center>
    )
  }

  renderAvatar () {
    const { loginMode } = this.state
    const { userAccount } = this.props

    if (conf.get('avatar:type') === 'boring') {
      return <a href="#">
        <Avatar
          size={ 200 }
          name={ Math.random().toString(36).substr(2, 5) }
          square={ false }
          variant={ conf.get('avatar:boringAvatarVariant') }
          colors={ ['#4D3B36', '#EB613B', '#F98F6F', '#C1D9CD', '#F7EADC'] }
        />
      </a>
    } else {
      let profileImage = dojocatImage
      if (userAccount.enterprise) {
        profileImage = conf.get('enterprise:avatarUrl')
          ? conf.get('enterprise:avatarUrl')
          : privateinvestocatImage
      } else if (loginMode === LoginModeEnum.TOKEN) {
        profileImage = saritocatImage
      }

      return <a href="#">
        <Image className='profile-image-modal' src={ profileImage } rounded/>
      </a>
    }
  }

  render () {
    return (
      <div className='login-modal'>
        <Modal.Dialog bsSize='small'>
          <Modal.Header>
            <Modal.Title>Login</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            { this.renderLoginModalBody() }
          </Modal.Body>
        </Modal.Dialog>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    authWindowStatus: state.authWindowStatus,
    userSessionStatus: state.userSession.activeStatus,
    userAccount: state.userAccount,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    updateUserAccount: updateUserAccount
  }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginPage)

import * as React from 'react'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import { SamplesURL } from '../../lib/stats'
import { UncommittedChangesStrategy } from '../../models/uncommitted-changes-strategy'
import { RadioButton } from '../lib/radio-button'
import { isWindowsOpenSSHAvailable } from '../../lib/ssh/ssh'
import {
  getNotificationSettingsUrl,
  supportsNotifications,
  supportsNotificationsPermissionRequest,
} from 'desktop-notifications'
import {
  getNotificationsPermission,
  requestNotificationsPermission,
} from '../main-process-proxy'

interface IAdvancedPreferencesProps {
  readonly useWindowsOpenSSH: boolean
  readonly optOutOfUsageTracking: boolean
  readonly notificationsEnabled: boolean
  readonly uncommittedChangesStrategy: UncommittedChangesStrategy
  readonly repositoryIndicatorsEnabled: boolean
  readonly onUseWindowsOpenSSHChanged: (checked: boolean) => void
  readonly onNotificationsEnabledChanged: (checked: boolean) => void
  readonly onOptOutofReportingChanged: (checked: boolean) => void
  readonly onUncommittedChangesStrategyChanged: (
    value: UncommittedChangesStrategy
  ) => void
  readonly onRepositoryIndicatorsEnabledChanged: (enabled: boolean) => void
}

interface IAdvancedPreferencesState {
  readonly optOutOfUsageTracking: boolean
  readonly uncommittedChangesStrategy: UncommittedChangesStrategy
  readonly canUseWindowsSSH: boolean
  readonly suggestGrantNotificationPermission: boolean
  readonly warnNotificationsDenied: boolean
  readonly suggestConfigureNotifications: boolean
}

export class Advanced extends React.Component<
  IAdvancedPreferencesProps,
  IAdvancedPreferencesState
> {
  public constructor(props: IAdvancedPreferencesProps) {
    super(props)

    this.state = {
      optOutOfUsageTracking: this.props.optOutOfUsageTracking,
      uncommittedChangesStrategy: this.props.uncommittedChangesStrategy,
      canUseWindowsSSH: false,
      suggestGrantNotificationPermission: false,
      warnNotificationsDenied: false,
      suggestConfigureNotifications: false,
    }
  }

  public componentDidMount() {
    this.checkSSHAvailability()
    this.updateNotificationsState()
  }

  private async checkSSHAvailability() {
    this.setState({ canUseWindowsSSH: await isWindowsOpenSSHAvailable() })
  }

  private onReportingOptOutChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ optOutOfUsageTracking: value })
    this.props.onOptOutofReportingChanged(value)
  }

  private onUncommittedChangesStrategyChanged = (
    value: UncommittedChangesStrategy
  ) => {
    this.setState({ uncommittedChangesStrategy: value })
    this.props.onUncommittedChangesStrategyChanged(value)
  }

  private onRepositoryIndicatorsEnabledChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onRepositoryIndicatorsEnabledChanged(event.currentTarget.checked)
  }

  private onUseWindowsOpenSSHChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onUseWindowsOpenSSHChanged(event.currentTarget.checked)
  }

  private onNotificationsEnabledChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onNotificationsEnabledChanged(event.currentTarget.checked)
  }

  private reportDesktopUsageLabel() {
    return (
      <span>
        通过提交帮助GitHub Desktop改进{' '}
        <LinkButton uri={SamplesURL}>使用情况统计信息</LinkButton>
      </span>
    )
  }

  public render() {
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2>如果我有更改并切换分支...</h2>

          <RadioButton
            value={UncommittedChangesStrategy.AskForConfirmation}
            checked={
              this.state.uncommittedChangesStrategy ===
              UncommittedChangesStrategy.AskForConfirmation
            }
            label="询问我要更改的位置"
            onSelected={this.onUncommittedChangesStrategyChanged}
          />

          <RadioButton
            value={UncommittedChangesStrategy.MoveToNewBranch}
            checked={
              this.state.uncommittedChangesStrategy ===
              UncommittedChangesStrategy.MoveToNewBranch
            }
            label="始终将我的更改带到我的新分支"
            onSelected={this.onUncommittedChangesStrategyChanged}
          />

          <RadioButton
            value={UncommittedChangesStrategy.StashOnCurrentBranch}
            checked={
              this.state.uncommittedChangesStrategy ===
              UncommittedChangesStrategy.StashOnCurrentBranch
            }
            label="始终将更改保存并保留在当前分支上"
            onSelected={this.onUncommittedChangesStrategyChanged}
          />
        </div>
        <div className="advanced-section">
          <h2>后台更新</h2>
          <Checkbox
            label="定期获取和刷新所有存储库的状态"
            value={
              this.props.repositoryIndicatorsEnabled
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onRepositoryIndicatorsEnabledChanged}
          />
          <p className="git-settings-description">
            允许在存储库列表中显示最新状态指示器.
            禁用此选项可以提高许多存储库的性能.
          </p>
        </div>
        {this.renderSSHSettings()}
        {this.renderNotificationsSettings()}
        <div className="advanced-section">
          <h2>使用</h2>
          <Checkbox
            label={this.reportDesktopUsageLabel()}
            value={
              this.state.optOutOfUsageTracking
                ? CheckboxValue.Off
                : CheckboxValue.On
            }
            onChange={this.onReportingOptOutChanged}
          />
        </div>
      </DialogContent>
    )
  }

  private renderSSHSettings() {
    if (!this.state.canUseWindowsSSH) {
      return null
    }

    return (
      <div className="advanced-section">
        <h2>SSH</h2>
        <Checkbox
          label="Use system OpenSSH (recommended)"
          value={
            this.props.useWindowsOpenSSH ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onUseWindowsOpenSSHChanged}
        />
      </div>
    )
  }

  private renderNotificationsSettings() {
    return (
      <div className="advanced-section">
        <h2>通知</h2>
        <Checkbox
          label="启用通知"
          value={
            this.props.notificationsEnabled
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onNotificationsEnabledChanged}
        />
        <p className="git-settings-description">
          允许在当前存储库中发生高信号事件时显示通知 (Allows the display of
          notifications when high-signal events take place in the current
          repository).{this.renderNotificationHint()}
        </p>
      </div>
    )
  }

  private onGrantNotificationPermission = async () => {
    await requestNotificationsPermission()
    this.updateNotificationsState()
  }

  private async updateNotificationsState() {
    const notificationsPermission = await getNotificationsPermission()
    this.setState({
      suggestGrantNotificationPermission:
        supportsNotificationsPermissionRequest() &&
        notificationsPermission === 'default',
      warnNotificationsDenied: notificationsPermission === 'denied',
      suggestConfigureNotifications: notificationsPermission === 'granted',
    })
  }

  private renderNotificationHint() {
    // No need to bother the user if their environment doesn't support our
    // notifications or if they've been explicitly disabled.
    if (!supportsNotifications() || !this.props.notificationsEnabled) {
      return null
    }

    const {
      suggestGrantNotificationPermission,
      warnNotificationsDenied,
      suggestConfigureNotifications,
    } = this.state

    if (suggestGrantNotificationPermission) {
      return (
        <>
          {' '}
          你需要{' '}
          <LinkButton onClick={this.onGrantNotificationPermission}>
            允许
          </LinkButton>{' '}
          要从GitHub桌面显示这些通知, 请执行以下操作.
        </>
      )
    }

    const notificationSettingsURL = getNotificationSettingsUrl()

    if (notificationSettingsURL === null) {
      return null
    }

    if (warnNotificationsDenied) {
      return (
        <>
          <br />
          <br />
          <span className="warning-icon">⚠️</span> GitHub桌面没有显示通知的权限.
          请在 <LinkButton uri={notificationSettingsURL}>通知和设置</LinkButton>
          中启用它们.
        </>
      )
    }

    const verb = suggestConfigureNotifications
      ? 'properly configured'
      : 'enabled'

    return (
      <>
        {' '}
        确保GitHub Desktop的通知{verb}{' '}
        <LinkButton uri={notificationSettingsURL}>通知设置</LinkButton>.
      </>
    )
  }
}

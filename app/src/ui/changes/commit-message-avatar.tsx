import React from 'react'
import { Select } from '../lib/select'
import { Button } from '../lib/button'
import { Row } from '../lib/row'
import { Popover, PopoverCaretPosition } from '../lib/popover'
import { IAvatarUser } from '../../models/avatar'
import { Avatar } from '../lib/avatar'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { LinkButton } from '../lib/link-button'

interface ICommitMessageAvatarState {
  readonly isPopoverOpen: boolean

  /** Currently selected account email address. */
  readonly accountEmail: string
}

interface ICommitMessageAvatarProps {
  /** The user whose avatar should be displayed. */
  readonly user?: IAvatarUser

  /**
   * The title of the avatar.
   * Defaults to the name and email if undefined and is
   * skipped completely if title is null
   */
  readonly title?: string | JSX.Element | null

  /** Current email address configured by the user. */
  readonly email?: string

  /** Whether or not the warning badge on the avatar should be visible. */
  readonly warningBadgeVisible: boolean

  /** Whether or not the user's account is a GHE account. */
  readonly isEnterpriseAccount: boolean

  /** Email addresses available in the relevant GitHub (Enterprise) account. */
  readonly accountEmails: ReadonlyArray<string>

  /** Preferred email address from the user's account. */
  readonly preferredAccountEmail: string

  readonly onUpdateEmail: (email: string) => void

  /**
   * Called when the user has requested to see the Git Config tab in the
   * repository settings dialog
   */
  readonly onOpenRepositorySettings: () => void
}

/**
 * User avatar shown in the commit message area. It encapsulates not only the
 * user avatar, but also any badge and warning we might display to the user.
 */
export class CommitMessageAvatar extends React.Component<
  ICommitMessageAvatarProps,
  ICommitMessageAvatarState
> {
  public constructor(props: ICommitMessageAvatarProps) {
    super(props)

    this.state = {
      isPopoverOpen: false,
      accountEmail: this.props.preferredAccountEmail,
    }
  }

  public render() {
    return (
      <div className="commit-message-avatar-component">
        {this.props.warningBadgeVisible && (
          <Button
            className="avatar-button"
            ariaLabel="提交可能属性错误. 查看警告."
            onClick={this.onAvatarClick}
          >
            {this.renderWarningBadge()}
            <Avatar user={this.props.user} title={this.props.title} />
          </Button>
        )}

        {!this.props.warningBadgeVisible && (
          <Avatar user={this.props.user} title={this.props.title} />
        )}
        {this.state.isPopoverOpen && this.renderPopover()}
      </div>
    )
  }

  private renderWarningBadge() {
    return (
      <div className="warning-badge">
        <Octicon symbol={OcticonSymbol.alert} />
      </div>
    )
  }

  private openPopover = () => {
    this.setState(prevState => {
      if (prevState.isPopoverOpen === false) {
        return { isPopoverOpen: true }
      }
      return null
    })
  }

  private closePopover = () => {
    this.setState(prevState => {
      if (prevState.isPopoverOpen) {
        return { isPopoverOpen: false }
      }
      return null
    })
  }

  private onAvatarClick = (event: React.FormEvent<HTMLButtonElement>) => {
    if (this.props.warningBadgeVisible === false) {
      return
    }

    event.preventDefault()
    if (this.state.isPopoverOpen) {
      this.closePopover()
    } else {
      this.openPopover()
    }
  }

  private renderPopover() {
    const accountTypeSuffix = this.props.isEnterpriseAccount ? ' 企业' : ''

    const updateEmailTitle = __DARWIN__ ? '更新邮件' : '更新邮件'

    return (
      <Popover
        caretPosition={PopoverCaretPosition.LeftBottom}
        onClickOutside={this.closePopover}
      >
        <h3>此提交将被错误归因</h3>
        <Row>
          <div>
            全局Git配置中的电子邮件 (
            <span className="git-email">{this.props.email}</span>) 不匹配 您的
            GitHub{accountTypeSuffix} 账户.{' '}
            <LinkButton uri="https://docs.github.com/en/github/committing-changes-to-your-project/why-are-my-commits-linked-to-the-wrong-user">
              了解更多信息.
            </LinkButton>
          </div>
        </Row>
        <Row>
          <Select
            value={this.state.accountEmail}
            onChange={this.onSelectedGitHubEmailChange}
          >
            {this.props.accountEmails.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Row>
        <Row>
          <div className="secondary-text">
            您还可以从中选择此存储库的本地电子邮件{' '}
            <LinkButton onClick={this.onRepositorySettingsClick}>
              存储库设置
            </LinkButton>
            .
          </div>
        </Row>
        <Row className="button-row">
          <Button onClick={this.onIgnoreClick} type="button">
            忽略
          </Button>
          <Button onClick={this.onUpdateEmailClick} type="submit">
            {updateEmailTitle}
          </Button>
        </Row>
      </Popover>
    )
  }

  private onRepositorySettingsClick = () => {
    this.closePopover()
    this.props.onOpenRepositorySettings()
  }

  private onIgnoreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    this.closePopover()
  }

  private onUpdateEmailClick = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    this.closePopover()

    if (this.props.email !== this.state.accountEmail) {
      this.props.onUpdateEmail(this.state.accountEmail)
    }
  }

  private onSelectedGitHubEmailChange = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const email = event.currentTarget.value
    if (email) {
      this.setState({ accountEmail: email })
    }
  }
}

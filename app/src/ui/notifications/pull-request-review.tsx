import * as React from 'react'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { PullRequest } from '../../models/pull-request'
import { Dispatcher } from '../dispatcher'
import { Account } from '../../models/account'
import { RepositoryWithGitHubRepository } from '../../models/repository'
import {
  getPullRequestReviewStateIcon,
  getVerbForPullRequestReview,
} from './pull-request-review-helpers'
import { LinkButton } from '../lib/link-button'
import { ValidNotificationPullRequestReview } from '../../lib/valid-notification-pull-request-review'
import { PullRequestCommentLike } from './pull-request-comment-like'

interface IPullRequestReviewProps {
  readonly dispatcher: Dispatcher
  readonly accounts: ReadonlyArray<Account>
  readonly repository: RepositoryWithGitHubRepository
  readonly pullRequest: PullRequest
  readonly review: ValidNotificationPullRequestReview

  /** Map from the emoji shortcut (e.g., :+1:) to the image's local path. */
  readonly emoji: Map<string, string>

  /**
   * Whether or not the dialog should offer to switch to the PR's repository or
   * to checkout the PR branch when applicable (e.g. non-approved reviews).
   */
  readonly shouldCheckoutBranch: boolean
  readonly shouldChangeRepository: boolean

  readonly onSubmit: () => void
  readonly onDismissed: () => void
}

interface IPullRequestReviewState {
  readonly switchingToPullRequest: boolean
}

/**
 * * Dialog to show a pull request review.
 */
export class PullRequestReview extends React.Component<
  IPullRequestReviewProps,
  IPullRequestReviewState
> {
  public constructor(props: IPullRequestReviewProps) {
    super(props)

    this.state = {
      switchingToPullRequest: false,
    }
  }

  public render() {
    const {
      dispatcher,
      accounts,
      repository,
      pullRequest,
      emoji,
      review,
      onSubmit,
      onDismissed,
    } = this.props

    const icon = getPullRequestReviewStateIcon(review.state)

    return (
      <PullRequestCommentLike
        dispatcher={dispatcher}
        accounts={accounts}
        repository={repository}
        pullRequest={pullRequest}
        emoji={emoji}
        eventDate={new Date(review.submitted_at)}
        eventVerb={getVerbForPullRequestReview(review)}
        eventIconSymbol={icon.symbol}
        eventIconClass={icon.className}
        externalURL={review.html_url}
        user={review.user}
        body={review.body}
        switchingToPullRequest={this.state.switchingToPullRequest}
        renderFooterContent={this.renderFooterContent}
        onSubmit={onSubmit}
        onDismissed={onDismissed}
      />
    )
  }

  private renderFooterContent = () => {
    const { review, shouldChangeRepository, shouldCheckoutBranch } = this.props
    const isApprovedReview = review.state === 'APPROVED'

    let okButtonTitle: undefined | string = undefined

    if (!isApprovedReview) {
      if (shouldChangeRepository) {
        okButtonTitle = __DARWIN__
          ? '切换到存储库并拉取请求'
          : '切换到存储库并拉取请求'
      } else if (shouldCheckoutBranch) {
        okButtonTitle = __DARWIN__ ? '切换到拉取请求' : '切换到拉取请求'
      }
    }

    const okCancelButtonGroup = (
      <OkCancelButtonGroup
        onCancelButtonClick={this.props.onDismissed}
        cancelButtonText="驳回"
        // If there is nothing special about the OK button, just hide the cancel
        // button, since they will both just dismiss the dialog.
        cancelButtonVisible={okButtonTitle !== undefined}
        okButtonText={okButtonTitle}
        okButtonDisabled={this.state.switchingToPullRequest}
        onOkButtonClick={this.onSubmit}
      />
    )

    const openInBrowserText = __DARWIN__ ? '在浏览器中打开' : '在浏览器中打开'

    return (
      <Row>
        <div className="footer-links">
          <LinkButton uri={review.html_url}>{openInBrowserText}</LinkButton>
        </div>
        {okCancelButtonGroup}
      </Row>
    )
  }

  private onSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    const {
      dispatcher,
      repository,
      pullRequest,
      shouldChangeRepository,
      shouldCheckoutBranch,
      review,
    } = this.props

    const isApprovedReview = review.state === 'APPROVED'

    // Only switch to the PR when needed, if it's not an approved review
    if (!isApprovedReview && (shouldChangeRepository || shouldCheckoutBranch)) {
      this.setState({ switchingToPullRequest: true })
      await dispatcher.selectRepository(repository)
      await dispatcher.checkoutPullRequest(repository, pullRequest)
      this.setState({ switchingToPullRequest: false })

      dispatcher.recordPullRequestReviewDialogSwitchToPullRequest(review.state)
    }

    this.props.onDismissed()
  }
}

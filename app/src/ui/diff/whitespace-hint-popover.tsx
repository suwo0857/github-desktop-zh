import * as React from 'react'
import {
  Popover,
  PopoverCaretPosition,
  PopoverAppearEffect,
} from '../lib/popover'
import { OkCancelButtonGroup } from '../dialog'

interface IWhitespaceHintPopoverProps {
  readonly caretPosition: PopoverCaretPosition
  /** Called when the user changes the hide whitespace in diffs setting. */
  readonly onHideWhitespaceInDiffChanged: (checked: boolean) => void
  readonly onDismissed: () => void
  readonly style: React.CSSProperties
}

export class WhitespaceHintPopover extends React.Component<IWhitespaceHintPopoverProps> {
  public render() {
    return (
      <Popover
        caretPosition={this.props.caretPosition}
        onMousedownOutside={this.onDismissed}
        className={'whitespace-hint'}
        style={this.props.style}
        appearEffect={PopoverAppearEffect.Shake}
      >
        <h3>显示空白更改?</h3>
        <p className="byline">隐藏空白更改时禁用选择行.</p>
        <footer>
          <OkCancelButtonGroup
            okButtonText="Yes"
            cancelButtonText="No"
            onCancelButtonClick={this.onDismissed}
            onOkButtonClick={this.onShowWhitespaceChanges}
          />
        </footer>
      </Popover>
    )
  }

  private onShowWhitespaceChanges = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    this.props.onHideWhitespaceInDiffChanged(false)
    this.props.onDismissed()
  }

  private onDismissed = (event?: React.MouseEvent | MouseEvent) => {
    event?.preventDefault()
    this.props.onDismissed()
  }
}

import * as React from 'react'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { RadioButton } from '../lib/radio-button'
import { Popover, PopoverCaretPosition } from '../lib/popover'

interface IDiffOptionsProps {
  readonly isInteractiveDiff: boolean
  readonly hideWhitespaceChanges: boolean
  readonly onHideWhitespaceChangesChanged: (
    hideWhitespaceChanges: boolean
  ) => void

  readonly showSideBySideDiff: boolean
  readonly onShowSideBySideDiffChanged: (showSideBySideDiff: boolean) => void

  /** Called when the user opens the diff options popover */
  readonly onDiffOptionsOpened: () => void
}

interface IDiffOptionsState {
  readonly isPopoverOpen: boolean
}

export class DiffOptions extends React.Component<
  IDiffOptionsProps,
  IDiffOptionsState
> {
  private diffOptionsRef = React.createRef<HTMLDivElement>()

  public constructor(props: IDiffOptionsProps) {
    super(props)
    this.state = {
      isPopoverOpen: false,
    }
  }

  private onButtonClick = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (this.state.isPopoverOpen) {
      this.closePopover()
    } else {
      this.openPopover()
    }
  }

  private openPopover = () => {
    this.setState(prevState => {
      if (!prevState.isPopoverOpen) {
        this.props.onDiffOptionsOpened()
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

  private onHideWhitespaceChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    return this.props.onHideWhitespaceChangesChanged(
      event.currentTarget.checked
    )
  }

  public render() {
    return (
      <div className="diff-options-component" ref={this.diffOptionsRef}>
        <button onClick={this.onButtonClick}>
          <Octicon symbol={OcticonSymbol.gear} />
          <Octicon symbol={OcticonSymbol.triangleDown} />
        </button>
        {this.state.isPopoverOpen && this.renderPopover()}
      </div>
    )
  }

  private renderPopover() {
    return (
      <Popover
        caretPosition={PopoverCaretPosition.TopRight}
        onClickOutside={this.closePopover}
      >
        {this.renderHideWhitespaceChanges()}
        {this.renderShowSideBySide()}
      </Popover>
    )
  }

  private onUnifiedSelected = () => {
    this.props.onShowSideBySideDiffChanged(false)
  }
  private onSideBySideSelected = () => {
    this.props.onShowSideBySideDiffChanged(true)
  }

  private renderShowSideBySide() {
    return (
      <section>
        <h3>差异显示</h3>
        <RadioButton
          value="Unified"
          checked={!this.props.showSideBySideDiff}
          label="统一的"
          onSelected={this.onUnifiedSelected}
        />
        <RadioButton
          value="Split"
          checked={this.props.showSideBySideDiff}
          label={
            <>
              <div>分离</div>
            </>
          }
          onSelected={this.onSideBySideSelected}
        />
      </section>
    )
  }

  private renderHideWhitespaceChanges() {
    return (
      <section>
        <h3>空白</h3>
        <Checkbox
          value={
            this.props.hideWhitespaceChanges
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onHideWhitespaceChangesChanged}
          label={__DARWIN__ ? '隐藏空白更改' : '隐藏空白更改'}
        />
        {this.props.isInteractiveDiff && (
          <p className="secondary-text">
            与单独的行或块交互将被禁用，同时隐藏空白.
          </p>
        )}
      </section>
    )
  }
}

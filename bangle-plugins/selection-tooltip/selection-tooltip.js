import { Extension } from 'bangle-core/extensions/index';
import { trackMousePlugin } from './track-mouse-plugin';
import {
  hideTooltip,
  tooltipPlacementPlugin,
} from 'bangle-plugins/tooltip-placement/index';
import { filter } from 'bangle-core/utils/pm-utils';
const LOG = false;
let log = LOG ? console.log.bind(console, 'plugins/tooltip') : () => {};

/**
 * Shows a tooltip when there is a selection
 */
export class SelectionTooltip extends Extension {
  tooltipPlugin = null;

  get name() {
    return 'selection_tooltip';
  }

  get defaultOptions() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const showTooltipArrow = true;
    const { tooltipDOM, tooltipContent } = createTooltipDOM(showTooltipArrow);
    tooltipContent.innerText = 'Hello I am a beautiful tooltip';
    return {
      tooltipName: 'selection',
      tooltipDOM: tooltipDOM,
      getScrollContainerDOM: (view) => {
        return view.dom.parentElement;
      },
      tooltipOffset: () => {
        return [0, 0.5 * rem];
      },
      showTooltipArrow: showTooltipArrow,
      getReferenceElement: getSelectionReferenceElement,
      shouldShowTooltip: (state) => {
        return !state.selection.empty;
      },
      getInitialShowState: (state) => false,
      onHideTooltip: () => {},
      onUpdateTooltip: () => {},
      placement: undefined,

      // key bindings
      enterKeyName: 'Enter',
      arrowUpKeyName: 'ArrowUp',
      arrowDownKeyName: 'ArrowDown',
      escapeKeyName: 'Escape',

      onEnter: (state, dispatch, view) => {
        return false;
      },
      onArrowDown: (state, dispatch, view) => {
        return false;
      },
      onArrowUp: (state, dispatch, view) => {
        return false;
      },
      onEscape: (state, dispatch, view) => {
        return hideTooltip(this.tooltipPlugin)(state, dispatch, view);
      },
    };
  }

  get plugins() {
    const options = this.options;
    const plugin = tooltipPlacementPlugin({
      pluginName: this.options.tooltipName,
      tooltipOffset: options.tooltipOffset,
      tooltipDOM: options.tooltipDOM,
      getScrollContainerDOM: options.getScrollContainerDOM,
      getReferenceElement: options.getReferenceElement,
      onUpdateTooltip: options.onUpdateTooltip,
      getInitialShowState: options.getInitialShowState,
      onHideTooltip: options.onHideTooltip,
      placement: options.placement,
    });

    this.tooltipPlugin = plugin;

    return [
      plugin,
      trackMousePlugin({
        tooltipDOM: this.options.tooltipDOM,
        tooltipPlugin: plugin,
        shouldShowTooltip: this.options.shouldShowTooltip,
      }).plugin,
    ];
  }

  keys() {
    const isActiveCheck = (state) => this.isTooltipActive(state);

    const result = {
      [this.options.enterKeyName]: filter(isActiveCheck, this.options.onEnter),
      [this.options.arrowUpKeyName]: filter(
        isActiveCheck,
        this.options.onArrowUp,
      ),
      [this.options.arrowDownKeyName]: filter(
        isActiveCheck,
        this.options.onArrowDown,
      ),
      [this.options.escapeKeyName]: filter(
        isActiveCheck,
        this.options.onEscape,
      ),
    };
    if (this.options.alternateEnterKeyName) {
      result[this.options.alternateEnterKeyName] =
        result[this.options.enterKeyName];
    }

    return result;
  }

  isTooltipActive(state) {
    return this.tooltipPlugin && this.tooltipPlugin.getState(state)?.show;
  }
}

export function createTooltipDOM(arrow = false) {
  const tooltipDOM = document.createElement('div');
  tooltipDOM.className = 'bangle-tooltip bangle-selection-tooltip';
  tooltipDOM.setAttribute('role', 'tooltip');

  const tooltipContent = document.createElement('div');
  tooltipContent.className = 'bangle-tooltip-content';
  tooltipDOM.appendChild(tooltipContent);
  if (arrow) {
    const arrowDOM = document.createElement('div');
    arrowDOM.className = 'bangle-tooltip-arrow';
    arrowDOM.setAttribute('data-popper-arrow', '');
    tooltipDOM.appendChild(arrowDOM);
  }
  return { tooltipDOM, tooltipContent };
}

function getSelectionReferenceElement(view) {
  return {
    getBoundingClientRect: () => {
      let { head } = view.state.selection;

      const start = view.coordsAtPos(head);
      let { top, bottom, left, right } = start;

      return {
        width: right - left,
        height: bottom - top,
        top: top,
        right: right,
        bottom: bottom,
        left: left,
      };
    },
  };
}
import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import {
  indentList,
  backspaceKeyCommand,
  enterKeyCommand,
  outdentList,
  moveEdgeListItem,
} from './commands';
import {
  cutEmptyCommand,
  copyEmptyCommand,
  parentHasDirectParentOfType,
  moveNode,
} from '../../core-commands';
import { filter, insertEmpty } from '../../utils/pm-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  indentListItem,
  outdentListItem,
};
export const defaultKeys = {
  indent: 'Tab',
  outdent: 'Shift-Tab',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyListAbove: 'Mod-Shift-Enter',
  insertEmptyListBelow: 'Mod-Enter',
};

const name = 'listItem';
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      content: '(paragraph) (paragraph | bulletList | orderedList)*',
      defining: true,
      draggable: true,
      parseDOM: [{ tag: 'li' }],
      toDOM: () => ['li', 0],
    },
    markdown: {
      toMarkdown(state, node) {
        state.renderContent(node);
      },
      parseMarkdown: {
        list_item: { block: name },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const parentCheck = parentHasDirectParentOfType(type, [
      schema.nodes['bulletList'],
      schema.nodes['orderedList'],
    ]);

    const move = (dir) =>
      chainCommands(moveNode(type, dir), moveEdgeListItem(type, dir));

    return [
      keybindings &&
        keymap({
          Backspace: backspaceKeyCommand(type),
          Enter: enterKeyCommand(type),
          [keybindings.indent]: indentListItem(),
          [keybindings.outdent]: outdentListItem(),
          [keybindings.moveUp]: filter(parentCheck, move('UP')),
          [keybindings.moveDown]: filter(parentCheck, move('DOWN')),
          [keybindings.emptyCut]: filter(parentCheck, cutEmptyCommand(type)),
          [keybindings.emptyCopy]: filter(parentCheck, copyEmptyCommand(type)),
          [keybindings.insertEmptyListAbove]: filter(
            parentCheck,
            insertEmpty(type, 'above', true),
          ),
          [keybindings.insertEmptyListBelow]: filter(
            parentCheck,
            insertEmpty(type, 'below', true),
          ),
        }),
    ];
  };
}

export function indentListItem() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return indentList(type)(state, dispatch, view);
  };
}

export function outdentListItem() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return outdentList(type)(state, dispatch, view);
  };
}

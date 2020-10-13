import localforage from 'localforage';
import { getTypeFromUID } from './type-helpers';

const LOG = false;

let log = LOG ? console.log.bind(console, 'play/workspaces-info') : () => {};

// TODO break this into a group of functions please
// no reason for it to be stateful
export class WorkspacesInfo {
  static validateEntry(entry) {
    const { name, uid, metadata } = entry;

    if (!name || !uid || !metadata) {
      log(entry);
      throw new Error('Missing field in entry');
    }
    if (Object.keys(entry).length > 3) {
      log(entry);
      throw new Error('Extra fields in entry');
    }
    getTypeFromUID(uid);
  }

  static async list() {
    const instance = localforage.createInstance({
      name: 'workspaces/1',
    });
    let existing = (await instance.getItem('workspaces')) || {};

    return Object.values(existing).sort((a, b) => a.type.localeCompare(b.type));
  }

  instance = localforage.createInstance({
    name: 'workspaces/1',
  });

  _getWorkspaces = async () =>
    (await this.instance.getItem('workspaces')) || {};

  async update(entry) {
    WorkspacesInfo.validateEntry(entry);

    const existing = await this._getWorkspaces();
    const { name, uid, metadata } = entry;
    // log({ entry });

    const entryMatch = existing[uid];

    if (entryMatch) {
      entryMatch.metadata = metadata;
      entryMatch.name = name;
    } else {
      existing[uid] = {
        uid,
        name: name,
        metadata: metadata,
      };
    }

    log(existing);
    await this.instance.setItem('workspaces', existing);
  }

  async delete(uid) {
    const existing = await this._getWorkspaces();
    delete existing[uid];
    await this.instance.setItem('workspaces', existing);
  }
}

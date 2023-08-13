/*
 * This file is part of prose-app-web
 *
 * Copyright 2023, Prose Foundation
 */

/**************************************************************************
 * IMPORTS
 * ************************************************************************* */

// NPM
import { JID, Message } from "@prose-im/prose-sdk-js";
import cloneDeep from "lodash.clonedeep";
import mitt from "mitt";
import { defineStore } from "pinia";
import { MessagingStoreMessageData } from "@prose-im/prose-core-views/types/messaging";

/**************************************************************************
 * TYPES
 * ************************************************************************* */

type InboxEntryMessages = {
  list: Array<Message>;
  byId: { [id: string]: Message };
};

type InboxEntryStates = {
  composing: boolean;
};

type EventMessageGeneric = {
  jid: JID;
  message: Message;
  original?: Message;
};

/**************************************************************************
 * INTERFACES
 * ************************************************************************* */

interface Inbox {
  entries: InboxEntries;
}

interface InboxEntries {
  [jid: string]: InboxEntry;
}

interface InboxEntry {
  messages: InboxEntryMessages;
  states: InboxEntryStates;
}

interface InboxEntryMessage extends MessagingStoreMessageData {
  archiveId?: string;
}

/**************************************************************************
 * INSTANCES
 * ************************************************************************* */

const EventBus = mitt();

/**************************************************************************
 * TABLE
 * ************************************************************************* */

const $inbox = defineStore("inbox", {
  persist: true,

  state: (): Inbox => {
    return {
      entries: {}
    };
  },

  getters: {
    getMessages: function () {
      return (jid: JID): Array<Message> => {
        return this.assert(jid).messages.list;
      };
    },

    getMessage: function () {
      return (jid: JID, id: string): Message | void => {
        return this.assert(jid).messages.byId[id] || undefined;
      };
    },

    getStates: function () {
      return (jid: JID): Array<InboxEntryStates> => {
        return this.assert(jid).states;
      };
    }
  },

  actions: {
    events(): ReturnType<typeof mitt> {
      // Return event bus
      return EventBus;
    },

    assert(jid: JID): InboxEntry {
      const jidString = jid.toString(),
        entries = this.entries;

      // Assign new inbox entry?
      if (!(jidString in entries)) {
        this.$patch(() => {
          // Insert with defaults
          entries[jidString] = {
            messages: {
              list: [],

              // TODO: do not store this in persistance layer
              byId: {} // TODO: rebuild this from list, DO NOT store this in store as reference to list is lost
            },

            states: {
              // TODO: do not store this in persistance layer
              composing: false
            }
          };
        });
      }

      return entries[jidString];
    },

    insertMessage(jid: JID, message: Message) {
      this.insertMessages(jid, [message]);
    },

    insertMessages(jid: JID, messages: Array<Message>) {
      const container = this.assert(jid).messages;

      messages.forEach(message => {
        if (!message.id) {
          throw new Error("Cannot insert a message with no identifier");
        }

        // Attempt to update first?
        const wasUpdated = this.updateMessage(jid, message.id, message);

        // Should insert message? (does not exist)
        if (wasUpdated !== true) {
          this.$patch(() => {
            container.byId[message.id] = message;
            container.list.push(message);
          });

          // Emit IPC inserted event
          EventBus.emit("message:inserted", {
            jid: jid,
            message
          } as EventMessageGeneric);
        }
      });
    },

    updateMessage(jid: JID, id: string, message: Message): boolean {
      const container = this.assert(jid).messages;

      if (!message.id) {
        throw new Error("Cannot update a message with no identifier");
      }

      // Acquire message from store
      const existingMessage = container.byId[id] || null;

      if (existingMessage !== null) {
        // Duplicate existing message (before it gets mutated)
        const originalMessage = cloneDeep(existingMessage);

        this.$patch(() => {
          // Delete existing message at previous identifier
          delete container.byId[id];

          Object.assign(existingMessage, message);

          // Update existing message identifier (w/ replacement identifier)
          existingMessage.id = message.id;

          // Store existing message at new identifier
          container.byId[message.id] = existingMessage;

          // TODO: remove temporary fix of lost reference when store is \
          //   restored
          const foundListMessage = container.list.find(listMessage => {
            return listMessage.id === existingMessage.id;
          });

          if (foundListMessage) {
            Object.assign(foundListMessage, message);

            // Update found list message identifier (w/ replacement identifier)
            foundListMessage.id = message.id;
          }
        });

        // Emit IPC updated event
        EventBus.emit("message:updated", {
          jid: jid,
          message: existingMessage,
          original: originalMessage
        } as EventMessageGeneric);

        // Mark as updated
        return true;
      }

      // Mark as non-updated
      return false;
    },

    retractMessage(jid: JID, id: string): boolean {
      const container = this.assert(jid).messages;

      // Acquire message from store
      const existingMessage = container.byId[id] || null;

      if (existingMessage !== null) {
        // Remove from identifier map
        this.$patch(() => {
          delete container.byId[id];
        });

        // Remove from list
        const listIndex = container.list.findIndex(message => {
          return message.id === id ? true : false;
        });

        if (listIndex > -1) {
          this.$patch(() => {
            container.list.splice(listIndex, 1);
          });
        }

        // Emit IPC retracted event
        EventBus.emit("message:retracted", {
          jid: jid,
          message: existingMessage
        } as EventMessageGeneric);

        // Mark as retracted
        return true;
      }

      // Mark as non-retracted
      return false;
    },

    setComposing(jid: JID, composing: boolean) {
      this.assert(jid).states.composing = composing;
    }
  }
});

/**************************************************************************
 * EXPORTS
 * ************************************************************************* */

export type { InboxEntryMessage, EventMessageGeneric };
export default $inbox;

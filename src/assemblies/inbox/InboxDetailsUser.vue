<!--
 * This file is part of prose-app-web
 *
 * Copyright 2023, Prose Foundation
 -->

<!-- **********************************************************************
     TEMPLATE
     ********************************************************************** -->

<template lang="pug">
layout-sidebar-details(
  class="a-inbox-details-user"
)
  template(
    v-slot:header
  )
    inbox-details-user-identity(
      :jid="jid"
    )

  template(
    v-slot:items
  )
    inbox-details-user-information(
      v-if="profile.information"
      :jid="jid"
      :header-class="headerClass"
      :item-class="itemClass"
      :expanded="layout.inbox.details.sections.information"
    )

    inbox-details-user-security(
      v-if="profile.security"
      :jid="jid"
      :header-class="headerClass"
      :item-class="itemClass"
      :expanded="layout.inbox.details.sections.security"
    )

    inbox-details-generic-actions(
      :room="room"
      :actions="actions"
      :header-class="headerClass"
      :item-class="itemClass"
      :expanded="layout.inbox.details.sections.actions"
    )

  template(
    v-slot:default
  )
    shared-files(
      v-if="popups.sharedFiles.visible"
      @file-preview="onPopupSharedFilesFilePreview"
      @close="onPopupSharedFilesClose"
    )

    encryption-settings(
      v-if="popups.encryptionSettings.visible"
      @close="onPopupEncryptionSettingsClose"
    )

    close-user(
      v-if="modals.closeUser.visible"
      @proceed="onModalCloseUserProceed"
      @close="onModalCloseUserClose"
      :loading="modals.closeUser.loading"
    )

    remove-contact(
      v-if="modals.removeContact.visible"
      @proceed="onModalRemoveContactProceed"
      @close="onModalRemoveContactClose"
    )

    block-user(
      v-if="modals.blockUser.visible"
      @proceed="onModalBlockUserProceed"
      @close="onModalBlockUserClose"
    )
</template>

<!-- **********************************************************************
     SCRIPT
     ********************************************************************** -->

<script lang="ts">
// NPM
import { PropType } from "vue";
import { JID, Room } from "@prose-im/prose-sdk-js";

// PROJECT: COMPOSABLES
import { useEvents } from "@/composables/events";

// PROJECT: STORES
import Store from "@/store";

// PROJECT: COMPONENTS
import BaseAlert from "@/components/base/BaseAlert.vue";
import { Collection as FilePreviewCollection } from "@/components/inbox/InboxFilePreview.vue";
import InboxDetailsUserIdentity from "@/components/inbox/InboxDetailsUserIdentity.vue";
import InboxDetailsUserInformation from "@/components/inbox/InboxDetailsUserInformation.vue";
import InboxDetailsUserSecurity from "@/components/inbox/InboxDetailsUserSecurity.vue";
import {
  default as InboxDetailsGenericActions,
  Action as DetailsAction
} from "@/components/inbox/InboxDetailsGenericActions.vue";

// PROJECT: MODALS
import CloseUser from "@/modals/inbox/CloseUser.vue";
import RemoveContact from "@/modals/inbox/RemoveContact.vue";
import BlockUser from "@/modals/inbox/BlockUser.vue";

// PROJECT: POPUPS
import SharedFiles from "@/popups/inbox/SharedFiles.vue";
import EncryptionSettings from "@/popups/inbox/EncryptionSettings.vue";

export default {
  name: "InboxDetailsUser",

  components: {
    InboxDetailsUserIdentity,
    InboxDetailsUserInformation,
    InboxDetailsUserSecurity,
    InboxDetailsGenericActions,
    SharedFiles,
    EncryptionSettings,
    CloseUser,
    RemoveContact,
    BlockUser
  },

  props: {
    room: {
      type: Object as PropType<Room>,
      required: true
    },

    jid: {
      type: Object as PropType<JID>,
      required: true
    },

    headerClass: {
      type: String,
      default: null
    },

    itemClass: {
      type: String,
      default: null
    }
  },

  emits: ["filePreview"],

  data() {
    return {
      // --> STATE <--

      isVCardSyncStale: true,

      modals: {
        closeUser: {
          visible: false,
          loading: false
        },

        removeContact: {
          visible: false
        },

        blockUser: {
          visible: false
        }
      },

      popups: {
        sharedFiles: {
          visible: false
        },

        encryptionSettings: {
          visible: false
        }
      }
    };
  },

  computed: {
    actions(): Array<DetailsAction> {
      const actions = [];

      // Append common actions
      actions.push(
        {
          id: "files",
          title: "View shared files",
          click: this.onActionSharedFilesClick,
          navigate: true
        },

        {
          id: "encryption",
          title: "Encryption settings",
          click: this.onActionEncryptionSettingsClick,
          navigate: true
        }
      );

      // Non-local user? Add ability to remove contact or block
      if (this.jid.domain !== this.selfJID.domain) {
        actions.push(
          {
            id: "remove",
            title: "Remove from contacts",
            click: this.onActionRemoveContactClick,
            color: "red"
          },

          {
            id: "block",
            title: "Block user",
            click: this.onActionBlockUserClick,
            color: "red"
          }
        );
      }

      // Non-favorited? Add ability to close chat
      if (this.roomItem?.isFavorite !== true) {
        actions.push({
          id: "close",
          title: "Close this chat",
          click: this.onActionCloseUserClick,
          color: "red"
        });
      }

      return actions;
    },

    selfJID(): JID {
      return this.account.getLocalJID();
    },

    account(): typeof Store.$account {
      return Store.$account;
    },

    layout(): typeof Store.$layout {
      return Store.$layout;
    },

    profile(): ReturnType<typeof Store.$profile.getProfile> {
      return Store.$profile.getProfile(this.jid);
    },

    roomItem(): ReturnType<typeof Store.$room.getRoomItem> {
      return this.room ? Store.$room.getRoomItem(this.room.id) : undefined;
    }
  },

  watch: {
    jid: {
      immediate: true,

      handler(newValue: JID, oldValue: JID) {
        // Make sure vCard data is loaded?
        if (newValue && (!oldValue || newValue.equals(oldValue) === false)) {
          // Mark as stale
          this.isVCardSyncStale = true;

          // Synchronize vCard eagerly
          this.syncVCardEager();
        }
      }
    }
  },

  created() {
    // Bind session event handlers
    useEvents(Store.$session, {
      connected: this.onStoreConnected
    });

    // Synchronize vCard eagerly
    this.syncVCardEager();
  },

  methods: {
    // --> HELPERS <--

    async syncVCardEager(): Promise<void> {
      // Can synchronize now? (connected)
      if (this.isVCardSyncStale === true && Store.$session.connected === true) {
        // Mark synchronization as non-stale
        this.isVCardSyncStale = false;

        // Load profile
        // TODO: refresh transient values every now and then
        await Store.$profile.load(this.jid);
      }
    },

    // --> EVENT LISTENERS <--

    onStoreConnected(connected: boolean): void {
      if (connected === true) {
        // Synchronize vCard eagerly (if stale)
        this.syncVCardEager();
      }
    },

    onActionSharedFilesClick(): void {
      this.popups.sharedFiles.visible = true;
    },

    onActionEncryptionSettingsClick(): void {
      this.popups.encryptionSettings.visible = true;
    },

    onActionRemoveContactClick(): void {
      this.modals.removeContact.visible = true;
    },

    onActionBlockUserClick(): void {
      this.modals.blockUser.visible = true;
    },

    onActionCloseUserClick(): void {
      this.modals.closeUser.visible = true;
    },

    onPopupSharedFilesFilePreview(
      collection: FilePreviewCollection,
      index = 0
    ): void {
      this.$emit("filePreview", collection, index);
    },

    onPopupSharedFilesClose(): void {
      this.popups.sharedFiles.visible = false;
    },

    onPopupEncryptionSettingsClose(): void {
      this.popups.encryptionSettings.visible = false;
    },

    async onModalCloseUserProceed(): Promise<void> {
      try {
        if (!this.roomItem) {
          throw new Error("No room item");
        }

        // Remove item from sidebar
        this.modals.closeUser.loading = true;

        await this.roomItem.removeFromSidebar();

        // Show closed alert
        BaseAlert.info("Closed chat", "You can re-open this chat anytime");

        this.modals.closeUser.visible = false;
      } catch (error) {
        this.$log.error("Failed closing chat", error);

        // Show error alert
        BaseAlert.error("Cannot close chat", "Could you try again?");
      } finally {
        this.modals.closeUser.loading = false;
      }
    },

    onModalCloseUserClose(): void {
      this.modals.closeUser.visible = false;
    },

    onModalRemoveContactProceed(): void {
      // TODO: proceed

      this.modals.removeContact.visible = false;
    },

    onModalRemoveContactClose(): void {
      this.modals.removeContact.visible = false;
    },

    onModalBlockUserProceed(): void {
      // TODO: proceed

      this.modals.blockUser.visible = false;
    },

    onModalBlockUserClose(): void {
      this.modals.blockUser.visible = false;
    }
  }
};
</script>

<!--
 * This file is part of prose-app-web
 *
 * Copyright 2023, Prose Foundation
 -->

<!-- **********************************************************************
     TEMPLATE
     ********************************************************************** -->

<template lang="pug">
.v-app-inbox-base
  inbox-topbar(
    :jid="jid"
    :room="room"
    class="v-app-inbox-base__topbar"
  )

  .v-app-inbox-base__content
    .v-app-inbox-base__messages(
      @dragover.prevent.stop="onMessagesDragOver"
      @dragleave.prevent.stop="onMessagesDragLeave"
    )
      inbox-file-preview(
        v-if="filePreview.collection.length > 0"
        @close="onMessagesFilePreviewClose"
        :collection="filePreview.collection"
        :initial-index="filePreview.index"
      )

      inbox-dropzone(
        v-if="isMessagesDragged"
        @drop.prevent.stop="onMessagesDrop"
        :room="room"
        class="v-app-inbox-base__dropzone"
      )

      inbox-banner

      inbox-messaging(
        @file-preview="onMessagesFilePreview"
        @dragover="onMessagesDragOver"
        :room="room"
        class="v-app-inbox-base__timeline"
      )

      inbox-form(
        :room="room"
        ref="form"
        class="v-app-inbox-base__form"
      )

    inbox-details(
      v-if="layout.inbox.details.visible"
      @file-preview="onDetailsFilePreview"
      :jid="jid"
      :room="room"
      class="v-app-inbox-base__details"
    )
</template>

<!-- **********************************************************************
     SCRIPT
     ********************************************************************** -->

<script lang="ts">
// NPM
import { JID, Room, RoomID } from "@prose-im/prose-sdk-js";

// PROJECT: STORES
import Store from "@/store";

// PROJECT: COMPONENTS
import {
  default as InboxFilePreview,
  Collection as FilePreviewCollection
} from "@/components/inbox/InboxFilePreview.vue";
import InboxDropzone from "@/components/inbox/InboxDropzone.vue";
import InboxBanner from "@/components/inbox/InboxBanner.vue";
import InboxMessaging from "@/components/inbox/InboxMessaging.vue";

// PROJECT: ASSEMBLIES
import InboxForm from "@/assemblies/inbox/InboxForm.vue";
import InboxTopbar from "@/assemblies/inbox/InboxTopbar.vue";
import InboxDetails from "@/assemblies/inbox/InboxDetails.vue";

export default {
  name: "AppInboxBase",

  components: {
    InboxFilePreview,
    InboxDropzone,
    InboxMessaging,
    InboxBanner,
    InboxTopbar,
    InboxDetails,
    InboxForm
  },

  data() {
    return {
      // --> STATE <--

      filePreview: {
        collection: [] as FilePreviewCollection,
        index: 0
      },

      isMessagesDragged: false
    };
  },

  computed: {
    jid(): JID {
      return new JID(this.roomId as string);
    },

    roomId(): RoomID {
      return this.$route.params.roomId as RoomID;
    },

    room(): Room | void {
      return Store.$room.getRoom(this.roomId);
    },

    layout(): typeof Store.$layout {
      return Store.$layout;
    }
  },

  methods: {
    // --> EVENT LISTENERS <--

    onMessagesDragOver(): void {
      this.isMessagesDragged = true;
    },

    onMessagesDragLeave(): void {
      this.isMessagesDragged = false;
    },

    onMessagesDrop(event: DragEvent): void {
      this.isMessagesDragged = false;

      // Send dropped files? (if any)
      if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        for (const file of event.dataTransfer.files) {
          (this.$refs.form as typeof InboxForm).onAttachFile(file);
        }
      }
    },

    onMessagesFilePreview(collection: FilePreviewCollection, index = 0): void {
      this.filePreview.collection = collection;
      this.filePreview.index = index;
    },

    onMessagesFilePreviewClose(): void {
      this.filePreview.collection = [];
    },

    onDetailsFilePreview(collection: FilePreviewCollection, index = 0): void {
      this.onMessagesFilePreview(collection, index);
    }
  }
};
</script>

<!-- **********************************************************************
     STYLE
     ********************************************************************** -->

<style lang="scss">
$c: ".v-app-inbox-base";

// VARIABLES
$content-padding-sides: 14px;

.v-app-inbox-base {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  #{$c}__topbar {
    background-color: rgb(var(--color-base-grey-light));
    border-block-end: 1px solid rgb(var(--color-border-secondary));
    height: $size-inbox-topbar-height;
    padding: 0 $content-padding-sides;
    flex: 0 0 auto;
  }

  #{$c}__content {
    flex: 1;
    display: flex;
    overflow: hidden;

    #{$c}__messages {
      display: flex;
      flex: 1;
      flex-direction: column;
      position: relative;

      #{$c}__banner {
        padding-inline: ($content-padding-sides + 11px);
        flex: 0 0 auto;
      }

      #{$c}__dropzone {
        position: absolute;
        inset: 0;
        z-index: 1;
      }

      #{$c}__timeline {
        width: 100%;
        height: 100%;
        flex: 1;
        position: relative;

        &:before,
        &:after {
          content: "";
          height: $size-layout-gradient-height;
          position: absolute;
          inset-inline: 0;
          pointer-events: none;
        }

        &:before {
          background-image: linear-gradient(
            0deg,
            rgba(var(--color-black), 0) 0%,
            rgba(var(--color-black), 0.015) 100%
          );
          inset-block-start: 0;
        }

        &:after {
          background-image: linear-gradient(
            180deg,
            rgba(var(--color-black), 0) 0%,
            rgba(var(--color-black), 0.01) 100%
          );
          inset-block-end: 0;
        }
      }

      #{$c}__form {
        border-block-start: 1px solid rgb(var(--color-border-secondary));
        min-height: $size-inbox-form-height;
        padding: 0 $content-padding-sides;
        flex: 0 0 auto;
      }
    }

    #{$c}__details {
      border-inline-start: 1px solid rgb(var(--color-border-secondary));
      width: $size-inbox-details-width;
      overflow-x: hidden;
      overflow-y: auto;
      flex: 0 0 auto;
    }
  }
}
</style>

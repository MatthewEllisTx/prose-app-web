/*
 * This file is part of prose-app-web
 *
 * Copyright 2023, Prose Foundation
 */

/**************************************************************************
 * IMPORTS
 * ************************************************************************* */

// NPM
import { defineStore } from "pinia";

/**************************************************************************
 * TABLE
 * ************************************************************************* */

const $settings = defineStore("settings", {
  persist: true,

  state: () => {
    return {
      appearance: {
        theme: "system"
      },

      availability: {
        autoAway: {
          enabled: false,
          after: "5m"
        }
      },

      notifications: {
        configuration: {
          topics: "all",
          replies: true,

          when: {
            days: "weekdays",

            time: {
              from: "10:00",
              to: "18:00"
            }
          }
        },

        action: {
          notify: {
            badge: true,
            sound: true,
            banner: true
          }
        },

        devices: {
          mobile: {
            alerts: {
              enabled: true,
              after: "5m"
            }
          }
        }
      },

      messages: {
        chats: {
          chatstates: true,
          spellcheck: false,
          clock24h: false
        },

        files: {
          imagePreviews: {
            enabled: true,
            size: "large"
          }
        }
      },

      calls: {
        camera: {
          inputSource: "system"
        },

        microphone: {
          inputSource: "system"
        },

        sound: {
          outputSource: "system"
        }
      },

      updates: {
        channel: "stable"
      },

      privacy: {
        report: {
          analytics: false,
          crashes: true
        }
      }
    };
  },

  actions: {
    setAppearanceTheme(value: string): void {
      this.setGeneric(this.appearance, "theme", value);
    },

    setAvailabilityAutoAwayEnabled(value: boolean): void {
      this.setGeneric(this.availability.autoAway, "enabled", value);
    },

    setAvailabilityAutoAwayAfter(value: string): void {
      this.setGeneric(this.availability.autoAway, "after", value);
    },

    setNotificationsConfigurationTopics(value: string): void {
      this.setGeneric(this.notifications.configuration, "topics", value);
    },

    setNotificationsConfigurationReplies(value: boolean): void {
      this.setGeneric(this.notifications.configuration, "replies", value);
    },

    setNotificationsConfigurationWhenDays(value: string): void {
      this.setGeneric(this.notifications.configuration.when, "days", value);
    },

    setNotificationsConfigurationWhenTimeFrom(value: string): void {
      this.setGeneric(
        this.notifications.configuration.when.time,
        "from",
        value
      );
    },

    setNotificationsConfigurationWhenTimeTo(value: string): void {
      this.setGeneric(this.notifications.configuration.when.time, "to", value);
    },

    setNotificationsActionNotifyBadge(value: boolean): void {
      this.setGeneric(this.notifications.action.notify, "badge", value);
    },

    setNotificationsActionNotifySound(value: boolean): void {
      this.setGeneric(this.notifications.action.notify, "sound", value);
    },

    setNotificationsActionNotifyBanner(value: boolean): void {
      this.setGeneric(this.notifications.action.notify, "banner", value);
    },

    setNotificationsDevicesMobileAlertsEnabled(value: boolean): void {
      this.setGeneric(
        this.notifications.devices.mobile.alerts,
        "enabled",
        value
      );
    },

    setNotificationsDevicesMobileAlertsAfter(value: string): void {
      this.setGeneric(this.notifications.devices.mobile.alerts, "after", value);
    },

    setMessagesChatsChatstates(value: boolean): void {
      this.setGeneric(this.messages.chats, "chatstates", value);
    },

    setMessagesChatsSpellcheck(value: boolean): void {
      this.setGeneric(this.messages.chats, "spellcheck", value);
    },

    setMessagesChatsClock24h(value: boolean): void {
      this.setGeneric(this.messages.chats, "clock24h", value);
    },

    setMessagesFilesImagePreviews(value: boolean): void {
      this.setGeneric(this.messages.files.imagePreviews, "enabled", value);
    },

    setMessagesFilesImageSize(value: string): void {
      this.setGeneric(this.messages.files.imagePreviews, "size", value);
    },

    setCallsCameraInputSource(value: string): void {
      this.setGeneric(this.calls.camera, "inputSource", value);
    },

    setCallsMicrophoneInputSource(value: string): void {
      this.setGeneric(this.calls.microphone, "inputSource", value);
    },

    setCallSoundOutputSource(value: string): void {
      this.setGeneric(this.calls.sound, "outputSource", value);
    },

    setUpdatesChannel(value: string): void {
      this.setGeneric(this.updates, "channel", value);
    },

    setPrivacyReportAnalytics(value: boolean): void {
      this.setGeneric(this.privacy.report, "analytics", value);
    },

    setPrivacyReportCrashes(value: boolean): void {
      this.setGeneric(this.privacy.report, "crashes", value);
    },

    setGeneric<ValueType>(
      container: { [key: string]: ValueType },
      key: string,
      value: ValueType
    ): boolean {
      // Check if will change
      const willChange = container[key] !== value ? true : false;

      if (willChange === true) {
        // Update value
        this.$patch(() => {
          container[key] = value;
        });

        // Has changed
        return true;
      }

      // Has not changed
      return false;
    }
  }
});

/**************************************************************************
 * EXPORTS
 * ************************************************************************* */

export default $settings;

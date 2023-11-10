/*
 * This file is part of prose-app-web
 *
 * Copyright 2023, Prose Foundation
 */

/**************************************************************************
 * IMPORTS
 * ************************************************************************* */

// NPM
import { Channel, JID, Room } from "@prose-im/prose-sdk-js";

// PROJECT: BROKER
import BrokerModule from "@/broker/modules";

// PROJECT: STORES
import Store from "@/store";

/**************************************************************************
 * CLASS
 * ************************************************************************* */

class BrokerModuleRoom extends BrokerModule {
  async startObservingRooms(): Promise<void> {
    await this._client.client?.startObservingRooms();
  }

  connectedRooms(): Room[] {
    return this._client.client?.connectedRooms() || [];
  }

  async loadPublicChannels(): Promise<Array<Channel>> {
    return (await this._client.client?.loadPublicChannels()) || [];
  }

  async createGroup(participants: Array<JID>): Promise<void> {
    const room = (await this._client.client?.createGroup(
      participants.map(jid => jid.toString())
    )) as Room;

    if (room) {
      Store.$room.insertRoom(room);
    }
  }

  async createPublicChannel(name: string): Promise<void> {
    const room = (await this._client.client?.createPublicChannel(name)) as Room;

    if (room) {
      Store.$room.insertRoom(room);
    }
  }

  async createPrivateChannel(name: string): Promise<void> {
    const room = (await this._client.client?.createPrivateChannel(
      name
    )) as Room;

    if (room) {
      Store.$room.insertRoom(room);
    }
  }
}

/**************************************************************************
 * EXPORTS
 * ************************************************************************* */

export default BrokerModuleRoom;
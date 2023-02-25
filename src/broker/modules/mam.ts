/*
 * This file is part of prose-app-web
 *
 * Copyright 2023, Prose Foundation
 */

/**************************************************************************
 * IMPORTS
 * ************************************************************************* */

// NPM
import { $iq } from "strophe.js";
import { JID } from "@xmpp/jid";

// PROJECT: BROKER
import BrokerModule from "@/broker/modules";
import { IQType } from "@/broker/stanzas/iq";
import { MessageID } from "@/broker/stanzas/message";
import { NS_MAM, NS_RSM, NS_DATA } from "@/broker/stanzas/xmlns";

/**************************************************************************
 * CONSTANTS
 * ************************************************************************* */

const HISTORY_PAGE_SIZE = 40;

/**************************************************************************
 * CLASS
 * ************************************************************************* */

class BrokerModuleMAM extends BrokerModule {
  async loadMessages(jid: JID, beforeId?: MessageID): Promise<void> {
    // XEP-0313: Message Archive Management
    // https://xmpp.org/extensions/xep-0313.html
    const stanza = $iq({ type: IQType.Set });

    // Append query
    const stanzaQuery = stanza.c("query", { xmlns: NS_MAM });

    // Append filters
    const stanzaQueryData = stanzaQuery.c("x", {
      xmlns: NS_DATA,
      type: "submit"
    });

    stanzaQueryData
      .c("field", { var: "FORM_TYPE", type: "hidden" })
      .c("value", {}, NS_MAM);

    stanzaQueryData.c("field", { var: "with" }).c("value", {}, jid);

    if (beforeId) {
      stanzaQueryData.c("field", { var: "before-id" }).c("value", {}, beforeId);
    }

    // Append RSM (Result Set Management)
    stanzaQuery.c("set", { xmlns: NS_RSM }).c("max", {}, HISTORY_PAGE_SIZE);

    this.__client.emit(stanza);

    // TODO: setup promise handler
  }
}

/**************************************************************************
 * EXPORTS
 * ************************************************************************* */

export default BrokerModuleMAM;
/*
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.daml.product.healthcareclaims.trigger;

import com.daml.ledger.javaapi.data.Party;
import java.nio.file.Path;
import java.util.function.IntSupplier;
import java.util.function.Supplier;

public class Builder {
  private String darPath;
  private String triggerName;
  private String ledgerHost = "localhost";
  private Supplier<String> ledgerPort = () -> "6865";
  private String party;

  public Builder dar(Path path) {
    this.darPath = path.toString();
    return this;
  }

  public Builder triggerName(String triggerName) {
    this.triggerName = triggerName;
    return this;
  }

  public Builder ledgerHost(String ledgerHost) {
    this.ledgerHost = ledgerHost;
    return this;
  }

  public Builder ledgerPort(IntSupplier ledgerPort) {
    this.ledgerPort = () -> String.valueOf(ledgerPort.getAsInt());
    return this;
  }

  public Builder party(Party party) {
    this.party = party.getValue();
    return this;
  }

  public Trigger build() {
    String timeMode = "--static-time";
    return new Trigger(darPath, triggerName, ledgerHost, ledgerPort, party, timeMode);
  }
}

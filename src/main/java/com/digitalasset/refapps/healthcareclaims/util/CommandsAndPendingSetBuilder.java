/**
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.digitalasset.refapps.healthcareclaims.util;

import com.daml.ledger.javaapi.data.Command;
import com.daml.ledger.javaapi.data.ExerciseCommand;
import com.daml.ledger.javaapi.data.Identifier;
import com.daml.ledger.javaapi.data.SubmitCommandsRequest;
import com.daml.ledger.rxjava.components.helpers.CommandsAndPendingSet;
import io.reactivex.Flowable;
import io.reactivex.Maybe;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import org.pcollections.HashTreePMap;
import org.pcollections.HashTreePSet;
import org.pcollections.PSet;

/**
 * Bots' "calculateCommands" need to emit an object containing commands to execute and a pending
 * contract set. This builder simplifies that task.
 */
public class CommandsAndPendingSetBuilder {
  private final String appId;
  private final String party;
  private final String workflowId;
  private final TimeManager timeManager;
  private final Duration mrtDuration;

  CommandsAndPendingSetBuilder(
      String appId,
      String party,
      String workflowId,
      TimeManager timeManager,
      Duration mrtDuration) {
    this.appId = appId;
    this.party = party;
    this.workflowId = workflowId;
    this.timeManager = timeManager;
    this.mrtDuration = mrtDuration;
  }

  public Builder newBuilder() {
    return new Builder();
  }

  public static class Factory {
    private final String applicationId;
    private final TimeManager timeManager;
    private Duration mrtDuration;

    public Factory(String applicationId, TimeManager timeManager, Duration mrtDuration) {
      this.applicationId = applicationId;
      this.timeManager = timeManager;
      this.mrtDuration = mrtDuration;
    }

    public CommandsAndPendingSetBuilder create(String party, String workflowId) {
      return new CommandsAndPendingSetBuilder(
          applicationId, party, workflowId, timeManager, mrtDuration);
    }
  }

  public final class Builder {
    private List<Command> commands = new ArrayList<>();
    private Map<Identifier, PSet<String>> pendingContractIds = new HashMap<>();

    public void addCommand(Command cmd) {
      commands.add(cmd);
      if (cmd instanceof ExerciseCommand) {
        ExerciseCommand ecmd = (ExerciseCommand) cmd;
        pendingContractIds.compute(
            ecmd.getTemplateId(),
            (k, v) ->
                (v == null)
                    ? HashTreePSet.singleton(ecmd.getContractId())
                    : v.plus(ecmd.getContractId()));
      }
    }

    public Optional<CommandsAndPendingSet> build() {
      if (commands.isEmpty() && pendingContractIds.isEmpty()) {
        return Optional.empty();
      } else {
        Instant now = timeManager.getTime();
        Instant mrt = now.plus(mrtDuration);
        SubmitCommandsRequest commandsRequest =
            new SubmitCommandsRequest(
                workflowId,
                appId,
                UUID.randomUUID().toString(),
                party,
                Optional.of(mrt),
                Optional.empty(),
                Optional.empty(),
                commands);
        return Optional.of(
            new CommandsAndPendingSet(commandsRequest, HashTreePMap.from(pendingContractIds)));
      }
    }

    public Flowable<CommandsAndPendingSet> buildFlowable() {
      return build().map(Maybe::just).orElse(Maybe.empty()).toFlowable();
    }
  }
}

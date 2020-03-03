/**
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.digitalasset.refapps.healthcareclaims.bot;

import static com.digitalasset.refapps.healthcareclaims.util.BotUtil.filterTemplates;

import com.daml.ledger.javaapi.data.*;
import com.daml.ledger.rxjava.components.LedgerViewFlowable;
import com.daml.ledger.rxjava.components.helpers.CommandsAndPendingSet;
import com.daml.ledger.rxjava.components.helpers.CreatedContract;
import com.daml.ledger.rxjava.components.helpers.TemplateUtils;
import com.digitalasset.nanobot.healthcare.models.main.claim.ClaimRequest;
import com.digitalasset.refapps.healthcareclaims.util.BotLogger;
import com.digitalasset.refapps.healthcareclaims.util.CommandsAndPendingSetBuilder;
import com.google.common.collect.Sets;
import io.reactivex.Flowable;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;

public class AcceptClaimBot {
  public final TransactionFilter transactionFilter;
  private final Logger logger;
  private final CommandsAndPendingSetBuilder commandBuilder;

  public AcceptClaimBot(
      CommandsAndPendingSetBuilder.Factory commandBuilderFactory, String partyName) {
    String workflowId = "WORKFLOW-" + partyName + "-AcceptClaimBot-" + UUID.randomUUID().toString();
    logger = BotLogger.getLogger(AcceptClaimBot.class, workflowId);

    commandBuilder = commandBuilderFactory.create(partyName, workflowId);
    Filter messageFilter = new InclusiveFilter(Sets.newHashSet(ClaimRequest.TEMPLATE_ID));
    this.transactionFilter = new FiltersByParty(Collections.singletonMap(partyName, messageFilter));
    logger.info("Startup.");
  }

  public Flowable<CommandsAndPendingSet> calculateCommands(
      LedgerViewFlowable.LedgerView<Template> ledgerView) {
    Map<ClaimRequest.ContractId, ClaimRequest> requests =
        filterTemplates(
            ClaimRequest.class,
            ledgerView.getContracts(ClaimRequest.TEMPLATE_ID),
            ClaimRequest.ContractId::new);

    CommandsAndPendingSetBuilder.Builder builder = commandBuilder.newBuilder();
    for (Map.Entry<ClaimRequest.ContractId, ClaimRequest> entry : requests.entrySet()) {
      logger.info("Exercising Accept on {}", entry.getKey());
      builder.addCommand(entry.getKey().exerciseAcceptClaimRequest());
    }
    return builder.buildFlowable();
  }

  public Template getContractInfo(CreatedContract createdContract) {
    //noinspection unchecked
    return TemplateUtils.contractTransformer(ClaimRequest.class).apply(createdContract);
  }
}

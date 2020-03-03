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
import com.digitalasset.nanobot.healthcare.models.main.networkcontract.ProviderNetworkContract;
import com.digitalasset.nanobot.healthcare.models.main.provider.ReferralRequest;
import com.digitalasset.refapps.healthcareclaims.util.BotLogger;
import com.digitalasset.refapps.healthcareclaims.util.CommandsAndPendingSetBuilder;
import com.google.common.collect.Sets;
import io.reactivex.Flowable;
import java.util.*;
import org.slf4j.Logger;

public class EvaluateReferralBot {
  public final TransactionFilter transactionFilter;
  private final Logger logger;
  private final CommandsAndPendingSetBuilder commandBuilder;

  public EvaluateReferralBot(
      CommandsAndPendingSetBuilder.Factory commandBuilderFactory, String partyName) {
    String workflowId =
        "WORKFLOW-" + partyName + "-EvaluateReferralBot-" + UUID.randomUUID().toString();
    logger = BotLogger.getLogger(EvaluateReferralBot.class, workflowId);

    commandBuilder = commandBuilderFactory.create(partyName, workflowId);
    Filter messageFilter =
        new InclusiveFilter(
            Sets.newHashSet(ReferralRequest.TEMPLATE_ID, ProviderNetworkContract.TEMPLATE_ID));
    this.transactionFilter = new FiltersByParty(Collections.singletonMap(partyName, messageFilter));
    logger.info("Startup.");
  }

  public Flowable<CommandsAndPendingSet> calculateCommands(
      LedgerViewFlowable.LedgerView<Template> ledgerView) {
    // look up referrals
    Map<ReferralRequest.ContractId, ReferralRequest> requests =
        filterTemplates(
            ReferralRequest.class,
            ledgerView.getContracts(ReferralRequest.TEMPLATE_ID),
            ReferralRequest.ContractId::new);

    // we assume every provider has exactly one network contract
    Map.Entry<ProviderNetworkContract.ContractId, ProviderNetworkContract> networkContract =
        filterTemplates(
                ProviderNetworkContract.class,
                ledgerView.getContracts(ProviderNetworkContract.TEMPLATE_ID),
                ProviderNetworkContract.ContractId::new)
            .entrySet()
            .iterator()
            .next();

    CommandsAndPendingSetBuilder.Builder builder = commandBuilder.newBuilder();
    for (Map.Entry<ReferralRequest.ContractId, ReferralRequest> request : requests.entrySet()) {

      builder.addCommand(request.getKey().exerciseEvaluateReferral(networkContract.getKey()));
    }
    return builder.buildFlowable();
  }

  public Template getContractInfo(CreatedContract createdContract) {
    //noinspection unchecked
    return TemplateUtils.contractTransformer(ReferralRequest.class, ProviderNetworkContract.class)
        .apply(createdContract);
  }
}

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
import com.digitalasset.nanobot.healthcare.models.main.policy.InsurancePolicy;
import com.digitalasset.nanobot.healthcare.models.main.provider.NotifyPayer;
import com.digitalasset.refapps.healthcareclaims.util.BotLogger;
import com.digitalasset.refapps.healthcareclaims.util.CommandsAndPendingSetBuilder;
import com.google.common.collect.Sets;
import io.reactivex.Flowable;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;

public class AcknowledgeAppointmentBot {
  public final TransactionFilter transactionFilter;
  private final Logger logger;
  private final CommandsAndPendingSetBuilder commandBuilder;

  public AcknowledgeAppointmentBot(
      CommandsAndPendingSetBuilder.Factory commandBuilderFactory, String partyName) {
    String workflowId =
        "WORKFLOW-" + partyName + "-AcknowledgeAppointmentBot-" + UUID.randomUUID().toString();
    logger = BotLogger.getLogger(AcceptClaimBot.class, workflowId);

    commandBuilder = commandBuilderFactory.create(partyName, workflowId);
    Filter messageFilter =
        new InclusiveFilter(Sets.newHashSet(NotifyPayer.TEMPLATE_ID, InsurancePolicy.TEMPLATE_ID));
    this.transactionFilter = new FiltersByParty(Collections.singletonMap(partyName, messageFilter));
    logger.info("Startup.");
  }

  public Flowable<CommandsAndPendingSet> calculateCommands(
      LedgerViewFlowable.LedgerView<Template> ledgerView) {
    // look up requests
    Map<NotifyPayer.ContractId, NotifyPayer> notifications =
        filterTemplates(
            NotifyPayer.class,
            ledgerView.getContracts(NotifyPayer.TEMPLATE_ID),
            NotifyPayer.ContractId::new);

    // look up policies
    Map<InsurancePolicy.ContractId, InsurancePolicy> policies =
        filterTemplates(
            InsurancePolicy.class,
            ledgerView.getContracts(InsurancePolicy.TEMPLATE_ID),
            InsurancePolicy.ContractId::new);

    CommandsAndPendingSetBuilder.Builder builder = commandBuilder.newBuilder();
    for (Map.Entry<NotifyPayer.ContractId, NotifyPayer> notifyEntry : notifications.entrySet()) {
      // find the appropriate policy
      Optional<Map.Entry<InsurancePolicy.ContractId, InsurancePolicy>> selectedPolicyOpt =
          policies.entrySet().stream()
              .filter(e -> e.getValue().patient.equals(notifyEntry.getValue().patient))
              .findFirst();

      // exercising AcknowledgeAndLock if the matching policy found
      selectedPolicyOpt.ifPresent(
          policy -> {
            logger.info("Exercising AcknowledgeAndLock");
            builder.addCommand(notifyEntry.getKey().exerciseAcknowledgeAndLock(policy.getKey()));
          });
    }
    return builder.buildFlowable();
  }

  public Template getContractInfo(CreatedContract createdContract) {
    //noinspection unchecked
    return TemplateUtils.contractTransformer(NotifyPayer.class, InsurancePolicy.class)
        .apply(createdContract);
  }
}

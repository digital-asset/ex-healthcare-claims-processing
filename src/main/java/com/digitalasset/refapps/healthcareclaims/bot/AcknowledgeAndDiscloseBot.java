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
import com.digitalasset.nanobot.healthcare.models.main.provider.NotifyPatient;
import com.digitalasset.refapps.healthcareclaims.util.BotLogger;
import com.digitalasset.refapps.healthcareclaims.util.CommandsAndPendingSetBuilder;
import com.google.common.collect.Sets;
import io.reactivex.Flowable;
import java.util.*;
import org.slf4j.Logger;

public class AcknowledgeAndDiscloseBot {
  public final TransactionFilter transactionFilter;
  private final Logger logger;
  private final CommandsAndPendingSetBuilder commandBuilder;
  private final List<String> receivers;

  public AcknowledgeAndDiscloseBot(
      CommandsAndPendingSetBuilder.Factory commandBuilderFactory,
      String partyName,
      List<String> receivers) {
    this.receivers = receivers;
    String workflowId =
        "WORKFLOW-" + partyName + "-AcknowledgeAndDiscloseBot-" + UUID.randomUUID().toString();
    logger = BotLogger.getLogger(AcknowledgeAndDiscloseBot.class, workflowId);

    commandBuilder = commandBuilderFactory.create(partyName, workflowId);
    Filter messageFilter =
        new InclusiveFilter(
            Sets.newHashSet(NotifyPatient.TEMPLATE_ID, InsurancePolicy.TEMPLATE_ID));
    this.transactionFilter = new FiltersByParty(Collections.singletonMap(partyName, messageFilter));
    logger.info("Startup.");
  }

  public Flowable<CommandsAndPendingSet> calculateCommands(
      LedgerViewFlowable.LedgerView<Template> ledgerView) {
    // look up requests
    Map<NotifyPatient.ContractId, NotifyPatient> notifications =
        filterTemplates(
            NotifyPatient.class,
            ledgerView.getContracts(NotifyPatient.TEMPLATE_ID),
            NotifyPatient.ContractId::new);

    // look up policies
    Map<InsurancePolicy.ContractId, InsurancePolicy> policies =
        filterTemplates(
            InsurancePolicy.class,
            ledgerView.getContracts(InsurancePolicy.TEMPLATE_ID),
            InsurancePolicy.ContractId::new);

    CommandsAndPendingSetBuilder.Builder builder = commandBuilder.newBuilder();
    for (Map.Entry<NotifyPatient.ContractId, NotifyPatient> notifyEntry :
        notifications.entrySet()) {
      // find the appropriate policy
      Optional<Map.Entry<InsurancePolicy.ContractId, InsurancePolicy>> selectedPolicyOpt =
          policies.entrySet().stream()
              .filter(e -> e.getValue().patient.equals(notifyEntry.getValue().patient))
              .findFirst();

      // exercising AcknowledgeAndDisclose if the matching policy found
      selectedPolicyOpt.ifPresent(
          policy -> {
            logger.info("Exercising AcknowledgeAndDisclose");
            builder.addCommand(
                notifyEntry.getKey().exerciseAcknowledgeAndDisclose(policy.getKey(), receivers));
          });
    }
    return builder.buildFlowable();
  }

  public Template getContractInfo(CreatedContract createdContract) {
    //noinspection unchecked
    return TemplateUtils.contractTransformer(NotifyPatient.class, InsurancePolicy.class)
        .apply(createdContract);
  }
}

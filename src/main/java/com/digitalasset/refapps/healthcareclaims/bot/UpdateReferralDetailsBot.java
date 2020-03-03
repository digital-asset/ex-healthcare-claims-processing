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
import com.digitalasset.nanobot.healthcare.models.main.provider.ReferralDetails;
import com.digitalasset.nanobot.healthcare.models.main.referral.Referral;
import com.digitalasset.refapps.healthcareclaims.util.BotLogger;
import com.digitalasset.refapps.healthcareclaims.util.CommandsAndPendingSetBuilder;
import com.google.common.collect.Sets;
import io.reactivex.Flowable;
import java.util.*;
import org.slf4j.Logger;

public class UpdateReferralDetailsBot {
  public final TransactionFilter transactionFilter;
  private final Logger logger;
  private final CommandsAndPendingSetBuilder commandBuilder;
  private final String party;

  public UpdateReferralDetailsBot(
      CommandsAndPendingSetBuilder.Factory commandBuilderFactory, String partyName) {
    this.party = partyName;
    String workflowId =
        "WORKFLOW-" + partyName + "-UpdateReferralDetailsBot-" + UUID.randomUUID().toString();
    logger = BotLogger.getLogger(UpdateReferralDetailsBot.class, workflowId);

    commandBuilder = commandBuilderFactory.create(partyName, workflowId);
    Filter messageFilter =
        new InclusiveFilter(Sets.newHashSet(ReferralDetails.TEMPLATE_ID, Referral.TEMPLATE_ID));
    this.transactionFilter = new FiltersByParty(Collections.singletonMap(partyName, messageFilter));
    logger.info("Startup.");
  }

  public Flowable<CommandsAndPendingSet> calculateCommands(
      LedgerViewFlowable.LedgerView<Template> ledgerView) {
    // look up referral details
    Map<ReferralDetails.ContractId, ReferralDetails> details =
        filterTemplates(
            ReferralDetails.class,
            ledgerView.getContracts(ReferralDetails.TEMPLATE_ID),
            ReferralDetails.ContractId::new);

    // look up referrals
    Map<Referral.ContractId, Referral> referrals =
        filterTemplates(
            Referral.class,
            ledgerView.getContracts(Referral.TEMPLATE_ID),
            Referral.ContractId::new);

    CommandsAndPendingSetBuilder.Builder builder = commandBuilder.newBuilder();

    for (Map.Entry<ReferralDetails.ContractId, ReferralDetails> referralDetail :
        details.entrySet()) {
      if (referralDetail.getValue().renderingProvider.equals(party)
          && !referralDetail.getValue().referralDetails.referral.isPresent()) {
        addCommandIfEncounterIdsMatch(referralDetail, referrals, builder);
      }
    }
    return builder.buildFlowable();
  }

  private void addCommandIfEncounterIdsMatch(
      Map.Entry<ReferralDetails.ContractId, ReferralDetails> referralDetails,
      Map<Referral.ContractId, Referral> referrals,
      CommandsAndPendingSetBuilder.Builder builder) {
    for (Map.Entry<Referral.ContractId, Referral> referral : referrals.entrySet()) {
      if (referralDetails
          .getValue()
          .referralDetails
          .encounterDetails
          .encounterId
          .equals(referral.getValue().encounterDetails.encounterId)) {
        logger.info("Exercising UpdateReferralDetails");
        builder.addCommand(
            referralDetails.getKey().exerciseUpdateReferralDetails(referral.getKey()));
      }
    }
  }

  public Template getContractInfo(CreatedContract createdContract) {
    //noinspection unchecked
    return TemplateUtils.contractTransformer(ReferralDetails.class, Referral.class)
        .apply(createdContract);
  }
}

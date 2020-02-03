/**
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.digitalasset.refapps.healthcareclaims.bot;

import static com.digitalasset.refapps.healthcareclaims.BotTestUtils.*;
import static org.junit.Assert.assertEquals;

import com.daml.ledger.javaapi.data.ExerciseCommand;
import com.daml.ledger.javaapi.data.Template;
import com.daml.ledger.rxjava.components.helpers.CommandsAndPendingSet;
import com.digitalasset.nanobot.healthcare.models.main.networkcontract.ProviderNetworkContract;
import com.digitalasset.nanobot.healthcare.models.main.policy.DisclosedPolicy;
import com.digitalasset.nanobot.healthcare.models.main.provider.ReferralDetails;
import com.digitalasset.nanobot.healthcare.models.main.referral.Referral;
import com.digitalasset.nanobot.healthcare.models.main.ruletypes.RuleParameters;
import com.digitalasset.nanobot.healthcare.models.main.types.EncounterDetails;
import com.digitalasset.refapps.healthcareclaims.LedgerTestView;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
import java.util.Optional;
import org.junit.Before;
import org.junit.Test;

public class UpdateReferralDetailsBotTest {
  private UpdateReferralDetailsBot bot;

  @Before
  public void setupTests() {
    bot = new UpdateReferralDetailsBot(createFactory(), Radiologist);
  }

  @Test
  public void testUpdateReferralDetails() throws InvocationTargetException, IllegalAccessException {
    LedgerTestView<Template> ledgerView = new LedgerTestView<>();
    // referrals
    ledgerView.addActiveContract(Referral.TEMPLATE_ID, "referralCid1", genReferral("encounterId1"));
    // referral details
    ledgerView.addActiveContract(
        ReferralDetails.TEMPLATE_ID,
        "referralDetailsCid1",
        genReferralDetails("encounterId1", false));
    ledgerView.addActiveContract(
        ReferralDetails.TEMPLATE_ID,
        "referralDetailsCid2",
        genReferralDetails("encounterId2", false));
    ledgerView.addActiveContract(
        ReferralDetails.TEMPLATE_ID,
        "referralDetailsCid3",
        genReferralDetails("encounterId1", true));

    CommandsAndPendingSet capSet =
        bot.calculateCommands(ledgerView.getRealLedgerView()).blockingFirst();
    List<ExerciseCommand> commands = asExerciseCommands(capSet);

    // only create command for the matching encounterId with referralCid filled in
    assertEquals(1, commands.size());
    assertEquals("UpdateReferralDetails", commands.get(0).getChoice());
    assertEquals("referralDetailsCid3", commands.get(0).getContractId());
  }

  private Referral genReferral(String encounterId) {
    return new Referral(
        Operator,
        PrimaryCareProvider,
        PrimaryCareProvider2,
        new EncounterDetails(
            "Patient1",
            encounterId,
            preventative_Care(),
            pain_in_the_right_arn(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "siteServiceCode",
            "appointmentPriority"));
  }

  private ReferralDetails genReferralDetails(String encounterId, Boolean emptyReferralCid) {
    Optional<Referral.ContractId> referralCid =
        Optional.of(new Referral.ContractId("referralCid1"));
    if (emptyReferralCid) {
      referralCid = Optional.empty();
    }
    return new ReferralDetails(
        Operator,
        PrimaryCareProvider,
        Radiologist,
        new RuleParameters(
            new DisclosedPolicy.ContractId("policyCid"),
            new EncounterDetails(
                "Patient1",
                encounterId,
                preventative_Care(),
                pain_in_the_right_arn(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                "siteServiceCode",
                "appointmentPriority"),
            new ProviderNetworkContract.ContractId("ncCid"),
            referralCid));
  }
}

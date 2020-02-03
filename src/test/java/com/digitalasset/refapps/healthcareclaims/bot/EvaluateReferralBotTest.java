/**
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.digitalasset.refapps.healthcareclaims.bot;

import static com.digitalasset.refapps.healthcareclaims.BotTestUtils.*;
import static org.hamcrest.CoreMatchers.hasItems;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThat;

import com.daml.ledger.javaapi.data.ContractId;
import com.daml.ledger.javaapi.data.ExerciseCommand;
import com.daml.ledger.javaapi.data.Template;
import com.daml.ledger.rxjava.components.helpers.CommandsAndPendingSet;
import com.digitalasset.nanobot.healthcare.models.main.networkcontract.ProviderNetworkContract;
import com.digitalasset.nanobot.healthcare.models.main.policy.DisclosedPolicy;
import com.digitalasset.nanobot.healthcare.models.main.provider.ReferralRequest;
import com.digitalasset.nanobot.healthcare.models.main.types.EncounterDetails;
import com.digitalasset.nanobot.healthcare.models.main.types.ProviderDemographics;
import com.digitalasset.nanobot.healthcare.models.main.types.ProviderType;
import com.digitalasset.refapps.healthcareclaims.LedgerTestView;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.junit.Before;
import org.junit.Test;

public class EvaluateReferralBotTest {
  private EvaluateReferralBot bot;

  @Before
  public void setupTests() {
    bot = new EvaluateReferralBot(createFactory(), Radiologist);
  }

  @Test
  public void testEvaluateReferral() throws InvocationTargetException, IllegalAccessException {
    LedgerTestView<Template> ledgerView = new LedgerTestView<>();
    // referral requests
    ledgerView.addActiveContract(
        ReferralRequest.TEMPLATE_ID, "referralRequestCid1", genReferralRequest());
    ledgerView.addActiveContract(
        ReferralRequest.TEMPLATE_ID, "referralRequestCid2", genReferralRequest());
    // network contracts
    ledgerView.addActiveContract(
        ProviderNetworkContract.TEMPLATE_ID, "networkContractCid1", genProviderNetworkContract());

    CommandsAndPendingSet capSet =
        bot.calculateCommands(ledgerView.getRealLedgerView()).blockingFirst();
    List<ExerciseCommand> commands = asExerciseCommands(capSet);

    assertEquals(2, commands.size());
    commands.forEach(c -> checkCommand(c));

    assertThat(
        commands.stream().map(c -> c.getContractId()).collect(Collectors.toList()),
        hasItems("referralRequestCid1", "referralRequestCid2"));
  }

  private void checkCommand(ExerciseCommand command) {
    assertEquals("EvaluateReferral", command.getChoice());
    assertEquals(
        Optional.of(new ContractId("networkContractCid1")),
        command
            .getChoiceArgument()
            .asRecord()
            .map(rec -> rec.getFieldsMap().get("networkContractCid")));
  }

  private ReferralRequest genReferralRequest() {
    return new ReferralRequest(
        Operator,
        PrimaryCareProvider,
        PrimaryCareProvider2,
        new DisclosedPolicy.ContractId("disclosedPolicyCid"),
        new EncounterDetails(
            "Patient1",
            "encounterId",
            preventative_Care(),
            pain_in_the_right_arn(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "siteServiceCode",
            "appointmentPriority"));
  }

  private ProviderNetworkContract genProviderNetworkContract() {
    return new ProviderNetworkContract(
        Operator,
        Patient1,
        Patient1,
        PrimaryCareProvider,
        PrimaryCareProvider,
        new ProviderDemographics(
            "providerHIN",
            "providerTaxID",
            "providerBankDFINumber",
            "providerBankAccountNumber",
            ProviderType.SPECIALIST,
            "providerAddressFirstLine",
            "providerAddressSecondLine",
            "providerCity",
            "providerState",
            "providerZipCode"),
        null);
  }
}

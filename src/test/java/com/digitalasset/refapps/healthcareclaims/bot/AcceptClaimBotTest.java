/**
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.digitalasset.refapps.healthcareclaims.bot;

import static com.digitalasset.refapps.healthcareclaims.BotTestUtils.*;
import static org.hamcrest.CoreMatchers.hasItems;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThat;

import com.daml.ledger.javaapi.data.ExerciseCommand;
import com.daml.ledger.javaapi.data.Record;
import com.daml.ledger.javaapi.data.Template;
import com.daml.ledger.rxjava.components.helpers.CommandsAndPendingSet;
import com.digitalasset.nanobot.healthcare.models.main.claim.ClaimRequest;
import com.digitalasset.nanobot.healthcare.models.main.types.EncounterDetails;
import com.digitalasset.refapps.healthcareclaims.LedgerTestView;
import java.lang.reflect.InvocationTargetException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class AcceptClaimBotTest {
  private AcceptClaimBot bot;

  @Before
  public void setupTests() {
    bot = new AcceptClaimBot(createFactory(), InsuranceCompany);
  }

  @Test
  public void testAcceptClaim() throws InvocationTargetException, IllegalAccessException {
    LedgerTestView<Template> ledgerView = new LedgerTestView<>();
    ledgerView.addActiveContract(
        ClaimRequest.TEMPLATE_ID,
        "claimRequestCid1",
        new ClaimRequest(
            Operator,
            PrimaryCareProvider,
            InsuranceCompany,
            new EncounterDetails(
                "Patient1",
                "encounterId",
                preventative_Care(),
                pain_in_the_right_arn(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                "siteServiceCode",
                "appointmentPriority"),
            "claimId",
            BigDecimal.ONE));
    ledgerView.addActiveContract(
        ClaimRequest.TEMPLATE_ID,
        "claimRequestCid2",
        new ClaimRequest(
            Operator,
            PrimaryCareProvider,
            InsuranceCompany2,
            new EncounterDetails(
                "Patient1",
                "encounterId",
                preventative_Care(),
                pain_in_the_right_arn(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                "siteServiceCode",
                "appointmentPriority"),
            "claimId",
            BigDecimal.ONE));

    CommandsAndPendingSet capSet =
        bot.calculateCommands(ledgerView.getRealLedgerView()).blockingFirst();
    List<ExerciseCommand> commands = asExerciseCommands(capSet);
    assertEquals(2, commands.size());
    ExerciseCommand c1 =
        new ExerciseCommand(
            ClaimRequest.TEMPLATE_ID, "claimRequestCid1", "AcceptClaimRequest", new Record());
    ExerciseCommand c2 =
        new ExerciseCommand(
            ClaimRequest.TEMPLATE_ID, "claimRequestCid2", "AcceptClaimRequest", new Record());
    assertThat(commands, hasItems(c1, c2));
  }
}

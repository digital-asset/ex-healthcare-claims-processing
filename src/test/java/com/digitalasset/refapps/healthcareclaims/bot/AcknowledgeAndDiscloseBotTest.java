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
import com.digitalasset.nanobot.healthcare.models.main.policy.InsurancePolicy;
import com.digitalasset.nanobot.healthcare.models.main.provider.NotifyPatient;
import com.digitalasset.nanobot.healthcare.models.main.types.PolicyType;
import com.digitalasset.refapps.healthcareclaims.LedgerTestView;
import java.lang.reflect.InvocationTargetException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class AcknowledgeAndDiscloseBotTest {
  private AcknowledgeAndDiscloseBot bot;

  @Before
  public void setupTests() {
    bot =
        new AcknowledgeAndDiscloseBot(
            createFactory(), Patient1, Arrays.asList(PrimaryCareProvider, Radiologist));
  }

  @Test
  public void testAcknowledgeAndDisclose()
      throws InvocationTargetException, IllegalAccessException {
    LedgerTestView<Template> ledgerView = new LedgerTestView<>();
    // policies
    ledgerView.addActiveContract(
        InsurancePolicy.TEMPLATE_ID, "#10:1", genInsurancePolicy(Patient1));
    ledgerView.addActiveContract(
        InsurancePolicy.TEMPLATE_ID, "#20:1", genInsurancePolicy(Patient2));
    ledgerView.addActiveContract(
        InsurancePolicy.TEMPLATE_ID, "#30:1", genInsurancePolicy(Patient3));
    // notifications
    ledgerView.addActiveContract(NotifyPatient.TEMPLATE_ID, "#1:1", genNotify(Patient1));
    ledgerView.addActiveContract(NotifyPatient.TEMPLATE_ID, "#2:1", genNotify(Patient4));

    CommandsAndPendingSet capSet =
        bot.calculateCommands(ledgerView.getRealLedgerView()).blockingFirst();
    List<ExerciseCommand> commands = asExerciseCommands(capSet);
    // we expect a single command for Patient
    assertEquals(1, commands.size());
    assertEquals(NotifyPatient.TEMPLATE_ID, commands.get(0).getTemplateId());
    assertEquals("#1:1", commands.get(0).getContractId());
  }

  private InsurancePolicy genInsurancePolicy(String patient) {
    return new InsurancePolicy(
        Operator,
        InsuranceCompany,
        patient,
        "John Doe",
        "insuranceId",
        PolicyType.GOLD,
        BigDecimal.ONE,
        BigDecimal.ONE,
        null,
        LocalDate.now(),
        true);
  }

  private NotifyPatient genNotify(String patient) {
    return new NotifyPatient(Operator, InsuranceCompany, patient, PrimaryCareProvider);
  }
}

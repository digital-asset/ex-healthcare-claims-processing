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
import com.digitalasset.nanobot.healthcare.models.main.provider.NotifyPayer;
import com.digitalasset.nanobot.healthcare.models.main.types.PolicyType;
import com.digitalasset.refapps.healthcareclaims.LedgerTestView;
import java.lang.reflect.InvocationTargetException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.Before;
import org.junit.Test;

public class AcknowledgeAppointmentBotTest {
  private AcknowledgeAppointmentBot bot;

  @Before
  public void setupTests() {
    bot = new AcknowledgeAppointmentBot(createFactory(), Patient1);
  }

  @Test
  public void testAcknowledgeAndLock() throws InvocationTargetException, IllegalAccessException {
    LedgerTestView<Template> ledgerView = new LedgerTestView<>();
    // policies
    ledgerView.addActiveContract(InsurancePolicy.TEMPLATE_ID, "#1:1", genInsurancePolicy(Patient1));
    ledgerView.addActiveContract(InsurancePolicy.TEMPLATE_ID, "#2:1", genInsurancePolicy(Patient2));
    ledgerView.addActiveContract(InsurancePolicy.TEMPLATE_ID, "#3:1", genInsurancePolicy(Patient3));
    // notifications
    ledgerView.addActiveContract(NotifyPayer.TEMPLATE_ID, "#10:1", genNotify(Patient1));
    ledgerView.addActiveContract(NotifyPayer.TEMPLATE_ID, "#11:1", genNotify(Patient4));

    CommandsAndPendingSet capSet =
        bot.calculateCommands(ledgerView.getRealLedgerView()).blockingFirst();
    List<ExerciseCommand> commands = asExerciseCommands(capSet);
    // we expect a single command for Patient
    assertEquals(1, commands.size());
    assertEquals(NotifyPayer.TEMPLATE_ID, commands.get(0).getTemplateId());
    assertEquals("#10:1", commands.get(0).getContractId());
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

  private NotifyPayer genNotify(String patient) {
    return new NotifyPayer(Operator, InsuranceCompany, patient, PrimaryCareProvider, null);
  }
}

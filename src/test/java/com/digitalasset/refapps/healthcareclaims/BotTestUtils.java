/**
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.digitalasset.refapps.healthcareclaims;

import static org.junit.Assert.assertTrue;

import com.daml.ledger.javaapi.data.Command;
import com.daml.ledger.javaapi.data.ExerciseCommand;
import com.daml.ledger.rxjava.components.helpers.CommandsAndPendingSet;
import com.digitalasset.nanobot.healthcare.models.main.types.DiagnosisCode;
import com.digitalasset.nanobot.healthcare.models.main.types.ProcedureCode;
import com.digitalasset.refapps.healthcareclaims.util.CommandsAndPendingSetBuilder;
import com.digitalasset.refapps.healthcareclaims.util.TimeManager;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class BotTestUtils {
  public static final String InsuranceCompany = "InsuranceCompany";
  public static final String InsuranceCompany2 = "InsuranceCompany2";
  public static final String PrimaryCareProvider = "PrimaryCareProvider";
  public static final String PrimaryCareProvider2 = "PrimaryCareProvider2";
  public static final String Radiologist = "Radiologist";
  public static final String Patient1 = "Patient1";
  public static final String Patient2 = "Patient2";
  public static final String Patient3 = "Patient3";
  public static final String Patient4 = "Patient4";
  public static final String Operator = "OPERATOR";

  public static CommandsAndPendingSetBuilder.Factory createFactory() {
    return new CommandsAndPendingSetBuilder.Factory(
        "testApplication", new TimeManager(0), Duration.ofMillis(1000));
  }

  public static List<ExerciseCommand> asExerciseCommands(CommandsAndPendingSet capSet) {
    List<Command> commands = capSet.getSubmitCommandsRequest().getCommands();
    return commands.stream()
        .map(
            command -> {
              Optional<ExerciseCommand> exerciseCommand = command.asExerciseCommand();
              assertTrue(exerciseCommand.isPresent());
              return exerciseCommand.get();
            })
        .collect(Collectors.toList());
  }

  public static ProcedureCode preventative_Care() {
    return ProcedureCode.PREVENTATIVE_CARE;
  }

  public static DiagnosisCode pain_in_the_right_arn() {
    return DiagnosisCode.PAIN_IN_RIGHT_ARM_M79_601;
  }
}

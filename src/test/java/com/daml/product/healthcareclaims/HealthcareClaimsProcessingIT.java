/*
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.daml.product.healthcareclaims;

import com.daml.extensions.testing.junit4.Sandbox;
import com.daml.extensions.testing.ledger.DefaultLedgerAdapter;
import com.daml.ledger.javaapi.data.Party;
import com.digitalasset.nanobot.healthcare.models.main.appointment.Appointment;
import com.digitalasset.nanobot.healthcare.models.main.claim.Claim;
import com.digitalasset.nanobot.healthcare.models.main.claim.PatientObligation;
import com.digitalasset.nanobot.healthcare.models.main.policy.DisclosedPolicy;
import com.digitalasset.nanobot.healthcare.models.main.policy.InsurancePolicy;
import com.digitalasset.nanobot.healthcare.models.main.provider.Provider;
import com.digitalasset.nanobot.healthcare.models.main.provider.ReferralDetails;
import com.digitalasset.nanobot.healthcare.models.main.treatment.Treatment;
import com.digitalasset.nanobot.healthcare.models.main.types.DiagnosisCode;
import com.digitalasset.nanobot.healthcare.models.main.types.ProcedureCode;
import com.google.protobuf.InvalidProtocolBufferException;
import io.grpc.StatusRuntimeException;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.After;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExternalResource;
import org.junit.rules.RuleChain;
import org.junit.rules.TestRule;

public class HealthcareClaimsProcessingIT {
  private static final Path RELATIVE_DAR_PATH =
      Paths.get("target/healthcare-claims-processing.dar");
  private static final String TEST_MODULE = "DemoOnboardScenario.StartScript";
  private static final String TEST_SCRIPT = "insurancePoliciesSetSingle";

  private static final Party PROVIDER_PARTY = new Party("PrimaryCareProvider");
  private static final Party RADIOLOGIST_PARTY = new Party("Radiologist");
  private static final Party INSURANCE_COMPANY_PARTY = new Party("InsuranceCompany");
  private static final Party PATIENT_PARTY = new Party("Patient1");

  private static final Sandbox sandbox =
      Sandbox.builder()
          .dar(RELATIVE_DAR_PATH)
          .observationTimeout(Duration.ofSeconds(60))
          .moduleAndScript(TEST_MODULE, TEST_SCRIPT)
          .parties(
              PROVIDER_PARTY.getValue(), RADIOLOGIST_PARTY.getValue(),
              INSURANCE_COMPANY_PARTY.getValue(), PATIENT_PARTY.getValue())
          .build();
  @ClassRule public static ExternalResource sandboxClassRule = sandbox.getClassRule();
  private Process triggers;

  @Rule public TestRule sandboxRule = RuleChain.outerRule(sandbox.getRule());

  @Before
  public void setUp() throws Throwable {
    // Valid port is assigned only after the sandbox has been started.
    // Therefore trigger has to be configured at the point where this can be guaranteed.
    File log = new File("integration-triggers.log");
    File errLog = new File("integration-triggers.err.log");
    triggers =
        new ProcessBuilder()
            // need to call Python directly for proper subprocess cleanup (not sure why though)
            .command("launchers/automation", Integer.toString(sandbox.getSandboxPort()))
            .redirectOutput(ProcessBuilder.Redirect.appendTo(log))
            .redirectError(ProcessBuilder.Redirect.appendTo(errLog))
            .start();
  }

  @After
  public void tearDown() {
    // Use destroy() to allow subprocess cleanup.
    triggers.destroy();
  }

  @Test
  public void testHealthcareClaimsProcessingMainWorkflow() throws InvalidProtocolBufferException {
    DefaultLedgerAdapter ledgerAdapter = sandbox.getLedgerAdapter();
    DisclosedPolicy.ContractId policy =
        ledgerAdapter.getCreatedContractId(
            PROVIDER_PARTY, DisclosedPolicy.TEMPLATE_ID, DisclosedPolicy.ContractId::new);
    Provider.ContractId provider =
        ledgerAdapter.getCreatedContractId(
            PROVIDER_PARTY, Provider.TEMPLATE_ID, Provider.ContractId::new);

    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            PROVIDER_PARTY,
            provider.exerciseCreateReferral(
                RADIOLOGIST_PARTY.getValue(),
                policy,
                "1",
                ProcedureCode.PREVENTATIVE_CARE,
                DiagnosisCode.PAIN_IN_RIGHT_ARM_M79_601,
                "11",
                "Elective"));

    ledgerAdapter.getCreatedContractId(
        RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);
    ReferralDetails.ContractId updatedReferral =
        ledgerAdapter.getCreatedContractId(
            RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);

    LocalDate appointmentDate = LocalDate.of(2019, 7, 7);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            RADIOLOGIST_PARTY, updatedReferral.exerciseScheduleAppointment(appointmentDate));

    // Check-in should happen on appointment date
    sandbox
        .getLedgerAdapter()
        .setCurrentTime(Instant.ofEpochSecond(appointmentDate.toEpochDay() * 24 * 60 * 60));
    Appointment.ContractId appointment =
        ledgerAdapter.getCreatedContractId(
            RADIOLOGIST_PARTY, Appointment.TEMPLATE_ID, Appointment.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(RADIOLOGIST_PARTY, appointment.exerciseCheckInPatient());

    // We check whether the insurance policy is there. It will be updated with the completed
    // treatment.
    ledgerAdapter.getCreatedContractId(
        INSURANCE_COMPANY_PARTY, InsurancePolicy.TEMPLATE_ID, InsurancePolicy.ContractId::new);

    Treatment.ContractId treatment =
        ledgerAdapter.getCreatedContractId(
            RADIOLOGIST_PARTY, Treatment.TEMPLATE_ID, Treatment.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(RADIOLOGIST_PARTY, treatment.exerciseCompleteTreatment());

    Claim.ContractId claim =
        ledgerAdapter.getCreatedContractId(
            INSURANCE_COMPANY_PARTY, Claim.TEMPLATE_ID, Claim.ContractId::new);
    sandbox.getLedgerAdapter().exerciseChoice(INSURANCE_COMPANY_PARTY, claim.exercisePayClaim());

    PatientObligation.ContractId obligation =
        ledgerAdapter.getCreatedContractId(
            PATIENT_PARTY, PatientObligation.TEMPLATE_ID, PatientObligation.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(PATIENT_PARTY, obligation.exercisePayPatientObligation());
  }

  @Test(expected = StatusRuntimeException.class)
  public void testHealthcareClaimsProcessingMainWorkflowWrongCheckingDate()
      throws InvalidProtocolBufferException {
    DefaultLedgerAdapter ledgerAdapter = sandbox.getLedgerAdapter();
    DisclosedPolicy.ContractId policy = new DisclosedPolicy.ContractId("#38:11");
    Provider.ContractId provider =
        ledgerAdapter.getCreatedContractId(
            PROVIDER_PARTY, Provider.TEMPLATE_ID, Provider.ContractId::new);

    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            PROVIDER_PARTY,
            provider.exerciseCreateReferral(
                RADIOLOGIST_PARTY.getValue(),
                policy,
                "1",
                ProcedureCode.PREVENTATIVE_CARE,
                DiagnosisCode.PAIN_IN_RIGHT_ARM_M79_601,
                "11",
                "Elective"));

    ledgerAdapter.getCreatedContractId(
        RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);
    ReferralDetails.ContractId updatedReferral =
        ledgerAdapter.getCreatedContractId(
            RADIOLOGIST_PARTY, ReferralDetails.TEMPLATE_ID, ReferralDetails.ContractId::new);

    LocalDate appointmentDate = LocalDate.of(2019, 7, 7);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(
            RADIOLOGIST_PARTY, updatedReferral.exerciseScheduleAppointment(appointmentDate));

    // Check-in should happen on appointment date!
    Appointment.ContractId appointment =
        ledgerAdapter.getCreatedContractId(
            RADIOLOGIST_PARTY, Appointment.TEMPLATE_ID, Appointment.ContractId::new);
    sandbox
        .getLedgerAdapter()
        .exerciseChoice(RADIOLOGIST_PARTY, appointment.exerciseCheckInPatient());
  }
}
